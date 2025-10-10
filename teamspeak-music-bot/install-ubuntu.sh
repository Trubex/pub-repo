#!/bin/bash
# TeamSpeak Music Bot Installation Script
# For Ubuntu/Debian-based systems

set -e

echo "=============================================="
echo "TeamSpeak Music Bot - Ubuntu/Debian Installer"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root. Consider using a regular user."
    echo ""
fi

# Update package list
echo "📦 Updating package list..."
sudo apt-get update -qq

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    read -p "Install Node.js 20.x? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Node.js 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Please install Node.js v16 or higher manually"
        exit 1
    fi
fi

echo "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    sudo apt-get install -y npm
fi

echo "✅ npm $(npm --version) found"

# Check if Python pip is installed (needed for yt-dlp)
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo "📦 Installing Python pip..."
    sudo apt-get install -y python3-pip
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "📦 Installing yt-dlp..."

    # Try apt first (Ubuntu 22.04+)
    if sudo apt-get install -y yt-dlp 2>/dev/null; then
        echo "✅ yt-dlp installed via apt"
    else
        # Fall back to pip
        echo "Installing yt-dlp via pip..."
        sudo pip3 install yt-dlp
    fi
else
    echo "✅ yt-dlp $(yt-dlp --version | head -n1) found"
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 Installing FFmpeg..."
    sudo apt-get install -y ffmpeg
else
    echo "✅ FFmpeg $(ffmpeg -version | head -n1 | awk '{print $3}') found"
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing git..."
    sudo apt-get install -y git
fi

echo ""
echo "Installing Node.js dependencies..."
npm install

echo ""
# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "Creating config.json from example..."
    cp config.example.json config.json
    echo "✅ config.json created"
    echo ""
    echo "⚠️  IMPORTANT: Edit config.json with your TeamSpeak server details!"
    echo ""
    echo "You can edit it with:"
    echo "  nano config.json"
    echo "  or"
    echo "  vi config.json"
    echo ""
else
    echo "✅ config.json already exists"
fi

# Create downloads directory
mkdir -p downloads
echo "✅ Created downloads directory"

echo ""
echo "=============================================="
echo "Installation complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Edit config.json:    nano config.json"
echo "2. Test the bot:        npm start"
echo "3. Run in background:   npm start &"
echo "4. Install as service:  sudo ./install-service.sh"
echo ""
echo "To update yt-dlp later:"
echo "  sudo pip3 install --upgrade yt-dlp"
echo ""
echo "For help, see README.md"
