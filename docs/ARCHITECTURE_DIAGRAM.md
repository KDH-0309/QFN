# QuantaFolio Navigator 아키텍처 다이어그램 (상세)

이 문서는 프로젝트의 전체 시스템 구조, 데이터 흐름, 기술 스택을 상세하게 정리한 자료입니다. PPT, 보고서, 협업 문서 등에 바로 활용할 수 있습니다.

---

## 📐 전체 시스템 구조 (3-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Presentation Layer (Client)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Frontend: React 18 + Vite + Tailwind CSS                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐      │
│  │ Dashboard   │  │ Portfolio    │  │ Chatbot  │  │ Settings   │      │
│  │ (요약/차트)  │  │ Optimizer    │  │ (AI 대화)│  │ (언어/테마) │      │
│  └─────────────┘  └──────────────┘  └──────────┘  └────────────┘      │
│        ↕ Axios HTTP Client + React Router + i18next                    │
└─────────────────────────────────────────────────────────────────────────┘
                              ↕ REST API (JSON)
┌─────────────────────────────────────────────────────────────────────────┐
│                    Application Layer (Backend)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Spring Boot 3.1.5 (Java 17) + Spring Security + JWT                   │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │  Controller Layer (REST API)                               │        │
│  │  ├─ PortfolioController    (/api/portfolio/*)             │        │
│  │  ├─ UserController          (/api/users/*)                │        │
│  │  ├─ ChatbotController       (/api/chatbot/*)              │        │
│  │  └─ VisualizationController (/api/visualizations/*)       │        │
│  └────────────────────────────────────────────────────────────┘        │
│                              ↕                                          │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │  Service Layer (Business Logic)                            │        │
│  │  ├─ PortfolioService       (포트폴리오 CRUD, 최적화 조정)   │        │
│  │  ├─ PythonIntegrationService (Python 스크립트 실행/통신)   │        │
│  │  ├─ ChatbotService         (AI 프롬프트/응답 관리)         │        │
│  │  └─ UserService            (인증/JWT/이메일)               │        │
│  └────────────────────────────────────────────────────────────┘        │
│                              ↕                                          │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │  Repository Layer (Data Access)                            │        │
│  │  ├─ StockRepository        (종목 정보)                     │        │
│  │  ├─ PortfolioRepository    (포트폴리오)                    │        │
│  │  ├─ UserRepository         (사용자)                        │        │
│  │  └─ SessionRepository      (임시 세션)                     │        │
│  └────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
        ↕ JPA/Hibernate                    ↕ Commons Exec
┌───────────────────────┐          ┌────────────────────────────┐
│   Data Layer (DB)     │          │  Python Integration        │
├───────────────────────┤          ├────────────────────────────┤
│  MariaDB (Production) │          │  Python 3.8+               │
│  ├─ users             │          │  ┌──────────────────────┐  │
│  ├─ stocks            │          │  │ optimize_portfolio.py│  │
│  ├─ portfolios        │          │  │ (Qiskit QAOA 최적화) │  │
│  ├─ optimization_     │          │  └──────────────────────┘  │
│  │   results          │          │  ┌──────────────────────┐  │
│  └─ sessions          │          │  │ fetch_stock_data.py  │  │
│                       │          │  │ (yfinance 실시간시세)│  │
│  H2 (Dev/Test)        │          │  └──────────────────────┘  │
└───────────────────────┘          └────────────────────────────┘
                                              ↕ HTTP API
                                   ┌────────────────────────────┐
                                   │  External APIs             │
                                   │  ├─ yfinance (Yahoo)       │
                                   │  ├─ ExchangeRate API       │
                                   │  └─ AI Chatbot API (GPT)   │
                                   └────────────────────────────┘
```

---

## 🔄 주요 데이터 흐름 (Sequence Diagram)

### 시나리오 1: 포트폴리오 최적화 실행

```
사용자(React)
   │
   │ POST /api/portfolio/optimize
   │ { "stocks": ["AAPL", "MSFT"], "constraints": {"risk": 5} }
   ▼
PortfolioController
   │
   │ optimize(request)
   ▼
PortfolioService
   │
   │ 1. 입력 검증 (종목 수, 위험도 범위 등)
   │ 2. 종목별 가격/통계 데이터 조회 (DB 캐시 or Python)
   ▼
PythonIntegrationService
   │
   │ 3. input.json 생성
   │ 4. python optimize_portfolio.py --input input.json 실행
   ▼
Python (optimize_portfolio.py)
   │
   │ 5. Qiskit QAOA 알고리즘 실행
   │    - 목적함수: minimize(risk - risk_factor * return)
   │    - 제약조건: Σ weights = 1
   │ 6. 결과 JSON 출력 (stdout)
   ▼
PythonIntegrationService
   │
   │ 7. stdout 파싱 → DTO 변환
   ▼
PortfolioService
   │
   │ 8. 결과 저장 (optimization_results 테이블)
   │ 9. 응답 DTO 생성
   ▼
PortfolioController
   │
   │ HTTP 200 OK + JSON
   │ { "allocation": {...}, "expectedReturn": 0.12, "riskScore": 4.8 }
   ▼
사용자(React)
   │
   │ 10. 결과 시각화 (차트, 표, 지표)
   └─── Dashboard/PortfolioOptimizer 컴포넌트
```

### 시나리오 2: 실시간 시세 조회

```
사용자(React)
   │ GET /api/portfolio/stock-price/AAPL
   ▼
PortfolioController
   │ getStockPrice("AAPL")
   ▼
PortfolioService
   │ 1. 캐시 확인 (5분 이내 데이터)
   │ 2. 캐시 없으면 Python 실행
   ▼
PythonIntegrationService
   │ python fetch_stock_data.py --symbol AAPL
   ▼
Python (fetch_stock_data.py)
   │ 1. yfinance로 실시간 시세 조회
   │ 2. 실패 시 Mock 데이터 폴백
   │ 3. USD → KRW 환율 변환 (해외 종목)
   │ 4. 통계 계산 (평균, 표준편차 등)
   ▼
PythonIntegrationService
   │ stdout 파싱 → StockPriceDto
   ▼
PortfolioService
   │ 캐시 저장 (5분 TTL)
   ▼
PortfolioController
   │ HTTP 200 OK + JSON
   │ { "symbol": "AAPL", "price": 234000, "dataSource": "yfinance" }
   ▼
사용자(React)
   │ StockSearchInput 컴포넌트에 가격 표시
```

---

## 🔐 보안 및 인증 흐름

```
1. 회원가입/로그인
   사용자 → POST /api/users/login → UserController
   → UserService (Spring Security 인증)
   → JWT 토큰 생성 (jjwt 라이브러리)
   → { "token": "eyJhbG...", "user": {...} }

2. 인증된 요청
   모든 API 요청
   → Header: Authorization: Bearer <token>
   → JwtAuthenticationFilter 검증
   → 유효하면 요청 처리
   → 무효하면 HTTP 401 Unauthorized
```

---

## 🛠️ 기술 스택 상세

### Frontend
- **React 18**: 컴포넌트 기반 UI
- **Vite**: 빠른 빌드/HMR (Webpack 대비 10배 빠름)
- **Tailwind CSS**: 유틸리티 클래스 기반 스타일링
- **Axios**: Promise 기반 HTTP 클라이언트
- **React Router**: SPA 라우팅
- **i18next**: 다국어 지원 (KO/EN)
- **Recharts**: 차트 시각화 (라인/파이/바 차트)

### Backend
- **Java 17**: LTS, 최신 문법 (Records, Pattern Matching)
- **Spring Boot 3.1.5**: 자동 설정, 내장 Tomcat
- **Spring Data JPA**: ORM (Hibernate 6.2.x)
- **Spring Security + JWT**: 인증/인가
- **MariaDB**: 오픈소스 RDBMS (MySQL 호환)
- **H2**: 인메모리 DB (개발/테스트)
- **Apache Commons Exec**: 외부 프로세스 실행
- **Spring Mail**: SMTP 이메일 발송

### Python (Data/AI)
- **Python 3.8+**: 데이터 과학 생태계
- **Qiskit 0.45.0**: 양자 컴퓨팅 프레임워크
- **Qiskit Optimization 0.6.0**: QAOA 알고리즘
- **yfinance 0.2.32**: Yahoo Finance API (실시간 시세)
- **NumPy/Pandas**: 데이터 처리/분석
- **SciPy**: 통계/최적화 보조
- **Matplotlib**: 시각화 (선택적)

### DevOps/Infra
- **Gradle/Maven**: 빌드 도구
- **Git**: 버전 관리
- **단일 포트 배포**: Spring Boot가 정적 파일 + API 서빙
- **SMTP**: Gmail SMTP로 이메일 발송

---

## 📊 PPT용 요약 불릿

### 계층별 역할
- **Presentation**: React SPA, 사용자 인터랙션, 시각화
- **Application**: Spring Boot, 비즈니스 로직, API 제공, Python 연동
- **Data**: MariaDB 영속화, Python 데이터 처리, 외부 API 연동

### 데이터 흐름
- **사용자 입력** → React → REST API → Spring Boot → Python/DB → 결과 반환 → React 시각화

### 핵심 기능
- **포트폴리오 최적화**: QAOA 알고리즘으로 리스크-수익 균형 자동 설계
- **실시간 시세**: yfinance + KRW 환율 변환, 실패 시 Mock 폴백
- **AI 챗봇**: 투자 관련 질문 답변 (GPT 연동)
- **인증/보안**: JWT 토큰 기반 Stateless 인증

### 확장 가능성
- 모듈화된 3-Tier 구조로 각 계층 독립 수정/확장 가능
- REST API로 프론트/백엔드 독립 배포 가능
- Python 연동으로 데이터 과학 라이브러리 활용 용이
- JWT로 수평 확장(Scale-out) 가능

---

**문의/수정 요청:** KDH-0309
