@echo off
echo ========================================
echo Render.com'a Deploy Etme Yardimcisi
echo ========================================
echo.
echo Bu script, projenizi GitHub'a yuklemenize yardimci olur.
echo Render.com'a deploy etmek icin GitHub'a yuklemeniz gerekiyor.
echo.

echo 1. GitHub'da yeni bir repository olusturun
echo 2. Repository URL'ini alin
echo.
set /p GIT_URL="GitHub Repository URL'inizi girin (ornek: https://github.com/kullanici/spotify-stream.git): "

if "%GIT_URL%"=="" (
    echo Hata: Repository URL'i gerekli!
    pause
    exit
)

echo.
echo GitHub'a yukleniyor...
echo.

git init
git add .
git commit -m "Initial commit - Render deployment ready"
git branch -M main
git remote add origin %GIT_URL%
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo [BASARILI] Kod GitHub'a yuklendi!
    echo.
    echo Simdi yapmaniz gerekenler:
    echo 1. https://render.com adresine gidin
    echo 2. GitHub hesabinizla giris yapin
    echo 3. "New +" -^> "Web Service" secin
    echo 4. Repository'nizi secin
    echo 5. Ayarlari yapilandirin (DEPLOYMENT_REHBERI.md dosyasina bakin)
    echo 6. Environment variables ekleyin
    echo 7. Deploy edin!
    echo.
) else (
    echo.
    echo [HATA] GitHub'a yukleme basarisiz oldu!
    echo.
    echo Kontrol edin:
    echo - Git kurulu mu? (git --version)
    echo - Repository URL'i dogru mu?
    echo - GitHub hesabiniza giris yaptiniz mi?
    echo.
)

pause



