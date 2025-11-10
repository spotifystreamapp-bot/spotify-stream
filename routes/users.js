const express = require('express');
const router = express.Router();
const db = require('../database/db').getDb();

// Kullanıcı rolünü al
router.get('/role/:roomId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId } = req.params;

  db.get(
    'SELECT role, status FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.session.userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Veritabanı hatası' });
      }
      if (!member) {
        return res.status(404).json({ error: 'Oda üyesi değilsiniz' });
      }
      res.json(member);
    }
  );
});

// Bekleme listesindeki kullanıcıları al
router.get('/pending/:roomId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId } = req.params;

  // Kullanıcının yetkisi var mı kontrol et
  db.get(
    'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.session.userId],
    (err, member) => {
      if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ error: 'Yetkiniz yok' });
      }

      db.all(
        `SELECT rm.*, u.display_name, u.avatar_url, u.email
         FROM room_members rm
         JOIN users u ON rm.user_id = u.id
         WHERE rm.room_id = ? AND rm.status = 'pending' AND rm.banned = 0
         ORDER BY rm.joined_at ASC`,
        [roomId],
        (err, pendingUsers) => {
          if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
          }
          res.json(pendingUsers);
        }
      );
    }
  );
});

// Kullanıcıyı kabul et
router.post('/:roomId/accept/:userId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId, userId } = req.params;

  // Yetki kontrolü
  db.get(
    'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.session.userId],
    (err, member) => {
      if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ error: 'Yetkiniz yok' });
      }

      db.run(
        `UPDATE room_members 
         SET status = 'active' 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Güncelleme hatası' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

// Kullanıcıyı reddet
router.post('/:roomId/reject/:userId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId, userId } = req.params;

  db.get(
    'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.session.userId],
    (err, member) => {
      if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ error: 'Yetkiniz yok' });
      }

      db.run(
        `DELETE FROM room_members 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Silme hatası' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

// Kullanıcıyı banla
router.post('/:roomId/ban/:userId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId, userId } = req.params;

  db.get(
    'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.session.userId],
    (err, member) => {
      if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({ error: 'Yetkiniz yok' });
      }

      db.run(
        `UPDATE room_members 
         SET banned = 1, status = 'banned' 
         WHERE room_id = ? AND user_id = ?`,
        [roomId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Ban hatası' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

// Admin olarak ata
router.post('/:roomId/make-admin/:userId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Oturum açılmamış' });
  }

  const { roomId, userId } = req.params;

  // Sadece owner yapabilir
  db.get(
    'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
    [roomId, req.session.userId],
    (err, member) => {
      if (err || !member || member.role !== 'owner') {
        return res.status(403).json({ error: 'Sadece oda sahibi admin atayabilir' });
      }

      // Admin sayısını kontrol et
      db.get(
        `SELECT COUNT(*) as count FROM room_members 
         WHERE room_id = ? AND role = 'admin'`,
        [roomId],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Veritabanı hatası' });
          }
          if (result.count >= 15) {
            return res.status(400).json({ error: 'Maksimum 15 admin olabilir' });
          }

          db.run(
            `UPDATE room_members 
             SET role = 'admin', status = 'active' 
             WHERE room_id = ? AND user_id = ?`,
            [roomId, userId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Güncelleme hatası' });
              }
              res.json({ success: true });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
