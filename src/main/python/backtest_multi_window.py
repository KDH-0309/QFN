#!/usr/bin/env python3
"""
Multi-window backtest for the portfolio optimizer.

What it does
- Train on different lookback windows (6M, 1Y, 2Y, 3Y, 5Y)
- Use the current optimizer (Hybrid: QAOA 2-bit + MPT, with automatic fallback to MPT)
- Evaluate out-of-sample over a fixed investment horizon (default: 3 months)
- Produce charts similar to the examples the user provided

Outputs (saved under docs/backtest/):
- final_portfolio_value_comparison.png
- weight_comparison_<window>.png
- training_period_performance_<window>.png
- investment_period_performance_<horizon>.png

Run
- python backtest_multi_window.py --tickers 005930.KS 000660.KS TSLA NVDA AAPL --horizon 3mo --windows 6mo 1y 2y 3y 5y --initial 10000
"""
from __future__ import annotations
import sys
import os
import math
import argparse
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import List, Tuple, Dict

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.ticker import FuncFormatter

# 한글 폰트 설정 (Windows)
plt.rcParams['font.family'] = 'Malgun Gothic'  # 맑은 고딕
plt.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 깨짐 방지

# Ensure we can import from this folder
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Import optimizer functions (uses QAOA if available with fallback)
from optimize_portfolio import (
    optimize_with_qaoa,
    optimize_with_modern_portfolio_theory,
)

try:
    import yfinance as yf
except Exception as e:
    print("yfinance not available. Please install it: pip install yfinance", file=sys.stderr)
    raise


# ----------------------------
# Data helpers
# ----------------------------

def parse_window(window: str) -> relativedelta:
    if window.endswith('mo'):
        return relativedelta(months=int(window[:-2]))
    if window.endswith('y'):
        return relativedelta(years=int(window[:-1]))
    raise ValueError(f"Unsupported window: {window}")


def download_close(symbols: List[str], start: str, end: str) -> pd.DataFrame:
    df = yf.download(symbols, start=start, end=end, progress=False)
    if df.empty:
        return pd.DataFrame()
    # Single-symbol returns a Series-like structure
    if 'Close' in df:
        return df['Close']
    # Already a price frame
    return df


def resolve_display_names(symbols: List[str]) -> List[str]:
    """Map tickers to human-friendly names. Uses a small built-in map first, then yfinance as fallback."""
    builtin = {
        '005930.KS': 'Samsung Electronics',
        '000660.KS': 'SK Hynix',
        'TSLA': 'Tesla',
        'NVDA': 'NVIDIA',
        'AAPL': 'Apple',
    }
    names: List[str] = []
    for s in symbols:
        if s in builtin:
            names.append(builtin[s])
            continue
        # Fallback: try to fetch from yfinance; if it fails, use the raw ticker
        try:
            info = yf.Ticker(s).get_info()
            nm = info.get('shortName') or info.get('longName')
            names.append(nm if nm else s)
        except Exception:
            names.append(s)
    return names


def annualized_stats(prices: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    """Compute annualized mean returns and covariance from close prices."""
    rets = prices.pct_change().dropna()
    if rets.empty:
        raise ValueError("No returns data after pct_change")
    mean_returns = (rets.mean() * 252).values if isinstance(rets, pd.DataFrame) else np.array([rets.mean() * 252])
    cov = (rets.cov() * 252).values if isinstance(rets, pd.DataFrame) else np.array([[rets.std() ** 2 * 252]])
    return mean_returns, cov


def portfolio_cumulative_value(weights: np.ndarray, prices: pd.DataFrame, initial: float) -> Tuple[pd.Series, float]:
    """Compute cumulative portfolio value over time given weights and daily close prices."""
    rets = prices.pct_change().dropna()
    # Align weights length
    if isinstance(rets, pd.Series):
        rets = rets.to_frame()
    if len(weights) != rets.shape[1]:
        raise ValueError("Weights length does not match number of assets")
    port_ret = (rets * weights).sum(axis=1)
    cum = (1.0 + port_ret).cumprod()
    value = initial * cum
    return value, float(value.iloc[-1])


# ----------------------------
# Backtest core
# ----------------------------

def run_backtest(symbols: List[str], windows: List[str], investment_horizon: str, initial: float,
                 use_qaoa_hybrid: bool = True,
                 diversify_bounds: Tuple[float, float] = (0.05, 0.40)) -> Dict:
    now = datetime.now()
    horizon_delta = parse_window(investment_horizon)
    invest_start = now - horizon_delta
    invest_end = now

    # Prepare folder
    out_dir = os.path.join(os.path.dirname(CURRENT_DIR), '..', '..', 'docs', 'backtest')
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    # Download investment period prices once (same for all windows)
    prices_invest = download_close(symbols, start=invest_start.strftime('%Y-%m-%d'), end=invest_end.strftime('%Y-%m-%d'))
    if prices_invest.empty:
        raise RuntimeError("Failed to download investment period prices")

    # Resolve display names and rename columns for plotting
    display_names = resolve_display_names(symbols)
    if isinstance(prices_invest, pd.DataFrame) and prices_invest.shape[1] == len(display_names):
        prices_invest.columns = display_names

    # Equal-weight baseline over investment horizon
    equal_w = np.ones(len(symbols)) / len(symbols)
    invest_series_eq, invest_final_eq = portfolio_cumulative_value(equal_w, prices_invest, initial)

    results = {
        'bars': [],  # for value comparison chart
        'equal_final': invest_final_eq,
        'equal_roi_pct': round((invest_final_eq / initial - 1) * 100, 1),
        'details': {}
    }

    # Per-window optimization and evaluation
    for w in windows:
        lookback_delta = parse_window(w)
        train_start = invest_start - lookback_delta
        train_end = invest_start

        prices_train = download_close(symbols, start=train_start.strftime('%Y-%m-%d'), end=train_end.strftime('%Y-%m-%d'))
        if prices_train.empty:
            print(f"[WARN] No training data for window {w}", file=sys.stderr)
            continue
        if isinstance(prices_train, pd.DataFrame) and prices_train.shape[1] == len(display_names):
            prices_train.columns = display_names

        mu, cov = annualized_stats(prices_train)
        n = len(symbols)
        risk_factor = 0.5  # balanced

        # Optimize
        if use_qaoa_hybrid:
            # QAOA 2-bit 정수 최적화 + MPT 리파인먼트 사용 (느림)
            last_prices = prices_train.iloc[-1]
            if isinstance(last_prices, pd.Series):
                price_vec = last_prices.values.astype(float)
            else:
                price_vec = np.array([float(last_prices)])
            constraints_for_qaoa = {
                'prices': price_vec,
                'budget': float(initial),
                'min_shares': np.zeros(n, dtype=int),
                'max_shares': np.full(n, 3, dtype=int),  # 2-bit 공간(0~3주)
            }
            weights = optimize_with_qaoa(n, mu, cov, risk_factor, constraints_for_qaoa)
            method_label = f"Qiskit {w.replace('mo',' Months').replace('y',' Years')}"  # label for chart
        else:
            # MPT만 사용 (빠름, 분산 강제)
            weights = optimize_with_modern_portfolio_theory(
                n, mu, cov, risk_factor,
                constraints={
                    'min_weights': np.full(n, diversify_bounds[0]),
                    'max_weights': np.full(n, diversify_bounds[1])
                }
            )
            method_label = f"MPT {w.replace('mo',' Months').replace('y',' Years')}"

        # Evaluate over investment period
        invest_series_opt, invest_final_opt = portfolio_cumulative_value(weights, prices_invest, initial)
        roi_pct = round((invest_final_opt / initial - 1) * 100, 1)

        results['bars'].append({
            'label': method_label,
            'final': float(invest_final_opt),
            'roi_pct': roi_pct,
            'weights': weights.tolist(),
        })
        results['details'][w] = {
            'weights': weights.tolist(),
            'investment_series': invest_series_opt,
            'training_prices': prices_train,
        }

    # --------------
    # Plotting
    # --------------

    # 1) Final Portfolio Value Comparison (Equal vs Optimized per window)
    labels = ["Equal Weight"] + [b['label'] for b in results['bars']]
    values = [results['equal_final']] + [b['final'] for b in results['bars']]
    rois = [results['equal_roi_pct']] + [b['roi_pct'] for b in results['bars']]

    fig, ax = plt.subplots(figsize=(12, 6))
    bars = ax.bar(labels, values, color=["#f4a6a6"] + ["#a6c8ff"] * len(results['bars']))
    ax.axhline(initial, color='red', linestyle='--', linewidth=1, label=f"Initial Investment: ${initial:,.0f}")
    ax.set_title("Final Portfolio Value Comparison\n(Equal Weight vs Qiskit Optimization by Training Period)", fontsize=14, fontweight='bold')
    ax.set_ylabel("Final Portfolio Value (USD)")
    ax.legend(loc='upper left')

    for b, v, r in zip(bars, values, rois):
        ax.text(b.get_x() + b.get_width() / 2, v + (max(values) * 0.01), f"${v:,.0f}\n({r}%)", ha='center', va='bottom', fontsize=10)

    plt.xticks(rotation=15)
    plt.tight_layout()
    fp = os.path.join(out_dir, "final_portfolio_value_comparison.png")
    plt.savefig(fp, dpi=140)
    plt.close(fig)

    # 2) Per-window charts: weights, training performance, investment value series
    for w, det in results['details'].items():
        opt_w = np.array(det['weights'])
        eq_w = np.ones_like(opt_w) / len(opt_w)
        x = np.arange(len(symbols))
        width = 0.35

        # 2-a) Weight comparison
        fig2, ax2 = plt.subplots(figsize=(12, 6))
        ax2.bar(x - width/2, opt_w, width, label='Qiskit Optimization', color='#a6c8ff', edgecolor='#4a76ff', linewidth=1.5)
        ax2.bar(x + width/2, eq_w, width, label='Equal Weight', color='#f4a6a6')
        ax2.set_title(f"Portfolio Weight Comparison\n({w.replace('y',' Year').replace('mo',' Months')} Training Period)", fontsize=14, fontweight='bold')
        ax2.set_ylabel("Portfolio Weight")
        ax2.set_xticks(x)
        ax2.set_xticklabels(display_names)
        ax2.legend()
        for i, (ow, ew) in enumerate(zip(opt_w, eq_w)):
            ax2.text(i - width/2, ow + 0.01, f"{ow*100:.1f}%", ha='center', fontsize=9)
            ax2.text(i + width/2, ew + 0.01, f"{ew*100:.1f}%", ha='center', fontsize=9)
        plt.tight_layout()
        fp2 = os.path.join(out_dir, f"weight_comparison_{w}.png")
        plt.savefig(fp2, dpi=140)
        plt.close(fig2)

        # 2-b) Training period performance (per window)
        train_prices = det['training_prices']
        train_norm = train_prices / train_prices.iloc[0] * 100.0
        fig3, ax3 = plt.subplots(figsize=(12, 6))
        train_norm.plot(ax=ax3)
        ax3.set_title(f"Training Period Stock Performance ({w.replace('y',' Years').replace('mo',' Months')})\n(Normalized to 100)", fontsize=14, fontweight='bold')
        ax3.set_ylabel("Normalized Price")
        plt.tight_layout()
        fp3 = os.path.join(out_dir, f"training_period_performance_{w}.png")
        plt.savefig(fp3, dpi=140)
        plt.close(fig3)

        # 2-c) Investment value series (optimized vs equal) for this window
        inv_series_opt = det['investment_series']
        fig2c, ax2c = plt.subplots(figsize=(12, 6))
        inv_series_opt.plot(ax=ax2c, label='Qiskit Optimization', color='#4a76ff')
        invest_series_eq.plot(ax=ax2c, label='Equal Weight', color='#e06666')
        ax2c.set_title(f"Investment Period Portfolio Value ({w.replace('y',' Years').replace('mo',' Months')} Training)\n(Initial ${initial:,.0f})", fontsize=14, fontweight='bold')
        ax2c.set_ylabel("Portfolio Value (USD)")
        ax2c.legend()
        plt.tight_layout()
        fp2c = os.path.join(out_dir, f"investment_value_series_{w}.png")
        plt.savefig(fp2c, dpi=140)
        plt.close(fig2c)

    # 4) Investment period performance chart
    invest_norm = prices_invest / prices_invest.iloc[0] * 100.0
    fig4, ax4 = plt.subplots(figsize=(12, 6))
    invest_norm.plot(ax=ax4)
    ax4.set_title(f"Investment Period Stock Performance ({investment_horizon.replace('y',' Years').replace('mo',' Months')})\n(Normalized to 100)", fontsize=14, fontweight='bold')
    ax4.set_ylabel("Normalized Price")
    plt.tight_layout()
    fp4 = os.path.join(out_dir, f"investment_period_performance_{investment_horizon}.png")
    plt.savefig(fp4, dpi=140)
    plt.close(fig4)

    # 5) Final amount comparison (each window shows final portfolio value)
    fig5, ax5 = plt.subplots(figsize=(18, 9))

    # Prepare data: Equal Weight vs each optimization window
    window_labels = ['Equal\nWeight'] + [f'최적화\n{w.replace("mo"," 개월").replace("y"," 년")}' for w in results['details'].keys()]

    # Calculate final amounts for each
    equal_amount = results['equal_final']
    opt_amounts = [b['final'] for b in results['bars']]

    amounts = [equal_amount] + opt_amounts
    colors = ['#f4a6a6'] + ['#a6c8ff' if i % 2 == 0 else '#6a9aff' for i in range(len(opt_amounts))]

    bars5 = ax5.bar(window_labels, amounts, color=colors, edgecolor='black', linewidth=1.2, width=0.5)

    # 제목/축 라벨 업데이트 (y축을 금액으로)
    ax5.set_title(f'최종 금액 비교 (각 학습 기간별)\n3개월 투자 후 포트폴리오 가치',
                  fontsize=18, fontweight='bold', pad=20)
    ax5.set_ylabel('최종 금액 (USD)', fontsize=14, fontweight='bold')
    ax5.set_xlabel('투자 전략', fontsize=14, fontweight='bold')

    # 초기 투자금 빨간 얇은 기준선 표시 + 범례로 안내
    ax5.axhline(initial, color='#d62728', linestyle='--', linewidth=1.2, alpha=0.9, zorder=1, 
                label=f'초기 투자금: ${initial:,.0f}')
    ax5.legend(loc='upper left')

    # 막대 라벨 단순화: 최종 금액만 표시 + 겹침 방지 여백
    y_max = max(amounts)
    # y축을 0부터로 복원하여 초기 투자금 선이 상대적으로 위쪽에 보이도록
    bottom = 0
    top = y_max * 1.10
    ax5.set_ylim(bottom, top)
    # y축 화폐 포맷 적용 (경고 제거: 역슬래시 제거)
    ax5.yaxis.set_major_formatter(FuncFormatter(lambda x, pos: f'${x:,.0f}'))
    for bar, amt in zip(bars5, amounts):
        ax5.text(bar.get_x() + bar.get_width()/2, amt * 1.01,
                 f'\\${amt:,.0f}', ha='center', va='bottom', fontsize=12, fontweight='bold')
    
    # 평균 추가 수익 계산 (상단에 텍스트로만 표시)
    equal_profit_per_window = equal_amount - initial
    opt_profits = [amt - initial for amt in opt_amounts]
    avg_opt_profit = sum(opt_profits) / len(opt_profits)
    avg_improvement = avg_opt_profit - equal_profit_per_window
    improvement_pct = (avg_improvement / equal_profit_per_window * 100) if equal_profit_per_window != 0 else 0.0
    
    # 상단에 평균 추가 수익 정보만 간단히 표시
    ax5.text(0.5, 0.97, 
        f'평균 추가 수익: \\${avg_improvement:,.0f} (+{improvement_pct:.1f}%)  |  초기 투자금: \\${initial:,.0f}', 
        ha='center', fontsize=14, fontweight='bold',
        transform=ax5.transAxes)
    
    # y축 포맷 간격/글자 겹침 개선
    plt.xticks(rotation=0, fontsize=12)
    plt.yticks(fontsize=11)
    plt.tight_layout(pad=2.0)
    fp5 = os.path.join(out_dir, "profit_comparison_by_window.png")
    plt.savefig(fp5, dpi=150)
    plt.close(fig5)

    print(f"\nBacktest complete. Charts saved to: {out_dir}")
    print(f" - {os.path.basename(fp)}")
    for w in results['details'].keys():
        print(f" - weight_comparison_{w}.png")
        print(f" - training_period_performance_{w}.png")
        print(f" - investment_value_series_{w}.png")
    print(f" - {os.path.basename(fp4)}")
    print(f" - {os.path.basename(fp5)}")
    print(f"\n💰 수익 비교:")
    print(f"   Equal Weight: ${equal_profit_per_window:,.0f}")
    for w, profit in zip(results['details'].keys(), opt_profits):
        improvement = profit - equal_profit_per_window
        print(f"   {w} 학습: ${profit:,.0f} (Equal 대비 {improvement:+,.0f}, {improvement/equal_profit_per_window*100:+.1f}%)")
    print(f"   평균 추가 수익: ${avg_improvement:,.0f} ({avg_improvement/equal_profit_per_window*100:+.1f}%)")

    return {
        'output_dir': out_dir,
        'value_chart': fp,
        'weight_chart': fp2 if windows else None,
        'training_chart': fp3 if windows else None,
        'investment_chart': fp4,
        'results': results,
    }


# ----------------------------
# CLI
# ----------------------------

def main():
    parser = argparse.ArgumentParser(description="Multi-window portfolio backtest with charts")
    parser.add_argument('--tickers', nargs='+', default=['005930.KS', '000660.KS', 'TSLA', 'NVDA', 'AAPL'], help='Stock symbols')
    parser.add_argument('--windows', nargs='+', default=['6mo', '1y', '2y', '3y', '5y'], help='Training windows')
    parser.add_argument('--horizon', default='3mo', help='Investment horizon (e.g., 3mo)')
    parser.add_argument('--initial', type=float, default=10000.0, help='Initial investment in USD')
    parser.add_argument('--use-qaoa', action='store_true', help='Use QAOA hybrid (slow); default is fast MPT only')
    args = parser.parse_args()

    run_backtest(args.tickers, args.windows, args.horizon, args.initial, use_qaoa_hybrid=args.use_qaoa)


if __name__ == '__main__':
    main()
