const db = require('../database/db').getDb();

const handleSocketConnection = (io) => {
  io.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);

    // Odaya katıl
    socket.on('join-room', (data) => {
      const { roomId, userId } = data;
      
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Oda ID ve Kullanıcı ID gerekli' });
        return;
      }

      // Kullanıcının oda üyesi olduğunu kontrol et
      db.get(
        'SELECT * FROM room_members WHERE room_id = ? AND user_id = ? AND banned = 0',
        [roomId, userId],
        (err, member) => {
          if (err) {
            socket.emit('error', { message: 'Veritabanı hatası' });
            return;
          }

          if (!member || member.status !== 'active') {
            socket.emit('error', { message: 'Odaya erişim yetkiniz yok' });
            return;
          }

          socket.join(roomId);
          socket.roomId = roomId;
          socket.userId = userId;

          // Kullanıcı bilgilerini al ve odaya bildir
          db.get(
            'SELECT display_name, avatar_url FROM users WHERE id = ?',
            [userId],
            (err, user) => {
              if (!err && user) {
                io.to(roomId).emit('user-joined', {
                  userId,
                  displayName: user.display_name,
                  avatarUrl: user.avatar_url
                });
              }
            }
          );
        }
      );
    });

    // Şarkı ekle
    socket.on('add-to-queue', (data) => {
      const { roomId, trackId, trackName, artistName, albumArt, durationMs } = data;

      if (!socket.roomId || socket.roomId !== roomId) {
        socket.emit('error', { message: 'Odaya katılmamışsınız' });
        return;
      }

      // Kullanıcının yetkisini kontrol et
      db.get(
        'SELECT role, request_limit FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, socket.userId],
        (err, member) => {
          if (err || !member) {
            socket.emit('error', { message: 'Yetki hatası' });
            return;
          }

          // İstek limiti kontrolü
          if (member.request_limit > 0) {
            db.get(
              `SELECT COUNT(*) as count FROM queue 
               WHERE room_id = ? AND added_by = ? AND played = 0`,
              [roomId, socket.userId],
              (err, result) => {
                if (err || result.count >= member.request_limit) {
                  socket.emit('error', { message: 'İstek limitiniz doldu' });
                  return;
                }
                addTrackToQueue();
              }
            );
          } else {
            addTrackToQueue();
          }

          function addTrackToQueue() {
            db.get(
              'SELECT MAX(position) as maxPos FROM queue WHERE room_id = ?',
              [roomId],
              (err, result) => {
                const position = (result?.maxPos || 0) + 1;

                db.run(
                  `INSERT INTO queue (room_id, track_id, track_name, artist_name, album_art, duration_ms, added_by, position)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [roomId, trackId, trackName, artistName, albumArt, durationMs, socket.userId, position],
                  function(err) {
                    if (err) {
                      socket.emit('error', { message: 'Şarkı ekleme hatası' });
                      return;
                    }

                    const queueItem = {
                      id: this.lastID,
                      trackId,
                      trackName,
                      artistName,
                      albumArt,
                      durationMs,
                      addedBy: socket.userId,
                      position
                    };

                    io.to(roomId).emit('queue-updated', queueItem);
                  }
                );
              }
            );
          }
        }
      );
    });

    // Şarkı sırasını al
    socket.on('get-queue', (roomId) => {
      if (!socket.roomId || socket.roomId !== roomId) {
        return;
      }

      db.all(
        `SELECT q.*, u.display_name as added_by_name
         FROM queue q
         LEFT JOIN users u ON q.added_by = u.id
         WHERE q.room_id = ? AND q.played = 0
         ORDER BY q.position ASC`,
        [roomId],
        (err, queue) => {
          if (!err) {
            socket.emit('queue', queue);
          }
        }
      );
    });

    // Şarkıyı sıradan sil
    socket.on('remove-from-queue', (data) => {
      const { roomId, queueId } = data;

      if (!socket.roomId || socket.roomId !== roomId) {
        return;
      }

      // Yetki kontrolü (admin veya owner)
      db.get(
        'SELECT role FROM room_members WHERE room_id = ? AND user_id = ?',
        [roomId, socket.userId],
        (err, member) => {
          if (err || !member || (member.role !== 'owner' && member.role !== 'admin')) {
            socket.emit('error', { message: 'Yetkiniz yok' });
            return;
          }

          db.run(
            'DELETE FROM queue WHERE id = ? AND room_id = ?',
            [queueId, roomId],
            (err) => {
              if (!err) {
                io.to(roomId).emit('queue-item-removed', { queueId });
              }
            }
          );
        }
      );
    });

    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
      if (socket.roomId && socket.userId) {
        io.to(socket.roomId).emit('user-left', {
          userId: socket.userId
        });
      }
      console.log('Bağlantı kesildi:', socket.id);
    });
  });
};

module.exports = {
  handleSocketConnection
};

