# 🎤 Karaoke Studio

An advanced karaoke web application with professional features for the ultimate singing experience. Sing along with **any YouTube video** using powerful vocal effects, recording capabilities, and flexible display modes!

## ✨ Features

### 🎥 Enhanced YouTube Video Player
- **Universal YouTube URL Support**: Works with any YouTube URL format:
  - Standard videos: `https://www.youtube.com/watch?v=VIDEO_ID`
  - Short URLs: `https://youtu.be/VIDEO_ID`
  - Playlist entries: URLs with `&list=` and `&index=` parameters
  - YouTube Music: `https://music.youtube.com/watch?v=VIDEO_ID`
  - Mobile URLs: `https://m.youtube.com/watch?v=VIDEO_ID`
  - Embed URLs: `https://www.youtube.com/embed/VIDEO_ID`
- **Smart Error Handling**: Clear, user-friendly error messages if a URL format isn't supported
- **In-App Guidance**: Built-in instructions and examples for finding karaoke tracks
- Seamless integration with video playback controls

### 🎤 Professional Microphone Recording
- Record your vocals separately from the backing track
- High-quality audio capture using Web Audio API
- Real-time waveform visualization
- Easy export of recordings in WebM format
- Adjustable input gain and monitoring

### 🎚️ Advanced Audio Effects
- **Professional EQ**: 3-band equalizer (Low/Mid/High) for precise vocal tuning
- **Echo/Delay**: Adjustable delay and feedback for studio-quality reverb
- **Volume Control**: Independent mic and backing track levels
- **Pitch Shifter**: Transpose to match your vocal range (coming soon)
- Real-time audio processing with minimal latency

### 📹 Webcam Integration
- Enable webcam for recording video performances
- Picture-in-Picture (PiP) mode to keep yourself visible while browsing
- Perfect for creating karaoke video content
- Easy toggle on/off during sessions

### 🎵 Song Browser
- Curated collection of popular karaoke songs across multiple genres:
  - 🎉 Pop Hits
  - 🎸 Rock Classics
  - 🤠 Country Favorites
  - 🎵 R&B/Soul
- One-click loading of pre-selected karaoke tracks
- Easy navigation between songs

### 🎨 Modern, Responsive UI
- Beautiful gradient design with intuitive controls
- Mobile-friendly responsive layout
- Clear visual feedback for all actions
- Organized sections for easy access to all features

## 🚀 Advanced Usage: Overlay & Sidebar Modes

Want to keep the karaoke controls accessible while browsing YouTube? Here are several options:

### Option 1: Browser Picture-in-Picture (Easiest)
1. Open the karaoke studio in your browser
2. Right-click on the YouTube video player
3. Select "Picture in Picture"
4. The video will float on top of all windows
5. Keep the karaoke studio tab open for controls

### Option 2: Browser Window Management
1. Open karaoke studio in a separate browser window
2. Resize the window to a comfortable size
3. Use your OS window management:
   - **Windows**: Win + Arrow keys to snap windows
   - **Mac**: Use Stage Manager or window tiling apps
   - **Linux**: Most DEs have built-in window snapping
4. Keep karaoke studio window "always on top" using:
   - **Windows**: Use third-party tools like PowerToys or AutoHotkey
   - **Mac**: Third-party apps like Afloat or Stay
   - **Linux**: Most window managers have this built-in

### Option 3: Create a Chrome Extension (Advanced)

You can create a simple Chrome extension to embed karaoke studio as a sidebar:

#### Step 1: Create Extension Files

Create a new folder called `karaoke-studio-extension` with these files:

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Karaoke Studio Sidebar",
  "version": "1.0",
  "description": "Access karaoke controls in a sidebar while browsing YouTube",
  "permissions": ["sidePanel"],
  "action": {
    "default_title": "Open Karaoke Studio"
  },
  "side_panel": {
    "default_path": "sidebar.html"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
```

**sidebar.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100vh;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="https://petrichor1989.github.io/karaoke-studio/" allowfullscreen></iframe>
</body>
</html>
```

#### Step 2: Add Icons
Create or download simple microphone icons (16x16, 48x48, 128x128 pixels) and save them as `icon16.png`, `icon48.png`, and `icon128.png`.

#### Step 3: Install the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select your `karaoke-studio-extension` folder
5. The extension will appear in your toolbar

#### Step 4: Use the Sidebar
1. Navigate to YouTube
2. Click the extension icon in your toolbar
3. Click "Open Karaoke Studio"
4. The sidebar will appear with full karaoke controls!
5. Copy any YouTube URL and paste it into the karaoke studio

### Option 4: Bookmarklet (Quick Access)

Create a bookmarklet to open karaoke studio in a popup:

1. Create a new bookmark in your browser
2. Name it "Karaoke Studio"
3. Set the URL to:
```javascript
javascript:(function(){window.open('https://petrichor1989.github.io/karaoke-studio/','karaoke','width=800,height=900,left=0,top=0,menubar=no,toolbar=no,location=no,status=no');})()
```
4. Click the bookmarklet while on any page to open karaoke studio in a popup window!

### Option 5: Web App Manifest (Progressive Web App)

The karaoke studio can be installed as a PWA for app-like experience:

1. Visit the karaoke studio website in Chrome/Edge
2. Look for the "Install" button in the address bar (if available)
3. Click to install as a desktop app
4. Access from your OS application menu
5. Runs in a standalone window without browser chrome

## 🎯 Getting Started

### Method 1: Use Online (Recommended)
1. Visit the live demo: `https://petrichor1989.github.io/karaoke-studio/`
2. Paste any YouTube URL into the input field
3. Click "Load Video"
4. Click "Start Microphone" to begin singing
5. Adjust vocal effects as desired
6. Hit "Start Recording" to capture your performance

### Method 2: Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/Petrichor1989/karaoke-studio.git
   cd karaoke-studio
   ```

2. Serve the files using any local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

4. Start singing!

### Tips for Best Experience
- 🎵 Search YouTube for "[song name] karaoke" or "[song name] instrumental"
- 🎤 Use headphones to prevent audio feedback
- 📹 Enable webcam to record video performances
- 🔊 Adjust echo and EQ settings to match your voice
- 💾 Test recording for a few seconds before a full performance

## 🛠️ Technologies Used

- **HTML5** - Structure and semantics
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Application logic and interactivity
- **Web Audio API** - Real-time audio processing and effects
- **YouTube IFrame API** - Video playback with enhanced URL parsing
- **MediaStream API** - Microphone and webcam access
- **MediaRecorder API** - Audio/video recording capabilities

## 🐛 Troubleshooting

### "YouTube URL not loading"
- Ensure the URL is a valid YouTube link
- Check that the video is not region-restricted or private
- Try copying the URL directly from YouTube's address bar
- For playlist URLs, make sure they include the `v=` parameter

### "Microphone not working"
- Grant microphone permissions when prompted by your browser
- Check system audio settings to ensure mic is enabled
- Try a different browser if issues persist
- Ensure no other application is using the microphone

### "Echo/feedback issues"
- Use headphones instead of speakers
- Lower the microphone volume
- Reduce the echo/delay effect level
- Move microphone away from speakers

### "Recording not saving"
- Ensure you have write permissions in your downloads folder
- Try a different browser (Chrome/Edge recommended)
- Check that your browser supports MediaRecorder API
- Disable browser extensions that might interfere

## 📝 License

This project is licensed under the MIT License - feel free to use, modify, and distribute as needed.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs by opening issues
- Suggest new features or improvements
- Submit pull requests with enhancements
- Share your karaoke performances using this tool!

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Made with ❤️ for karaoke enthusiasts everywhere!**

*Sing your heart out! 🎤🎵*
