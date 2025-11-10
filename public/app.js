// Socket.io bağlantısı
const socket = io();

// Global state
let currentUser = null;
let currentRoom = null;
let userRole = null;
let spotifyApi = null;

// Spotify giriş işlemi
function handleSpotifyLogin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    console.log('Spotify giriş butonuna tıklandı');
    
    try {
        // Direkt olarak Spotify auth sayfasına yönlendir
        window.location.href = '/auth/spotify';
    } catch (error) {
        console.error('Spotify giriş hatası:', error);
        alert('Giriş sayfasına yönlendirilemedi. Lütfen tekrar deneyin.');
    }
}

// Global fonksiyon - HTML'den çağrılabilir
window.handleSpotifyLoginClick = function(e) {
    handleSpotifyLogin(e);
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Sayfa yüklendi, event listenerlar kuruluyor...');
    setupEventListeners();
    await checkAuth();
});

// Oturum kontrolü
async function checkAuth() {
    try {
        const response = await fetch('/auth/me');
        if (response.ok) {
            currentUser = await response.json();
            showMainScreen();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Auth kontrolü hatası:', error);
        showLoginScreen();
    }
}

// Event listeners
function setupEventListeners() {
    // Giriş butonu - butonun varlığını kontrol et ve event listener ekle
    const spotifyLoginBtn = document.getElementById('spotify-login-btn');
    if (spotifyLoginBtn) {
        spotifyLoginBtn.addEventListener('click', handleSpotifyLogin);
        // Butonun disabled olmadığından emin ol
        spotifyLoginBtn.disabled = false;
        console.log('Spotify giriş butonu event listener eklendi');
    } else {
        console.error('Spotify giriş butonu bulunamadı!');
        // Buton henüz yüklenmemişse, bir süre sonra tekrar dene
        setTimeout(() => {
            const retryBtn = document.getElementById('spotify-login-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', handleSpotifyLogin);
                retryBtn.disabled = false;
                console.log('Spotify giriş butonu event listener (retry) eklendi');
            }
        }, 500);
    }

    // Çıkış butonu
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await logout();
    });

    // Navigasyon
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Oda oluştur
    document.getElementById('create-room-btn')?.addEventListener('click', createRoom);

    // Odaya katıl
    document.getElementById('join-room-btn')?.addEventListener('click', joinRoom);

    // Odadan çık
    document.getElementById('leave-room-btn')?.addEventListener('click', leaveRoom);

    // Şarkı arama
    const searchInput = document.getElementById('track-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchTracks(e.target.value);
            }, 500);
        });
    }

    // Socket event'leri
    socket.on('connect', () => {
        console.log('Socket bağlantısı kuruldu');
    });

    socket.on('user-joined', (data) => {
        console.log('Kullanıcı katıldı:', data);
        updateActiveUsers();
    });

    socket.on('user-left', (data) => {
        console.log('Kullanıcı ayrıldı:', data);
        updateActiveUsers();
    });

    socket.on('queue-updated', (data) => {
        console.log('Sıra güncellendi:', data);
        updateQueue();
    });

    socket.on('queue-item-removed', (data) => {
        console.log('Sıradan çıkarıldı:', data);
        updateQueue();
    });

    socket.on('queue', (queue) => {
        displayQueue(queue);
    });

    socket.on('error', (data) => {
        showStatus(data.message, 'error');
    });
}

// Ekranları göster/gizle
function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
}

function showMainScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.display_name || 'Kullanıcı';
        document.getElementById('user-avatar').src = currentUser.avatar_url || '';
    }
}

function switchView(viewName) {
    // Tüm view'ları gizle
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Nav item'ları güncelle
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // İlgili view'ı göster
    const view = document.getElementById(`${viewName}-view`);
    if (view) {
        view.classList.add('active');
    }
}

// Çıkış
async function logout() {
    try {
        const response = await fetch('/auth/logout', { method: 'POST' });
        if (response.ok) {
            currentUser = null;
            currentRoom = null;
            socket.disconnect();
            showLoginScreen();
        }
    } catch (error) {
        console.error('Çıkış hatası:', error);
    }
}

// Oda oluştur
async function createRoom() {
    const roomName = document.getElementById('room-name-input').value || 'Yeni Oda';
    
    try {
        const response = await fetch('/api/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: roomName })
        });

        if (response.ok) {
            const data = await response.json();
            currentRoom = data.roomId;
            
            // QR kod ve kod göster
            document.getElementById('room-code').textContent = data.code;
            document.getElementById('qr-code-img').src = data.qrCode;
            document.getElementById('room-created').classList.remove('hidden');
            
            // Odaya katıl
            socket.emit('join-room', { roomId: data.roomId, userId: currentUser.id });
            
            // Oda görünümüne geç
            switchView('room');
            loadRoomData();
        } else {
            showStatus('Oda oluşturulamadı', 'error');
        }
    } catch (error) {
        console.error('Oda oluşturma hatası:', error);
        showStatus('Bir hata oluştu', 'error');
    }
}

// Odaya katıl
async function joinRoom() {
    const code = document.getElementById('room-code-input').value;
    
    if (!code || code.length !== 6) {
        showStatus('Geçerli bir kod girin', 'error');
        return;
    }

    try {
        // Önce oda bilgilerini al
        const roomResponse = await fetch(`/api/rooms/join/${code}`);
        if (!roomResponse.ok) {
            showStatus('Oda bulunamadı', 'error');
            return;
        }

        const roomData = await roomResponse.json();
        currentRoom = roomData.roomId;

        // Katılma isteği gönder
        const joinResponse = await fetch(`/api/rooms/${currentRoom}/join-request`, {
            method: 'POST'
        });

        if (joinResponse.ok) {
            const joinData = await joinResponse.json();
            
            if (joinData.status === 'active') {
                // Direkt aktif
                socket.emit('join-room', { roomId: currentRoom, userId: currentUser.id });
                switchView('room');
                loadRoomData();
            } else {
                showStatus('Katılma isteğiniz gönderildi. Onay bekleniyor...', 'success');
                // Kullanıcı rolünü kontrol et
                checkUserRole();
            }
        } else {
            showStatus('Odaya katılamadınız', 'error');
        }
    } catch (error) {
        console.error('Katılma hatası:', error);
        showStatus('Bir hata oluştu', 'error');
    }
}

// Odadan çık
function leaveRoom() {
    if (currentRoom) {
        socket.emit('leave-room', { roomId: currentRoom });
        socket.leave(currentRoom);
    }
    currentRoom = null;
    switchView('create-room');
    document.getElementById('room-created').classList.add('hidden');
}

// Kullanıcı rolünü kontrol et
async function checkUserRole() {
    if (!currentRoom) return;

    try {
        const response = await fetch(`/api/users/role/${currentRoom}`);
        if (response.ok) {
            const data = await response.json();
            userRole = data.role;
            
            if (data.status === 'active') {
                // Aktifse arama bölümünü göster
                document.getElementById('search-section').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Rol kontrolü hatası:', error);
    }
}

// Oda verilerini yükle
async function loadRoomData() {
    if (!currentRoom) return;

    // Oda bilgileri
    const roomResponse = await fetch(`/api/rooms/${currentRoom}`);
    if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        document.getElementById('current-room-name').textContent = roomData.name || 'Oda';
    }

    // Kullanıcı rolünü kontrol et
    await checkUserRole();

    // Aktif kullanıcılar
    updateActiveUsers();

    // Bekleme listesi (admin/owner ise)
    updatePendingUsers();

    // Şarkı sırası
    socket.emit('get-queue', currentRoom);
}

// Bekleme listesini güncelle
async function updatePendingUsers() {
    if (!currentRoom || (userRole !== 'owner' && userRole !== 'admin')) {
        document.getElementById('pending-users-section').classList.add('hidden');
        return;
    }

    try {
        const response = await fetch(`/api/users/pending/${currentRoom}`);
        if (response.ok) {
            const pendingUsers = await response.json();
            displayPendingUsers(pendingUsers);
            document.getElementById('pending-users-section').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Bekleme listesi hatası:', error);
    }
}

// Bekleme listesini göster
function displayPendingUsers(users) {
    const container = document.getElementById('pending-users-list');
    container.innerHTML = '';

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.innerHTML = `
            <img src="${user.avatar_url || ''}" alt="${user.display_name}" class="avatar">
            <div class="user-item-info">
                <div class="user-item-name">${user.display_name}</div>
            </div>
            <div class="user-item-actions">
                <button class="action-btn" onclick="acceptUser('${user.user_id}')">Kabul</button>
                <button class="action-btn" onclick="rejectUser('${user.user_id}')">Reddet</button>
                <button class="action-btn" onclick="banUser('${user.user_id}')">Banla</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Aktif kullanıcıları güncelle
function updateActiveUsers() {
    // Socket üzerinden aktif kullanıcıları al
    // Şimdilik placeholder
    const container = document.getElementById('active-users-list');
    container.innerHTML = '<p style="color: var(--text-secondary);">Kullanıcılar yükleniyor...</p>';
}

// Şarkı sırasını güncelle
function updateQueue() {
    if (currentRoom) {
        socket.emit('get-queue', currentRoom);
    }
}

// Şarkı sırasını göster
function displayQueue(queue) {
    const container = document.getElementById('queue-list');
    container.innerHTML = '';

    if (queue.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Sırada şarkı yok</p>';
        return;
    }

    queue.forEach(item => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
            <img src="${item.album_art || ''}" alt="${item.track_name}" class="queue-item-art">
            <div class="queue-item-info">
                <div class="queue-item-title">${item.track_name}</div>
                <div class="queue-item-artist">${item.artist_name}</div>
            </div>
            ${(userRole === 'owner' || userRole === 'admin') ? 
                `<button class="action-btn" onclick="removeFromQueue(${item.id})">Kaldır</button>` : 
                ''}
        `;
        container.appendChild(queueItem);
    });
}

// Şarkı ara
async function searchTracks(query) {
    if (!query || query.length < 2) {
        document.getElementById('search-results').innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const tracks = await response.json();
            displaySearchResults(tracks);
        }
    } catch (error) {
        console.error('Arama hatası:', error);
    }
}

// Arama sonuçlarını göster
function displaySearchResults(tracks) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';

    if (tracks.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Sonuç bulunamadı</p>';
        return;
    }

    tracks.forEach(track => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <img src="${track.albumArt || ''}" alt="${track.name}" class="queue-item-art" style="width: 50px; height: 50px;">
            <div class="queue-item-info" style="flex: 1;">
                <div class="queue-item-title">${track.name}</div>
                <div class="queue-item-artist">${track.artist}</div>
            </div>
            <button class="action-btn" onclick="addTrackToQueue('${track.id}', '${track.name.replace(/'/g, "\\'")}', '${track.artist.replace(/'/g, "\\'")}', '${track.albumArt || ''}', ${track.duration})">Ekle</button>
        `;
        container.appendChild(item);
    });
}

// Şarkıyı sıraya ekle
function addTrackToQueue(trackId, trackName, artistName, albumArt, duration) {
    if (!currentRoom) {
        showStatus('Önce bir odaya katılın', 'error');
        return;
    }

    socket.emit('add-to-queue', {
        roomId: currentRoom,
        trackId,
        trackName,
        artistName,
        albumArt,
        durationMs: duration
    });

    showStatus('Şarkı sıraya eklendi', 'success');
    document.getElementById('track-search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
}

window.addTrackToQueue = addTrackToQueue;

// Kullanıcı işlemleri
async function acceptUser(userId) {
    await userAction('accept', userId);
}

async function rejectUser(userId) {
    await userAction('reject', userId);
}

async function banUser(userId) {
    await userAction('ban', userId);
}

async function userAction(action, userId) {
    try {
        const response = await fetch(`/api/users/${currentRoom}/${action}/${userId}`, {
            method: 'POST'
        });

        if (response.ok) {
            updatePendingUsers();
            showStatus('İşlem başarılı', 'success');
        } else {
            showStatus('İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Kullanıcı işlemi hatası:', error);
    }
}

// Sıradan kaldır
async function removeFromQueue(queueId) {
    socket.emit('remove-from-queue', { roomId: currentRoom, queueId });
}

// Durum mesajı göster
function showStatus(message, type) {
    const statusEl = document.getElementById('join-status');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.classList.remove('hidden');

    setTimeout(() => {
        statusEl.classList.add('hidden');
    }, 5000);
}

// Global fonksiyonlar
window.acceptUser = acceptUser;
window.rejectUser = rejectUser;
window.banUser = banUser;
window.removeFromQueue = removeFromQueue;

