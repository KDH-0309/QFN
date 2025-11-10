# 빠른 시작 가이드

## 1. Python 패키지 설치

### Windows
```bash
pip install -r src\main\python\requirements.txt
```

### macOS/Linux
```bash
pip install -r src/main/python/requirements.txt
```

## 2. 애플리케이션 실행

```bash
mvn spring-boot:run
```

## 3. 웹 브라우저에서 접속

```
http://localhost:8080
```

## 주요 종목 코드 예시

### 미국 주식
- AAPL (Apple Inc.)
- MSFT (Microsoft Corporation)
- GOOGL (Alphabet Inc.)
- AMZN (Amazon.com Inc.)
- TSLA (Tesla Inc.)
- NVDA (NVIDIA Corporation)
- META (Meta Platforms Inc.)

### 한국 주식
- 005930.KS (삼성전자)
- 000660.KS (SK하이닉스)
- 035420.KS (NAVER)
- 035720.KS (카카오)
- 051910.KS (LG화학)
- 006400.KS (삼성SDI)

## 사용 예시

1. **기술주 포트폴리오**
   - AAPL: 2,000,000원, 위험도 6
   - MSFT: 2,000,000원, 위험도 5
   - GOOGL: 1,500,000원, 위험도 7
   - 총 투자: 5,500,000원
   - 목표 위험도: 6

2. **국내 대형주 포트폴리오**
   - 005930.KS: 3,000,000원, 위험도 4
   - 000660.KS: 2,000,000원, 위험도 6
   - 035420.KS: 1,500,000원, 위험도 7
   - 총 투자: 6,500,000원
   - 목표 위험도: 5

## 문제 해결

### Python 패키지 설치 실패
```bash
# pip 업그레이드
python -m pip install --upgrade pip

# 재설치
pip install -r src/main/python/requirements.txt --force-reinstall
```

### 포트 8080 사용 중
`src/main/resources/application.properties` 수정:
```properties
server.port=8081
```

### Python 실행 파일을 찾을 수 없음
`src/main/resources/application.properties` 수정:
```properties
# Windows (전체 경로 지정)
python.executable=C:/Python39/python.exe

# macOS/Linux
python.executable=/usr/local/bin/python3
```
