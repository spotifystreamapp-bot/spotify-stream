# 🌐 İnternetten Erişim Rehberi

Bu rehber, Spotify Stream uygulamanıza internetten nasıl erişebileceğinizi adım adım açıklar.

## 📋 İçindekiler

1. [Yerel Ağdan Erişim](#yerel-ağdan-erişim)
2. [İnternetten Erişim](#internetten-erişim)
3. [Public IP Adresini Öğrenme](#public-ip-adresini-öğrenme)
4. [Router Port Forwarding](#router-port-forwarding)
5. [Windows Firewall Ayarları](#windows-firewall-ayarları)
6. [Spotify Redirect URI Güncelleme](#spotify-redirect-uri-güncelleme)
7. [Test Etme](#test-etme)

---

## 🏠 Yerel Ağdan Erişim

### Senaryo 1: Aynı Wi-Fi/Network Üzerinden

Eğer telefon, tablet veya başka bir bilgisayar aynı Wi-Fi ağınıza bağlıysa:

1. Sunucuyu başlatın: `npm start` veya `start-server.bat`
2. Konsolda gösterilen yerel IP adresini kopyalayın (örnek: `http://192.168.1.100:3000`)
3. Diğer cihazınızın tarayıcısından bu adrese gidin

**Örnek:**
- Bilgisayarınızın IP'si: `192.168.1.100`
- Port: `3000`
- Erişim adresi: `http://192.168.1.100:3000`

### Senaryo 2: Kendi Bilgisayarınızdan

- `http://localhost:3000`
- `http://127.0.0.1:3000`

---

## 🌍 İnternetten Erişim

İnternetten erişmek için şu adımları takip edin:

### 1️⃣ Public IP Adresini Öğrenme

1. Tarayıcınızda şu adrese gidin: https://whatismyipaddress.com
2. **IPv4 Address** değerini not edin (örnek: `185.123.45.67`)
3. Bu adres, dış dünyadan sizin bilgisayarınıza erişmek için kullanılacak

**Alternatif Yöntemler:**
- PowerShell: `(Invoke-WebRequest -uri "http://ifconfig.me/ip").Content`
- Komut satırı: `curl ifconfig.me`

### 2️⃣ Router Port Forwarding

Router'ınızda port forwarding yapmanız gerekiyor. Her router markası için farklıdır, ancak genel adımlar:

#### Adım 1: Router Yönetim Paneline Giriş

1. Router'ınızın IP adresini bulun (genellikle `192.168.1.1` veya `192.168.0.1`)
2. Tarayıcıdan bu adrese gidin
3. Kullanıcı adı ve şifre ile giriş yapın (router'ın altında yazabilir)

#### Adım 2: Port Forwarding Ayarları

1. **Port Forwarding** veya **Virtual Server** bölümünü bulun
2. Yeni bir kural ekleyin:
   - **Service Name**: `Spotify Stream`
   - **External Port**: `3000` (veya istediğiniz port)
   - **Internal IP**: Bilgisayarınızın yerel IP'si (örn: `192.168.1.100`)
   - **Internal Port**: `3000`
   - **Protocol**: `TCP`
3. Ayarları kaydedin

#### Popüler Router Markaları için Kısayollar:

- **TP-Link**: Advanced → NAT Forwarding → Virtual Servers
- **Netgear**: Advanced → Port Forwarding / Port Triggering
- **ASUS**: WAN → Virtual Server / Port Forwarding
- **D-Link**: Advanced → Port Forwarding
- **Huawei**: Advanced → NAT → Port Mapping

#### Önemli Notlar:

⚠️ **Dinamik IP Sorunu**: Çoğu internet sağlayıcısı dinamik IP kullanır. IP adresiniz değişebilir. Çözüm için:
- **DDNS (Dynamic DNS)** kullanın (No-IP, DuckDNS gibi)
- Veya her seferinde yeni IP'nizi kontrol edin

---

### 3️⃣ Windows Firewall Ayarları

Windows Firewall, gelen bağlantıları engelleyebilir. Portu açmanız gerekiyor:

#### Yöntem 1: Otomatik Script (Önerilen)

1. `open-firewall.bat` dosyasına sağ tıklayın
2. **"Run as administrator"** (Yönetici olarak çalıştır) seçin
3. Port numarasını girin (varsayılan: 3000)
4. Enter'a basın

#### Yöntem 2: Manuel Ayarlama

1. Windows tuşu + R → `wf.msc` yazın → Enter
2. **Inbound Rules** → **New Rule**
3. **Port** → **Next**
4. **TCP** → **Specific local ports**: `3000` → **Next**
5. **Allow the connection** → **Next**
6. Tüm profilleri seçin (Domain, Private, Public) → **Next**
7. İsim: `Spotify Stream - Port 3000` → **Finish**

#### PowerShell ile (Yönetici olarak):

```powershell
New-NetFirewallRule -DisplayName "Spotify Stream - Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

### 4️⃣ Spotify Redirect URI Güncelleme

Spotify Developer Dashboard'da redirect URI'yi güncellemeniz gerekiyor:

1. https://developer.spotify.com/dashboard adresine gidin
2. Uygulamanızı seçin
3. **Edit Settings** butonuna tıklayın
4. **Redirect URIs** bölümüne şunu ekleyin:
   ```
   http://PUBLIC_IP:3000/auth/spotify/callback
   ```
   Örnek: `http://185.123.45.67:3000/auth/spotify/callback`

5. `.env` dosyasını güncelleyin:
   ```env
   SPOTIFY_REDIRECT_URI=http://PUBLIC_IP:3000/auth/spotify/callback
   ```

**⚠️ ÖNEMLİ:** 
- Public IP'niz değişirse, hem Spotify Dashboard'u hem de `.env` dosyasını güncellemeniz gerekir
- DDNS kullanıyorsanız, domain adresinizi kullanabilirsiniz: `http://yourdomain.ddns.net:3000/auth/spotify/callback`

---

### 5️⃣ Test Etme

#### Yerel Ağdan Test:

1. Telefonunuzdan Wi-Fi'ye bağlanın
2. Tarayıcıdan yerel IP adresinize gidin: `http://192.168.1.100:3000`
3. Uygulama açılıyorsa başarılı!

#### İnternetten Test:

1. **Mobil veri** kullanarak (Wi-Fi'yi kapatın)
2. Tarayıcıdan public IP'nize gidin: `http://185.123.45.67:3000`
3. Uygulama açılıyorsa başarılı!

#### Port Kontrolü:

Online port checker kullanın:
- https://www.yougetsignal.com/tools/open-ports/
- https://canyouseeme.org/
- Port: `3000`
- IP: Public IP'niz

---

## 🔒 Güvenlik Önerileri

1. **HTTPS Kullanın**: Üretim ortamında SSL sertifikası kullanın (Let's Encrypt)
2. **Şifre Koruması**: Uygulamanıza giriş şifresi ekleyin
3. **Rate Limiting**: DDoS saldırılarına karşı rate limiting ekleyin
4. **Firewall**: Sadece gerekli portları açın
5. **Güncellemeler**: Node.js ve bağımlılıkları düzenli güncelleyin

---

## 🐛 Sorun Giderme

### Port açık görünmüyor

1. Router'da port forwarding doğru yapıldı mı kontrol edin
2. Windows Firewall'da port açık mı kontrol edin
3. Bilgisayarınızın yerel IP'si değişmiş olabilir (DHCP)

### Bağlantı zaman aşımına uğruyor

1. Public IP adresiniz doğru mu kontrol edin
2. Router'ın firewall'u portu engelliyor olabilir
3. İnternet sağlayıcınız portları engelliyor olabilir (bazı ISP'ler engeller)

### Spotify girişi çalışmıyor

1. Redirect URI'nin doğru olduğundan emin olun
2. `.env` dosyasındaki `SPOTIFY_REDIRECT_URI` değerini kontrol edin
3. Public IP değiştiyse her ikisini de güncelleyin

### Yerel ağdan erişilemiyor

1. Bilgisayarınızın yerel IP'sini kontrol edin: `ipconfig` (Windows)
2. Firewall'da port açık mı kontrol edin
3. Aynı ağda olduğunuzdan emin olun

---

## 📞 Yardım

Sorun yaşarsanız:
1. `logs/err.log` dosyasını kontrol edin
2. Konsol çıktısını kontrol edin
3. Router log'larını kontrol edin
4. Port checker araçlarını kullanın

---

## ✅ Kontrol Listesi

İnternetten erişim için:

- [ ] Public IP adresini öğrendim
- [ ] Router'da port forwarding yaptım
- [ ] Windows Firewall'da portu açtım
- [ ] Spotify Redirect URI'yi güncelledim
- [ ] `.env` dosyasını güncelledim
- [ ] Sunucuyu yeniden başlattım
- [ ] Test ettim ve çalışıyor

---

## 🎉 Başarılı!

Artık uygulamanıza internetten erişebilirsiniz! 

**Erişim Adresi:** `http://PUBLIC_IP:3000`

**Örnek:** `http://185.123.45.67:3000`

---

## 💡 İleri Seviye: DDNS Kullanımı

Public IP'niz sürekli değişiyorsa, DDNS (Dynamic DNS) kullanabilirsiniz:

1. **No-IP** veya **DuckDNS** gibi bir servis seçin
2. Ücretsiz hesap oluşturun
3. Domain adresi alın (örn: `myspotify.ddns.net`)
4. Router'ınızda DDNS ayarlarını yapın
5. Spotify Redirect URI'yi domain adresinizle güncelleyin

Bu şekilde IP değişse bile domain adresiniz aynı kalır!



