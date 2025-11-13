# QuantaFolio Navigator 주요 코드 및 API 명세서

이 문서는 프로젝트의 핵심 코드 스니펫과 API 엔드포인트 명세를 정리한 자료입니다. 발표용 PPT, 문서화, 협업 등에 활용할 수 있습니다.

---

## 주요 코드 스니펫

### 1. 포트폴리오 최적화 (Python, QAOA)
```python
def optimize_portfolio(weights, returns, risk_factor):
    qp = QuadraticProgram()
    # ... 변수/제약조건 정의 ...
    qaoa = QAOA(reps=3, quantum_instance=Aer.get_backend('aer_simulator'))
    optimizer = MinimumEigenOptimizer(qaoa)
    result = optimizer.solve(qp)
    return result
```

### 2. 실시간 시세 데이터 조회 (Python)
```python
def get_stock_price(symbol):
    stock = yf.Ticker(symbol)
    price = stock.info['regularMarketPrice']
    return price
```

### 3. 백엔드 API 엔드포인트 (Spring Boot)
```java
@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {
    @GetMapping("/stock-price/{symbol}")
    public ResponseEntity<StockPriceDto> getStockPrice(@PathVariable String symbol) {
        // ... 시세 조회 및 반환 ...
    }

    @PostMapping("/optimize")
    public ResponseEntity<PortfolioResultDto> optimizePortfolio(@RequestBody PortfolioRequestDto request) {
        // ... 최적화 실행 및 결과 반환 ...
    }
}
```

---

## API 명세서

### 포트폴리오 관련
- `GET /api/portfolio/stock-price/{symbol}`
  - 특정 종목의 실시간 가격 조회
  - 예시: `/api/portfolio/stock-price/AAPL`

- `POST /api/portfolio/stocks`
  - 종목 저장(사용자별 포트폴리오)

- `GET /api/portfolio/stocks/{sessionId}`
  - 저장된 종목 목록 조회

- `DELETE /api/portfolio/stocks/{sessionId}`
  - 저장된 종목 삭제

- `POST /api/portfolio/optimize`
  - 포트폴리오 최적화 실행
  - Request 예시:
    ```json
    {
      "stocks": ["AAPL", "MSFT", "GOOGL"],
      "constraints": { "risk": 5, "budget": 10000000 }
    }
    ```
  - Response 예시:
    ```json
    {
      "allocation": { "AAPL": 0.4, "MSFT": 0.3, "GOOGL": 0.3 },
      "expectedReturn": 0.12,
      "riskScore": 4.8
    }
    ```

### 챗봇 관련
- `POST /api/chatbot/chat`
  - 투자 관련 질문 입력 시 AI 챗봇 답변 반환
  - Request 예시:
    ```json
    { "question": "포트폴리오 리밸런싱이란?" }
    ```
  - Response 예시:
    ```json
    { "answer": "리밸런싱은 자산 배분을 재조정하는 과정입니다." }
    ```

---

## 활용 방법
- 발표용 PPT의 "주요 코드" 및 "API 명세서" 슬라이드에 발췌/요약해 활용
- 개발자/협업자에게 프로젝트 기능 구조를 빠르게 전달
- 문서화/보고서/기획서에 인용 가능

---

**문의/수정 요청:** KDH-0309
