# Azure 배포 가이드

## 🚀 Azure App Service 배포 단계

### 1. 사전 준비

#### Azure 리소스 생성
```bash
# 리소스 그룹 생성
az group create --name qfn-rg --location koreacentral

# Azure Database for MariaDB 생성
az mariadb server create \
  --resource-group qfn-rg \
  --name qfn-db-server \
  --location koreacentral \
  --admin-user dbadmin \
  --admin-password "YourPassword123!" \
  --sku-name GP_Gen5_2 \
  --version 10.3

# 데이터베이스 생성
az mariadb db create \
  --resource-group qfn-rg \
  --server-name qfn-db-server \
  --name qfn

# 방화벽 규칙 추가 (Azure 서비스 허용)
az mariadb server firewall-rule create \
  --resource-group qfn-rg \
  --server-name qfn-db-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# App Service Plan 생성
az appservice plan create \
  --name qfn-app-plan \
  --resource-group qfn-rg \
  --sku B1 \
  --is-linux

# Web App 생성
az webapp create \
  --resource-group qfn-rg \
  --plan qfn-app-plan \
  --name qfn-portfolio-app \
  --runtime "JAVA:17-java17"
```

### 2. Python 환경 설정

Azure App Service에 Python 런타임 추가:

```bash
# Azure Web App에 Python 설치 (Kudu 콘솔에서)
apt-get update
apt-get install -y python3 python3-pip

# 필요한 Python 패키지 설치
pip3 install yfinance numpy scipy pandas matplotlib
```

또는 `requirements.txt` 사용:
```bash
# requirements.txt 파일 생성
cat > requirements.txt <<EOF
yfinance==0.2.28
numpy==1.24.3
scipy==1.11.1
pandas==2.0.3
matplotlib==3.7.2
EOF

# 스타트업 스크립트로 자동 설치
az webapp config set \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --startup-file "pip3 install -r requirements.txt && java -jar app.jar"
```

### 3. 환경 변수 설정

```bash
# Azure Web App 환경 변수 설정
az webapp config appsettings set \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --settings \
    SPRING_PROFILES_ACTIVE=azure \
    AZURE_DB_URL="jdbc:mariadb://qfn-db-server.mariadb.database.azure.com:3306/qfn?sslMode=REQUIRED" \
    AZURE_DB_USERNAME="dbadmin@qfn-db-server" \
    AZURE_DB_PASSWORD="YourPassword123!" \
    JWT_SECRET="your-production-jwt-secret-key-256-bits-or-longer" \
    GEMINI_API_KEY="your-gemini-api-key" \
    MAIL_USERNAME="your-email@gmail.com" \
    MAIL_PASSWORD="your-gmail-app-password" \
    MAIL_FROM="your-email@gmail.com"
```

### 4. 로컬에서 빌드 및 배포

#### 프론트엔드 빌드
```powershell
cd frontend
npm install
npm run build
```

#### 프론트엔드를 백엔드 static 폴더로 복사
```powershell
# Windows
xcopy /E /I /Y frontend\dist build\resources\main\static

# PowerShell
Copy-Item -Path "frontend\dist\*" -Destination "build\resources\main\static" -Recurse -Force
```

#### 백엔드 빌드
```powershell
# Maven
mvnw clean package -DskipTests

# Gradle
gradlew clean build -x test
```

#### Azure에 배포
```bash
# Azure CLI로 배포
az webapp deploy \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --src-path target/stock-portfolio-optimizer-1.0.0.jar \
  --type jar
```

### 5. CI/CD 파이프라인 설정 (선택사항)

#### Azure DevOps
1. Azure DevOps 프로젝트 생성
2. `azure-pipelines.yml` 파일 사용
3. Service Connection 설정
4. 파이프라인 실행

#### GitHub Actions (대안)
```yaml
# .github/workflows/azure-deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up JDK 17
        uses: actions/setup-java@v2
        with:
          java-version: '17'
          
      - name: Build with Maven
        run: mvn clean package -DskipTests
        
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'qfn-portfolio-app'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: 'target/*.jar'
```

### 6. 배포 후 확인

```bash
# 앱 상태 확인
az webapp show \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --query state

# 로그 확인
az webapp log tail \
  --resource-group qfn-rg \
  --name qfn-portfolio-app

# 브라우저에서 접속
https://qfn-portfolio-app.azurewebsites.net
```

## 🔒 보안 체크리스트

- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] Azure Key Vault 사용 고려 (프로덕션)
- [ ] HTTPS 강제 활성화
- [ ] CORS 설정 확인
- [ ] JWT Secret 강력한 값으로 변경
- [ ] 데이터베이스 방화벽 규칙 최소화
- [ ] Gemini API 키 재발급 (기존 키가 노출된 경우)

## 🔧 문제 해결

### Python 스크립트 실행 오류
```bash
# Kudu 콘솔에서 Python 경로 확인
which python3
python3 --version

# 앱 설정에 Python 경로 추가
az webapp config appsettings set \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --settings PYTHON_EXECUTABLE=/usr/bin/python3
```

### 메모리 부족
```bash
# 더 큰 App Service Plan으로 업그레이드
az appservice plan update \
  --name qfn-app-plan \
  --resource-group qfn-rg \
  --sku P1V2
```

### 정적 파일 404 오류
- `application-azure.properties`에서 static 경로 확인
- 빌드 시 `frontend/dist` → `build/resources/main/static` 복사 확인

## 💰 비용 최적화

- **개발/테스트**: B1 ($13/월)
- **프로덕션**: P1V2 ($73/월) - 권장
- **DB**: GP_Gen5_2 ($60/월)

총 예상 비용: **약 $86~133/월**

## 📞 지원

문제 발생 시:
1. Azure Portal에서 로그 확인
2. Application Insights 활성화 (선택)
3. `az webapp log tail` 명령으로 실시간 로그 확인
