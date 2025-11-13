@echo off
echo ========================================
echo Public IP Adresinizi Ogrenme
echo ========================================
echo.

echo Yerel IP Adresiniz:
ipconfig | findstr /i "IPv4"

echo.
echo Public IP Adresiniz:
powershell -Command "(Invoke-WebRequest -uri 'http://ifconfig.me/ip' -UseBasicParsing).Content"

echo.
echo.
echo Yukaridaki Public IP adresini kullanarak:
echo - Router'da port forwarding yapin
echo - Spotify Developer Dashboard'da Redirect URI'yi guncelleyin
echo - .env dosyasindaki SPOTIFY_REDIRECT_URI'yi guncelleyin
echo.
pause



