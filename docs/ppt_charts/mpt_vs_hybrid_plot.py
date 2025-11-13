import argparse
import math
import os
from typing import Optional

import pandas as pd
import matplotlib.pyplot as plt
from matplotlib import font_manager


DEF_OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'backtest', 'mpt_vs_hybrid_3mo.png')
DEF_INPUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'mpt_vs_hybrid_3mo.csv')


def load_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    # Expected columns: window_label, mpt_final_value, hybrid_final_value, initial_investment
    # Coerce numerics
    for col in ['mpt_final_value', 'hybrid_final_value', 'initial_investment']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    if 'window_label' not in df.columns:
        df['window_label'] = [f'win_{i+1}' for i in range(len(df))]
    return df


def compute_summary(df: pd.DataFrame) -> Optional[dict]:
    if 'hybrid_final_value' not in df.columns:
        return None
    # Average hybrid value across rows (only finite)
    hvals = df['hybrid_final_value'].dropna()
    if hvals.empty:
        return None
    initial = df.get('initial_investment')
    initial_val = float(initial.iloc[0]) if initial is not None and not initial.isna().all() else None

    # If MPT exists, compute average uplift over MPT; else only report over initial if available
    res = {'avg_hybrid': hvals.mean()}
    if 'mpt_final_value' in df.columns and df['mpt_final_value'].notna().any():
        mvals = df['mpt_final_value'].dropna()
        if not mvals.empty:
            res['avg_mpt'] = mvals.mean()
            res['avg_uplift_over_mpt'] = res['avg_hybrid'] - res['avg_mpt']
            if res['avg_mpt'] != 0:
                res['avg_uplift_over_mpt_pct'] = res['avg_uplift_over_mpt'] / res['avg_mpt'] * 100.0
    if initial_val is not None:
        res['initial'] = initial_val
        res['avg_uplift_over_initial'] = res['avg_hybrid'] - initial_val
        if initial_val != 0:
            res['avg_uplift_over_initial_pct'] = res['avg_uplift_over_initial'] / initial_val * 100.0
    return res


def _setup_korean_font():
    # Try common Korean fonts on Windows/macOS/Linux. Fallback to default if none found.
    candidates = [
        'Malgun Gothic',        # Windows default Korean
        'NanumGothic',          # Popular OSS font
        'Noto Sans CJK KR',     # Google Noto
        'AppleGothic',          # macOS
    ]
    installed = set(f.name for f in font_manager.fontManager.ttflist)
    for name in candidates:
        if name in installed:
            plt.rcParams['font.family'] = name
            break
    plt.rcParams['axes.unicode_minus'] = False
    plt.rcParams['font.size'] = 11


def plot(df: pd.DataFrame, out_path: str):
    _setup_korean_font()

    has_mpt = 'mpt_final_value' in df.columns and df['mpt_final_value'].notna().any()
    windows = df['window_label'].astype(str).tolist()
    x = range(len(windows))

    width = 0.35 if has_mpt else 0.5
    fig, ax = plt.subplots(figsize=(12, 6))

    # Bars
    if has_mpt:
        ax.bar([i - width/2 for i in x], df['mpt_final_value'], width=width, label='MPT', color='#94a3b8', edgecolor='#334155')
        ax.bar([i + width/2 for i in x], df['hybrid_final_value'], width=width, label='하이브리드 (MPT+QAOA)', color='#60a5fa', edgecolor='#1e40af')
    else:
        ax.bar(x, df['hybrid_final_value'], width=width, label='하이브리드 (MPT+QAOA)', color='#60a5fa', edgecolor='#1e40af')

    # Value labels
    def annotate(values, xs):
        for xv, yv in zip(xs, values):
            if pd.notna(yv):
                ax.text(xv, yv + max(df['hybrid_final_value'].max()*0.01, 10), f"${yv:,.0f}", ha='center', va='bottom', fontsize=9)

    if has_mpt:
        annotate(df['mpt_final_value'], [i - width/2 for i in x])
        annotate(df['hybrid_final_value'], [i + width/2 for i in x])
    else:
        annotate(df['hybrid_final_value'], x)

    ax.set_xticks(x)
    ax.set_xticklabels(windows)
    ax.set_ylabel('최종 금액 (USD)')
    ax.set_xlabel('학습 기간')
    title = 'MPT vs 하이브리드 최종 금액 비교 (3개월 투자)'
    ax.set_title(title)

    # Initial investment ref line
    if 'initial_investment' in df.columns and df['initial_investment'].notna().any():
        init = float(df['initial_investment'].dropna().iloc[0])
        ax.axhline(init, color='red', linestyle='--', linewidth=1)
        ax.text(len(x)-0.5, init + max(df['hybrid_final_value'].max()*0.008, 5), f'초기 투자금: ${init:,.0f}', color='red')

    ax.legend()
    if not has_mpt:
        ax.text(0.5, 0.95, 'MPT 데이터가 없어 하이브리드만 표시되었습니다.', transform=ax.transAxes,
                ha='center', va='top', fontsize=10, color='#ef4444', bbox=dict(boxstyle='round', fc='#fff1f2', ec='#fecaca'))
    ax.grid(axis='y', linestyle=':', alpha=0.4)
    fig.tight_layout()

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    plt.savefig(out_path, dpi=180)
    print(f"Saved chart to: {out_path}")


def main():
    parser = argparse.ArgumentParser(description='Plot MPT vs Hybrid comparison from CSV')
    parser.add_argument('--csv', default=DEF_INPUT)
    parser.add_argument('--out', default=DEF_OUTPUT)
    args = parser.parse_args()

    df = load_data(args.csv)
    summary = compute_summary(df)
    if summary:
        print('Summary:', summary)
    plot(df, args.out)


if __name__ == '__main__':
    main()
