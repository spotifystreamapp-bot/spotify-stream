# 🎵 Spotify Stream

Gerçek zamanlı paylaşımlı dinleme platformu. Spotify hesabınızla giriş yaparak arkadaşlarınızla birlikte müzik dinleyin!

## 🚀 Kurulum

### 1. Gereksinimler

- Node.js (v16 veya üzeri)
- Spotify Developer hesabı
- E-posta hesabı (Gmail önerilir)

### 2. Spotify Developer Ayarları

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)'a gidin
2. Yeni bir uygulama oluşturun
3. Redirect URI ekleyin: `http://127.0.0.1:3000/auth/spotify/callback`

**⚠️ ÖNEMLİ:** Spotify artık `localhost` kabul etmiyor! Mutlaka `127.0.0.1` kullanın.
4. Client ID ve Client Secret'ı kopyalayın

### 3. E-posta Ayarları (Gmail için)

1. Google hesabınızda 2 adımlı doğrulamayı açın
2. [App Passwords](https://myaccount.google.com/apppasswords) sayfasına gidin
3. Yeni bir uygulama şifresi oluşturun
4. Bu şifreyi `.env` dosyasına ekleyin

### 4. Proje Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle ve gerekli bilgileri ekle
```

### 5. .env Dosyası Yapılandırması

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/auth/spotify/callback

PORT=3000
NODE_ENV=production

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

SESSION_SECRET=your_random_secret_key_here
```

## 🏃 Çalıştırma

### Geliştirme Modu

```bash
npm run dev
```

### Üretim Modu

```bash
npm start
```

## 📡 24 Saat Çalışan Sunucu

### Windows için (PowerShell)

Sunucuyu 24 saat çalıştırmak için:

1. **PM2 kullanarak (Önerilen):**
```bash
npm install -g pm2
pm2 start server.js --name spotify-stream
pm2 save
pm2 startup
```

2. **Windows Task Scheduler ile:**
   - Task Scheduler'ı açın
   - Yeni görev oluşturun
   - Tetikleyici: Bilgisayar başladığında
   - Eylem: `node C:\Users\gokde\Desktop\spotify-stream\server.js`

3. **NSSM (Non-Sucking Service Manager) ile:**
```bash
# NSSM indirin ve kurun
nssm install SpotifyStream "C:\Program Files\nodejs\node.exe" "C:\Users\gokde\Desktop\spotify-stream\server.js"
nssm start SpotifyStream
```

### Otomatik Yeniden Başlatma

Sunucu çökerse otomatik olarak yeniden başlatmak için PM2 kullanın:

```bash
pm2 start server.js --name spotify-stream --watch
pm2 save
```

## 🎯 Özellikler

- ✅ Spotify OAuth ile giriş
- ✅ 6 haneli kod veya QR kod ile oda paylaşımı
- ✅ Gerçek zamanlı iletişim (Socket.io)
- ✅ Kullanıcı rolleri (Owner, Admin, Guest)
- ✅ Bekleme listesi ve onay sistemi
- ✅ Şarkı sırası yönetimi
- ✅ Spotify şarkı arama
- ✅ Giriş e-posta bildirimi
- ✅ Modern ve kullanıcı dostu arayüz

## 📱 Kullanım

1. Uygulamaya giriş yapın (Spotify hesabınızla)
2. Yeni bir oda oluşturun veya mevcut bir odaya kod ile katılın
3. Şarkı arayın ve sıraya ekleyin
4. Arkadaşlarınızla birlikte dinleyin!

## 🔧 API Endpoints

- `GET /auth/spotify` - Spotify giriş sayfasına yönlendirme
- `GET /auth/spotify/callback` - Spotify callback
- `GET /auth/me` - Kullanıcı bilgileri
- `POST /auth/logout` - Çıkış
- `POST /api/rooms/create` - Oda oluştur
- `GET /api/rooms/join/:code` - Koda göre oda bul
- `POST /api/rooms/:roomId/join-request` - Odaya katılma isteği
- `GET /api/spotify/search` - Şarkı ara
- `GET /api/users/pending/:roomId` - Bekleme listesi

## 📝 Notlar

- Sunucu varsayılan olarak `http://127.0.0.1:3000` adresinde çalışır
- Veritabanı SQLite kullanır (`database.db`)
- Tüm kullanıcı bilgileri Spotify'dan alınır
- E-posta ayarları yapılmazsa giriş e-postası gönderilmez

## 🐛 Sorun Giderme

### Port zaten kullanılıyor
`.env` dosyasında `PORT` değerini değiştirin

### Spotify giriş hatası
- Redirect URI'nin Spotify Developer Dashboard'da doğru olduğundan emin olun
- Client ID ve Secret'ın doğru olduğunu kontrol edin

### E-posta gönderilmiyor
- Gmail App Password kullandığınızdan emin olun
- `.env` dosyasındaki e-posta ayarlarını kontrol edin

## 📄 Lisans

MIT

