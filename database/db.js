const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

const init = () => {
  db.serialize(() => {
    // Kullanıcılar tablosu
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      spotify_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      email TEXT,
      avatar_url TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Odalar tablosu
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT,
      max_guests INTEGER DEFAULT 50,
      requests_enabled INTEGER DEFAULT 1,
      local_only INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )`);

    // Oda üyeleri tablosu
    db.run(`CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'guest',
      status TEXT DEFAULT 'pending',
      request_limit INTEGER DEFAULT -1,
      permissions TEXT,
      muted INTEGER DEFAULT 0,
      banned INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(room_id, user_id)
    )`);

    // Şarkı sırası tablosu
    db.run(`CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      track_name TEXT,
      artist_name TEXT,
      album_art TEXT,
      duration_ms INTEGER,
      added_by TEXT,
      position INTEGER,
      played INTEGER DEFAULT 0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (added_by) REFERENCES users(id)
    )`);

    // Çalma geçmişi
    db.run(`CREATE TABLE IF NOT EXISTS playback_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      track_name TEXT,
      artist_name TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )`);

    console.log('✅ Veritabanı tabloları oluşturuldu');
  });
};

const getDb = () => db;

const close = () => {
  db.close((err) => {
    if (err) {
      console.error('Veritabanı kapatma hatası:', err);
    } else {
      console.log('Veritabanı bağlantısı kapatıldı');
    }
  });
};

module.exports = {
  init,
  getDb,
  close
};

