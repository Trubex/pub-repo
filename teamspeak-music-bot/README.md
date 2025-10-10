# TeamSpeak YouTube Music Bot

A self-hosted TeamSpeak bot that plays YouTube audio in voice channels with queue management, search functionality, and permission-based access control.

## Features

- 🎵 Play YouTube videos as audio in TeamSpeak voice channels
- 🔍 Search YouTube directly from TeamSpeak chat
- 📋 Queue management (add, remove, clear, view)
- ⏯️ Playback controls (play, pause, resume, skip, stop)
- 🔐 Permission system (Group ID and UID based access control)
- 🎚️ Volume control
- 💾 Automatic audio caching
- 🔄 Auto-reconnect on connection loss

## Quick Start

```bash
# 1. Clone the repository from GitHub
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot

# 2. Install Node.js dependencies
npm install

# 3. Install yt-dlp (choose your OS below)
# Windows: winget install yt-dlp
# Linux/macOS: pip install yt-dlp

# 4. Create and edit config file
cp config.example.json config.json
# Edit config.json with your TeamSpeak server details

# 5. Start the bot
npm start
```

**Replace `YOUR-USERNAME` with your actual GitHub username!**

## Prerequisites

Before installing, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** (for cloning) - [Download here](https://git-scm.com/)
- **yt-dlp** - YouTube downloader (installation instructions below)
- **FFmpeg** - Audio processing (installation instructions below)
- **TeamSpeak server** with ServerQuery access
- **ServerQuery credentials** (username and password)

### Installing yt-dlp

**Windows:**
```bash
# Option 1: Using winget (recommended)
winget install yt-dlp

# Option 2: Using pip
pip install yt-dlp

# Option 3: Download from GitHub
# Download yt-dlp.exe from https://github.com/yt-dlp/yt-dlp/releases
# Add it to your PATH or place it in the bot directory
```

**Linux:**
```bash
# Option 1: Using pip (recommended)
pip install yt-dlp

# Option 2: Using package manager
sudo apt install yt-dlp      # Debian/Ubuntu
sudo pacman -S yt-dlp        # Arch Linux
sudo dnf install yt-dlp      # Fedora
```

**macOS:**
```bash
# Option 1: Using Homebrew (recommended)
brew install yt-dlp

# Option 2: Using pip
pip install yt-dlp
```

**Verify installation:**
```bash
yt-dlp --version
```

### Installing FFmpeg

**Windows:**
```bash
# Option 1: Using winget (recommended)
winget install FFmpeg

# Option 2: Using Chocolatey
choco install ffmpeg

# Option 3: Download manually from https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt install ffmpeg      # Debian/Ubuntu
sudo pacman -S ffmpeg        # Arch Linux
sudo dnf install ffmpeg      # Fedora
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

## Installation from GitHub

### Method 1: Using Git Clone (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git

# Navigate to the directory
cd teamspeak-music-bot

# Install Node.js dependencies
npm install
```

### Method 2: Download ZIP

1. Go to your GitHub repository page
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file to your desired location
5. Open terminal/command prompt in the extracted folder
6. Run `npm install`

## Configuration

### Step 1: Create Config File

Copy the example configuration file:

**Linux/macOS:**
```bash
cp config.example.json config.json
```

**Windows (Command Prompt):**
```cmd
copy config.example.json config.json
```

**Windows (PowerShell):**
```powershell
Copy-Item config.example.json config.json
```

### Step 2: Edit Configuration

Open `config.json` in your favorite text editor and configure:

```json
{
  "teamspeak": {
    "host": "your-server-ip",
    "queryport": 10011,
    "serverport": 9987,
    "username": "serveradmin",
    "password": "your-query-password",
    "nickname": "Music Bot",
    "channel": "Music Channel"
  },
  "permissions": {
    "allowedGroupIds": [6, 7],
    "allowedUIDs": [
      "your-unique-identifier-here"
    ],
    "requireBoth": false
  },
  "bot": {
    "commandPrefix": "!",
    "maxQueueSize": 50,
    "defaultVolume": 50
  }
}
```

### Configuration Options

#### TeamSpeak Settings
- `host`: Your TeamSpeak server IP or hostname
- `queryport`: ServerQuery port (default: 10011)
- `serverport`: Voice server port (default: 9987)
- `username`: ServerQuery username (usually "serveradmin")
- `password`: ServerQuery password
- `nickname`: Bot's display name in TeamSpeak
- `channel`: Channel name where the bot should join

#### Permissions
- `allowedGroupIds`: Array of server group IDs that can use bot commands
- `allowedUIDs`: Array of TeamSpeak unique identifiers that can use bot commands
- `requireBoth`: If `true`, user must match BOTH group and UID requirements. If `false`, user needs to match EITHER requirement

**Finding Group IDs:**
1. In TeamSpeak client, right-click server → "Permissions" → "Server Groups"
2. Group IDs typically start from 6 (regular users) and go up
3. Admins are usually group 6, regular users group 8, etc.

**Finding Your UID:**
1. Right-click your name in TeamSpeak → "Copy Unique ID"
2. Or use: Tools → Identities → Select your identity → View "Unique ID"

#### Bot Settings
- `commandPrefix`: Command prefix (default: "!")
- `maxQueueSize`: Maximum songs allowed in queue
- `defaultVolume`: Default volume level (0-100)

## Usage

### Starting the Bot

**Production:**
```bash
npm start
```

**Development (with auto-restart):**
```bash
npm run dev
```

### Commands

All commands use the prefix defined in config (default: `!`):

| Command | Description | Example |
|---------|-------------|---------|
| `!play <URL/query>` | Play a YouTube video or search query | `!play https://youtube.com/watch?v=...` or `!play never gonna give you up` |
| `!search <query>` | Search YouTube and display results | `!search lofi hip hop` |
| `!queue` | Display current queue | `!queue` |
| `!skip` | Skip current song | `!skip` |
| `!pause` | Pause playback | `!pause` |
| `!resume` | Resume playback | `!resume` |
| `!stop` | Stop playback and clear queue | `!stop` |
| `!current` | Show currently playing song | `!current` |
| `!remove <position>` | Remove song from queue | `!remove 3` |
| `!clear` | Clear entire queue | `!clear` |
| `!volume [0-100]` | Set or show volume | `!volume 75` |
| `!help` | Show available commands | `!help` |

### Example Usage

```
User: !play lofi hip hop
Bot: Searching for: lofi hip hop...
Bot: Now playing: Lofi Hip Hop Radio - Beats to Relax/Study to [2:45:30]

User: !queue
Bot: [Now Playing] Lofi Hip Hop Radio - Beats to Relax/Study to [2:45:30]

User: !volume 80
Bot: Volume set to 80%

User: !skip
Bot: Skipped: Lofi Hip Hop Radio - Beats to Relax/Study to

User: !play https://www.youtube.com/watch?v=dQw4w9WgXcQ
Bot: Added to queue (position 1): Rick Astley - Never Gonna Give You Up [3:32]
```

## Permissions Setup

### Option 1: Group-Based Permissions
Only allow specific server groups to use commands:
```json
"allowedGroupIds": [6, 7, 8],
"allowedUIDs": []
```

### Option 2: UID-Based Permissions
Only allow specific users (by UID) to use commands:
```json
"allowedGroupIds": [],
"allowedUIDs": [
  "UniqueID1==",
  "UniqueID2=="
]
```

### Option 3: Combined Permissions (Require Both)
Users must be in an allowed group AND have their UID in the list:
```json
"allowedGroupIds": [6, 7],
"allowedUIDs": ["YourUID=="],
"requireBoth": true
```

### Option 4: Open Access
Allow everyone to use bot commands:
```json
"allowedGroupIds": [],
"allowedUIDs": [],
"requireBoth": false
```

## Troubleshooting

### Bot won't connect to TeamSpeak
- ✅ Verify ServerQuery credentials are correct in `config.json`
- ✅ Check that ServerQuery port (10011) is accessible
- ✅ Ensure the bot account has necessary permissions on the TeamSpeak server
- ✅ Check firewall settings aren't blocking the connection
- ✅ Make sure you're using the correct `serverport` (voice port, usually 9987)

### No audio playback
- ✅ Verify FFmpeg is installed: `ffmpeg -version`
- ✅ Check that FFmpeg is in your system PATH
- ✅ Verify the bot has "Send Voice" permission in the channel
- ✅ Try adjusting volume: `!volume 100`
- ✅ Check bot logs for error messages

### Permission denied errors
- ✅ Check your UID is in the `allowedUIDs` array
- ✅ Verify your server groups match `allowedGroupIds`
- ✅ Check the `requireBoth` setting
- ✅ Try setting both arrays to empty `[]` to allow everyone temporarily

### YouTube download errors
- ✅ **Make sure yt-dlp is installed**: Run `yt-dlp --version`
- ✅ **Check yt-dlp is in your PATH**
- ✅ Update yt-dlp to latest version: `pip install --upgrade yt-dlp`
- ✅ Some videos may be region-restricted or unavailable
- ✅ Age-restricted videos may fail to download
- ✅ Try a different video or search query
- ✅ Check internet connection

### "Cannot find module" errors
- ✅ Make sure you ran `npm install` in the bot directory
- ✅ Delete `node_modules` folder and run `npm install` again
- ✅ Check you're using Node.js v16 or higher: `node --version`

### Bot crashes or disconnects
- ✅ Check the console output for error messages
- ✅ The bot has auto-reconnect - it will try to reconnect after 5 seconds
- ✅ Check your internet connection stability
- ✅ Verify ServerQuery login hasn't been used elsewhere (only one connection per login)

## File Structure

```
teamspeak-music-bot/
├── bot.js                  # Main bot file - handles TS connection
├── config.json            # Your configuration (create from example)
├── config.example.json    # Example configuration template
├── package.json           # Node.js dependencies
├── .gitignore            # Git ignore file
├── README.md             # This file
├── downloads/            # Cached audio files (auto-created)
└── modules/
    ├── audioPlayer.js     # Audio playback and queue management
    ├── commandHandler.js  # Command processing and parsing
    ├── permissions.js     # Permission checking (groups/UIDs)
    └── youtube.js         # YouTube downloading and searching
```

## Advanced Configuration

### Automatic Cleanup
Downloaded audio files are cached in `downloads/` folder. The `youtube.js` module includes a cleanup function. To enable automatic cleanup, you can modify the bot to call:

```javascript
youtube.cleanupDownloads(24); // Delete files older than 24 hours
```

### Custom Commands
Add new commands in `modules/commandHandler.js`:

```javascript
this.commands = {
  // ... existing commands
  mycommand: this.handleMyCommand.bind(this)
};

async handleMyCommand(invoker, args) {
  await this.sendMessage(invoker, 'My custom response!');
}
```

### Running as a Service

**Linux (systemd):**
Create `/etc/systemd/system/tsbot.service`:
```ini
[Unit]
Description=TeamSpeak Music Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/teamspeak-music-bot
ExecStart=/usr/bin/node bot.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable tsbot
sudo systemctl start tsbot
```

**Windows (using NSSM):**
1. Download NSSM from https://nssm.cc/
2. Run: `nssm install TSMusicBot`
3. Set path to `node.exe` and argument to `bot.js`
4. Start service

## Security Notes

- 🔐 Keep your `config.json` file secure (contains ServerQuery password)
- 🔐 Never commit `config.json` to version control (it's in `.gitignore`)
- 🔐 Use restrictive permissions to limit bot command access
- 🔐 The bot requires ServerQuery admin access - consider using a dedicated ServerQuery user
- 🔐 Regularly update yt-dlp for security patches: `pip install --upgrade yt-dlp`

## Dependencies

**Node.js Packages:**
- `ts3-nodejs-library` - TeamSpeak 3 ServerQuery library
- `yt-dlp-wrap` - Node.js wrapper for yt-dlp
- `ytsr` - YouTube search functionality
- `ffmpeg-static` - FFmpeg binary

**External Dependencies (must be installed separately):**
- `yt-dlp` - YouTube downloader ([GitHub](https://github.com/yt-dlp/yt-dlp))
- `ffmpeg` - Audio processing ([Website](https://ffmpeg.org/))

## Updating

### Update the Bot
```bash
cd teamspeak-music-bot
git pull origin main
npm install
```

### Update yt-dlp
```bash
pip install --upgrade yt-dlp
```

### Update Node.js packages
```bash
npm update
```

## Support

For issues or questions:

1. **Check prerequisites:**
   - ✅ Run `yt-dlp --version` to verify yt-dlp is installed
   - ✅ Run `ffmpeg -version` to verify FFmpeg is installed
   - ✅ Run `node --version` to verify Node.js v16+

2. **Check configuration:**
   - ✅ Verify `config.json` has correct server details
   - ✅ Test ServerQuery credentials in TeamSpeak client

3. **Check installation:**
   - ✅ Run `npm install` to ensure all packages are installed
   - ✅ Check for error messages in console

4. **Check permissions:**
   - ✅ Verify bot has necessary TeamSpeak permissions
   - ✅ Check UID/Group ID permissions in `config.json`

5. **Check GitHub Issues:**
   - Search existing issues on the GitHub repository
   - Create a new issue with error logs and configuration (remove passwords!)

## Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs by opening an issue
- 💡 Suggest new features
- 🔧 Submit pull requests with improvements
- 📖 Improve documentation

## License

ISC

## Credits

Built with:
- [ts3-nodejs-library](https://github.com/Multivit4min/TS3-NodeJS-Library) - TeamSpeak 3 ServerQuery
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloader
- [ytsr](https://github.com/TimeForANinja/node-ytsr) - YouTube search
- [FFmpeg](https://ffmpeg.org/) - Audio processing

---

**Note:** Remember to replace `YOUR-USERNAME` in the clone URL with your actual GitHub username!

Example: `git clone https://github.com/john-doe/teamspeak-music-bot.git`
