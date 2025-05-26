document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const body = document.body;
    const stationsGrid = document.querySelector('.stations-grid');
    const stationsList = document.querySelector('.stations-list');
    const viewGridBtn = document.querySelector('.view-grid');
    const viewListBtn = document.querySelector('.view-list');
    const btnPlay = document.querySelector('.btn-play');
    const btnPrev = document.querySelector('.btn-prev');
    const btnNext = document.querySelector('.btn-next');
    const btnVolume = document.querySelector('.btn-volume');
    const volumeSlider = document.querySelector('.volume-slider');
    const btnFavorite = document.querySelector('.btn-favorite');
    const progressBar = document.querySelector('.progress-bar');
    const progressTime = document.querySelector('.progress-time');
    const notification = document.querySelector('.notification');
    const btnTheme = document.querySelector('.btn-theme');
    const nowPlayingPreview = document.querySelector('.now-playing-preview .station-info');
    const playerStationInfo = document.querySelector('.player-progress .station-info');
    
    // Audio context
    const audio = new Audio();
    let audioContext;
    let analyser;
    let source;
    let isPlaying = false;
    let currentStationIndex = 0;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // Sample radio stations data
    const stations = [
        {
            id: 1,
            name: "Shaa FM",
            genre: "Youth",
            country: "Sri Lanka",
            url: "http://209.133.216.3:7073/;stream.mp3",
            logo: "https://cdn-radiotime-logos.tunein.com/s24928q.png",
            favorite: false
        },
        {
            id: 2,
            name: "BBC Radio 1",
            genre: "Pop",
            country: "UK",
            url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
            logo: "https://cdn-radiotime-logos.tunein.com/s24928q.png",
            favorite: false
        },
        {
            id: 3,
            name: "Jazz24",
            genre: "Jazz",
            country: "USA",
            url: "https://jazz24.streamguys1.com/jazz24",
            logo: "https://cdn-radiotime-logos.tunein.com/s10755q.png",
            favorite: false
        },
        {
            id: 4,
            name: "Classic FM",
            genre: "Classical",
            country: "UK",
            url: "https://media-ssl.musicradio.com/ClassicFM",
            logo: "https://cdn-radiotime-logos.tunein.com/s24930q.png",
            favorite: false
        },
        {
            id: 5,
            name: "Radio Nova",
            genre: "Rock",
            country: "France",
            url: "https://novazz.ice.infomaniak.ch/novazz-128.mp3",
            logo: "https://cdn-radiotime-logos.tunein.com/s10714q.png",
            favorite: false
        },
        {
            id: 6,
            name: "SomaFM Groove Salad",
            genre: "Ambient",
            country: "USA",
            url: "https://ice1.somafm.com/groovesalad-128.mp3",
            logo: "https://somafm.com/img3/groovesalad-400.jpg",
            favorite: false
        },
        {
            id: 7,
            name: "Radio Caprice Jazz",
            genre: "Jazz",
            country: "Russia",
            url: "https://79.120.39.202:8000/jazz",
            logo: "https://cdn-radiotime-logos.tunein.com/s27224d.png",
            favorite: false
        },
        {
            id: 8,
            name: "FIP Radio",
            genre: "Eclectic",
            country: "France",
            url: "https://icecast.radiofrance.fr/fip-midfi.mp3",
            logo: "https://cdn-radiotime-logos.tunein.com/s10713q.png",
            favorite: false
        },
        {
    id: 9,
    name: "Shaa FM",
    genre: "Sinhala",
    country: "Sri Lanka",
    // Try these URLs one by one:
    url: "https://radio.lotustechnologieslk.net:2020/stream/shaafmgarden", // Primary
    // url: "http://209.133.216.3:7073/;stream.mp3", // Backup HTTP
    // url: "https://cp2.shaafm.lk:7073/;stream.mp3", // New HTTPS alternative
    // url: "https://eu10b.serverse.com:1936/shaafm/shaafm/playlist.m3u8", // HLS
    logo: "https://www.shaafm.lk/images/listenlivelogo.jpg",
    favorite: false
},
    // Alternative stream URL (from their backup player)
    {
        id: 10,
        name: "Shaa FM (Backup Stream)",
        genre: "Sinhala",
        country: "Sri Lanka",
        url: "http://209.133.216.3:7073/;stream.mp3",
        logo: "https://www.shaafm.lk/images/listenlivelogo.jpg",
        favorite: false
    }
        
    ];
    
    // Initialize the app
    function init() {
        renderStations();
        loadFavorites();
        setupEventListeners();
        checkTheme();
    }
    
    // Render stations in grid and list views
    function renderStations() {
        stationsGrid.innerHTML = '';
        stationsList.innerHTML = '';
        
        stations.forEach((station, index) => {
            // Grid view item
            const stationCard = document.createElement('div');
            stationCard.className = 'station-card';
            stationCard.innerHTML = `
                <div class="station-card-image-container" style="position: relative;">
                    <img src="${station.logo}" alt="${station.name}" class="station-card-image">
                    <button class="station-card-play" data-index="${index}">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="station-card-body">
                    <h3 class="station-card-title">${station.name}</h3>
                    <div class="station-card-meta">
                        <span>${station.genre}</span>
                        <span><i class="fas fa-heart ${station.favorite ? 'active' : ''}" data-id="${station.id}"></i></span>
                    </div>
                </div>
            `;
            stationsGrid.appendChild(stationCard);
            
            // List view item
            const stationListItem = document.createElement('div');
            stationListItem.className = 'station-list-item';
            stationListItem.innerHTML = `
                <img src="${station.logo}" alt="${station.name}" class="station-list-logo">
                <div class="station-list-details">
                    <h3 class="station-list-name">${station.name}</h3>
                    <p class="station-list-genre">${station.genre} • ${station.country}</p>
                </div>
                <button class="station-list-play" data-index="${index}">
                    <i class="fas fa-play"></i>
                </button>
                <i class="fas fa-heart ${station.favorite ? 'active' : ''}" data-id="${station.id}"></i>
            `;
            stationsList.appendChild(stationListItem);
        });
    }
    
    // Load favorites from localStorage
    function loadFavorites() {
        stations.forEach(station => {
            station.favorite = favorites.includes(station.id);
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // View toggle buttons
        viewGridBtn.addEventListener('click', () => {
            viewGridBtn.classList.add('active');
            viewListBtn.classList.remove('active');
            stationsGrid.style.display = 'grid';
            stationsList.style.display = 'none';
        });
        
        viewListBtn.addEventListener('click', () => {
            viewListBtn.classList.add('active');
            viewGridBtn.classList.remove('active');
            stationsGrid.style.display = 'none';
            stationsList.style.display = 'flex';
        });
        
        // Play station when card is clicked
        document.addEventListener('click', function(e) {
            // Play buttons
            if (e.target.closest('.station-card-play') || e.target.closest('.station-list-play')) {
                const button = e.target.closest('.station-card-play') || e.target.closest('.station-list-play');
                const index = parseInt(button.getAttribute('data-index'));
                playStation(index);
            }
            
            // Favorite buttons
            if (e.target.classList.contains('fa-heart')) {
                const stationId = parseInt(e.target.getAttribute('data-id'));
                toggleFavorite(stationId);
                e.target.classList.toggle('active');
            }
        });
        
        // Player controls
        btnPlay.addEventListener('click', togglePlay);
        btnPrev.addEventListener('click', playPrevious);
        btnNext.addEventListener('click', playNext);
        btnFavorite.addEventListener('click', toggleCurrentFavorite);
        
        // Volume control
        volumeSlider.addEventListener('input', function() {
            audio.volume = this.value / 100;
            if (audio.volume === 0) {
                btnVolume.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (audio.volume < 0.5) {
                btnVolume.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                btnVolume.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });
        
        // Mute button
        btnVolume.addEventListener('click', function() {
            if (audio.volume > 0) {
                audio.volume = 0;
                volumeSlider.value = 0;
                this.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                audio.volume = 0.8;
                volumeSlider.value = 80;
                this.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });
        
        // Progress bar click
        progressBar.addEventListener('click', function(e) {
            const percent = e.offsetX / this.offsetWidth;
            if (audio.duration) {
                audio.currentTime = percent * audio.duration;
            }
        });
        
        // Theme toggle
        btnTheme.addEventListener('click', toggleTheme);
        
        // Audio events
        audio.addEventListener('play', updatePlayButton);
        audio.addEventListener('pause', updatePlayButton);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', playNext);
        audio.addEventListener('error', handleAudioError);
    }
    
    // Play a station by index
    function playStation(index) {
        if (index < 0 || index >= stations.length) return;
        
        currentStationIndex = index;
        const station = stations[index];
        
        // Update UI
        updateStationInfo(station);
        
        // Play the stream
        audio.src = station.url;
        audio.load();
        audio.play().then(() => {
            isPlaying = true;
            setupAudioVisualizer();
            showNotification(`Now playing: ${station.name}`);
        }).catch(error => {
            console.error('Playback failed:', error);
            showNotification('Error: Could not play station', true);
        });
    }
    
    // Update station info in player and preview
    function updateStationInfo(station) {
        // Player bar
        playerStationInfo.querySelector('.station-logo').src = station.logo;
        playerStationInfo.querySelector('.station-name').textContent = station.name;
        playerStationInfo.querySelector('.station-genre').textContent = `${station.genre} • ${station.country}`;
        
        // Now playing preview
        nowPlayingPreview.querySelector('.station-logo').src = station.logo;
        nowPlayingPreview.querySelector('.station-name').textContent = station.name;
        nowPlayingPreview.querySelector('.station-genre').textContent = station.genre;
        
        // Update favorite button
        btnFavorite.innerHTML = station.favorite ? 
            '<i class="fas fa-heart"></i>' : 
            '<i class="far fa-heart"></i>';
    }
    
    // Toggle play/pause
    function togglePlay() {
        if (audio.paused) {
            if (audio.src) {
                audio.play();
            } else {
                playStation(0);
            }
        } else {
            audio.pause();
        }
    }
    
    // Update play button icon
    function updatePlayButton() {
        btnPlay.innerHTML = audio.paused ? 
            '<i class="fas fa-play"></i>' : 
            '<i class="fas fa-pause"></i>';
    }
    
    // Play previous station
    function playPrevious() {
        let prevIndex = currentStationIndex - 1;
        if (prevIndex < 0) prevIndex = stations.length - 1;
        playStation(prevIndex);
    }
    
    // Play next station
    function playNext() {
        let nextIndex = currentStationIndex + 1;
        if (nextIndex >= stations.length) nextIndex = 0;
        playStation(nextIndex);
    }
    
    // Update progress bar
    function updateProgress() {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.setProperty('--progress', `${percent}%`);
            
            const currentTime = formatTime(audio.currentTime);
            const duration = formatTime(audio.duration);
            progressTime.textContent = `${currentTime} / ${duration}`;
        } else {
            // For live streams where duration isn't available
            progressBar.style.setProperty('--progress', '0%');
            progressTime.textContent = 'LIVE';
        }
    }
    
    // Format time (seconds to MM:SS)
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Toggle favorite status for a station
    function toggleFavorite(stationId) {
        const stationIndex = stations.findIndex(s => s.id === stationId);
        if (stationIndex === -1) return;
        
        stations[stationIndex].favorite = !stations[stationIndex].favorite;
        
        if (stations[stationIndex].favorite) {
            if (!favorites.includes(stationId)) {
                favorites.push(stationId);
            }
        } else {
            favorites = favorites.filter(id => id !== stationId);
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // If current station is the one being toggled, update the favorite button
        if (currentStationIndex === stationIndex) {
            btnFavorite.innerHTML = stations[stationIndex].favorite ? 
                '<i class="fas fa-heart"></i>' : 
                '<i class="far fa-heart"></i>';
        }
    }
    
    // Toggle favorite for currently playing station
    function toggleCurrentFavorite() {
        if (stations.length === 0) return;
        const currentStation = stations[currentStationIndex];
        toggleFavorite(currentStation.id);
        this.innerHTML = currentStation.favorite ? 
            '<i class="fas fa-heart"></i>' : 
            '<i class="far fa-heart"></i>';
    }
    
    // Show notification
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.backgroundColor = isError ? 'var(--warning-color)' : 'var(--primary-color)';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Handle audio errors
    function handleAudioError() {
        showNotification('Error: Could not play station', true);
        isPlaying = false;
        updatePlayButton();
    }
    
    // Setup audio visualizer (for future enhancements)
    function setupAudioVisualizer() {
        // Create audio context if not already created
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // For visualization (could be implemented later)
            analyser.fftSize = 256;
        }
    }
    
    // Toggle dark/light theme
    function toggleTheme() {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        btnTheme.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    
    // Check saved theme preference
    function checkTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // Initialize the app
    init();
});