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

    // Audio Management
    let audio = new Audio();
    audio.crossOrigin = 'anonymous';
    let audioContext, analyser, source;
    let isPlaying = false;
    let currentStationIndex = 0;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let isLoading = false;

    // Radio Stations Data
    const stations = [
        {
            id: 1,
            name: "Shaa FM",
            genre: "Youth",
            country: "Sri Lanka",
            url: "https://radio.lotustechnologieslk.net:2020/stream/shaafmgarden",
            logo: "./img/radio/shaa.png",
            favorite: false
        },
        // ... other stations ...
    ];

    // Initialization
    function init() {
        renderStations();
        loadFavorites();
        setupEventListeners();
        checkTheme();
        setupAudioContext();
    }

    function setupAudioContext() {
        document.body.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    async function playStation(index) {
        if (isLoading || index < 0 || index >= stations.length) return;
        
        try {
            isLoading = true;
            showNotification('Loading station...');
            
            const station = stations[index];
            currentStationIndex = index;
            updateStationInfo(station);

            // Clean up previous audio
            if (!audio.paused) await audio.pause();
            audio.src = '';
            audio.removeAttribute('src');

            // Create new audio element
            const newAudio = new Audio();
            newAudio.crossOrigin = 'anonymous';
            newAudio.volume = volumeSlider.value / 100;
            newAudio.src = station.url;

            // Wait for metadata
            await new Promise((resolve, reject) => {
                const handleCanPlay = () => {
                    newAudio.removeEventListener('canplaythrough', handleCanPlay);
                    resolve();
                };
                
                newAudio.addEventListener('canplaythrough', handleCanPlay, { once: true });
                newAudio.addEventListener('error', reject, { once: true });
            });

            // Replace audio element
            audio.replaceWith(newAudio);
            audio = newAudio;
            setupAudioListeners();

            // Start playback
            await audio.play();
            
            isPlaying = true;
            setupAudioVisualizer();
            showNotification(`Now playing: ${station.name}`);
        } catch (err) {
            console.error('Playback failed:', err);
            handlePlaybackError(err);
        } finally {
            isLoading = false;
        }
    }

    function setupAudioListeners() {
        const events = ['play', 'pause', 'timeupdate', 'ended', 'error'];
        events.forEach(event => audio.addEventListener(event, handleAudioEvent));
    }

    function handleAudioEvent(event) {
        switch(event.type) {
            case 'play':
                updatePlayButton();
                break;
            case 'pause':
                updatePlayButton();
                break;
            case 'timeupdate':
                updateProgress();
                break;
            case 'ended':
                playNext();
                break;
            case 'error':
                handleAudioError(event);
                break;
        }
    }

    async function togglePlay() {
        try {
            if (audio.paused) {
                if (!audio.src) await playStation(0);
                await audio.play();
            } else {
                await audio.pause();
            }
        } catch (err) {
            handlePlaybackError(err);
        }
    }

    function handlePlaybackError(err) {
        showNotification(`Error: ${err.message || 'Failed to play station'}`, true);
        isPlaying = false;
        updatePlayButton();
        
        if (err.name === 'NotAllowedError') {
            showNotification('Click anywhere to start playback');
            document.body.addEventListener('click', () => playStation(currentStationIndex), { once: true });
        }
    }

    // UI Functions
    function renderStations() {
        stationsGrid.innerHTML = stations.map((station, index) => `
            <div class="station-card">
                <div class="station-card-image-container">
                    <img src="${station.logo}" alt="${station.name}" class="station-card-image">
                    <button class="station-card-play" data-index="${index}">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="station-card-body">
                    <h3 class="station-card-title">${station.name}</h3>
                    <div class="station-card-meta">
                        <span>${station.genre}</span>
                        <i class="fas fa-heart ${station.favorite ? 'active' : ''}" data-id="${station.id}"></i>
                    </div>
                </div>
            </div>
        `).join('');

        stationsList.innerHTML = stations.map((station, index) => `
            <div class="station-list-item">
                <img src="${station.logo}" alt="${station.name}" class="station-list-logo">
                <div class="station-list-details">
                    <h3 class="station-list-name">${station.name}</h3>
                    <p class="station-list-genre">${station.genre} • ${station.country}</p>
                </div>
                <button class="station-list-play" data-index="${index}">
                    <i class="fas fa-play"></i>
                </button>
                <i class="fas fa-heart ${station.favorite ? 'active' : ''}" data-id="${station.id}"></i>
            </div>
        `).join('');
    }

    function updateStationInfo(station) {
        const updateElements = (parent) => {
            parent.querySelector('.station-logo').src = station.logo;
            parent.querySelector('.station-name').textContent = station.name;
            parent.querySelector('.station-genre').textContent = `${station.genre} • ${station.country}`;
        };
        
        updateElements(playerStationInfo);
        updateElements(nowPlayingPreview);
        btnFavorite.innerHTML = station.favorite 
            ? '<i class="fas fa-heart"></i>' 
            : '<i class="far fa-heart"></i>';
    }

    function updatePlayButton() {
        btnPlay.innerHTML = audio.paused 
            ? '<i class="fas fa-play"></i>' 
            : '<i class="fas fa-pause"></i>';
    }

    function updateProgress() {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.setProperty('--progress', `${percent}%`);
            progressTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        } else {
            progressBar.style.setProperty('--progress', '0%');
            progressTime.textContent = 'LIVE';
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    // Event Handlers
    function setupEventListeners() {
        viewGridBtn.addEventListener('click', () => toggleView('grid'));
        viewListBtn.addEventListener('click', () => toggleView('list'));
        
        document.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.station-card-play, .station-list-play');
            if (playBtn) {
                const index = parseInt(playBtn.dataset.index, 10);
                playStation(index);
            }

            const favBtn = e.target.closest('.fa-heart');
            if (favBtn) {
                const stationId = parseInt(favBtn.dataset.id, 10);
                toggleFavorite(stationId);
                favBtn.classList.toggle('active');
            }
        });

        btnPlay.addEventListener('click', togglePlay);
        btnPrev.addEventListener('click', () => playStation((currentStationIndex - 1 + stations.length) % stations.length));
        btnNext.addEventListener('click', () => playStation((currentStationIndex + 1) % stations.length));
        btnFavorite.addEventListener('click', () => toggleFavorite(stations[currentStationIndex].id));

        volumeSlider.addEventListener('input', () => {
            audio.volume = volumeSlider.value / 100;
            btnVolume.innerHTML = getVolumeIcon(audio.volume);
        });

        btnVolume.addEventListener('click', toggleMute);
        progressBar.addEventListener('click', handleProgressClick);
        btnTheme.addEventListener('click', toggleTheme);
    }

    // Helper Functions
    function toggleView(view) {
        stationsGrid.style.display = view === 'grid' ? 'grid' : 'none';
        stationsList.style.display = view === 'list' ? 'flex' : 'none';
        viewGridBtn.classList.toggle('active', view === 'grid');
        viewListBtn.classList.toggle('active', view === 'list');
    }

    function getVolumeIcon(volume) {
        if (volume === 0) return '<i class="fas fa-volume-mute"></i>';
        return volume < 0.5 
            ? '<i class="fas fa-volume-down"></i>' 
            : '<i class="fas fa-volume-up"></i>';
    }

    function toggleMute() {
        audio.muted = !audio.muted;
        volumeSlider.value = audio.muted ? 0 : audio.volume * 100;
        btnVolume.innerHTML = getVolumeIcon(audio.muted ? 0 : audio.volume);
    }

    function handleProgressClick(e) {
        if (audio.duration) {
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        }
    }

    function toggleFavorite(stationId) {
        const index = stations.findIndex(s => s.id === stationId);
        if (index === -1) return;

        stations[index].favorite = !stations[index].favorite;
        favorites = stations[index].favorite
            ? [...favorites, stationId]
            : favorites.filter(id => id !== stationId);

        localStorage.setItem('favorites', JSON.stringify(favorites));
        if (index === currentStationIndex) {
            btnFavorite.classList.toggle('active', stations[index].favorite);
        }
    }

    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.backgroundColor = isError ? 'var(--warning-color)' : 'var(--primary-color)';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function toggleTheme() {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        btnTheme.innerHTML = isDark 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }

    function checkTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    function setupAudioVisualizer() {
        if (!audioContext) return;

        try {
            if (source) source.disconnect();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;
        } catch (err) {
            console.warn('Audio visualization error:', err);
        }
    }

    // Initialize the application
    init();
});
