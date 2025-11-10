# 📈 실시간 주가 데이터 가이드

## 🔍 문제 상황
이전에는 Mock 데이터만 사용하여 주가가 실시간으로 업데이트되지 않았습니다.

## ✅ 해결 방법

### 1. Python 스크립트 수정 완료
`src/main/python/fetch_stock_data.py`가 실시간 데이터를 가져오도록 수정되었습니다.

**동작 방식:**
1. **우선순위**: yfinance를 통한 실시간 데이터 조회
2. **폴백**: 실패 시 Mock 데이터 사용
3. **환율 자동 변환**: 해외 주식은 자동으로 원화로 변환 (USD → KRW)

### 2. 지원되는 주식 시장

#### 한국 주식 (KOSPI)
- 심볼 형식: `종목코드.KS`
- 예시:
  - `005930.KS` - 삼성전자
  - `000660.KS` - SK하이닉스
  - `035420.KS` - 네이버
  - `035720.KS` - 카카오

#### 미국 주식 (NASDAQ, NYSE)
- 심볼 형식: `AAPL`, `TSLA` 등
- 예시:
  - `AAPL` - Apple
  - `MSFT` - Microsoft
  - `GOOGL` - Alphabet (Google)
  - `TSLA` - Tesla
  - `NVDA` - NVIDIA

### 3. 실시간 데이터 정보

yfinance로 조회 시 다음 정보가 실시간으로 제공됩니다:

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "currentPrice": 234000,  // 원화 환산
  "change": 2600,
  "changePercent": 1.12,
  "volume": 45670000,
  "averageVolume": 52340000,
  "high52Week": 280000,
  "low52Week": 180000,
  "marketCap": 3800000000000,
  "peRatio": 28.5,
  "dividendYield": 0.0052,
  "beta": 1.25,
  "statistics": {
    "mean": 0.0012,
    "std": 0.0234,
    "min": -0.0456,
    "max": 0.0567,
    "median": 0.0008
  },
  "timestamp": "2025-11-07T15:49:00",
  "dataSource": "yfinance"  // 실시간 데이터임을 표시
}
```

### 4. Mock 데이터 (폴백)

실시간 데이터 조회 실패 시 다음 종목들은 Mock 데이터로 제공됩니다:

**한국 주식:**
- 삼성전자 (005930.KS): 71,000원
- SK하이닉스 (000660.KS): 127,000원
- 네이버 (035420.KS): 185,000원
- 카카오 (035720.KS): 45,000원
- LG화학 (051910.KS): 418,000원
- 삼성SDI (006400.KS): 365,000원
- 삼성바이오로직스 (207940.KS): 845,000원
- 현대차 (005380.KS): 233,000원
- 기아 (000270.KS): 95,000원
- 셀트리온 (068270.KS): 180,000원
- 삼성전기 (009150.KS): 155,000원

**미국 주식 (USD → KRW 환율: 1,300원):**
- Apple (AAPL): $180 → 234,000원
- Microsoft (MSFT): $375 → 487,500원
- Alphabet (GOOGL): $140 → 182,000원
- Amazon (AMZN): $145 → 188,500원
- Tesla (TSLA): $242 → 314,600원
- NVIDIA (NVDA): $495 → 643,500원
- Meta (META): $325 → 422,500원
- JPMorgan (JPM): $152 → 197,600원
- Visa (V): $257 → 334,100원
- Mastercard (MA): $412 → 535,600원

### 5. 사용 방법

#### 프론트엔드에서 주가 조회
```javascript
// StockSearchInput 컴포넌트에서 주식 선택 시 자동으로 실시간 가격 조회
const handleSelectStock = async (stock) => {
  try {
    const response = await axios.get(`/api/portfolio/stock-price/${stock.symbol}`);
    // response.data에 실시간 주가 정보 포함
    console.log('Data Source:', response.data.dataSource); // 'yfinance' 또는 'mock'
  } catch (error) {
    console.error('Error fetching stock price:', error);
  }
};
```

#### 백엔드 API 엔드포인트
```
GET /api/portfolio/stock-price/{symbol}

예시:
- GET /api/portfolio/stock-price/AAPL
- GET /api/portfolio/stock-price/005930.KS
```

### 6. 환율 정보
- 현재 USD → KRW 환율: **1,300원** (고정)
- 실제 서비스에서는 실시간 환율 API 사용 권장 (예: ExchangeRate-API)

### 7. 데이터 업데이트 주기
- **yfinance**: 거래 시간 중 15-20분 지연 데이터 제공
- **실시간**: 주식 거래소 개장 시간에만 업데이트
  - 한국: 평일 09:00 ~ 15:30 (KST)
  - 미국: 평일 09:30 ~ 16:00 (EST) = 23:30 ~ 06:00 (KST)
- **폴백 Mock**: 랜덤 변동(±2%) 적용

### 8. 로그 확인
Python 스크립트 실행 시 표준 에러 출력으로 데이터 소스 확인 가능:

```
Fetching real-time data for AAPL...  # yfinance 사용
```

또는

```
Failed to fetch real data: ...
Falling back to mock data for AAPL...  # Mock 데이터 사용
```

### 9. 의존성
- **Python 패키지**: `yfinance` (버전 0.2.66 설치됨)
- **설치 확인**: `pip list | findstr yfinance`
- **재설치**: `pip install --upgrade yfinance`

### 10. 문제 해결

#### yfinance 설치 안 됨
```bash
cd src/main/python
pip install -r requirements.txt
```

#### 주가 조회 실패
1. 심볼 형식 확인 (한국: `.KS` 접미사 필요)
2. 인터넷 연결 확인
3. 거래소 개장 시간 확인
4. Mock 데이터로 자동 폴백 확인

#### 환율 업데이트
`fetch_stock_data.py`에서 `USD_TO_KRW` 변수 수정:

```python
USD_TO_KRW = 1350  # 원하는 환율로 변경
```

## 🎯 결론
실시간 주가 데이터 조회가 활성화되었으며, 실패 시 자동으로 Mock 데이터로 폴백됩니다.
브라우저를 **강력 새로고침** (Ctrl + Shift + R) 하여 변경사항을 확인하세요!
