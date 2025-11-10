# AI 주식 포트폴리오 최적화 시스템
# Maven 없이 실행하기

## Maven이 없는 경우 해결 방법

### 옵션 1: Maven 설치 (권장)

1. Maven 다운로드: https://maven.apache.org/download.cgi
2. 압축 해제 후 환경 변수 PATH에 추가
3. 터미널 재시작 후 `mvn -v` 확인

### 옵션 2: IntelliJ IDEA 사용

1. IntelliJ IDEA에서 프로젝트 열기
2. 우측 Maven 패널 클릭
3. Plugins → spring-boot → spring-boot:run 더블클릭

### 옵션 3: Eclipse/STS 사용

1. Eclipse 또는 Spring Tool Suite에서 프로젝트 import
2. Run As → Spring Boot App 선택

### 옵션 4: Gradle로 변경 (선택사항)

Gradle을 사용하는 경우 build.gradle 파일이 필요합니다.

---

## 빠른 해결: Maven 설치

PowerShell에서 Chocolatey 사용 (관리자 권한 필요):
```powershell
choco install maven
```

또는 Scoop 사용:
```powershell
scoop install maven
```

---

Maven 설치 후:
```powershell
cd c:\Users\DongHyun\Desktop\AI\test\stock-portfolio-optimizer
mvn spring-boot:run
```
