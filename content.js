// Karaoke Studio Chrome Extension - Content Script
// Professional-grade mic recording with real-time vocal and video filters

class KaraokeOverlay {
  constructor() {
    this.audioContext = null;
    this.microphone = null;
    this.recorder = null;
    this.isRecording = false;
    this.filters = {
      pitch: 0,
      reverb: 0,
      echo: 0,
      gain: 1.0
    };
    this.init();
  }

  async init() {
    // Only activate on YouTube video pages
    if (!window.location.href.includes('youtube.com/watch')) {
      return;
    }

    this.createOverlay();
    await this.setupAudio();
  }

  createOverlay() {
    // Create main overlay container
    const overlay = document.createElement('div');
    overlay.id = 'karaoke-overlay';
    overlay.innerHTML = `
      <div class="karaoke-panel">
        <div class="karaoke-header">
          <h3>🎤 Karaoke Studio</h3>
          <button id="karaoke-close">×</button>
        </div>
        
        <div class="karaoke-controls">
          <div class="control-section">
            <h4>Recording</h4>
            <button id="record-btn" class="record-btn">🔴 Start Recording</button>
            <button id="stop-btn" class="stop-btn" disabled>⏹ Stop</button>
            <div class="mic-level">
              <div class="mic-level-bar" id="mic-level"></div>
            </div>
          </div>

          <div class="control-section">
            <h4>Vocal Filters</h4>
            <label>
              Pitch Shift:
              <input type="range" id="pitch-slider" min="-12" max="12" value="0" step="1">
              <span id="pitch-value">0</span>
            </label>
            <label>
              Reverb:
              <input type="range" id="reverb-slider" min="0" max="100" value="0">
              <span id="reverb-value">0%</span>
            </label>
            <label>
              Echo:
              <input type="range" id="echo-slider" min="0" max="100" value="0">
              <span id="echo-value">0%</span>
            </label>
            <label>
              Volume:
              <input type="range" id="gain-slider" min="0" max="200" value="100">
              <span id="gain-value">100%</span>
            </label>
          </div>

          <div class="control-section">
            <h4>Video Filters</h4>
            <label>
              <input type="checkbox" id="filter-blur"> Blur
            </label>
            <label>
              <input type="checkbox" id="filter-grayscale"> Grayscale
            </label>
            <label>
              <input type="checkbox" id="filter-sepia"> Sepia
            </label>
            <label>
              <input type="checkbox" id="filter-invert"> Invert
            </label>
            <label>
              Brightness:
              <input type="range" id="brightness-slider" min="0" max="200" value="100">
              <span id="brightness-value">100%</span>
            </label>
            <label>
              Contrast:
              <input type="range" id="contrast-slider" min="0" max="200" value="100">
              <span id="contrast-value">100%</span>
            </label>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.attachEventListeners();
  }

  async setupAudio() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });

      // Create Audio Context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // Create filter nodes
      this.gainNode = this.audioContext.createGain();
      this.biquadFilter = this.audioContext.createBiquadFilter();
      this.delayNode = this.audioContext.createDelay(5.0);
      this.delayGain = this.audioContext.createGain();
      this.convolverNode = this.audioContext.createConvolver();
      this.convolverGain = this.audioContext.createGain();

      // Configure filters
      this.biquadFilter.type = 'allpass';
      this.delayNode.delayTime.value = 0.3;
      this.delayGain.gain.value = 0;
      this.convolverGain.gain.value = 0;

      // Create impulse response for reverb
      this.createReverbImpulse();

      // Connect audio graph
      this.microphone.connect(this.biquadFilter);
      this.biquadFilter.connect(this.gainNode);
      
      // Echo path
      this.gainNode.connect(this.delayNode);
      this.delayNode.connect(this.delayGain);
      this.delayGain.connect(this.biquadFilter); // Feedback
      
      // Reverb path
      this.gainNode.connect(this.convolverNode);
      this.convolverNode.connect(this.convolverGain);
      
      // Final output
      this.gainNode.connect(this.audioContext.destination);
      this.delayGain.connect(this.audioContext.destination);
      this.convolverGain.connect(this.audioContext.destination);

      // Analyzer for mic level
      this.analyser = this.audioContext.createAnalyser();
      this.gainNode.connect(this.analyser);
      this.startMicLevelMonitor();

      console.log('Audio setup complete');
    } catch (error) {
      console.error('Failed to setup audio:', error);
      alert('Failed to access microphone. Please grant permission.');
    }
  }

  createReverbImpulse() {
    const rate = this.audioContext.sampleRate;
    const length = rate * 2; // 2 seconds reverb
    const impulse = this.audioContext.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 2);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 2);
    }

    this.convolverNode.buffer = impulse;
  }

  startMicLevelMonitor() {
    const levelBar = document.getElementById('mic-level');
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const level = (average / 255) * 100;
      levelBar.style.width = level + '%';
      requestAnimationFrame(update);
    };

    update();
  }

  attachEventListeners() {
    // Close button
    document.getElementById('karaoke-close').addEventListener('click', () => {
      document.getElementById('karaoke-overlay').style.display = 'none';
    });

    // Recording controls
    document.getElementById('record-btn').addEventListener('click', () => this.startRecording());
    document.getElementById('stop-btn').addEventListener('click', () => this.stopRecording());

    // Vocal filters
    document.getElementById('pitch-slider').addEventListener('input', (e) => {
      this.filters.pitch = parseInt(e.target.value);
      document.getElementById('pitch-value').textContent = e.target.value;
      this.updatePitchShift(this.filters.pitch);
    });

    document.getElementById('reverb-slider').addEventListener('input', (e) => {
      this.filters.reverb = parseInt(e.target.value);
      document.getElementById('reverb-value').textContent = e.target.value + '%';
      this.convolverGain.gain.value = this.filters.reverb / 100;
    });

    document.getElementById('echo-slider').addEventListener('input', (e) => {
      this.filters.echo = parseInt(e.target.value);
      document.getElementById('echo-value').textContent = e.target.value + '%';
      this.delayGain.gain.value = this.filters.echo / 100;
    });

    document.getElementById('gain-slider').addEventListener('input', (e) => {
      this.filters.gain = parseInt(e.target.value) / 100;
      document.getElementById('gain-value').textContent = e.target.value + '%';
      this.gainNode.gain.value = this.filters.gain;
    });

    // Video filters
    const videoFilters = ['blur', 'grayscale', 'sepia', 'invert'];
    videoFilters.forEach(filter => {
      document.getElementById(`filter-${filter}`).addEventListener('change', () => {
        this.updateVideoFilters();
      });
    });

    document.getElementById('brightness-slider').addEventListener('input', (e) => {
      document.getElementById('brightness-value').textContent = e.target.value + '%';
      this.updateVideoFilters();
    });

    document.getElementById('contrast-slider').addEventListener('input', (e) => {
      document.getElementById('contrast-value').textContent = e.target.value + '%';
      this.updateVideoFilters();
    });
  }

  updatePitchShift(semitones) {
    // Simple pitch shift using playback rate
    // Note: This is a basic implementation. For better quality, use a library like Tone.js
    const ratio = Math.pow(2, semitones / 12);
    this.biquadFilter.frequency.value = 1000 * ratio;
  }

  updateVideoFilters() {
    const video = document.querySelector('video');
    if (!video) return;

    let filters = [];

    if (document.getElementById('filter-blur').checked) {
      filters.push('blur(5px)');
    }
    if (document.getElementById('filter-grayscale').checked) {
      filters.push('grayscale(100%)');
    }
    if (document.getElementById('filter-sepia').checked) {
      filters.push('sepia(100%)');
    }
    if (document.getElementById('filter-invert').checked) {
      filters.push('invert(100%)');
    }

    const brightness = document.getElementById('brightness-slider').value;
    filters.push(`brightness(${brightness}%)`);

    const contrast = document.getElementById('contrast-slider').value;
    filters.push(`contrast(${contrast}%)`);

    video.style.filter = filters.join(' ');
  }

  startRecording() {
    if (!this.audioContext) {
      alert('Audio not initialized');
      return;
    }

    try {
      // Create destination for recording
      const dest = this.audioContext.createMediaStreamDestination();
      this.gainNode.connect(dest);
      this.delayGain.connect(dest);
      this.convolverGain.connect(dest);

      // Start MediaRecorder
      this.recorder = new MediaRecorder(dest.stream);
      this.chunks = [];

      this.recorder.ondataavailable = (e) => {
        this.chunks.push(e.data);
      };

      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `karaoke-recording-${Date.now()}.webm`;
        a.click();
      };

      this.recorder.start();
      this.isRecording = true;

      document.getElementById('record-btn').disabled = true;
      document.getElementById('stop-btn').disabled = false;
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording');
    }
  }

  stopRecording() {
    if (this.recorder && this.isRecording) {
      this.recorder.stop();
      this.isRecording = false;

      document.getElementById('record-btn').disabled = false;
      document.getElementById('stop-btn').disabled = true;
      console.log('Recording stopped');
    }
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new KaraokeOverlay());
} else {
  new KaraokeOverlay();
}
