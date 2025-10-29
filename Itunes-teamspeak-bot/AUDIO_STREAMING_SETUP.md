# iTunes Audio Streaming to TeamSpeak via SinusBot

This guide explains how to stream iTunes audio to TeamSpeak through SinusBot.

## Architecture

```
iTunes (Windows PC)
   ↓ plays audio
System Audio Output
   ↓ captured by
Audio Stream Server (port 8182)
   ↓ streams as HTTP MP3
SinusBot (cloud)
   ↓ plays stream URL
TeamSpeak Server
   ↓ broadcasts to
TeamSpeak Clients 🎵
```

## Prerequisites

1. **FFmpeg** - Required for audio capture
   - Download: https://ffmpeg.org/download.html
   - Or install via Chocolatey: `choco install ffmpeg`
   - Add to system PATH

2. **Stereo Mix** (Option 1 - captures ALL system audio)
   - Enable in Windows Sound Settings
   - Right-click sound icon > Sounds > Recording tab
   - Right-click > Show Disabled Devices
   - Enable "Stereo Mix" and set as default

3. **VB-Audio Virtual Cable** (Option 2 - recommended, iTunes audio only)
   - Download: https://vb-audio.com/Cable/
   - Install the virtual audio cable
   - Set iTunes output device to "CABLE Input"
   - Update line 38 in `audio-stream-server.js`:
     ```javascript
     '-i', 'audio=CABLE Output',
     ```

## Setup Steps

### 1. Start iTunes Control Server

```bash
cd d:\pub-repo\Itunes-teamspeak-bot\host-scripts
npm run start:windows
```

This runs on port **8181** and allows the bot to control iTunes.

### 2. Start Audio Stream Server

Open a **second terminal**:

```bash
cd d:\pub-repo\Itunes-teamspeak-bot\host-scripts
npm run stream:windows
```

This runs on port **8182** and captures/streams iTunes audio.

### 3. Get Your Public Stream URL

The audio stream server runs locally at `http://localhost:8182/stream`, but SinusBot (in the cloud) can't access localhost.

**Option A: Use ngrok (easiest for testing)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 8182
```

ngrok will give you a public URL like: `https://abc123.ngrok-free.app`

Your stream URL becomes: `https://abc123.ngrok-free.app/stream`

**Option B: Port forwarding (for permanent setup)**
1. Forward port 8182 on your router to your PC
2. Find your public IP: https://whatismyipaddress.com/
3. Stream URL: `http://YOUR_PUBLIC_IP:8182/stream`

### 4. Configure SinusBot to Play the Stream

Go to your SinusBot web interface at `http://104.234.156.66:24001`:

1. Click **"Music"** tab
2. Click **"Add Station/Playlist"**
3. Enter your stream URL: `https://abc123.ngrok-free.app/stream`
4. Name it "iTunes Stream"
5. Click "Add"

### 5. Update Bot Configuration

The bot needs to know about the stream URL. You can either:

**Option A: Manual via SinusBot web interface**
- Just play the stream manually from SinusBot when you want

**Option B: Automatic playback (add this feature)**
- We can add a "Start Streaming" button to the web UI
- It will automatically tell SinusBot to play your iTunes stream URL

## Usage

1. Start both servers (iTunes control + Audio stream)
2. Play music in iTunes
3. In the bot web UI (localhost:3000), click "Play"
4. The bot tells SinusBot to play your stream URL
5. SinusBot receives the audio stream from your PC
6. SinusBot broadcasts it to TeamSpeak
7. Everyone in TeamSpeak hears your iTunes music! 🎵

## Troubleshooting

### "Stereo Mix not working"
- Make sure it's enabled AND set as default device
- Try the VB-Audio Cable method instead

### "FFmpeg not found"
- Install FFmpeg and add to PATH
- Restart terminal after installation
- Test with: `ffmpeg -version`

### "No audio in TeamSpeak"
- Check audio stream status: `http://localhost:8182/status`
- Verify iTunes is playing
- Check SinusBot is connected to TeamSpeak
- Verify stream URL is accessible from cloud (test in browser)

### "Stream URL not accessible"
- If using ngrok, make sure it's running
- If using port forwarding, check router settings
- Test stream URL in VLC player from another device

## Advanced: Auto-start with Bot

To make the audio stream start automatically, you can add it as a Windows service or use PM2:

```bash
npm install -g pm2
pm2 start npm --name "itunes-control" -- run start:windows
pm2 start npm --name "audio-stream" -- run stream:windows
pm2 save
pm2 startup
```

## Next Steps

We can add these features to the bot:
1. "Start Streaming" button that automatically tells SinusBot to play the stream
2. Display stream status in the web UI
3. Automatic stream URL detection
4. One-click setup wizard
