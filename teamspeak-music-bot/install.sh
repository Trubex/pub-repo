#!/bin/bash
# TeamSpeak Music Bot Installation Script
# For Linux and macOS

set -e

echo "======================================"
echo "TeamSpeak Music Bot - Quick Installer"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js v16 or higher from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm $(npm --version) found"

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️  yt-dlp is not installed!"
    echo ""
    echo "Install yt-dlp with one of these commands:"
    echo "  - pip install yt-dlp"
    echo "  - sudo apt install yt-dlp (Ubuntu/Debian)"
    echo "  - brew install yt-dlp (macOS)"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ yt-dlp $(yt-dlp --version | head -n1) found"
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg is not installed!"
    echo ""
    echo "Install FFmpeg with one of these commands:"
    echo "  - sudo apt install ffmpeg (Ubuntu/Debian)"
    echo "  - brew install ffmpeg (macOS)"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ FFmpeg $(ffmpeg -version | head -n1 | awk '{print $3}') found"
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
    echo "   - host: Your TeamSpeak server IP"
    echo "   - username: ServerQuery username"
    echo "   - password: ServerQuery password"
    echo "   - channel: Channel name to join"
    echo ""
else
    echo "✅ config.json already exists"
fi

echo ""
echo "======================================"
echo "Installation complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit config.json with your TeamSpeak server details"
echo "2. Run: npm start"
echo ""
echo "For help, see README.md"
