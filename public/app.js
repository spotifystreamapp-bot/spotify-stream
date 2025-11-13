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
        // credentials: 'include' ile cookie'lerin gönderilmesini sağla
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
    console.log('📄 Sayfa yüklendi, event listenerlar kuruluyor...');
    console.log('📍 Current pathname:', window.location.pathname);
    
    // Önce varsayılan olarak login ekranını göster (auth kontrolü yapılana kadar)
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    
    if (loginScreen && mainScreen) {
        // Varsayılan olarak login ekranını göster
        loginScreen.classList.add('active');
        mainScreen.classList.remove('active');
        console.log('🔵 Varsayılan olarak login ekranı gösteriliyor');
    }
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Auth kontrolü yap
    await checkAuth();
});

// Oturum kontrolü
async function checkAuth() {
    try {
        console.log('🔐 Auth kontrolü başlatılıyor...');
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Current pathname:', window.location.pathname);
        
        const response = await fetch('/auth/me', {
            method: 'GET',
            credentials: 'include', // Cookie'leri gönder - ÖNEMLİ!
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Auth response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            currentUser = await response.json();
            console.log('✅ Kullanıcı bilgileri alındı:', currentUser);
            
            // Ana ekranı göster
            showMainScreen();
            
            // URL'yi güncelle (eğer gerekirse)
            const currentPath = window.location.pathname;
            if (currentPath !== '/dashboard' && currentPath !== '/') {
                window.history.replaceState({}, '', '/dashboard');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Giriş yapılmamış:', errorData);
            console.log('📍 Login ekranı gösteriliyor...');
            
            // Giriş yapılmamışsa login ekranını göster
            showLoginScreen();
            
            // Eğer dashboard'taysa URL'yi ana sayfaya değiştir (ama sayfayı yenileme)
            const currentPath = window.location.pathname;
            if (currentPath === '/dashboard') {
                // URL'yi değiştir ama sayfayı yenileme (SPA mantığı)
                window.history.replaceState({}, '', '/');
            }
        }
    } catch (error) {
        console.error('❌ Auth kontrolü hatası:', error);
        showLoginScreen();
        
        // Eğer dashboard'taysa URL'yi ana sayfaya değiştir
        const currentPath = window.location.pathname;
        if (currentPath === '/dashboard') {
            window.history.replaceState({}, '', '/');
        }
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
    
    // Ayarlar butonu
    document.getElementById('settings-btn')?.addEventListener('click', () => {
        openSettingsModal();
    });
    
    // Oda ayarları butonu
    document.getElementById('room-settings-btn')?.addEventListener('click', () => {
        // Oda ayarları modal'ı (ileride eklenecek)
        showStatus('Oda ayarları yakında eklenecek', 'info');
    });

    // Navigasyon
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Stream onay butonu
    document.getElementById('confirm-stream-btn')?.addEventListener('click', confirmStream);
    
    // Stream name input Enter tuşu ve validasyon
    const streamNameInput = document.getElementById('stream-name-input');
    if (streamNameInput) {
        streamNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmStream();
            }
        });
        
        // Input değiştiğinde hata durumunu temizle
        streamNameInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length >= 3 || value.length === 0) {
                e.target.classList.remove('error');
                document.getElementById('stream-name-error').classList.add('hidden');
                document.getElementById('stream-name-error-text').classList.add('hidden');
            }
        });
    }

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
    
    // Şarkı çalmaya başla butonu
    document.getElementById('start-playing-btn')?.addEventListener('click', () => {
        if (currentRoom) {
            switchView('room');
            loadRoomData();
        }
    });

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
    console.log('🔵 Login ekranı gösteriliyor');
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    
    console.log('🔵 Login screen element:', loginScreen);
    console.log('🔵 Main screen element:', mainScreen);
    
    if (loginScreen) {
        loginScreen.classList.add('active');
        console.log('✅ Login screen active class eklendi');
    } else {
        console.error('❌ Login screen elementi bulunamadı!');
    }
    
    if (mainScreen) {
        mainScreen.classList.remove('active');
        console.log('✅ Main screen active class kaldırıldı');
    } else {
        console.error('❌ Main screen elementi bulunamadı!');
    }
}

function showMainScreen() {
    console.log('🟢 Ana ekran gösteriliyor');
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    
    console.log('🟢 Login screen element:', loginScreen);
    console.log('🟢 Main screen element:', mainScreen);
    
    if (!loginScreen || !mainScreen) {
        console.error('❌ Ekran elementleri bulunamadı!', {
            loginScreen: !!loginScreen,
            mainScreen: !!mainScreen
        });
        // Elementler henüz yüklenmemişse, kısa bir süre bekle ve tekrar dene
        setTimeout(() => {
            console.log('🔄 Ekranları tekrar göster/gizle deneniyor...');
            showMainScreen();
        }, 100);
        return;
    }
    
    // Login ekranını gizle
    loginScreen.classList.remove('active');
    console.log('✅ Login screen active class kaldırıldı');
    console.log('✅ Login screen classes:', loginScreen.className);
    
    // Main ekranı göster
    mainScreen.classList.add('active');
    console.log('✅ Main screen active class eklendi');
    console.log('✅ Main screen classes:', mainScreen.className);
    
    // Kullanıcı bilgilerini güncelle
    if (currentUser) {
        const userName = currentUser.display_name || 'Kullanıcı';
        const userNameEl = document.getElementById('user-name');
        const welcomeUserNameEl = document.getElementById('welcome-user-name');
        const userAvatarEl = document.getElementById('user-avatar');
        
        console.log('👤 Kullanıcı bilgileri güncelleniyor:', userName);
        
        if (userNameEl) {
            userNameEl.textContent = userName;
            console.log('✅ User name güncellendi');
        } else {
            console.warn('⚠️ User name elementi bulunamadı');
        }
        
        if (welcomeUserNameEl) {
            welcomeUserNameEl.textContent = userName;
            console.log('✅ Welcome user name güncellendi');
        } else {
            console.warn('⚠️ Welcome user name elementi bulunamadı');
        }
        
        if (userAvatarEl) {
            userAvatarEl.src = currentUser.avatar_url || '';
            userAvatarEl.alt = userName;
            console.log('✅ User avatar güncellendi:', currentUser.avatar_url);
        } else {
            console.warn('⚠️ User avatar elementi bulunamadı');
        }
        
        // Kullanıcı rolünü göster (varsayılan olarak guest, sonra güncellenecek)
        updateUserRoleBadge('guest');
    }
    
    // URL'ye göre view'ı ayarla
    const pathname = window.location.pathname;
    console.log('📍 Current pathname:', pathname);
    
    // Kısa bir gecikme ile view'ı değiştir (DOM'un güncellenmesi için)
    setTimeout(() => {
        if (pathname === '/dashboard' || pathname === '/') {
            // Eğer oda içindeyse room view'ı göster, değilse home
            if (!currentRoom) {
                console.log('🏠 Home view gösteriliyor');
                switchView('home');
                // Yayınlarım listesini yükle
                updateMyStreams();
            }
        }
    }, 50);
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
    
    // Ana sayfaya dönüldüğünde yayınlarım listesini güncelle
    if (viewName === 'home' && currentUser) {
        updateMyStreams();
    }
    
    // URL'yi güncelle (history API ile)
    if (viewName !== 'room') {
        window.history.pushState({ view: viewName }, '', `/dashboard`);
    }
}

// Global fonksiyon - HTML'den çağrılabilir
window.switchView = switchView;

// Çıkış
async function logout() {
    try {
        const response = await fetch('/auth/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            currentUser = null;
            currentRoom = null;
            userRole = null;
            socket.disconnect();
            
            // Login ekranına dön
            showLoginScreen();
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Çıkış hatası:', error);
        // Hata olsa bile login ekranına dön
        showLoginScreen();
        window.location.href = '/';
    }
}

// Kullanıcı rol rozetini güncelle
function updateUserRoleBadge(role) {
    const roleBadge = document.getElementById('user-role');
    if (!roleBadge) return;
    
    roleBadge.className = 'user-role-badge';
    roleBadge.textContent = '';
    
    switch(role) {
        case 'owner':
            roleBadge.classList.add('owner');
            roleBadge.textContent = '🟢 Ana Admin';
            break;
        case 'admin':
            roleBadge.classList.add('admin');
            roleBadge.textContent = '🟡 Admin';
            break;
        case 'ranked-admin':
            roleBadge.classList.add('ranked-admin');
            roleBadge.textContent = '⭐ Rütbeli Admin';
            break;
        case 'guest':
        default:
            roleBadge.classList.add('guest');
            roleBadge.textContent = '🔵 Misafir';
            break;
    }
}

// Stream type seçimi
let selectedStreamType = null;

function selectStreamType(type) {
    selectedStreamType = type;
    // Tüm seçeneklerden active class'ını kaldır
    document.querySelectorAll('.stream-option').forEach(option => {
        option.classList.remove('active');
    });
    // Seçilen seçeneğe active class'ı ekle
    const selectedOption = document.querySelector(`.stream-option[data-type="${type}"]`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }
}

// Stream başlat
function startStream(type) {
    selectedStreamType = type;
    // Modal'ı aç
    const modal = document.getElementById('stream-name-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Input'a odaklan
        setTimeout(() => {
            const input = document.getElementById('stream-name-input');
            if (input) {
                input.focus();
            }
        }, 100);
    }
}

// Stream name modal'ı kapat
function closeStreamNameModal() {
    const modal = document.getElementById('stream-name-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('stream-name-input').value = '';
    }
}

// Stream'i onayla ve oda oluştur
async function confirmStream() {
    const streamNameInput = document.getElementById('stream-name-input');
    const streamName = streamNameInput.value.trim();
    const errorIcon = document.getElementById('stream-name-error');
    const errorText = document.getElementById('stream-name-error-text');
    
    // Validasyon: En az 3 karakter kontrolü
    if (streamName.length > 0 && streamName.length < 3) {
        streamNameInput.classList.add('error');
        errorIcon.classList.remove('hidden');
        errorText.classList.remove('hidden');
        return;
    }
    
    // Hata durumunu temizle
    streamNameInput.classList.remove('error');
    errorIcon.classList.add('hidden');
    errorText.classList.add('hidden');
    
    const finalStreamName = streamName || getDefaultStreamName(selectedStreamType);
    
    // Modal'ı kapat
    closeStreamNameModal();
    
    // Oda oluştur
    await createRoom(finalStreamName);
}

// Stream tipine göre varsayılan isim
function getDefaultStreamName(type) {
    const names = {
        'friends': 'Arkadaşlarla Yayın',
        'business': 'İşletme Yayını',
        'streamer': 'Canlı Yayın',
        'custom': 'Özel Yayın'
    };
    return names[type] || 'Yeni Yayın';
}

// Oda oluştur
async function createRoom(roomName = 'Yeni Oda') {
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
            
            // Kullanıcıyı owner olarak işaretle
            userRole = 'owner';
            updateUserRoleBadge('owner');
            
            // "Kodla Gir" ve "Müzik Yayını Başlat" kartlarını gizle
            const joinRoomCard = document.getElementById('join-room-card');
            const createRoomCard = document.getElementById('create-room-card');
            if (joinRoomCard) {
                joinRoomCard.classList.add('hidden');
            }
            if (createRoomCard) {
                createRoomCard.classList.add('hidden');
            }
            
            // Sidebar'daki nav item'ları gizle
            const navCreateRoom = document.getElementById('nav-create-room');
            const navJoinRoom = document.getElementById('nav-join-room');
            if (navCreateRoom) {
                navCreateRoom.classList.add('hidden');
            }
            if (navJoinRoom) {
                navJoinRoom.classList.add('hidden');
            }
            
            // Yayınlarım bölümünü göster ve yayını ekle
            updateMyStreams();
            
            // Oda görünümüne geç
            setTimeout(() => {
                switchView('room');
                loadRoomData();
            }, 1000);
        } else {
            showStatus('Oda oluşturulamadı', 'error');
        }
    } catch (error) {
        console.error('Oda oluşturma hatası:', error);
        showStatus('Bir hata oluştu', 'error');
    }
}

// Global fonksiyonlar
window.selectStreamType = selectStreamType;
window.startStream = startStream;
window.closeStreamNameModal = closeStreamNameModal;
window.confirmStream = confirmStream;

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

// Yayını bitir
async function leaveRoom() {
    if (currentRoom) {
        // Odayı kapat (owner ise)
        if (userRole === 'owner') {
            try {
                await fetch(`/api/rooms/${currentRoom}/close`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Oda kapatma hatası:', error);
            }
        }
        
        socket.emit('leave-room', { roomId: currentRoom });
        socket.leave(currentRoom);
    }
    currentRoom = null;
    userRole = null;
    
    // "Kodla Gir" ve "Müzik Yayını Başlat" kartlarını tekrar göster
    const joinRoomCard = document.getElementById('join-room-card');
    const createRoomCard = document.getElementById('create-room-card');
    if (joinRoomCard) {
        joinRoomCard.classList.remove('hidden');
    }
    if (createRoomCard) {
        createRoomCard.classList.remove('hidden');
    }
    
    // Sidebar'daki nav item'ları tekrar göster
    const navCreateRoom = document.getElementById('nav-create-room');
    const navJoinRoom = document.getElementById('nav-join-room');
    if (navCreateRoom) {
        navCreateRoom.classList.remove('hidden');
    }
    if (navJoinRoom) {
        navJoinRoom.classList.remove('hidden');
    }
    
    // Yayınlarım listesini güncelle
    updateMyStreams();
    
    switchView('home');
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
            
            // Rol rozetini güncelle
            updateUserRoleBadge(data.role);
            
            if (data.status === 'active') {
                // Aktifse arama bölümünü göster
                const searchSection = document.getElementById('search-section');
                if (searchSection) {
                    searchSection.classList.remove('hidden');
                }
            } else {
                // Beklemedeyse arama bölümünü gizle
                const searchSection = document.getElementById('search-section');
                if (searchSection) {
                    searchSection.classList.add('hidden');
                }
            }
            
            // Admin/Owner ise bekleme listesini göster
            if (data.role === 'owner' || data.role === 'admin') {
                const pendingSection = document.getElementById('pending-users-section');
                if (pendingSection) {
                    pendingSection.classList.remove('hidden');
                }
                updatePendingUsers();
            } else {
                const pendingSection = document.getElementById('pending-users-section');
                if (pendingSection) {
                    pendingSection.classList.add('hidden');
                }
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
    try {
        const roomResponse = await fetch(`/api/rooms/${currentRoom}`);
        if (roomResponse.ok) {
            const roomData = await roomResponse.json();
            document.getElementById('current-room-name').textContent = roomData.name || 'Oda';
            if (roomData.code) {
                const roomCodeDisplay = document.getElementById('room-code-display');
                if (roomCodeDisplay) {
                    roomCodeDisplay.textContent = roomData.code;
                }
            }
        }
    } catch (error) {
        console.error('Oda bilgisi yüklenirken hata:', error);
    }

    // Kullanıcı rolünü kontrol et
    await checkUserRole();

    // Aktif kullanıcılar
    updateActiveUsers();

    // Bekleme listesi (admin/owner ise)
    updatePendingUsers();

    // Şarkı sırası
    socket.emit('get-queue', currentRoom);
    
    // Oda kullanıcı sayısını güncelle
    socket.emit('get-room-users-count', { roomId: currentRoom }, (count) => {
        const userCountEl = document.getElementById('room-user-count');
        if (userCountEl) {
            userCountEl.textContent = `${count || 0} kullanıcı`;
        }
    });
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
    const pendingCount = document.getElementById('pending-count');
    
    if (pendingCount) {
        pendingCount.textContent = users.length;
    }
    
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Bekleme listesinde kullanıcı yok</p>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.innerHTML = `
            <img src="${user.avatar_url || ''}" alt="${user.display_name || 'Kullanıcı'}" class="avatar" onerror="this.src=''">
            <div class="user-item-info">
                <div class="user-item-name">${user.display_name || 'Kullanıcı'}</div>
                <div class="user-item-role">Beklemede</div>
            </div>
            <div class="user-item-actions">
                <button class="action-btn" onclick="acceptUser('${user.user_id}')" title="Kabul Et">✅</button>
                <button class="action-btn" onclick="rejectUser('${user.user_id}')" title="Reddet">❌</button>
                <button class="action-btn danger" onclick="banUser('${user.user_id}')" title="Banla">🚫</button>
                <button class="action-btn" onclick="openUserActionsModal('${user.user_id}', '${(user.display_name || 'Kullanıcı').replace(/'/g, "\\'")}', 'pending')" title="Daha Fazla">⋯</button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Aktif kullanıcıları güncelle
function updateActiveUsers() {
    if (!currentRoom) return;
    
    // Socket üzerinden aktif kullanıcıları al
    socket.emit('get-active-users', { roomId: currentRoom }, (users) => {
        displayActiveUsers(users || []);
    });
}

// Aktif kullanıcıları göster
function displayActiveUsers(users) {
    const container = document.getElementById('active-users-list');
    const activeCount = document.getElementById('active-count');
    
    if (activeCount) {
        activeCount.textContent = users.length;
    }
    
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Aktif kullanıcı yok</p>';
        return;
    }

    users.forEach(user => {
        const item = document.createElement('div');
        item.className = 'user-item';
        
        // Kullanıcı rolüne göre rozet
        let roleBadge = '';
        if (user.role === 'owner') {
            roleBadge = '<span class="badge owner">🟢 Ana Admin</span>';
        } else if (user.role === 'admin') {
            roleBadge = user.ranked ? '<span class="badge ranked-admin">⭐ Rütbeli Admin</span>' : '<span class="badge admin">🟡 Admin</span>';
        } else if (user.role === 'guest') {
            roleBadge = user.always_allowed ? '<span class="badge guest">⭐ Müdavim</span>' : '<span class="badge guest">🔵 Misafir</span>';
        }
        
        item.innerHTML = `
            <img src="${user.avatar_url || ''}" alt="${user.display_name || 'Kullanıcı'}" class="avatar" onerror="this.src=''">
            <div class="user-item-info">
                <div class="user-item-name">${user.display_name || 'Kullanıcı'}</div>
                <div class="user-item-role">${roleBadge}</div>
            </div>
            ${(userRole === 'owner' || (userRole === 'admin' && user.role === 'guest')) && user.user_id !== currentUser?.id ? `
            <div class="user-item-actions">
                <button class="action-btn" onclick="openUserActionsModal('${user.user_id}', '${(user.display_name || 'Kullanıcı').replace(/'/g, "\\'")}', '${user.role}')" title="İşlemler">⋯</button>
            </div>
            ` : ''}
        `;
        container.appendChild(item);
    });
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
    const queueCount = document.getElementById('queue-count');
    
    if (queueCount) {
        queueCount.textContent = queue.length;
    }
    
    container.innerHTML = '';

    if (!queue || queue.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Sırada şarkı yok</p>';
        return;
    }

    queue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
            <div style="font-size: 14px; color: var(--text-tertiary); min-width: 24px;">${index + 1}</div>
            <img src="${item.album_art || ''}" alt="${item.track_name || 'Şarkı'}" class="queue-item-art" onerror="this.src=''">
            <div class="queue-item-info">
                <div class="queue-item-title">${item.track_name || 'Bilinmeyen Şarkı'}</div>
                <div class="queue-item-artist">${item.artist_name || 'Bilinmeyen Sanatçı'}</div>
            </div>
            ${(userRole === 'owner' || userRole === 'admin') ? 
                `<button class="action-btn danger" onclick="removeFromQueue(${item.id})" title="Kaldır">🗑️</button>` : 
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

// Oda kodunu kopyala
function copyRoomCode() {
    const roomCode = document.getElementById('room-code').textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(roomCode).then(() => {
            showStatus('Kod kopyalandı!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showStatus('Kod kopyalandı!', 'success');
    }
}
window.copyRoomCode = copyRoomCode;

// Ayarlar Modal
function openSettingsModal() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
}
window.closeSettingsModal = closeSettingsModal;

// Kullanıcı İşlemleri Modal
function openUserActionsModal(userId, userName, userRole) {
    const modal = document.getElementById('user-actions-modal');
    const title = document.getElementById('user-actions-title');
    const content = document.getElementById('user-actions-content');
    
    title.textContent = `${userName} - İşlemler`;
    
    // Kullanıcı rolüne göre işlemleri göster
    let actionsHTML = '';
    
    if (userRole === 'pending' || userRole === 'guest') {
        actionsHTML = `
            <div class="user-actions-list">
                <button class="action-btn" onclick="acceptUser('${userId}')">✅ Kabul Et</button>
                <button class="action-btn" onclick="rejectUser('${userId}')">❌ Reddet</button>
                <button class="action-btn" onclick="banUser('${userId}')">🚫 Banla</button>
                <button class="action-btn" onclick="makeAdmin('${userId}')">👑 Admin Yap</button>
                <button class="action-btn" onclick="allowAlways('${userId}')">⭐ Hep İzin Ver</button>
            </div>
        `;
    } else if (userRole === 'admin') {
        actionsHTML = `
            <div class="user-actions-list">
                <button class="action-btn" onclick="limitPermissions('${userId}')">🔒 Yetki Sınırla</button>
                <button class="action-btn" onclick="makeGuest('${userId}')">👤 Misafir Yap</button>
                <button class="action-btn danger" onclick="banUser('${userId}')">🚫 Banla</button>
            </div>
        `;
    }
    
    content.innerHTML = actionsHTML;
    modal.classList.remove('hidden');
}

function closeUserActionsModal() {
    document.getElementById('user-actions-modal').classList.add('hidden');
}
window.closeUserActionsModal = closeUserActionsModal;

// Kullanıcı işlemleri
async function makeAdmin(userId) {
    await userAction('make-admin', userId);
    closeUserActionsModal();
}

async function makeGuest(userId) {
    await userAction('make-guest', userId);
    closeUserActionsModal();
}

async function allowAlways(userId) {
    await userAction('allow-always', userId);
    closeUserActionsModal();
}

async function limitPermissions(userId) {
    showStatus('Yetki sınırlama özelliği yakında eklenecek', 'info');
    closeUserActionsModal();
}

// Global fonksiyonlar
window.acceptUser = acceptUser;
window.rejectUser = rejectUser;
window.banUser = banUser;
window.removeFromQueue = removeFromQueue;
window.makeAdmin = makeAdmin;
window.makeGuest = makeGuest;
window.allowAlways = allowAlways;
window.openUserActionsModal = openUserActionsModal;
window.limitPermissions = limitPermissions;

// Yayınlarım listesini güncelle
async function updateMyStreams() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/rooms/my-rooms', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const rooms = await response.json();
            const myStreamsSection = document.getElementById('my-streams-section');
            const myStreamsList = document.getElementById('my-streams-list');
            
            if (rooms.length > 0) {
                myStreamsSection.classList.remove('hidden');
                myStreamsList.innerHTML = '';
                
                rooms.forEach(room => {
                    const streamItem = document.createElement('div');
                    streamItem.className = 'stream-item';
                    streamItem.onclick = () => {
                        currentRoom = room.id;
                        // Odaya katıl
                        socket.emit('join-room', { roomId: room.id, userId: currentUser.id });
                        userRole = 'owner';
                        updateUserRoleBadge('owner');
                        
                        // Butonları gizle
                        const joinRoomCard = document.getElementById('join-room-card');
                        const createRoomCard = document.getElementById('create-room-card');
                        if (joinRoomCard) {
                            joinRoomCard.classList.add('hidden');
                        }
                        if (createRoomCard) {
                            createRoomCard.classList.add('hidden');
                        }
                        
                        // Sidebar'daki nav item'ları gizle
                        const navCreateRoom = document.getElementById('nav-create-room');
                        const navJoinRoom = document.getElementById('nav-join-room');
                        if (navCreateRoom) {
                            navCreateRoom.classList.add('hidden');
                        }
                        if (navJoinRoom) {
                            navJoinRoom.classList.add('hidden');
                        }
                        
                        switchView('room');
                        loadRoomData();
                    };
                    streamItem.innerHTML = `
                        <div class="stream-item-name">${room.name || 'Yayın'}</div>
                        <div class="stream-item-code">Kod: ${room.code}</div>
                    `;
                    myStreamsList.appendChild(streamItem);
                });
            } else {
                myStreamsSection.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Yayınlarım listesi hatası:', error);
    }
}

// Sayfa yüklendiğinde yayınlarım listesini yükle
document.addEventListener('DOMContentLoaded', () => {
    // checkAuth içinde çağrılacak
});

// Modal dışına tıklandığında kapat
document.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settings-modal');
    const userActionsModal = document.getElementById('user-actions-modal');
    
    if (e.target === settingsModal) {
        closeSettingsModal();
    }
    if (e.target === userActionsModal) {
        closeUserActionsModal();
    }
});

