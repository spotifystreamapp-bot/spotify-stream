# 🚀 Spotify Stream - Hızlı Kurulum Kılavuzu

## ⚡ Hızlı Başlangıç

### 1. Otomatik Kurulum

```bash
# Kurulum scriptini çalıştırın
setup.bat
```

Bu script:
- Tüm bağımlılıkları yükler
- `.env` dosyasını oluşturur (yoksa)
- Gerekli klasörleri hazırlar

### 2. .env Dosyasını Düzenleyin

`.env` dosyasını açın ve şu bilgileri doldurun:

```env
# Spotify API Bilgileri (https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/auth/spotify/callback

# Sunucu Ayarları
PORT=3000
NODE_ENV=production

# E-posta Ayarları (Gmail için App Password gerekli)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Session Secret (rastgele bir string)
SESSION_SECRET=your_random_secret_key_min_32_chars
```

### 3. Spotify Developer Ayarları

1. https://developer.spotify.com/dashboard adresine gidin
2. "Create app" butonuna tıklayın
3. App bilgilerini doldurun
4. "Edit Settings" butonuna tıklayın
5. "Redirect URIs" bölümüne ekleyin: `http://127.0.0.1:3000/auth/spotify/callback`

**⚠️ ÖNEMLİ:** Spotify artık `localhost` kabul etmiyor! Mutlaka `127.0.0.1` kullanın.
6. Client ID ve Client Secret'ı kopyalayıp `.env` dosyasına yapıştırın

### 4. Gmail App Password (E-posta için)

1. Google hesabınızda 2 adımlı doğrulamayı açın
2. https://myaccount.google.com/apppasswords adresine gidin
3. "Select app" → "Mail" seçin
4. "Select device" → "Other (Custom name)" seçin
5. "Spotify Stream" yazın ve "Generate" tıklayın
6. Oluşan 16 haneli şifreyi `.env` dosyasındaki `EMAIL_PASS` alanına yapıştırın

## 🏃 Sunucuyu Başlatma

### Yöntem 1: Normal Başlatma

```bash
npm start
```

### Yöntem 2: PM2 ile (24 Saat Çalışma için Önerilen)

```bash
# PM2'yi kurun (ilk kez)
install-pm2.bat

# Sunucuyu başlatın
npm run pm2:start

# Sunucu durumunu kontrol edin
npm run pm2:logs

# Sunucuyu durdurmak için
npm run pm2:stop
```

PM2 ile sunucu:
- ✅ Otomatik yeniden başlar (çökerse)
- ✅ Sistem yeniden başladığında otomatik başlar
- ✅ Log dosyalarını tutar
- ✅ 24 saat kesintisiz çalışır

## 🌐 Uygulamaya Erişim

Sunucu başladıktan sonra:

1. Tarayıcınızda `http://127.0.0.1:3000` adresine gidin
2. "Spotify ile Giriş Yap" butonuna tıklayın
3. Spotify hesabınızla giriş yapın
4. Giriş yaptığınızda e-posta adresinize bildirim gönderilir

## 📝 İlk Kullanım

1. **Oda Oluştur**: Ana ekrandan "Oda Oluştur" seçeneğini seçin
2. **Kod Paylaş**: Oluşan 6 haneli kodu veya QR kodu arkadaşlarınızla paylaşın
3. **Şarkı Ekle**: Odaya katıldıktan sonra şarkı arayıp sıraya ekleyin
4. **Birlikte Dinleyin**: Arkadaşlarınızla birlikte müzik dinleyin!

## 🔧 Sorun Giderme

### Port 3000 zaten kullanılıyor

`.env` dosyasında `PORT=3001` gibi farklı bir port kullanın.

### Spotify giriş hatası

- Redirect URI'nin Spotify Developer Dashboard'da doğru olduğundan emin olun
- Client ID ve Secret'ın doğru kopyalandığını kontrol edin
- Redirect URI'nin tam olarak eşleştiğini kontrol edin

### E-posta gönderilmiyor

- Gmail App Password kullandığınızdan emin (normal şifre çalışmaz)
- 2 adımlı doğrulamanın açık olduğunu kontrol edin
- `.env` dosyasındaki e-posta bilgilerini kontrol edin

### Veritabanı hatası

- `database.db` dosyasını silin ve sunucuyu yeniden başlatın
- Klasör izinlerini kontrol edin

## 📞 Destek

Sorun yaşarsanız:
1. `logs/err.log` dosyasını kontrol edin
2. Konsol çıktısını kontrol edin
3. `.env` dosyasındaki tüm ayarları doğrulayın

## 🎉 Başarılı Kurulum!

Artık Spotify Stream kullanıma hazır! İyi eğlenceler! 🎵

