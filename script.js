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
    let audio = document.getElementById('wave-audio');
    audio.crossOrigin = 'anonymous';

    // Audio context & analyzer
    let audioContext, analyser, sourceNode;

    // State vars
    let isPlaying = false;
    let isLoading = false;
    let currentStationIndex = 0;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Sample radio stations data
    const stations = [
      { id:1, name:"Shaa FM", genre:"Youth", country:"Sri Lanka", url:"https://radio.lotustechnologieslk.net:2020/stream/shaafmgarden", logo:"./img/radio/shaa.png" },
      { id:2, name:"Hiru FM", genre:"Pop", country:"Sri Lanka", url:"https://radio.lotustechnologieslk.net:2020/stream/hirufmgarden", logo:"./img/radio/hiru.png" },
      { id:3, name:"Sooriyan FM", genre:"Tamil", country:"Sri Lanka", url:"https://stream.zeno.fm/27sa0ppcztzuv", logo:"./img/radio/radio-place.webp" },
      { id:4, name:"Sun FM", genre:"English", country:"Sri Lanka", url:"http://209.133.216.3:7125/;stream.mp3", logo:"./img/radio/radio-place.webp" },
      { id:5, name:"Gold FM", genre:"Oldies", country:"Sri Lanka", url:"http://66.29.204.30:8000/goldfm.aac", logo:"./img/radio/radio-place.webp" },
      { id:6, name:"Ran FM", genre:"Mixed", country:"Sri Lanka", url:"http://66.29.204.30:8000/ranfm.aac", logo:"./img/radio/radio-place.webp" },
      { id:7, name:"Lakhanda Radio", genre:"News/Talk", country:"Sri Lanka", url:"http://66.29.204.30:8000/lakhanda.aac", logo:"./img/radio/radio-place.webp" },
      { id:8, name:"Shakthi FM", genre:"Bollywood", country:"Sri Lanka", url:"http://66.29.204.30:8000/shakthi.aac", logo:"./img/radio/radio-place.webp" },
      { id:9, name:"Y FM", genre:"News/Talk", country:"Sri Lanka", url:"https://mbc.thestreamtech.com:7032/index.html", logo:"./img/radio/y.png" }
    ];

    /*** Initialization ***/
    function init() {
        renderStations();
        loadFavorites();
        setupEventListeners();
        checkTheme();
    }

    /*** Render station cards & list ***/
    function renderStations() {
        stationsGrid.innerHTML = '';
        stationsList.innerHTML = '';
        stations.forEach((station, idx) => {
            const activeHeart = station.favorite ? 'active' : '';
            // Grid card
            const card = document.createElement('div');
            card.className = 'station-card';
            card.innerHTML = `
                <div class="station-card-image-container">
                    <img src="${station.logo}" alt="${station.name}" class="station-card-image">
                    <button class="station-card-play" data-index="${idx}"><i class="fas fa-play"></i></button>
                </div>
                <div class="station-card-body">
                    <h3>${station.name}</h3>
                    <div class="station-card-meta">
                      <span>${station.genre}</span>
                      <span><i class="fas fa-heart ${activeHeart}" data-id="${station.id}"></i></span>
                    </div>
                </div>`;
            stationsGrid.appendChild(card);

            // List item
            const item = document.createElement('div');
            item.className = 'station-list-item';
            item.innerHTML = `
                <img src="${station.logo}" alt="${station.name}" class="station-list-logo">
                <div class="station-list-details">
                  <h3>${station.name}</h3>
                  <p>${station.genre} • ${station.country}</p>
                </div>
                <button class="station-list-play" data-index="${idx}"><i class="fas fa-play"></i></button>
                <i class="fas fa-heart ${activeHeart}" data-id="${station.id}"></i>`;
            stationsList.appendChild(item);
        });
    }

    /*** Favorites from localStorage ***/
    function loadFavorites() {
        stations.forEach(s => s.favorite = favorites.includes(s.id));
    }

    /*** Event listeners ***/
    function setupEventListeners() {
        // View-toggle
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

        // Station play buttons & hearts
        document.addEventListener('click', e => {
            if (e.target.closest('.station-card-play, .station-list-play')) {
                const idx = parseInt(e.target.closest('[data-index]').dataset.index, 10);
                playStation(idx);
            }
            if (e.target.classList.contains('fa-heart')) {
                const id = parseInt(e.target.dataset.id, 10);
                toggleFavorite(id);
                e.target.classList.toggle('active');
            }
        });

        // Player controls
        btnPlay.addEventListener('click', togglePlay);
        btnPrev.addEventListener('click', () => playStation((currentStationIndex - 1 + stations.length) % stations.length));
        btnNext.addEventListener('click', () => playStation((currentStationIndex + 1) % stations.length));
        btnFavorite.addEventListener('click', () => toggleFavorite(stations[currentStationIndex].id));
        btnShare.addEventListener('click', () => {
            const st = stations[currentStationIndex];
            if (navigator.share) {
                navigator.share({ title: st.name, text: `Listening to ${st.name}`, url: st.url })
                    .catch(() => showNotification('Sharing not supported', true));
            } else {
                showNotification('Sharing not supported', true);
            }
        });

        // Volume
        volumeSlider.addEventListener('input', () => {
            audio.volume = volumeSlider.value / 100;
            updateVolumeIcon();
        });
        btnVolume.addEventListener('click', () => {
            if (audio.volume > 0) {
                audio.volume = 0; volumeSlider.value = 0;
            } else {
                audio.volume = 0.8; volumeSlider.value = 80;
            }
            updateVolumeIcon();
        });

        // Progress bar seeking
        progressBar.addEventListener('click', e => {
            if (audio.duration) {
                audio.currentTime = (e.offsetX / progressBar.offsetWidth) * audio.duration;
            }
        });

        // Theme toggle
        btnTheme.addEventListener('click', toggleTheme);

        // Audio events
        audio.addEventListener('play', updatePlayButton);
        audio.addEventListener('pause', updatePlayButton);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', () => playStation((currentStationIndex + 1) % stations.length));
        audio.addEventListener('error', handleAudioError);

        // Init AudioContext on first interaction
        document.body.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                sourceNode = audioContext.createMediaElementSource(audio);
                sourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
                analyser.fftSize = 256;
            }
        }, { once: true });

        // Network events
        window.addEventListener('online',  () => {
            showNotification('Back online');
            if (isPlaying && !audio.src) playStation(currentStationIndex);
        });
        window.addEventListener('offline', () => {
            showNotification('Connection lost', true);
        });
    }

    /*** Play a station (async with cleanup & loading state) ***/
    async function playStation(index) {
        if (index < 0 || index >= stations.length || isLoading) return;
        isLoading = true;
        showNotification('Loading station...');
        try {
            currentStationIndex = index;
            const st = stations[index];
            updateStationInfo(st);

            // Clean up old audio
            if (!audio.paused) audio.pause();
            audio.src = ''; audio.removeAttribute('src'); audio.load();

            // New audio instance
            const newAudio = new Audio(st.url);
            newAudio.crossOrigin = 'anonymous';
            newAudio.volume = volumeSlider.value / 100;

            // Swap in DOM
            audio.replaceWith(newAudio);
            audio = newAudio;

            // Reattach events
            ['play','pause','timeupdate','ended','error'].forEach(evt => {
                audio.addEventListener(evt, {
                    play: updatePlayButton,
                    pause: updatePlayButton,
                    timeupdate: updateProgress,
                    ended: () => playStation((currentStationIndex + 1) % stations.length),
                    error: handleAudioError
                }[evt]);
            });

            // Wait until buffer ready
            await new Promise((res, rej) => {
                audio.addEventListener('canplaythrough', res, { once: true });
                audio.addEventListener('error', rej,          { once: true });
            });

            // Start playback
            await audio.play();
            isPlaying = true;
            setupAudioVisualizer();
            showNotification(`Now playing: ${st.name}`);
        } catch (err) {
            console.error('Playback failed:', err);
            showNotification('Error: Could not play station', true);
            isPlaying = false;
            updatePlayButton();
        } finally {
            isLoading = false;
        }
    }

    /*** Toggle play/pause ***/
    async function togglePlay() {
        try {
            if (audio.paused) {
                if (!audio.src) await playStation(0);
                else await audio.play();
            } else {
                audio.pause();
            }
        } catch (err) {
            console.error('Playback toggle failed:', err);
            showNotification('Error: Could not toggle playback', true);
        }
    }

    /*** Update UI helpers ***/
    function updateStationInfo(st) {
        playerStationInfo.querySelector('.station-logo').src  = st.logo;
        playerStationInfo.querySelector('.station-name').textContent  = st.name;
        playerStationInfo.querySelector('.station-genre').textContent = `${st.genre} • ${st.country}`;
        nowPlayingPreview.querySelector('.station-logo').src  = st.logo;
        nowPlayingPreview.querySelector('.station-name').textContent  = st.name;
        nowPlayingPreview.querySelector('.station-genre').textContent = st.genre;
        btnFavorite.innerHTML = st.favorite
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
            const pct = (audio.currentTime / audio.duration) * 100;
            progressBar.style.setProperty('--progress', `${pct}%`);
            progressTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        } else {
            progressBar.style.setProperty('--progress', `0%`);
            progressTime.textContent = 'LIVE';
        }
    }

    function formatTime(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(Math.floor(sec % 60)).padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateVolumeIcon() {
        if (audio.volume === 0) btnVolume.innerHTML = '<i class="fas fa-volume-mute"></i>';
        else if (audio.volume < 0.5) btnVolume.innerHTML = '<i class="fas fa-volume-down"></i>';
        else btnVolume.innerHTML = '<i class="fas fa-volume-up"></i>';
    }

    function toggleFavorite(id) {
        const idx = stations.findIndex(s => s.id === id);
        if (idx === -1) return;
        stations[idx].favorite = !stations[idx].favorite;
        favorites = stations[idx].favorite
            ? [...favorites, id]
            : favorites.filter(f => f !== id);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        if (currentStationIndex === idx) {
            btnFavorite.innerHTML = stations[idx].favorite
                ? '<i class="fas fa-heart"></i>'
                : '<i class="far fa-heart"></i>';
        }
    }

    function showNotification(msg, isError = false) {
        notification.textContent = msg;
        notification.style.backgroundColor = isError
            ? 'var(--warning-color)'
            : 'var(--primary-color)';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function handleAudioError() {
        showNotification('Error: Could not play station', true);
        isPlaying = false;
        updatePlayButton();
    }

    function setupAudioVisualizer() {
        if (audioContext && analyser && sourceNode) {
            sourceNode.disconnect();
            analyser.disconnect();
            sourceNode = audioContext.createMediaElementSource(audio);
            sourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
        }
    }

    function toggleTheme() {
        const dark = body.classList.toggle('dark-theme');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        btnTheme.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    function checkTheme() {
        if ((localStorage.getItem('theme') || 'light') === 'dark') {
            body.classList.add('dark-theme');
            btnTheme.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Kick things off
    init();
});
