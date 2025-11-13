#!/usr/bin/env python3
"""
Generate a PPT-ready side-by-side comparison chart (MPT vs Hybrid) per training window
by reusing the existing multi-window backtest code.

It runs the backtest twice (MPT-only and Hybrid/QAOA+MPT) with the same
tickers/windows/horizon/initial, then plots two bars per window.

Usage (examples):
  python docs/ppt_charts/mpt_vs_hybrid_from_backtest.py \
    --tickers 005930.KS 000660.KS TSLA NVDA AAPL \
    --windows 6mo 1y 2y 3y 5y \
    --horizon 3mo \
    --initial 10000 \
    --out docs/backtest/mpt_vs_hybrid_by_window.png

If quantum libraries are not installed, the Hybrid run will fall back to MPT.
"""
from __future__ import annotations
import os
import sys
import argparse
from typing import List

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm


def _ensure_path():
    # Add src/main/python to import path for backtest module
    here = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(here, '..', '..'))
    src_py = os.path.join(repo_root, 'src', 'main', 'python')
    if src_py not in sys.path:
        sys.path.insert(0, src_py)


_ensure_path()
from backtest_multi_window import run_backtest


def _set_korean_font():
    try_fonts = [
        'Malgun Gothic',  # Windows
        'AppleGothic',    # macOS
        'NanumGothic',
        'Noto Sans CJK KR',
        'Noto Sans CJK',
    ]
    available = {f.name for f in fm.fontManager.ttflist}
    for f in try_fonts:
        if f in available:
            plt.rcParams['font.family'] = f
            break
    plt.rcParams['axes.unicode_minus'] = False


def build_chart(tickers: List[str], windows: List[str], horizon: str, initial: float, out_path: str):
    # Run MPT-only (fast)
    mpt_res = run_backtest(tickers, windows, horizon, float(initial), use_qaoa_hybrid=False)

    # Run Hybrid (QAOA+MPT; will fall back to MPT if quantum libs missing)
    hybrid_res = run_backtest(tickers, windows, horizon, float(initial), use_qaoa_hybrid=True)

    # Prepare data aligned by window
    mpt_vals = []
    hyb_vals = []
    aligned_windows = []
    for w in windows:
        if w not in mpt_res['results']['details'] or w not in hybrid_res['results']['details']:
            # Skip window if either run had missing data
            continue
        mpt_series = mpt_res['results']['details'][w]['investment_series']
        hyb_series = hybrid_res['results']['details'][w]['investment_series']
        mpt_vals.append(float(mpt_series.iloc[-1]))
        hyb_vals.append(float(hyb_series.iloc[-1]))
        aligned_windows.append(w)

    if not aligned_windows:
        raise RuntimeError('No windows produced valid results in both runs.')

    # Plot
    _set_korean_font()
    x = np.arange(len(aligned_windows))
    width = 0.35

    fig, ax = plt.subplots(figsize=(14, 7))

    bars_mpt = ax.bar(x - width/2, mpt_vals, width, label='MPT', color='#6aa84f', edgecolor='#2d5a27', linewidth=1.2)
    bars_hyb = ax.bar(x + width/2, hyb_vals, width, label='하이브리드(QAOA+MPT)', color='#4a76ff', edgecolor='#2649a4', linewidth=1.2)

    # Labels and lines
    ax.axhline(initial, color='#d62728', linestyle='--', linewidth=1.0, label=f'초기 투자금: ${initial:,.0f}')
    ax.set_title(f'MPT vs 하이브리드 비교 (학습 기간별)\n투자기간 {horizon}, 초기 ${initial:,.0f}', fontsize=16, fontweight='bold')
    ax.set_ylabel('최종 금액 (USD)')
    ax.set_xticks(x)
    ax.set_xticklabels([w.replace('mo','개월').replace('y','년') for w in aligned_windows])
    ax.legend(loc='upper left')

    # Annotate values and ROI
    def _roi(v):
        return (v / initial - 1.0) * 100.0
    ymax = max(max(mpt_vals), max(hyb_vals)) * 1.10
    ax.set_ylim(0, ymax)
    for b, v in zip(bars_mpt, mpt_vals):
        ax.text(b.get_x() + b.get_width()/2, v * 1.01, f'${v:,.0f}\n({_roi(v):+.1f}%)', ha='center', va='bottom', fontsize=10)
    for b, v in zip(bars_hyb, hyb_vals):
        ax.text(b.get_x() + b.get_width()/2, v * 1.01, f'${v:,.0f}\n({_roi(v):+.1f}%)', ha='center', va='bottom', fontsize=10)

    plt.tight_layout()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    plt.savefig(out_path, dpi=160)
    plt.close(fig)

    # Simple console summary
    try:
        import json
        print(json.dumps({
            'out': os.path.abspath(out_path),
            'windows': aligned_windows,
            'mpt': mpt_vals,
            'hybrid': hyb_vals,
        }))
    except Exception:
        pass


def main():
    p = argparse.ArgumentParser(description='Create MPT vs Hybrid side-by-side chart from backtest results')
    p.add_argument('--tickers', nargs='+', required=False, default=['005930.KS', '000660.KS', 'TSLA', 'NVDA', 'AAPL'])
    p.add_argument('--windows', nargs='+', required=False, default=['6mo', '1y', '2y', '3y', '5y'])
    p.add_argument('--horizon', required=False, default='3mo')
    p.add_argument('--initial', type=float, required=False, default=10000.0)
    p.add_argument('--out', required=False, default=os.path.join('docs', 'backtest', 'mpt_vs_hybrid_by_window.png'))
    args = p.parse_args()

    build_chart(args.tickers, args.windows, args.horizon, args.initial, args.out)


if __name__ == '__main__':
    main()
