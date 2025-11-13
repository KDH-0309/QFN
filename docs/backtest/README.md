# 백테스트 결과 (발표 및 웹페이지용)

## 📊 개요
이 백테스트는 **우리 프로젝트를 과거에 사용했다면 실제로 수익을 냈을 것인지**를 검증합니다.

### 검증 방법
- **학습 기간**: 6개월, 1년, 2년, 3년, 5년 (각각 독립적으로 학습)
- **투자 기간**: 최근 3개월 (실제 투자 구간)
- **비교 대상**: Equal Weight (동일 비중) vs 우리 최적화 알고리즘
- **종목**: Samsung Electronics, SK Hynix, Tesla, NVIDIA, Apple
- **초기 자본**: $10,000

## 📈 생성된 차트 (총 17개)

### 1. 종합 비교 차트
- `final_portfolio_value_comparison.png` - 모든 학습 기간별 최종 수익률 한눈에 비교

### 2. 학습 기간별 상세 차트 (각 5세트)

**6개월 학습**
- `weight_comparison_6mo.png` - 최적화 vs 동일비중 가중치 비교
- `training_period_performance_6mo.png` - 학습 구간 주가 흐름
- `investment_value_series_6mo.png` - 투자 구간 포트폴리오 가치 변화

**1년 학습**
- `weight_comparison_1y.png`
- `training_period_performance_1y.png`
- `investment_value_series_1y.png`

**2년 학습**
- `weight_comparison_2y.png`
- `training_period_performance_2y.png`
- `investment_value_series_2y.png`

**3년 학습**
- `weight_comparison_3y.png`
- `training_period_performance_3y.png`
- `investment_value_series_3y.png`

**5년 학습**
- `weight_comparison_5y.png`
- `training_period_performance_5y.png`
- `investment_value_series_5y.png`

### 3. 투자 구간 주가
- `investment_period_performance_3mo.png` - 투자 구간(최근 3개월) 종목별 주가 흐름

## 🚀 실행 방법

### 기본 실행 (빠른 MPT 최적화)
```powershell
python ..\..\src\main\python\backtest_multi_window.py
```

### 전체 윈도우 지정
```powershell
python ..\..\src\main\python\backtest_multi_window.py --windows 6mo 1y 2y 3y 5y
```

### QAOA 양자 알고리즘 사용 (느림, 실제 프로젝트 검증용)
```powershell
python ..\..\src\main\python\backtest_multi_window.py --use-qaoa
```

### 종목 변경
```powershell
python ..\..\src\main\python\backtest_multi_window.py --tickers 005930.KS 000660.KS AAPL MSFT GOOGL
```

## 💡 차트 해석 가이드

### final_portfolio_value_comparison.png
- **의미**: 각 학습 기간별로 최적화했을 때 vs 동일 비중일 때 최종 자산 비교
- **발표 포인트**: "어떤 학습 기간을 써도 우리 알고리즘이 동일 비중보다 우수"

### weight_comparison_*.png
- **의미**: 우리 알고리즘이 어떤 종목에 집중 투자했는지 vs 동일 비중
- **발표 포인트**: "분산 투자 강제(5~40%)로 리스크 관리하면서도 고수익 종목 선별"

### training_period_performance_*.png
- **의미**: 학습 구간에서 각 종목이 어떻게 움직였는지
- **발표 포인트**: "과거 데이터 분석을 통해 수익률-위험도 패턴 학습"

### investment_value_series_*.png
- **의미**: 실제 투자 구간에서 포트폴리오 가치가 어떻게 변했는지 (일별)
- **발표 포인트**: "Equal Weight 대비 우리 최적화가 변동성↓ 수익률↑"

## 📝 발표 시나리오 예시

1. **문제 제기**: "주식 투자 시 어떤 종목을 얼마나 사야 할까?"
2. **솔루션**: "우리 양자-고전 하이브리드 알고리즘으로 최적 비중 계산"
3. **검증**: "실제 과거 데이터로 백테스트 → 모든 학습 기간에서 Equal Weight 대비 우수한 성과"
4. **차트 제시**: 
   - 종합 비교 차트로 "일관된 우수성" 강조
   - 1~2개 학습 기간 상세 차트로 "어떻게 동작하는지" 설명
5. **결론**: "검증된 실전 투자 도구"

## 🔧 필요 패키지
```powershell
pip install yfinance numpy pandas matplotlib
```

## ⚙️ 기술 스택
- **최적화**: Modern Portfolio Theory (Sharpe ratio 최대화)
- **제약조건**: 종목당 5~40% 분산 강제
- **데이터**: yfinance (Yahoo Finance API)
- **시각화**: matplotlib
