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
    const result = extractVideoId(url);
    
    // Clear any previous errors
    const errorDiv = document.getElementById('urlError');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
    
    if (result.success) {
        const videoId = result.videoId;
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
                    'onReady': onPlayerReady
                }
            });
        }
    } else {
        // Display error message
        showError(result.error);
    }
});

function onPlayerReady(event) {
    console.log('Player ready');
}

// Enhanced YouTube URL extraction supporting various formats
function extractVideoId(url) {
    if (!url || url.trim() === '') {
        return {
            success: false,
            error: 'Please enter a YouTube URL'
        };
    }
    
    try {
        // Handle various YouTube URL formats
        const patterns = [
            // Standard watch URLs with optional parameters
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&.*)?/,
            // Short URLs
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?.*)?/,
            // Embed URLs
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:\?.*)?/,
            // YouTube Music URLs
            /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&.*)?/,
            // Mobile URLs
            /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&.*)?/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return {
                    success: true,
                    videoId: match[1]
                };
            }
        }
        
        // If no pattern matched, provide helpful error
        return {
            success: false,
            error: 'Invalid YouTube URL. Please use a valid format like:\n' +
                   '• https://www.youtube.com/watch?v=VIDEO_ID\n' +
                   '• https://youtu.be/VIDEO_ID\n' +
                   '• Playlist URLs with &index parameter are supported'
        };
    } catch (e) {
        return {
            success: false,
            error: 'Error parsing URL. Please check the format and try again.'
        };
    }
}

// Show error message to user
function showError(message) {
    let errorDiv = document.getElementById('urlError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'urlError';
        errorDiv.style.cssText = 'color: #ff4444; padding: 10px; margin: 10px 0; background: #fff0f0; border: 1px solid #ffcccc; border-radius: 4px; white-space: pre-line;';
        const urlInput = document.getElementById('youtubeUrl');
        urlInput.parentNode.insertBefore(errorDiv, urlInput.nextSibling);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Microphone setup
document.getElementById('startMic').addEventListener('click', async () => {
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        micSource = audioContext.createMediaStreamSource(micStream);
        gainNode = audioContext.createGain();
        analyser = audioContext.createAnalyser();
        
        // EQ setup
        eqLow = audioContext.createBiquadFilter();
        eqMid = audioContext.createBiquadFilter();
        eqHigh = audioContext.createBiquadFilter();
        
        eqLow.type = 'lowshelf';
        eqLow.frequency.value = 320;
        eqMid.type = 'peaking';
        eqMid.frequency.value = 1000;
        eqHigh.type = 'highshelf';
        eqHigh.frequency.value = 3200;
        
        // Delay/Echo setup
        delayNode = audioContext.createDelay();
        const delayGain = audioContext.createGain();
        delayNode.delayTime.value = 0.3;
        delayGain.gain.value = 0.3;
        
        // Connect nodes
        micSource.connect(gainNode);
        gainNode.connect(eqLow);
        eqLow.connect(eqMid);
        eqMid.connect(eqHigh);
        eqHigh.connect(analyser);
        eqHigh.connect(delayNode);
        delayNode.connect(delayGain);
        delayGain.connect(audioContext.destination);
        eqHigh.connect(audioContext.destination);
        
        visualizeWaveform();
        
        document.getElementById('startMic').disabled = true;
        document.getElementById('stopMic').disabled = false;
        document.getElementById('startRecord').disabled = false;
    } catch (err) {
        console.error('Microphone error:', err);
        alert('Could not access microphone');
    }
});

document.getElementById('stopMic').addEventListener('click', () => {
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        document.getElementById('startMic').disabled = false;
        document.getElementById('stopMic').disabled = true;
        document.getElementById('startRecord').disabled = true;
    }
});

// Recording
document.getElementById('startRecord').addEventListener('click', async () => {
    recordedChunks = [];
    const options = { mimeType: 'audio/webm' };
    mediaRecorder = new MediaRecorder(micStream, options);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'karaoke-recording.webm';
        a.click();
    };
    
    mediaRecorder.start();
    isRecording = true;
    document.getElementById('startRecord').disabled = true;
    document.getElementById('stopRecord').disabled = false;
});

document.getElementById('stopRecord').addEventListener('click', () => {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        document.getElementById('startRecord').disabled = false;
        document.getElementById('stopRecord').disabled = true;
    }
});

// Audio controls
document.getElementById('volume').addEventListener('input', (e) => {
    if (gainNode) {
        gainNode.gain.value = e.target.value;
    }
});

document.getElementById('echo').addEventListener('input', (e) => {
    if (delayNode) {
        const delayGain = delayNode.context.createGain();
        delayGain.gain.value = e.target.value;
    }
});

document.getElementById('pitch').addEventListener('input', (e) => {
    // Pitch shifting would require additional library
    console.log('Pitch:', e.target.value);
});

// Webcam toggle
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
            console.error('Webcam error:', err);
            alert('Could not access webcam');
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
