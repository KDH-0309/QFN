# 🔒 보안 가이드

## ⚠️ 긴급 조치 (배포 전 필수)

### 1. 노출된 API 키 재발급

현재 다음 정보가 GitHub에 노출되었을 가능성이 있습니다:

#### Gemini API Key
- 기존 키: `AIzaSyDXZbRMubuLd8LGu0qPQmP6BBf_kL1_wEU`
- **즉시 조치**: [Google AI Studio](https://makersuite.google.com/app/apikey)에서 키 삭제 및 재발급

#### Gmail App Password
- 기존 비밀번호: `ddwrlmxdgdgeegts`
- **즉시 조치**: [Google 계정 보안](https://myaccount.google.com/security)에서 앱 비밀번호 삭제 및 재발급

### 2. Git History 정리 (선택사항)

민감 정보가 커밋 히스토리에 남아있다면:

```bash
# 주의: 강제 푸시가 필요하므로 팀원과 협의 필요
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/main/resources/application.properties" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

또는 GitHub에서 저장소 삭제 후 새로 생성하는 것이 더 안전합니다.

---

## 🛡️ 환경변수 관리

### 로컬 개발 환경

1. `.env.example`을 `.env`로 복사
2. 실제 값으로 수정
3. `.env`는 절대 Git에 커밋하지 않기 (.gitignore에 포함됨)

```bash
cp .env.example .env
# .env 파일 수정
```

### Azure 프로덕션 환경

#### 방법 1: Azure Portal (권장)
1. Azure Portal → App Service 선택
2. 설정 → 구성 → 애플리케이션 설정
3. 각 환경변수 추가

#### 방법 2: Azure CLI
```bash
az webapp config appsettings set \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --settings \
    GEMINI_API_KEY="새로운API키" \
    MAIL_PASSWORD="새로운앱비밀번호"
```

#### 방법 3: Azure Key Vault (고급)
```bash
# Key Vault 생성
az keyvault create \
  --name qfn-keyvault \
  --resource-group qfn-rg \
  --location koreacentral

# 비밀 추가
az keyvault secret set \
  --vault-name qfn-keyvault \
  --name "GeminiApiKey" \
  --value "새로운API키"

# App Service에 Key Vault 참조 추가
az webapp config appsettings set \
  --resource-group qfn-rg \
  --name qfn-portfolio-app \
  --settings \
    GEMINI_API_KEY="@Microsoft.KeyVault(SecretUri=https://qfn-keyvault.vault.azure.net/secrets/GeminiApiKey/)"
```

---

## 🔐 JWT Secret 관리

### 강력한 Secret 생성

```bash
# Node.js 사용
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Python 사용
python -c "import secrets; print(secrets.token_hex(64))"

# OpenSSL 사용
openssl rand -hex 64
```

생성된 값을 `JWT_SECRET` 환경변수로 설정

---

## 🌐 CORS 설정

`application-azure.properties`:
```properties
cors.allowed.origins=https://qfn-portfolio-app.azurewebsites.net,https://your-custom-domain.com
```

프로덕션에서는 `*` 사용 금지!

---

## 🔒 데이터베이스 보안

### SSL/TLS 연결 강제

```properties
spring.datasource.url=jdbc:mariadb://your-db.mariadb.database.azure.com:3306/qfn?sslMode=REQUIRED&serverSslCert=/path/to/DigiCertGlobalRootCA.crt.pem
```

### 방화벽 규칙 최소화

```bash
# Azure 서비스만 허용
az mariadb server firewall-rule create \
  --resource-group qfn-rg \
  --server-name qfn-db-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 특정 IP만 허용
az mariadb server firewall-rule create \
  --resource-group qfn-rg \
  --server-name qfn-db-server \
  --name AllowOffice \
  --start-ip-address "your.office.ip.address" \
  --end-ip-address "your.office.ip.address"
```

---

## 📋 보안 체크리스트

### 배포 전
- [ ] Gemini API 키 재발급 완료
- [ ] Gmail 앱 비밀번호 재발급 완료
- [ ] JWT Secret 강력한 값으로 변경
- [ ] `.env` 파일이 .gitignore에 포함되어 있음
- [ ] `application.properties`에 하드코딩된 민감정보 없음
- [ ] Git 히스토리에서 민감정보 제거 (필요시)

### 배포 후
- [ ] HTTPS 강제 활성화
- [ ] CORS 설정 확인 (프로덕션 도메인만 허용)
- [ ] 데이터베이스 SSL 연결 확인
- [ ] 방화벽 규칙 최소화
- [ ] 로그에 민감정보 출력 안 됨 확인
- [ ] Session cookie secure 플래그 확인

### 정기 점검
- [ ] API 키 정기적 교체 (3개월마다)
- [ ] 의심스러운 활동 모니터링
- [ ] 보안 패치 적용
- [ ] 의존성 취약점 스캔

---

## 🚨 보안 사고 대응

### API 키 유출 시
1. 즉시 해당 키 비활성화
2. 새 키 발급 및 환경변수 업데이트
3. 앱 재시작
4. 사용량 모니터링

### 데이터베이스 접근 시도 감지 시
1. 방화벽 규칙 재확인
2. 의심스러운 IP 차단
3. 비밀번호 변경
4. 감사 로그 확인

---

## 📞 참고 링크

- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
