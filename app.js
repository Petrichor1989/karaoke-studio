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

// Initialize YouTube API
function onYouTubeIframeAPIReady() {
    console.log('YouTube API Ready');
}

// Load video from URL
document.getElementById('loadVideo').addEventListener('click', () => {
    const url = document.getElementById('youtubeUrl').value;
    const videoId = extractVideoId(url);
    
    if (videoId) {
        if (player) {
            player.loadVideoById(videoId);
        } else {
            player = new YT.Player('player', {
                height: '390',
                width: '640',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }
    } else {
        alert('Please enter a valid YouTube URL');
    }
});

function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))?\??v?=?([^#&?]*).*/ ;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

function onPlayerReady(event) {
    console.log('Player ready');
    initializeAudio();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        document.getElementById('playPause').textContent = 'Pause';
    } else {
        document.getElementById('playPause').textContent = 'Play';
    }
}

// Initialize Web Audio API
function initializeAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create audio nodes
        gainNode = audioContext.createGain();
        
        // EQ nodes
        eqLow = audioContext.createBiquadFilter();
        eqLow.type = 'lowshelf';
        eqLow.frequency.value = 60;
        
        eqMid = audioContext.createBiquadFilter();
        eqMid.type = 'peaking';
        eqMid.frequency.value = 1000;
        eqMid.Q.value = 1;
        
        eqHigh = audioContext.createBiquadFilter();
        eqHigh.type = 'highshelf';
        eqHigh.frequency.value = 8000;
        
        // Delay for echo effect
        delayNode = audioContext.createDelay();
        delayNode.delayTime.value = 0.3;
        
        // Analyser for waveform
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        // Connect microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                micStream = stream;
                micSource = audioContext.createMediaStreamSource(stream);
                
                // Connect audio chain
                micSource.connect(eqLow);
                eqLow.connect(eqMid);
                eqMid.connect(eqHigh);
                eqHigh.connect(gainNode);
                gainNode.connect(analyser);
                analyser.connect(audioContext.destination);
                
                visualizeWaveform();
            })
            .catch(err => {
                console.error('Microphone access denied:', err);
                alert('Please allow microphone access to use karaoke features');
            });
    }
}

// Video controls
document.getElementById('playPause').addEventListener('click', () => {
    if (player && player.getPlayerState) {
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }
});

document.getElementById('stop').addEventListener('click', () => {
    if (player && player.stopVideo) {
        player.stopVideo();
    }
});

// Pitch control
document.getElementById('pitchControl').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('pitchValue').textContent = value;
    // Pitch shifting would require additional library like Tone.js
    // This is a placeholder for the functionality
});

// Tempo control
document.getElementById('tempoControl').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('tempoValue').textContent = value;
    if (player && player.setPlaybackRate) {
        player.setPlaybackRate(value / 100);
    }
});

// EQ controls
document.getElementById('eqLow').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('eqLowValue').textContent = value;
    if (eqLow) eqLow.gain.value = value;
});

document.getElementById('eqMid').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('eqMidValue').textContent = value;
    if (eqMid) eqMid.gain.value = value;
});

document.getElementById('eqHigh').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('eqHighValue').textContent = value;
    if (eqHigh) eqHigh.gain.value = value;
});

// Reverb control
document.getElementById('reverbControl').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('reverbValue').textContent = value;
    // Reverb implementation would require impulse response
    // This is a placeholder
});

// Echo control
document.getElementById('echoControl').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('echoValue').textContent = value;
    if (gainNode && audioContext) {
        const echoGain = audioContext.createGain();
        echoGain.gain.value = value / 100;
        // Connect delay for echo effect
    }
});

// Recording controls
document.getElementById('startRecording').addEventListener('click', async () => {
    if (!micStream) {
        alert('Microphone not initialized');
        return;
    }
    
    recordedChunks = [];
    
    // Create MediaRecorder for mic only
    const options = { mimeType: 'audio/webm' };
    mediaRecorder = new MediaRecorder(micStream, options);
    
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const audioPlayback = document.getElementById('audioPlayback');
        audioPlayback.src = url;
        audioPlayback.style.display = 'block';
        document.getElementById('downloadRecording').disabled = false;
    };
    
    mediaRecorder.start();
    isRecording = true;
    document.getElementById('recordingStatus').textContent = 'Recording...';
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
});

document.getElementById('stopRecording').addEventListener('click', () => {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('recordingStatus').textContent = 'Recording stopped';
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
    }
});

document.getElementById('downloadRecording').addEventListener('click', () => {
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karaoke-recording-${Date.now()}.webm`;
    a.click();
});

// Webcam controls
document.getElementById('toggleWebcam').addEventListener('click', async () => {
    if (!webcamEnabled) {
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const webcamVideo = document.getElementById('webcam');
            webcamVideo.srcObject = webcamStream;
            webcamVideo.style.display = 'block';
            webcamEnabled = true;
            document.getElementById('toggleWebcam').textContent = 'Disable Webcam';
            document.getElementById('togglePiP').disabled = false;
        } catch (err) {
            console.error('Webcam access denied:', err);
            alert('Please allow webcam access');
        }
    } else {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            document.getElementById('webcam').style.display = 'none';
            webcamEnabled = false;
            document.getElementById('toggleWebcam').textContent = 'Enable Webcam';
            document.getElementById('togglePiP').disabled = true;
        }
    }
});

document.getElementById('togglePiP').addEventListener('click', async () => {
    const webcamVideo = document.getElementById('webcam');
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            await webcamVideo.requestPictureInPicture();
        }
    } catch (err) {
        console.error('PiP error:', err);
    }
});

// Waveform visualization
function visualizeWaveform() {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const waveformDiv = document.getElementById('waveform');
    
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        
        // Simple visualization with div height
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalized = (average - 128) / 128;
        const height = Math.abs(normalized) * 50;
        waveformDiv.style.height = height + 'px';
    }
    
    draw();
}

// Initialize on page load
window.addEventListener('load', () => {
    console.log('Karaoke Studio loaded');
});
