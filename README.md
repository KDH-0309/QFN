# AI 주식 포트폴리오 최적화 시스템

양자 컴퓨팅(Qiskit QAOA)을 활용한 AI 기반 주식 포트폴리오 최적화 웹 애플리케이션

## 🚀 주요 기능

- **양자 최적화**: Qiskit QAOA 알고리즘을 사용한 포트폴리오 최적화
- **실시간 주가 데이터**: yfinance를 통한 실시간 주식 데이터 수집
- **리스크 관리**: 위험도 기반 포트폴리오 배분
- **모던 UI**: React + Tailwind CSS 기반의 반응형 인터페이스
- **AI 챗봇**: 포트폴리오 관련 실시간 질의응답
- **다국어 지원**: 한국어/영어 지원
- **다양한 시장 지원**: 국내/해외 주식 통합 관리

## 🛠️ 기술 스택

### Backend
- **Java 17**
- **Spring Boot 3.1.5**
- **Spring Data JPA**
- **H2 Database**
- **Lombok**
- **Apache Commons Exec**

### Python Integration
- **Qiskit 0.45.0** - 양자 컴퓨팅 프레임워크
- **Qiskit Optimization 0.6.0** - 최적화 문제 해결
- **yfinance 0.2.32** - 주식 데이터 수집
- **NumPy, Pandas** - 데이터 처리
- **Matplotlib** - 시각화

### Frontend
- **React 18** - UI 라이브러리
- **Vite** - 빌드 툴
- **Tailwind CSS** - CSS 프레임워크
- **Axios** - HTTP 클라이언트
- **i18next** - 다국어 지원
- **Lucide React** - 아이콘

## 📋 시스템 요구사항

- **Java**: JDK 17 이상
- **Python**: Python 3.8 이상
- **Maven**: 3.6 이상
- **메모리**: 최소 2GB RAM
- **운영체제**: Windows, macOS, Linux

## 🔧 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd stock-portfolio-optimizer
```

### 2. Python 환경 설정
```bash
# Python 가상환경 생성 (선택사항)
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Python 패키지 설치
pip install -r src/main/python/requirements.txt
```

### 3. Python 실행 경로 설정
`src/main/resources/application.properties` 파일에서 Python 실행 경로를 시스템에 맞게 수정:

```properties
# Windows
python.executable=python

# macOS/Linux (가상환경 사용시)
python.executable=/path/to/venv/bin/python
```

### 4. 빠른 실행 (권장)
Windows에서 한 번에 빌드 및 실행:
```bash
# 프론트엔드 빌드 + 백엔드 실행
start.bat
```

수동 실행:
```bash
# 1. 프론트엔드 빌드
cd frontend
npm install
npm run build
cd ..

# 2. 백엔드 실행
gradlew bootRun
```

### 5. 웹 브라우저에서 접속
```
http://localhost:8080
```

> **개발 모드**: 프론트엔드를 개발할 때는 `cd frontend && npm run dev`로 별도 실행 (http://localhost:3000)

## 📖 사용 방법

### 1. 대시보드
- 포트폴리오 요약 정보 확인
- 주요 성과 지표 한눈에 보기

### 2. 포트폴리오 최적화
- **주식 검색**: 검색창에 종목명 또는 코드 입력 (예: 삼성전자, AAPL)
- **주식 선택**: 검색 결과에서 원하는 종목 클릭
- **수량 입력**: 보유 수량 입력 (투자 금액 자동 계산)
- **위험도 설정**: 1-10 사이의 위험도 설정
- **주식 추가**: "추가" 버튼 클릭
- **최적화 실행**: 최소 2개 주식 추가 후 "포트폴리오 최적화" 버튼 클릭

### 3. AI 챗봇
- 포트폴리오 관련 질문 입력
- AI 어시스턴트로부터 실시간 답변 받기
- 투자 가이드 및 조언 확인

### 4. 설정
- 언어 변경 (한국어/English)
- 애플리케이션 정보 확인

### 5. 결과 확인
- 예상 수익률
- 예상 위험도
- 샤프 비율
- 권장 자산 배분 비율 및 금액

## 🏗️ 프로젝트 구조

```
stock-portfolio-optimizer/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/portfolio/optimizer/
│   │   │       ├── controller/         # REST API 컨트롤러
│   │   │       │   ├── PortfolioController.java
│   │   │       │   ├── ChatbotController.java
│   │   │       │   └── VisualizationController.java
│   │   │       ├── service/            # 비즈니스 로직
│   │   │       │   ├── PortfolioService.java
│   │   │       │   ├── ChatbotService.java
│   │   │       │   └── PythonIntegrationService.java
│   │   │       ├── model/              # 엔티티 클래스
│   │   │       ├── dto/                # 데이터 전송 객체
│   │   │       └── repository/         # 데이터베이스 리포지토리
│   │   ├── python/                     # Python 스크립트
│   │   │   ├── optimize_portfolio.py  # QAOA 최적화
│   │   │   ├── fetch_stock_data.py    # 주가 데이터 수집
│   │   │   └── requirements.txt       # Python 의존성
│   │   └── resources/
│   │       ├── static/                 # 빌드된 프론트엔드
│   │       └── application.properties  # 애플리케이션 설정
│   └── test/                          # 테스트 코드
├── frontend/                          # React 프론트엔드
│   ├── src/
│   │   ├── components/                # React 컴포넌트
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PortfolioOptimizer.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   └── Settings.jsx
│   │   ├── contexts/                  # React Context
│   │   │   └── LanguageContext.jsx
│   │   ├── utils/
│   │   │   └── i18n.js                # 다국어 설정
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── pom.xml                            # Maven 설정
└── build.gradle                       # Gradle 설정
```

## 🔌 API 엔드포인트

### 포트폴리오 API
- `GET /api/portfolio/stock-price/{symbol}` - 주식 가격 조회
- `POST /api/portfolio/stocks` - 주식 저장
- `GET /api/portfolio/stocks/{sessionId}` - 주식 조회
- `DELETE /api/portfolio/stocks/{sessionId}` - 주식 삭제
- `POST /api/portfolio/optimize` - 포트폴리오 최적화 실행

### 챗봇 API
- `POST /api/chatbot/chat` - AI 챗봇 대화

### 시각화 API
- `GET /api/visualizations/{filename}` - 시각화 이미지 조회

## 🧮 최적화 알고리즘

### QAOA (Quantum Approximate Optimization Algorithm)
- 양자 어닐링 기반 최적화 알고리즘
- 포트폴리오의 분산(위험도)을 최소화하면서 수익률을 최대화
- 고전 컴퓨터로 해결하기 어려운 조합 최적화 문제를 효율적으로 해결

### 목적 함수
```
minimize: risk - risk_factor * return
subject to: Σ weights = 1
```

## 📊 성과 지표

- **예상 수익률**: 포트폴리오의 기대 수익률 (%)
- **예상 위험도**: 포트폴리오의 표준편차 (%)
- **샤프 비율**: (수익률 - 무위험 수익률) / 위험도
  - 높을수록 위험 대비 수익이 좋음

## ⚠️ 주의사항

1. **교육 목적**: 이 시스템은 교육 및 연구 목적으로 개발되었습니다.
2. **투자 조언 아님**: 실제 투자 결정에 사용하지 마십시오.
3. **데이터 정확성**: 실시간 데이터는 지연될 수 있습니다.
4. **양자 시뮬레이션**: 실제 양자 컴퓨터가 아닌 고전 시뮬레이터를 사용합니다.

## 🐛 트러블슈팅

### Python 모듈을 찾을 수 없음
```bash
pip install -r src/main/python/requirements.txt
```

### H2 데이터베이스 접속
- URL: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:portfoliodb
- Username: sa
- Password: (비어있음)

### 포트 충돌
application.properties에서 포트 변경:
```properties
server.port=8081
```

## 📝 라이센스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 환영합니다!

## 📧 연락처

문의사항이 있으시면 이슈를 등록해주세요.

---

**⚡ Powered by Qiskit & Spring Boot**
