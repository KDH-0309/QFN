#!/bin/bash

echo "================================"
echo "AI 주식 포트폴리오 최적화 시스템"
echo "설치 스크립트"
echo "================================"
echo ""

# Python 가상환경 생성
echo "1. Python 가상환경 생성 중..."
python -m venv venv

# 가상환경 활성화
echo "2. 가상환경 활성화..."
source venv/bin/activate

# Python 패키지 설치
echo "3. Python 패키지 설치 중..."
pip install -r src/main/python/requirements.txt

# Maven 빌드
echo "4. Maven 빌드 중..."
mvn clean install

echo ""
echo "================================"
echo "설치 완료!"
echo "================================"
echo ""
echo "실행 방법:"
echo "  mvn spring-boot:run"
echo ""
echo "접속 주소:"
echo "  http://localhost:8080"
echo ""
