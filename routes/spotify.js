const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const db = require('../database/db').getDb();

// Kullanıcının Spotify API instance'ını al
const getSpotifyApi = async (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT access_token, refresh_token, token_expires_at FROM users WHERE id = ?',
      [userId],
      async (err, user) => {
        if (err || !user) {
          return reject(new Error('Kullanıcı bulunamadı'));
        }

        const spotifyApi = new SpotifyWebApi({
          clientId: process.env.SPOTIFY_CLIENT_ID,
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
          accessToken: user.access_token,
          refreshToken: user.refresh_token
        });

        // Token süresi dolmuşsa yenile
        if (Date.now() >= user.token_expires_at) {
          try {
            const data = await spotifyApi.refreshAccessToken();
            const { access_token, expires_in } = data.body;
            
            spotifyApi.setAccessToken(access_token);
            
            // Veritabanını güncelle
            const expiresAt = Date.now() + (expires_in * 1000);
            db.run(
              'UPDATE users SET access_token = ?, token_expires_at = ? WHERE id = ?',
              [access_token, expiresAt, userId]
            );
          } catch (error) {
            return reject(error);
          }
        }

        resolve(spotifyApi);
      }
    );
  });
};

// Şarkı ara
router.get('/search', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { q, limit = 20 } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Arama terimi gerekli' });
  }

  try {
    const spotifyApi = await getSpotifyApi(req.session.userId);
    const results = await spotifyApi.searchTracks(q, { limit: parseInt(limit) });

    const tracks = results.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      duration: track.duration_ms,
      uri: track.uri
    }));

    res.json(tracks);
  } catch (error) {
    console.error('Spotify arama hatası:', error);
    res.status(500).json({ error: 'Arama yapılamadı' });
  }
});

// Şu an çalan şarkıyı al
router.get('/currently-playing', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  try {
    const spotifyApi = await getSpotifyApi(req.session.userId);
    const playback = await spotifyApi.getMyCurrentPlayingTrack();

    if (!playback.body || !playback.body.item) {
      return res.json({ playing: false });
    }

    const track = playback.body.item;
    res.json({
      playing: true,
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        albumArt: track.album.images[0]?.url || null,
        duration: track.duration_ms,
        progress: playback.body.progress_ms
      }
    });
  } catch (error) {
    console.error('Çalma durumu hatası:', error);
    res.status(500).json({ error: 'Çalma durumu alınamadı' });
  }
});

// Şarkı çal
router.post('/play', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { trackUri, deviceId } = req.body;

  try {
    const spotifyApi = await getSpotifyApi(req.session.userId);
    
    const playOptions = {};
    if (trackUri) {
      playOptions.uris = [trackUri];
    }
    if (deviceId) {
      playOptions.device_id = deviceId;
    }

    await spotifyApi.play(playOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Çalma hatası:', error);
    res.status(500).json({ error: 'Şarkı çalınamadı' });
  }
});

// Duraklat
router.post('/pause', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  try {
    const spotifyApi = await getSpotifyApi(req.session.userId);
    await spotifyApi.pause();
    res.json({ success: true });
  } catch (error) {
    console.error('Duraklatma hatası:', error);
    res.status(500).json({ error: 'Duraklatılamadı' });
  }
});

// Kullanıcının çalma listelerini al
router.get('/playlists', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  try {
    const spotifyApi = await getSpotifyApi(req.session.userId);
    const playlists = await spotifyApi.getUserPlaylists();

    const playlistData = playlists.body.items.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      image: playlist.images[0]?.url || null,
      tracks: playlist.tracks.total
    }));

    res.json(playlistData);
  } catch (error) {
    console.error('Çalma listesi hatası:', error);
    res.status(500).json({ error: 'Çalma listeleri alınamadı' });
  }
});

module.exports = router;

