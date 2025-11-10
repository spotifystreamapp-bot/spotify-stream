const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Tüm ağ arayüzlerinde dinle

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'spotify-stream-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 saat
}));

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const userRoutes = require('./routes/users');
const spotifyRoutes = require('./routes/spotify');

app.use('/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/spotify', spotifyRoutes);

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io bağlantı yönetimi
const { handleSocketConnection } = require('./socket/socketHandler');
handleSocketConnection(io);

// Veritabanı başlatma
const db = require('./database/db');
db.init();

server.listen(PORT, HOST, () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`🚀 Spotify Stream sunucusu ${PORT} portunda çalışıyor`);
  
  if (isProduction) {
    console.log(`🌐 Production modu aktif`);
    console.log(`✅ Uygulamanız internet üzerinden erişilebilir!`);
    // Render/Railway gibi platformlarda URL otomatik olarak ayarlanır
    if (process.env.RENDER_EXTERNAL_URL) {
      console.log(`📍 URL: ${process.env.RENDER_EXTERNAL_URL}`);
    } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      console.log(`📍 URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
  } else {
    console.log(`📡 Development modu`);
    console.log(`\n📍 Yerel Erişim Adresleri:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://127.0.0.1:${PORT}`);
    
    // Yerel IP adresini göster (sadece development'ta)
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
          console.log(`   - http://${iface.address}:${PORT}`);
        }
      });
    });
    
    if (addresses.length > 0) {
      console.log(`\n🌐 Yerel Ağdan Erişim:`);
      console.log(`   Aynı ağdaki diğer cihazlardan yukarıdaki IP adreslerinden birini kullanarak erişebilirsiniz.`);
    }
  }
});

// Hata yakalama
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

