@echo off
echo Building frontend...
call npm install
call npm run build
echo Frontend build complete!
echo Built files are in: src/main/resources/static
