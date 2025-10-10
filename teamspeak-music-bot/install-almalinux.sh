#!/bin/bash
# TeamSpeak Music Bot Installation Script
# For AlmaLinux/RHEL/Rocky Linux/CentOS

set -e

echo "================================================"
echo "TeamSpeak Music Bot - AlmaLinux/RHEL Installer"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root. Consider using a regular user."
    echo ""
fi

# Check AlmaLinux version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "Detected: $NAME $VERSION"
    echo ""
fi

# Enable EPEL repository (needed for some packages)
if ! rpm -q epel-release &> /dev/null; then
    echo "📦 Installing EPEL repository..."
    sudo dnf install -y epel-release
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    read -p "Install Node.js 20.x? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing Node.js 20.x..."
        # Add NodeSource repository
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo dnf install -y nodejs
    else
        echo "Please install Node.js v16 or higher manually"
        exit 1
    fi
fi

echo "✅ Node.js $(node --version) found"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    sudo dnf install -y npm
fi

echo "✅ npm $(npm --version) found"

# Install Python 3 and pip (needed for yt-dlp)
if ! command -v python3 &> /dev/null; then
    echo "📦 Installing Python 3..."
    sudo dnf install -y python3 python3-pip
elif ! command -v pip3 &> /dev/null; then
    echo "📦 Installing Python pip..."
    sudo dnf install -y python3-pip
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "📦 Installing yt-dlp..."

    # Install via pip (most reliable method for RHEL-based systems)
    sudo pip3 install yt-dlp

    echo "✅ yt-dlp installed"
else
    echo "✅ yt-dlp $(yt-dlp --version | head -n1) found"
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 Installing FFmpeg..."

    # Enable RPM Fusion Free repository for FFmpeg
    if ! rpm -q rpmfusion-free-release &> /dev/null; then
        echo "Enabling RPM Fusion repository..."
        sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
    fi

    sudo dnf install -y ffmpeg
else
    echo "✅ FFmpeg $(ffmpeg -version | head -n1 | awk '{print $3}') found"
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing git..."
    sudo dnf install -y git
fi

# Install development tools (may be needed for some npm packages)
if ! rpm -q gcc-c++ &> /dev/null; then
    echo "📦 Installing build tools..."
    sudo dnf groupinstall -y "Development Tools"
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

# Set up firewall rules if firewalld is running
if systemctl is-active --quiet firewalld; then
    echo ""
    echo "⚠️  Firewalld is active. You may need to allow TeamSpeak ports:"
    echo "  sudo firewall-cmd --permanent --add-port=10011/tcp  # ServerQuery"
    echo "  sudo firewall-cmd --permanent --add-port=9987/udp   # Voice"
    echo "  sudo firewall-cmd --reload"
    echo ""
fi

echo ""
echo "================================================"
echo "Installation complete!"
echo "================================================"
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
echo "SELinux note:"
echo "  If you encounter permission issues, you may need to:"
echo "  sudo setenforce 0  (temporarily disable)"
echo "  Or configure SELinux policies properly"
echo ""
echo "For help, see README.md"
