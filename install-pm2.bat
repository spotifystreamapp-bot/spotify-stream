@echo off
echo PM2 kuruluyor...
npm install -g pm2
echo.
echo PM2 kuruldu!
echo.
echo Sunucuyu baslatmak icin: pm2 start server.js --name spotify-stream
echo Sunucuyu durdurmak icin: pm2 stop spotify-stream
echo Sunucu durumunu gormek icin: pm2 status
echo.
pause

