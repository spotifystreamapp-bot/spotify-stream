@echo off
echo ========================================
echo Spotify Stream Kurulum
echo ========================================
echo.

echo [1/4] Node modulleri yukleniyor...
call npm install
if errorlevel 1 (
    echo HATA: npm install basarisiz!
    pause
    exit /b 1
)
echo.

echo [2/4] .env dosyasi kontrol ediliyor...
if not exist .env (
    echo .env dosyasi bulunamadi. .env.example kopyalaniyor...
    copy .env.example .env
    echo.
    echo LUTFEN .env DOSYASINI DUZENLEYIN VE GEREKLI BILGILERI EKLEYIN!
    echo.
) else (
    echo .env dosyasi mevcut.
)
echo.

echo [3/4] Log klasoru olusturuluyor...
if not exist logs mkdir logs
echo.

echo [4/4] Veritabani klasoru hazirlaniyor...
if not exist database mkdir database
echo.

echo ========================================
echo Kurulum tamamlandi!
echo ========================================
echo.
echo Sonraki adimlar:
echo 1. .env dosyasini duzenleyin
echo 2. npm start ile sunucuyu baslatin
echo 3. Veya PM2 kullanmak icin: install-pm2.bat calistirin
echo.
pause

