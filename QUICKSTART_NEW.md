# Stock Portfolio Optimizer - 빠른 시작 가이드

이 가이드는 프로젝트를 빠르게 실행하는 방법을 안내합니다.

## 1단계: 사전 요구사항 확인

다음 소프트웨어가 설치되어 있는지 확인하세요:

- **Java 17** 이상
- **Node.js 18** 이상
- **Python 3.8** 이상
- **Gradle** 또는 **Maven**

버전 확인:
```bash
java -version
node -v
python --version
```

## 2단계: Python 환경 설정

```bash
# Python 패키지 설치
cd src/main/python
pip install -r requirements.txt
cd ../../..
```

필수 Python 패키지:
- qiskit
- qiskit-optimization
- yfinance
- pandas
- numpy

## 3단계: 빠른 실행 (권장)

### Windows 사용자
```bash
# 프로젝트 루트 디렉토리에서
start.bat
```

### 수동 실행
```bash
# 1. 프론트엔드 빌드
cd frontend
npm install
npm run build
cd ..

# 2. 백엔드 실행
./gradlew bootRun
```

## 4단계: 애플리케이션 사용

1. 브라우저에서 **http://localhost:8080** 접속
2. 왼쪽 사이드바에서 "포트폴리오" 메뉴 선택
3. 주식 검색 및 추가
4. 최적화 설정 후 "포트폴리오 최적화" 버튼 클릭
5. 결과 확인

## 개발 모드 (프론트엔드 개발시)

프론트엔드 코드를 수정하면서 개발하려면:

```bash
# 터미널 1: 백엔드
./gradlew bootRun

# 터미널 2: 프론트엔드 (Hot Reload)
cd frontend
npm run dev
```

개발 모드에서는 http://localhost:3000 으로 접속
프로덕션 모드에서는 http://localhost:8080 으로 접속

## 문제 해결

### Python 스크립트 오류
- Python 경로가 올바른지 확인
- requirements.txt의 모든 패키지가 설치되었는지 확인

### 포트 충돌
- 다른 애플리케이션이 8080 또는 3000 포트를 사용하고 있지 않은지 확인
- `application.properties` 또는 `vite.config.js`에서 포트 변경

### CORS 오류
- 백엔드와 프론트엔드가 모두 실행 중인지 확인
- 브라우저 콘솔에서 오류 메시지 확인

## 다음 단계

- [README.md](README.md) 에서 전체 문서 확인
- [ARCHITECTURE.md](ARCHITECTURE.md) 에서 아키텍처 이해
- API 문서 확인 및 커스터마이징

즐거운 개발 되세요! 🚀
