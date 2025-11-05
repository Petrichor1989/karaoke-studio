// Global variables
let player;
let songLibrary = JSON.parse(localStorage.getItem('songLibrary')) || [];
let filteredSongs = [];
let currentVideoId = null;
let youtubeApiReady = false;
let pendingVideoId = null;

// YouTube API Key
const YOUTUBE_API_KEY = 'AIzaSyAMeMjRRVLJNpXrrjbHoWHmirkFAjv_NBs';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    renderSongGrid();
});

// Initialize all event listeners
function initializeEventListeners() {
    const addSongBtn = document.getElementById('addSongBtn');
    if (addSongBtn) addSongBtn.addEventListener('click', addSongToLibrary);
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', searchYoutube);
    
    const searchQuery = document.getElementById('searchQuery');
    if (searchQuery) {
        searchQuery.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchYoutube();
        });
    }
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (prevBtn) prevBtn.addEventListener('click', playPrevious);
    if (nextBtn) nextBtn.addEventListener('click', playNext);
    
    const sortBy = document.getElementById('sortBy');
    if (sortBy) sortBy.addEventListener('change', renderSongGrid);
}

function addSongToLibrary() {
    const title = document.getElementById('songTitle').value.trim();
    const artist = document.getElementById('songArtist').value.trim();
    const urlInput = document.getElementById('songUrl').value.trim();
    
    if (!title || !artist || !urlInput) {
        showBanner('Please fill in all fields', 'error');
        return;
    }

    if (!isValidYoutubeUrl(urlInput)) {
        showBanner('Invalid YouTube URL', 'error');
        return;
    }

    const song = {
        id: Date.now(),
        title: title,
        artist: artist,
        url: urlInput,
        addedAt: new Date().toISOString()
    };

    songLibrary.unshift(song);
    localStorage.setItem('songLibrary', JSON.stringify(songLibrary));
    
    document.getElementById('songTitle').value = '';
    document.getElementById('songArtist').value = '';
    document.getElementById('songUrl').value = '';
    
    showBanner(`Added "${title}" by ${artist}`, 'success');
    renderSongGrid();
}

async function searchYoutube() {
    const query = document.getElementById('searchQuery').value.trim();
    
    if (!query) {
        showBanner('Enter a search query', 'error');
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="search-loading">🔍 Searching YouTube...</div>';
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' karaoke')}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) {
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center;">No results found. Try a different search term.</div>';
            return;
        }
        
        let html = '<div class="search-results-container">';
        data.items.forEach(item => {
            const title = item.snippet.title;
            const channelTitle = item.snippet.channelTitle;
            const videoId = item.id.videoId;
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            
            html += `
                <div class="search-result-card">
                    <div class="result-title">${escapeHtml(title)}</div>
                    <div class="result-artist">${escapeHtml(channelTitle)}</div>
                    <button onclick="quickAddSong('${escapeHtml(title).replace(/'/g, "\\'")}', '${escapeHtml(channelTitle).replace(/'/g, "\\'")}', '${url}')">Quick Add</button>
                </div>
            `;
        });
        html += '</div>';
        searchResults.innerHTML = html;
        
    } catch (error) {
        console.error('YouTube search error:', error);
        searchResults.innerHTML = '<div style="padding: 20px; background: rgba(255, 100, 100, 0.2); border-radius: 8px; text-align: center;">❌ Search failed. Please try again.</div>';
    }
}

function quickAddSong(title, artist, url) {
    document.getElementById('songTitle').value = title;
    document.getElementById('songArtist').value = artist;
    document.getElementById('songUrl').value = url;
    document.getElementById('searchResults').innerHTML = '';
    showBanner('Song info filled - click Add to save', 'info');
}

function renderSongGrid() {
    const songGrid = document.getElementById('songGrid');
    const sortBy = document.getElementById('sortBy') && document.getElementById('sortBy').value;
    
    let filtered = [...songLibrary];
    
    if (sortBy === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'artist') {
        filtered.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sortBy === 'recent') {
        filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }
    
    filteredSongs = filtered;
    
    if (filtered.length === 0) {
        songGrid.innerHTML = '<div class="empty-state">No songs in library. Add some to get started!</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(song => {
        html += `<div class="song-card" onclick="loadSongToPlayer('${song.url}')"><button class="delete-btn" onclick="deleteSong(${song.id}, event)">🗑️</button><div class="song-title">${escapeHtml(song.title)}</div><div class="song-artist">${escapeHtml(song.artist)}</div><div class="song-date">${formatDate(song.addedAt)}</div></div>`;
    });
    
    songGrid.innerHTML = html;
}

function deleteSong(id, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this song?')) {
        songLibrary = songLibrary.filter(song => song.id !== id);
        localStorage.setItem('songLibrary', JSON.stringify(songLibrary));
        renderSongGrid();
        showBanner('Song deleted', 'success');
    }
}

function loadSongToPlayer(url) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        showBanner('Invalid video URL', 'error');
        return;
    }
    
    if (youtubeApiReady) {
        initializePlayer(videoId);
    } else {
        pendingVideoId = videoId;
        showBanner('Loading YouTube player...', 'info');
    }
}

// YouTube IFrame API Integration
function onYouTubeIframeAPIReady() {
    console.log('YouTube IFrame API is ready');
    youtubeApiReady = true;
    
    if (pendingVideoId) {
        initializePlayer(pendingVideoId);
        pendingVideoId = null;
    }
}

function initializePlayer(videoId) {
    currentVideoId = videoId;
    
    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(videoId);
        showBanner('Video loaded', 'success');
        return;
    }
    
    // Destroy old player if exists
    if (player && typeof player.destroy === 'function') {
        player.destroy();
    }
    
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { 
            'autoplay': 1, 
            'controls': 1, 
            'rel': 0,
            'modestbranding': 1,
            'enablejsapi': 1
        },
        events: { 
            'onReady': onPlayerReady, 
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('Player is ready');
    showBanner('Video loaded successfully!', 'success');
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (event.data === YT.PlayerState.PLAYING) {
        if (playPauseBtn) playPauseBtn.textContent = '⏸️ Pause';
    } else if (event.data === YT.PlayerState.PAUSED) {
        if (playPauseBtn) playPauseBtn.textContent = '▶️ Play';
    }
}

function onPlayerError(event) {
    console.error('YouTube Player Error:', event.data);
    let errorMessage = 'Error loading video. ';
    
    switch(event.data) {
        case 2:
            errorMessage += 'Invalid video ID.';
            break;
        case 5:
            errorMessage += 'HTML5 player error.';
            break;
        case 100:
            errorMessage += 'Video not found or private.';
            break;
        case 101:
        case 150:
            errorMessage += 'Video cannot be embedded.';
            break;
        default:
            errorMessage += 'Please try another video.';
    }
    
    showBanner(errorMessage, 'error');
}

function extractVideoId(url) {
    const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function isValidYoutubeUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);
}

function togglePlayPause() {
    if (!player || typeof player.getPlayerState !== 'function') {
        showBanner('No video loaded', 'error');
        return;
    }

    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

function playPrevious() {
    if (filteredSongs.length > 0) {
        const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
        loadSongToPlayer(randomSong.url);
    }
}

function playNext() {
    if (filteredSongs.length > 0) {
        const randomSong = filteredSongs[Math.floor(Math.random() * filteredSongs.length)];
        loadSongToPlayer(randomSong.url);
    }
}

function showBanner(message, type = 'info') {
    const banner = document.getElementById('infoBanner');
    const bannerMessage = document.getElementById('bannerMessage');
    banner.className = `info-banner ${type}`;
    bannerMessage.textContent = message;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 4000);
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
