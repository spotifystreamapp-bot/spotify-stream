@echo off
echo ========================================
echo Windows Firewall Port Acma Yardimcisi
echo ========================================
echo.
echo Bu script, Spotify Stream uygulamanizin portunu Windows Firewall'da acar.
echo.

set /p PORT="Port numarasi (varsayilan: 3000): "
if "%PORT%"=="" set PORT=3000

echo.
echo %PORT% portu aciliyor...

netsh advfirewall firewall add rule name="Spotify Stream - Port %PORT%" dir=in action=allow protocol=TCP localport=%PORT%

if %errorlevel% equ 0 (
    echo.
    echo [BASARILI] Port %PORT% basariyla acildi!
    echo.
    echo Artik internetten bu porta erisebilirsiniz.
) else (
    echo.
    echo [HATA] Port acilamadi. Yonetici olarak calistirdiginizdan emin olun.
    echo.
    pause
)

echo.
pause


