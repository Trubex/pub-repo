#!/bin/bash
# Install TeamSpeak Music Bot as a systemd service
# For Linux systems (Ubuntu, AlmaLinux, etc.)

set -e

echo "=========================================="
echo "TeamSpeak Music Bot - Service Installer"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Get the current directory (bot installation directory)
BOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Bot directory: $BOT_DIR"

# Get the current user (the one who ran sudo)
if [ -n "$SUDO_USER" ]; then
    BOT_USER="$SUDO_USER"
else
    BOT_USER="$(whoami)"
fi

echo "Bot will run as user: $BOT_USER"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    exit 1
fi

NODE_PATH=$(which node)
echo "Node.js path: $NODE_PATH"

# Check if config.json exists
if [ ! -f "$BOT_DIR/config.json" ]; then
    echo "❌ config.json not found!"
    echo "Please create and configure config.json before installing as a service"
    exit 1
fi

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/tsbot.service"

echo "Creating systemd service file: $SERVICE_FILE"

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=TeamSpeak YouTube Music Bot
After=network.target

[Service]
Type=simple
User=$BOT_USER
WorkingDirectory=$BOT_DIR
ExecStart=$NODE_PATH $BOT_DIR/bot.js
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tsbot

# Security settings
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created"

# Reload systemd
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
echo "Enabling service to start on boot..."
systemctl enable tsbot.service

echo ""
echo "=========================================="
echo "Service installed successfully!"
echo "=========================================="
echo ""
echo "Service commands:"
echo "  Start:   sudo systemctl start tsbot"
echo "  Stop:    sudo systemctl stop tsbot"
echo "  Restart: sudo systemctl restart tsbot"
echo "  Status:  sudo systemctl status tsbot"
echo "  Logs:    sudo journalctl -u tsbot -f"
echo ""
echo "The service is enabled and will start automatically on boot."
echo ""
read -p "Start the service now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting service..."
    systemctl start tsbot.service
    sleep 2
    systemctl status tsbot.service --no-pager
    echo ""
    echo "Service started! Check logs with: sudo journalctl -u tsbot -f"
else
    echo "Service not started. Start it manually with: sudo systemctl start tsbot"
fi

echo ""
echo "To remove the service later:"
echo "  sudo systemctl stop tsbot"
echo "  sudo systemctl disable tsbot"
echo "  sudo rm /etc/systemd/system/tsbot.service"
echo "  sudo systemctl daemon-reload"
