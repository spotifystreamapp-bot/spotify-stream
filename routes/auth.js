const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const db = require('../database/db').getDb();
const { sendLoginEmail } = require('../utils/email');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/auth/spotify/callback'
});

// Spotify giriş sayfasına yönlendirme
router.get('/spotify', (req, res) => {
  try {
    console.log('Spotify giriş isteği alındı');
    console.log('Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Mevcut' : 'Eksik');
    console.log('Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
    
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'streaming'
    ];

    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.error('Spotify API credentials eksik!');
      return res.status(500).send('Spotify API yapılandırması eksik. Lütfen .env dosyasını kontrol edin.');
    }

    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
    console.log('Spotify authorization URL oluşturuldu:', authorizeURL);
    res.redirect(authorizeURL);
  } catch (error) {
    console.error('Spotify giriş hatası:', error);
    res.status(500).send('Spotify giriş hatası: ' + error.message);
  }
});

// Spotify callback
router.get('/spotify/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  try {
    // Token al
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    // Kullanıcı bilgilerini al
    const me = await spotifyApi.getMe();
    const userInfo = me.body;

    // Kullanıcıyı veritabanına kaydet veya güncelle
    const userId = `user_${userInfo.id}`;
    const expiresAt = Date.now() + (expires_in * 1000);

    db.run(
      `INSERT OR REPLACE INTO users 
       (id, spotify_id, display_name, email, avatar_url, access_token, refresh_token, token_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userInfo.id,
        userInfo.display_name,
        userInfo.email,
        userInfo.images?.[0]?.url || null,
        access_token,
        refresh_token,
        expiresAt
      ],
      function(err) {
        if (err) {
          console.error('Kullanıcı kayıt hatası:', err);
          return res.redirect('/?error=database_error');
        }

        // Session'a kullanıcı bilgilerini kaydet
        req.session.userId = userId;
        req.session.spotifyId = userInfo.id;
        req.session.accessToken = access_token;
        req.session.refreshToken = refresh_token;

        // Giriş e-postası gönder
        if (userInfo.email) {
          sendLoginEmail(userInfo.email, userInfo.display_name || 'Kullanıcı')
            .catch(err => console.error('E-posta gönderme hatası:', err));
        }

        res.redirect('/?login=success');
      }
    );
  } catch (error) {
    console.error('Spotify callback hatası:', error);
    res.redirect('/?error=auth_failed');
  }
});

// Oturum kontrolü
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  db.get(
    'SELECT id, spotify_id, display_name, email, avatar_url FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
      res.json(user);
    }
  );
});

// Çıkış
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Çıkış hatası' });
    }
    res.json({ success: true });
  });
});

module.exports = router;

