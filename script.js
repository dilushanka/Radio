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
    const btnShare = document.querySelector('.btn-share');
    const progressBar = document.querySelector('.progress-bar');
    const progressTime = document.querySelector('.progress-time');
    const notification = document.querySelector('.notification');
    const btnTheme = document.querySelector('.btn-theme');
    const nowPlayingPreview = document.querySelector('.now-playing-preview .station-info');
    const playerStationInfo = document.querySelector('.player-progress .station-info');

    // Audio element with CORS enabled
    const audio = document.getElementById('wave-audio');
    audio.crossOrigin = 'anonymous';

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
    url: "https://radio.lotustechnologieslk.net:2020/stream/shaafmgarden",
    logo: "https://www.shaafm.lk/images/listenlivelogo.jpg",
    favorite: false
  },
  {
    id: 2,
    name: "Hiru FM",
    genre: "Pop",
    country: "Sri Lanka",
    url: "https://radio.lotustechnologieslk.net:2020/stream/hirufmgarden",
    logo: "https://www.hirufm.lk/images/logo.png",
    favorite: false
  },
  {
    id: 3,
    name: "Sooriyan FM",
    genre: "Tamil",
    country: "Sri Lanka",
    url: "https://stream.zeno.fm/27sa0ppcztzuv",
    logo: "https://www.sooriyanfm.lk/assets/images/logo.png",
    favorite: false
  },
  {
    id: 4,
    name: "Sun FM",
    genre: "English",
    country: "Sri Lanka",
    url: "http://209.133.216.3:7125/;stream.mp3",
    logo: "https://www.sunfm.lk/images/logo.png",
    favorite: false
  },
  {
    id: 5,
    name: "Gold FM",
    genre: "Oldies",
    country: "Sri Lanka",
    url: "http://66.29.204.30:8000/goldfm.aac",
    logo: "https://www.goldfm.lk/images/logo.png",
    favorite: false
  },
  {
    id: 6,
    name: "Ran FM",
    genre: "Mixed",
    country: "Sri Lanka",
    url: "http://66.29.204.30:8000/ranfm.aac",
    logo: "https://www.ranfm.lk/images/logo.png",
    favorite: false
  },
  {
    id: 7,
    name: "Lakhanda Radio",
    genre: "News/Talk",
    country: "Sri Lanka",
    url: "http://66.29.204.30:8000/lakhanda.aac",
    logo: "https://lakhandaradio.lk/images/logo.png",
    favorite: false
  },
  {
    id: 8,
    name: "Y FM",
    genre: "Bollywood",
    country: "Sri Lanka",
    url: "data-playtrack="http://mbc.thestreamtech.com:7032/index.html",
    logo: "https://onlineradiofm.in/images/shakthi-fm.png",
    favorite: false
  }
];


    function init() {
        renderStations();
        loadFavorites();
        setupEventListeners();
        checkTheme();
    }

    function renderStations() {
        stationsGrid.innerHTML = '';
        stationsList.innerHTML = '';
        stations.forEach((station, index) => {
            const stationCard = document.createElement('div');
            stationCard.className = 'station-card';
            stationCard.innerHTML = `
                <div class="station-card-image-container" style="position: relative;">
                    <img src="${station.logo}" alt="${station.name}" class="station-card-image">
                    <button class="station-card-play" data-index="${index}"><i class="fas fa-play"></i></button>
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

            const stationListItem = document.createElement('div');
            stationListItem.className = 'station-list-item';
            stationListItem.innerHTML = `
                <img src="${station.logo}" alt="${station.name}" class="station-list-logo">
                <div class="station-list-details">
                    <h3 class="station-list-name">${station.name}</h3>
                    <p class="station-list-genre">${station.genre} • ${station.country}</p>
                </div>
                <button class="station-list-play" data-index="${index}"><i class="fas fa-play"></i></button>
                <i class="fas fa-heart ${station.favorite ? 'active' : ''}" data-id="${station.id}"></i>
            `;
            stationsList.appendChild(stationListItem);
        });
    }

    function loadFavorites() {
        stations.forEach(s => s.favorite = favorites.includes(s.id));
    }

    function setupEventListeners() {
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
        document.addEventListener('click', function(e) {
            if (e.target.closest('.station-card-play') || e.target.closest('.station-list-play')) {
                const btn = e.target.closest('[data-index]');
                playStation(parseInt(btn.dataset.index, 10));
            }
            if (e.target.classList.contains('fa-heart')) {
                toggleFavorite(parseInt(e.target.dataset.id, 10));
                e.target.classList.toggle('active');
            }
        });

        btnPlay.addEventListener('click', togglePlay);
        btnPrev.addEventListener('click', playPrevious);
        btnNext.addEventListener('click', playNext);
        btnFavorite.addEventListener('click', toggleCurrentFavorite);
        btnShare.addEventListener('click', () => {
            const station = stations[currentStationIndex];
            if (station) navigator.share(
                { title: station.name, text: `Listening to ${station.name}`, url: station.url }
            ).catch(() => showNotification('Sharing not supported', true));
        });

        volumeSlider.addEventListener('input', () => {
            audio.volume = volumeSlider.value / 100;
            btnVolume.innerHTML = audio.volume === 0 ? '<i class="fas fa-volume-mute"></i>' : audio.volume < 0.5 ? '<i class="fas fa-volume-down"></i>' : '<i class="fas fa-volume-up"></i>';
        });
        btnVolume.addEventListener('click', () => {
            if (audio.volume > 0) { audio.volume = 0; volumeSlider.value = 0; btnVolume.innerHTML = '<i class="fas fa-volume-mute"></i>'; }
            else { audio.volume = 0.8; volumeSlider.value = 80; btnVolume.innerHTML = '<i class="fas fa-volume-up"></i>'; }
        });

        progressBar.addEventListener('click', e => {
            if (audio.duration) audio.currentTime = (e.offsetX / progressBar.offsetWidth) * audio.duration;
        });

        btnTheme.addEventListener('click', toggleTheme);
        audio.addEventListener('play', updatePlayButton);
        audio.addEventListener('pause', updatePlayButton);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', playNext);
        audio.addEventListener('error', handleAudioError);
    }

    function playStation(index) {
        if (index < 0 || index >= stations.length) return;
        currentStationIndex = index;
        const station = stations[index];
        updateStationInfo(station);

        audio.src = station.url;
        audio.load();
        audio.play().then(() => {
            isPlaying = true;
            setupAudioVisualizer();
            showNotification(`Now playing: ${station.name}`);
        }).catch(err => {
            console.error('Playback failed:', err);
            showNotification('Error: Could not play station', true);
        });
    }

    function updateStationInfo(station) {
        playerStationInfo.querySelector('.station-logo').src = station.logo;
        playerStationInfo.querySelector('.station-name').textContent = station.name;
        playerStationInfo.querySelector('.station-genre').textContent = `${station.genre} • ${station.country}`;
        nowPlayingPreview.querySelector('.station-logo').src = station.logo;
        nowPlayingPreview.querySelector('.station-name').textContent = station.name;
        nowPlayingPreview.querySelector('.station-genre').textContent = station.genre;
        btnFavorite.innerHTML = station.favorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    }

    function togglePlay() {
        if (audio.paused) audio.src ? audio.play() : playStation(0);
        else audio.pause();
    }

    function updatePlayButton() {
        btnPlay.innerHTML = audio.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }

    function playPrevious() { playStation((currentStationIndex - 1 + stations.length) % stations.length); }
    function playNext() { playStation((currentStationIndex + 1) % stations.length); }

    function updateProgress() {
        if (audio.duration) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressBar.style.setProperty('--progress', `${pct}%`);
            progressTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        } else {
            progressBar.style.setProperty('--progress', '0%');
            progressTime.textContent = 'LIVE';
        }
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function toggleFavorite(id) {
        const i = stations.findIndex(s => s.id === id);
        if (i === -1) return;
        stations[i].favorite = !stations[i].favorite;
        favorites = stations[i].favorite ? [...favorites, id] : favorites.filter(f => f !== id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        if (currentStationIndex === i) btnFavorite.innerHTML = stations[i].favorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    }

    function toggleCurrentFavorite() { toggleFavorite(stations[currentStationIndex].id); }

    function showNotification(msg, isError = false) {
        notification.textContent = msg;
        notification.style.backgroundColor = isError ? 'var(--warning-color)' : 'var(--primary-color)';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function handleAudioError() {
        showNotification('Error: Could not play station', true);
        isPlaying = false;
        updatePlayButton();
    }

    function setupAudioVisualizer() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;
        }
    }

    function toggleTheme() {
        body.classList.toggle('dark-theme');
        const dark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        btnTheme.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function checkTheme() {
        if ((localStorage.getItem('theme') || 'light') === 'dark') {
            body.classList.add('dark-theme');
            btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    init();
});
