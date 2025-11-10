# 프로젝트 실행 가이드

## 🚀 빠른 실행 (권장)

### Windows 사용자
```powershell
# 프로젝트 루트 디렉토리에서 한 번에 실행
start.bat
```

이 스크립트는:
1. 프론트엔드 의존성 설치
2. 프론트엔드 빌드
3. 백엔드 실행 (프론트엔드 포함)

완료되면 **http://localhost:8080** 으로 접속하세요!

---

## 📝 수동 실행

### 1. 프론트엔드 빌드
```powershell
cd frontend
npm install
npm run build
cd ..
```

빌드된 파일이 `src/main/resources/static` 폴더에 생성됩니다.

### 2. 백엔드 실행
```powershell
# Gradle 사용
./gradlew bootRun

# 또는 Maven 사용
./mvnw spring-boot:run
```

### 3. 브라우저에서 접속
**http://localhost:8080** 으로 접속하세요.

---

## 🔧 개발 모드 (프론트엔드 개발시)

프론트엔드 코드를 수정하면서 Hot Reload를 사용하려면:

### 1. 백엔드 실행 (터미널 1)
```powershell
./gradlew bootRun
```

### 2. 프론트엔드 개발 서버 실행 (터미널 2)
```powershell
cd frontend
npm run dev
```

개발 모드에서는:
- 프론트엔드: **http://localhost:3000** (Hot Reload)
- 백엔드 API: http://localhost:8080

코드 변경 시 자동으로 새로고침됩니다.

## 📦 빠른 시작 스크립트

### 프로덕션 모드 (한 포트만 사용)
```powershell
# 프론트엔드 빌드 + 백엔드 실행
start.bat
```
→ http://localhost:8080 접속

### 개발 모드 (두 포트 사용)
`start-dev.ps1` 파일 생성:
```powershell
# 백엔드 실행
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD; ./gradlew bootRun"

# 프론트엔드 실행
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD/frontend; npm run dev"

# 브라우저 열기
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"
```

실행:
```powershell
./start-dev.ps1
```
→ http://localhost:3000 접속

## 문제 해결

### 포트가 이미 사용 중인 경우

**백엔드 포트 변경:**
`src/main/resources/application.properties` 수정:
```properties
server.port=8081
```

**프론트엔드 포트 변경:**
`frontend/vite.config.js` 수정:
```javascript
server: {
  port: 3001,
  // ...
}
```

### Node 모듈 오류

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Python 경로 오류

`src/main/resources/application.properties`에서 Python 경로 확인:
```properties
python.executable=python
```

시스템에 Python이 설치되어 있는지 확인:
```powershell
python --version
```

## 유용한 명령어

### 백엔드 빌드
```powershell
./gradlew clean build
```

### 테스트 실행
```powershell
./gradlew test
```

### 프론트엔드 린트
```powershell
cd frontend
npm run lint
```

### 프론트엔드 프리뷰 (빌드 후)
```powershell
cd frontend
npm run preview
```

## 환경 변수 설정

필요한 경우 `.env` 파일을 생성하여 환경 변수를 설정할 수 있습니다:

`frontend/.env`:
```
VITE_API_URL=http://localhost:8080
```

## 추가 정보

- [README.md](README.md) - 전체 프로젝트 문서
- [QUICKSTART_NEW.md](QUICKSTART_NEW.md) - 빠른 시작 가이드

문제가 발생하면 GitHub Issues에 문의해주세요!
