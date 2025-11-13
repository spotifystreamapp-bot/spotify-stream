# 📦 Node.js Kurulum Rehberi

## 🚀 Node.js Kurulumu

Spotify Stream uygulamasını çalıştırmak için önce Node.js kurmanız gerekiyor.

### Adım 1: Node.js İndirme

1. Tarayıcınızda şu adrese gidin: **https://nodejs.org/**
2. **LTS (Long Term Support)** versiyonunu indirin (v20.x.x veya v18.x.x önerilir)
3. İndirilen `.msi` dosyasını çalıştırın

### Adım 2: Node.js Kurulumu

1. Kurulum sihirbazını açın
2. **"Next"** butonlarına tıklayarak ilerleyin
3. **"Add to PATH"** seçeneğinin işaretli olduğundan emin olun (varsayılan olarak işaretlidir)
4. Kurulumu tamamlayın

### Adım 3: Kurulumu Doğrulama

1. **PowerShell'i kapatın ve yeniden açın** (veya CMD)
2. Şu komutu çalıştırın:
   ```bash
   node --version
   ```
3. Versiyon numarası görünüyorsa (örn: v20.11.0) kurulum başarılı!

### Adım 4: npm Kontrolü

npm (Node Package Manager) Node.js ile birlikte gelir. Kontrol edin:
```bash
npm --version
```

## ✅ Kurulum Sonrası

Node.js kurulduktan sonra:

1. **PowerShell'i kapatıp yeniden açın** (önemli!)
2. Proje klasörüne gidin:
   ```bash
   cd "C:\Users\gokde\OneDrive\Desktop\Spotify Stream"
   ```
3. Kurulum scriptini çalıştırın:
   ```bash
   setup.bat
   ```

## 🔧 Alternatif: Chocolatey ile Kurulum (İleri Seviye)

Eğer Chocolatey kuruluysa, şu komutla Node.js kurabilirsiniz:
```bash
choco install nodejs-lts
```

## ❓ Sorun Giderme

### "node is not recognized" hatası

- PowerShell'i kapatıp yeniden açın
- Sistem PATH değişkenine Node.js'in eklendiğinden emin olun
- Node.js'i yeniden kurun ve "Add to PATH" seçeneğini işaretleyin

### Kurulum başarısız oluyor

- Yönetici olarak çalıştırmayı deneyin
- Antivirüs yazılımınızı geçici olarak kapatın
- Windows Update'i kontrol edin

## 📚 Kaynaklar

- Node.js Resmi Sitesi: https://nodejs.org/
- Node.js Dokümantasyonu: https://nodejs.org/docs/

## 🎯 Sonraki Adımlar

Node.js kurulduktan sonra `KURULUM.md` dosyasındaki adımları takip edin.






