const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const QRCode = require('qrcode');
const db = require('../database/db').getDb();

// Oda oluştur
router.post('/create', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const roomId = `room_${randomUUID()}`;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli kod

  db.run(
    `INSERT INTO rooms (id, code, owner_id, name, max_guests, requests_enabled, local_only)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      roomId,
      code,
      req.session.userId,
      req.body.name || 'Yeni Oda',
      req.body.max_guests || 50,
      req.body.requests_enabled !== false ? 1 : 0,
      req.body.local_only ? 1 : 0
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Oda oluşturma hatası' });
      }

      // Sahibi admin olarak ekle
      db.run(
        `INSERT INTO room_members (room_id, user_id, role, status)
         VALUES (?, ?, 'owner', 'active')`,
        [roomId, req.session.userId],
        (err) => {
          if (err) {
            console.error('Sahip ekleme hatası:', err);
          }
        }
      );

      // QR kod oluştur
      const qrData = JSON.stringify({ code, roomId });
      QRCode.toDataURL(qrData, (err, url) => {
        if (err) {
          console.error('QR kod oluşturma hatası:', err);
        }

        res.json({
          roomId,
          code,
          qrCode: url
        });
      });
    }
  );
});

// Koda göre oda bul
router.get('/join/:code', (req, res) => {
  const { code } = req.params;

  db.get(
    'SELECT * FROM rooms WHERE code = ?',
    [code],
    (err, room) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!room) {
        return res.status(404).json({ error: 'Oda bulunamadı' });
      }

      // Oda bilgilerini döndür (sahip bilgisi hariç hassas veriler)
      res.json({
        roomId: room.id,
        code: room.code,
        name: room.name,
        maxGuests: room.max_guests,
        requestsEnabled: room.requests_enabled === 1,
        localOnly: room.local_only === 1
      });
    }
  );
});

// Oda bilgilerini al
router.get('/:roomId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId } = req.params;

  db.get(
    `SELECT r.*, u.display_name as owner_name, u.avatar_url as owner_avatar
     FROM rooms r
     JOIN users u ON r.owner_id = u.id
     WHERE r.id = ?`,
    [roomId],
    (err, room) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!room) {
        return res.status(404).json({ error: 'Oda bulunamadı' });
      }

      res.json(room);
    }
  );
});

// Odaya katılma isteği
router.post('/:roomId/join-request', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId } = req.params;

  // Oda var mı kontrol et
  db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
    if (err || !room) {
      return res.status(404).json({ error: 'Oda bulunamadı' });
    }

    // Zaten üye mi kontrol et
    db.get(
      'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
      [roomId, req.session.userId],
      (err, member) => {
        if (err) {
          return res.status(500).json({ error: 'Veritabanı hatası' });
        }

        if (member) {
          if (member.banned === 1) {
            return res.status(403).json({ error: 'Bu odadan yasaklandınız' });
          }
          return res.json({ status: member.status, member });
        }

        // Yeni katılma isteği
        db.run(
          `INSERT INTO room_members (room_id, user_id, role, status)
           VALUES (?, ?, 'guest', 'pending')`,
          [roomId, req.session.userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Katılma isteği hatası' });
            }

            res.json({ 
              success: true, 
              message: 'Katılma isteği gönderildi',
              memberId: this.lastID
            });
          }
        );
      }
    );
  });
});

module.exports = router;

