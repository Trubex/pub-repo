# iTunes Control Server (Host Scripts)

These scripts run on your **host machine** (Windows or macOS) to provide an HTTP API for controlling iTunes/Music app.

## Installation

1. Navigate to this directory:
```bash
cd host-scripts
```

2. Install dependencies:
```bash
npm install
```

## Running the Server

### On Windows:

```bash
npm run start:windows
```

Or directly:
```bash
node itunes-server-windows.js
```

**Requirements**:
- iTunes must be installed (desktop version, not Microsoft Store version)
- iTunes must be running
- Node.js 18 or higher

### On macOS:

```bash
npm run start:macos
```

Or directly:
```bash
node itunes-server-macos.js
```

**Requirements**:
- iTunes or Music app must be installed
- iTunes/Music must be running
- Node.js 18 or higher
- Terminal must have permission to control iTunes/Music (System Preferences > Security & Privacy > Automation)

## Configuration

Set the port via environment variable:

```bash
# Windows
set ITUNES_PORT=8181
npm run start:windows

# macOS/Linux
export ITUNES_PORT=8181
npm run start:macos
```

Default port is 8181.

## API Endpoints

All endpoints are available at `http://localhost:8181`

### GET /ping
Check server status

### GET /current
Get currently playing track

### POST /play
Play or resume playback
- Body (optional): `{ "query": "song name" }` to search and play

### POST /pause
Pause playback

### POST /stop
Stop playback

### POST /next
Skip to next track

### POST /previous
Go to previous track

### GET /volume
Get current volume (0-100)

### POST /volume
Set volume
- Body: `{ "volume": 50 }`

### POST /search
Search for tracks
- Body: `{ "query": "search term", "limit": 20 }`

### GET /playlists
Get all playlists

### POST /playlist/play
Play a playlist
- Body: `{ "name": "playlist name" }`

## Troubleshooting

### Windows Issues

**Error: "iTunes not available"**
- Make sure iTunes is installed and running
- Do not use the Microsoft Store version of iTunes
- Install the desktop version from Apple's website
- Run `npm install winax` if the package is missing

### macOS Issues

**Error: "execution error: Music got an error: Not authorized to send Apple events to Music"**
- Open System Preferences > Security & Privacy > Privacy > Automation
- Grant Terminal (or your terminal app) permission to control Music/iTunes
- Restart the script

**Error: "osascript: command not found"**
- This should not happen on macOS as osascript is built-in
- Make sure you're running on macOS

## Running as a Service

### Windows (NSSM)

1. Download NSSM: https://nssm.cc/download
2. Install service:
```cmd
nssm install iTunesControl "C:\Program Files\nodejs\node.exe" "C:\path\to\host-scripts\itunes-server-windows.js"
nssm start iTunesControl
```

### macOS (launchd)

Create file: `~/Library/LaunchAgents/com.itunesbot.control.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.itunesbot.control</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/host-scripts/itunes-server-macos.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load service:
```bash
launchctl load ~/Library/LaunchAgents/com.itunesbot.control.plist
```

### Linux (systemd) - Not applicable

This script is only for Windows and macOS where iTunes/Music app is available.

## Security Notes

- The server binds to `0.0.0.0` (all interfaces) by default
- Consider using a firewall to restrict access
- No authentication is implemented - the server trusts all requests
- Only run on trusted networks or add authentication middleware
