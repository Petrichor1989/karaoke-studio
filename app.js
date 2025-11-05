// Global variables
let player;
let audioContext;
let micStream;
let micSource;
let analyser;
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let webcamStream;
let webcamEnabled = false;
// Audio nodes
let gainNode;
let eqLow, eqMid, eqHigh;
let delayNode;
let convolverNode;
let pitchShifter;
// Song library data
let songLibrary = JSON.parse(localStorage.getItem('songLibrary')) || [];
let filteredSongs = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  renderSongGrid();
});

// Initialize all event listeners
function initializeEventListeners() {
  // Add song button
  const addSongBtn = document.getElementById('addSongBtn');
  if (addSongBtn) {
    addSongBtn.addEventListener('click', addSongToLibrary);
  }

  // Search functionality  
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchYoutube);
  }
  
  const searchQuery = document.getElementById('searchQuery');
  if (searchQuery) {
    searchQuery.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchYoutube();
    });
  }

  // Player controls
  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
  if (prevBtn) prevBtn.addEventListener('click', playPrevious);
  if (nextBtn) nextBtn.addEventListener('click', playNext);
}

// Add song to library - NO CHANNEL RESTRICTIONS
function addSongToLibrary() {
  const title = document.getElementById('songTitle').value.trim();
  const artist = document.getElementById('songArtist').value.trim();
  const urlInput = document.getElementById('songUrl').value.trim();
  
  if (!title || !artist || !urlInput) {
    showBanner('Please fill in all fields', 'error');
    return;
  }

  // Accept ANY YouTube URL - no restrictions
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

// Smart search on YouTube  
function searchYoutube() {
  const query = document.getElementById('searchQuery').value.trim();
  
  if (!query) {
    showBanner('Enter a search query', 'error');
    return;
  }

  const searchResults = document.getElementById('searchResults');
  searchResults.innerHTML = '<div class="search-loading">🔍 Searching YouTube (mock results)...</div>';
  
  setTimeout(() => {
    const mockResults = [
      { 
        title: `${query} - Karaoke Version`, 
        artist: 'Various Artists',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' 
      },
      { 
        title: `${query} - Official Karaoke`, 
        artist: 'Karaoke Channel',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' 
      }
    ];
    
    let html = '<div class="search-results-container">';
    mockResults.forEach(result => {
      html += `
        <div class="search-result-card">
          <div class="result-title">${result.title}</div>
          <div class="result-artist">${result.artist}</div>
          <button onclick="quickAddSong('${result.title}', '${result.artist}', '${result.url}')">Quick Add</button>
        </div>
      `;
    });
    html += '</div>';
    searchResults.innerHTML = html;
  }, 500);
}

function quickAddSong(title, artist, url) {
  document.getElementById('songTitle').value = title;
  document.getElementById('songArtist').value = artist;
  document.getElementById('songUrl').value = url;
  document.getElementById('searchResults').innerHTML = '';
  showBanner('Song info filled - click Add to save', 'info');
}

// Render song grid with filter and sorting
function renderSongGrid() {
  const songGrid = document.getElementById('songGrid');
  
  const sortBy = document.getElementById('sortBy') && document.getElementById('sortBy').value;
  
  let filtered = songLibrary;
  
  if (sortBy === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'artist') {
    filtered.sort((a, b) => a.artist.localeCompare(b.artist));
  } else if (sortBy === 'recent') {
    filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }
  
  filteredSongs = filtered;
  
  // Render grid
  if (filtered.length === 0) {
    songGrid.innerHTML = '<div class="empty-state">No songs in library. Add some to get started!</div>';
    return;
  }
  
  let html = '';
  filtered.forEach(song => {
    html += `
      <div class="song-card" onclick="loadSongToPlayer('${song.url}')">
        <button class="delete-btn" onclick="deleteSong(${song.id}, event)">🗑️</button>
        <div class="song-title">${escapeHtml(song.title)}</div>
        <div class="song-artist">${escapeHtml(song.artist)}</div>
        <div class="song-date">${formatDate(song.addedAt)}</div>
      </div>
    `;
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
  if (videoId) {
    loadPlayer(videoId);
  } else {
    showBanner('Invalid video URL', 'error');
  }
}

function loadPlayer(videoId) {
  const playerDiv = document.getElementById('player');
  playerDiv.innerHTML = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}

function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Accept ANY valid YouTube URL - NO CHANNEL RESTRICTIONS
function isValidYoutubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//.test(url) || 
         /^[a-zA-Z0-9_-]{11}$/.test(url);
}

function togglePlayPause() {
  const btn = document.getElementById('playPauseBtn');
  btn.textContent = btn.textContent.includes('Pause') ? '▶️ Play' : '⏸️ Pause';
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
  
  setTimeout(() => {
    banner.style.display = 'none';
  }, 4000);
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

function onYouTubeIframeAPIReady() {
  console.log('YouTube API Ready');
}
