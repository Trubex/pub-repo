# Installation Guide - TeamSpeak Music Bot

Complete installation instructions for all supported platforms.

## Table of Contents
- [Ubuntu/Debian Installation](#ubuntudebian-installation)
- [AlmaLinux/RHEL Installation](#almalinuxrhel-installation)
- [Windows Installation](#windows-installation)
- [Running as a Service](#running-as-a-service)
- [Manual Installation](#manual-installation)

---

## Ubuntu/Debian Installation

### Automated Installation (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot

# 2. Run the Ubuntu installer
chmod +x install-ubuntu.sh
./install-ubuntu.sh

# 3. Edit configuration
nano config.json

# 4. Start the bot
npm start
```

### What the installer does:
- ✅ Updates package lists
- ✅ Installs Node.js 20.x (if not installed)
- ✅ Installs yt-dlp (via apt or pip)
- ✅ Installs FFmpeg
- ✅ Installs all npm dependencies
- ✅ Creates config.json from template
- ✅ Creates downloads directory

### Manual Ubuntu Installation

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
sudo apt-get install -y yt-dlp ffmpeg git python3-pip

# If yt-dlp not available via apt:
sudo pip3 install yt-dlp

# Clone and setup
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot
npm install
cp config.example.json config.json
nano config.json
```

---

## AlmaLinux/RHEL Installation

### Automated Installation (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot

# 2. Run the AlmaLinux installer
chmod +x install-almalinux.sh
./install-almalinux.sh

# 3. Edit configuration
nano config.json

# 4. Start the bot
npm start
```

### What the installer does:
- ✅ Installs EPEL repository
- ✅ Installs Node.js 20.x (if not installed)
- ✅ Installs Python 3 and pip
- ✅ Installs yt-dlp via pip
- ✅ Installs FFmpeg (via RPM Fusion)
- ✅ Installs development tools
- ✅ Installs all npm dependencies
- ✅ Creates config.json from template
- ✅ Provides firewall configuration hints

### Manual AlmaLinux Installation

```bash
# Enable EPEL and RPM Fusion
sudo dnf install -y epel-release
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Install dependencies
sudo dnf install -y python3-pip ffmpeg git
sudo pip3 install yt-dlp

# Install build tools (needed for some npm packages)
sudo dnf groupinstall -y "Development Tools"

# Clone and setup
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot
npm install
cp config.example.json config.json
nano config.json
```

### Firewall Configuration (AlmaLinux/RHEL)

If you need to access TeamSpeak from external networks:

```bash
# Allow TeamSpeak ports
sudo firewall-cmd --permanent --add-port=10011/tcp  # ServerQuery
sudo firewall-cmd --permanent --add-port=9987/udp   # Voice
sudo firewall-cmd --reload

# Check rules
sudo firewall-cmd --list-all
```

### SELinux Considerations

If you encounter permission issues:

```bash
# Check SELinux status
sestatus

# Temporarily disable (for testing only)
sudo setenforce 0

# Re-enable
sudo setenforce 1

# For permanent solution, configure SELinux policies properly
# Or set to permissive mode in /etc/selinux/config
```

---

## Windows Installation

### Automated Installation (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot

# 2. Run the Windows installer
install.bat

# 3. Edit configuration
notepad config.json

# 4. Start the bot
npm start
```

### Manual Windows Installation

```powershell
# Install Node.js (download from https://nodejs.org/)
# Install Git (download from https://git-scm.com/)

# Install yt-dlp
winget install yt-dlp

# Install FFmpeg
winget install FFmpeg

# Clone and setup
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot
npm install
Copy-Item config.example.json config.json
notepad config.json
```

---

## Running as a Service

### Linux Systems (Ubuntu, AlmaLinux, etc.)

Run the bot as a systemd service so it starts automatically on boot:

```bash
# 1. Make sure the bot is configured and tested
npm start
# Press Ctrl+C to stop

# 2. Install as a service
sudo ./install-service.sh

# 3. Service is now running and enabled
```

### Service Management Commands

```bash
# Start the service
sudo systemctl start tsbot

# Stop the service
sudo systemctl stop tsbot

# Restart the service
sudo systemctl restart tsbot

# Check status
sudo systemctl status tsbot

# View logs (live)
sudo journalctl -u tsbot -f

# View recent logs
sudo journalctl -u tsbot -n 100

# Enable on boot (already done by installer)
sudo systemctl enable tsbot

# Disable on boot
sudo systemctl disable tsbot
```

### Manual Service Installation

If the installer doesn't work, you can manually create the service:

```bash
# 1. Edit the template service file
nano tsbot.service

# 2. Update these fields:
#    User=YOUR_USERNAME
#    WorkingDirectory=/full/path/to/teamspeak-music-bot
#    ExecStart=/usr/bin/node /full/path/to/teamspeak-music-bot/bot.js

# 3. Copy to systemd
sudo cp tsbot.service /etc/systemd/system/

# 4. Reload and start
sudo systemctl daemon-reload
sudo systemctl enable tsbot
sudo systemctl start tsbot
```

### Windows Service (using NSSM)

```powershell
# 1. Download NSSM from https://nssm.cc/download
# 2. Extract nssm.exe

# Install service
nssm install TSMusicBot

# In the GUI:
# - Path: C:\Program Files\nodejs\node.exe
# - Startup directory: C:\path\to\teamspeak-music-bot
# - Arguments: bot.js

# Or via command line:
nssm install TSMusicBot "C:\Program Files\nodejs\node.exe" "C:\path\to\teamspeak-music-bot\bot.js"
nssm set TSMusicBot AppDirectory "C:\path\to\teamspeak-music-bot"
nssm start TSMusicBot
```

---

## Manual Installation (All Platforms)

### Prerequisites

1. **Install Node.js** (v16 or higher)
   - Ubuntu: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
   - AlmaLinux: `curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo dnf install -y nodejs`
   - Windows: Download from https://nodejs.org/
   - macOS: `brew install node`

2. **Install yt-dlp**
   - Ubuntu: `sudo apt install yt-dlp` or `sudo pip3 install yt-dlp`
   - AlmaLinux: `sudo pip3 install yt-dlp`
   - Windows: `winget install yt-dlp`
   - macOS: `brew install yt-dlp`

3. **Install FFmpeg**
   - Ubuntu: `sudo apt install ffmpeg`
   - AlmaLinux: Enable RPM Fusion, then `sudo dnf install ffmpeg`
   - Windows: `winget install FFmpeg`
   - macOS: `brew install ffmpeg`

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/YOUR-USERNAME/teamspeak-music-bot.git
cd teamspeak-music-bot

# 2. Install Node.js dependencies
npm install

# 3. Create configuration
cp config.example.json config.json

# 4. Edit configuration
nano config.json  # or vi, vim, notepad, etc.

# 5. Test the bot
npm start

# 6. (Optional) Install as service
sudo ./install-service.sh
```

---

## Configuration

Edit `config.json` with your TeamSpeak server details:

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
    "allowedUIDs": ["your-uid-here"],
    "requireBoth": false
  },
  "bot": {
    "commandPrefix": "!",
    "maxQueueSize": 50,
    "defaultVolume": 50
  }
}
```

See main [README.md](README.md) for detailed configuration options.

---

## Troubleshooting

### Ubuntu/Debian Issues

**"Package yt-dlp not found":**
```bash
# Install via pip instead
sudo apt install python3-pip
sudo pip3 install yt-dlp
```

**Permission denied errors:**
```bash
# Make sure you own the bot directory
sudo chown -R $USER:$USER ~/teamspeak-music-bot
```

### AlmaLinux/RHEL Issues

**"No package ffmpeg available":**
```bash
# Install RPM Fusion repository
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
sudo dnf install -y ffmpeg
```

**SELinux blocking the bot:**
```bash
# Check SELinux denials
sudo ausearch -m avc -ts recent

# Temporary: Set to permissive
sudo setenforce 0

# Permanent: Edit /etc/selinux/config
sudo vi /etc/selinux/config
# Change: SELINUX=permissive
```

**Firewall blocking connections:**
```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=10011/tcp
sudo firewall-cmd --reload
```

### General Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**yt-dlp not found:**
```bash
# Verify installation
yt-dlp --version

# Check PATH
echo $PATH

# Install in user directory
pip3 install --user yt-dlp
```

**Bot crashes immediately:**
```bash
# Check logs
npm start

# Or if running as service
sudo journalctl -u tsbot -f
```

---

## Updating

### Update the Bot
```bash
cd teamspeak-music-bot
git pull origin main
npm install

# If running as service
sudo systemctl restart tsbot
```

### Update yt-dlp
```bash
# Ubuntu/AlmaLinux
sudo pip3 install --upgrade yt-dlp

# Windows
winget upgrade yt-dlp

# macOS
brew upgrade yt-dlp
```

---

## Support

For more help, see:
- [README.md](README.md) - Main documentation
- [GitHub Issues](https://github.com/YOUR-USERNAME/teamspeak-music-bot/issues) - Report bugs
- Check system logs: `sudo journalctl -u tsbot -f` (Linux)

Replace `YOUR-USERNAME` with your actual GitHub username!
