const nodemailer = require('nodemailer');

// E-posta transporter oluştur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Giriş e-postası gönder
const sendLoginEmail = async (email, displayName) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('E-posta ayarları yapılmamış, e-posta gönderilmiyor');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Spotify Stream - Giriş Yaptınız',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #1DB954;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎵 Spotify Stream</h1>
        </div>
        <div class="content">
          <h2>Merhaba ${displayName}!</h2>
          <p>Spotify Stream hesabınıza başarıyla giriş yaptınız.</p>
          <p>Artık gerçek zamanlı paylaşımlı dinleme deneyiminin keyfini çıkarabilirsiniz!</p>
          <p>Oda oluşturabilir, arkadaşlarınızla müzik paylaşabilir ve birlikte dinleyebilirsiniz.</p>
          <a href="${process.env.SPOTIFY_REDIRECT_URI?.replace('/auth/spotify/callback', '') || 'http://127.0.0.1:3000'}" class="button">Uygulamaya Git</a>
        </div>
        <div class="footer">
          <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
          <p>&copy; 2025 Spotify Stream. Tüm hakları saklıdır.</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Giriş e-postası gönderildi:', info.messageId);
    return info;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
};

module.exports = {
  sendLoginEmail
};

