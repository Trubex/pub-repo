# iTunes TeamSpeak Bot

A self-hosted TeamSpeak 3 music bot with iTunes integration and web GUI. The bot runs in Docker and controls iTunes running on your host machine.

## Features

- TeamSpeak 3 bot with music control commands
- Web GUI for remote control and monitoring
- iTunes integration (Windows/macOS)
- MySQL database for playback history
- Docker containerized deployment
- Pterodactyl compatible port configuration
- Full playback controls: play, pause, stop, skip, search, volume

## Architecture

- **Bot Container**: Runs the TeamSpeak bot and web server in Docker
- **MySQL Container**: Stores playback history and session data
- **Host iTunes Server**: Runs on your host machine to control iTunes

## Requirements

- Docker and Docker Compose
- Node.js 18+ (for host iTunes control server)
- iTunes (Windows) or Music app (macOS) installed on host
- TeamSpeak 3 server

## Installation

### 1. Clone/Setup the Repository

```bash
cd itunes-teamspeak-bot
```

### 2. Configure Environment Variables

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# TeamSpeak 3 Server Configuration
TS3_HOST=your.teamspeak.server
TS3_QUERY_PORT=10011
TS3_SERVER_PORT=9987
TS3_USERNAME=serveradmin
TS3_PASSWORD=your_password
TS3_NICKNAME=iTunes Bot
TS3_CHANNEL=Music Channel

# Web GUI Configuration
WEB_PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# MySQL Database Configuration
MYSQL_ROOT_PASSWORD=secure_root_password
MYSQL_USER=itunesbot
MYSQL_PASSWORD=secure_database_password
MYSQL_DATABASE=itunesbot

# iTunes Remote Control Configuration
ITUNES_PLATFORM=windows  # or 'macos'
ITUNES_HOST=host.docker.internal
ITUNES_PORT=8181

# Session Secret
SESSION_SECRET=your_random_secret_key_here
```

### 3. Set Up iTunes Control Server on Host Machine

The iTunes control server must run on your **host machine** (not in Docker) to access iTunes.

#### On Windows:

```bash
cd host-scripts
npm install
npm run start:windows
```

#### On macOS:

```bash
cd host-scripts
npm install
npm run start:macos
```

The server will start on port 8181 (or your configured `ITUNES_PORT`).

**Important**: Keep this server running while using the bot!

### 4. Start the Bot with Docker Compose

```bash
docker-compose up -d
```

This will start:
- MySQL database
- TeamSpeak bot container
- Web GUI server

### 5. Access the Web GUI

Open your browser and navigate to:

```
http://localhost:3000
```

Login with the credentials you set in `.env`:
- Username: `admin` (or your configured username)
- Password: Your configured password

## Usage

### TeamSpeak Commands

Connect to your TeamSpeak server and send private messages to the bot:

- `!play [search]` - Play a track or resume playback
- `!pause` - Pause playback
- `!stop` - Stop playback
- `!skip` / `!next` - Skip to next track
- `!previous` / `!prev` - Go to previous track
- `!volume [0-100]` - Set or get volume
- `!current` / `!np` - Show currently playing track
- `!search <query>` - Search for tracks
- `!help` - Show available commands

### Web GUI

The web GUI provides:
- Real-time status monitoring (TeamSpeak & iTunes connection)
- Player controls (play, pause, stop, skip, previous)
- Volume control
- Search and play tracks
- Playback history

## Pterodactyl Configuration

To use with Pterodactyl:

1. Set the `WEB_PORT` environment variable in Pterodactyl to match the allocated port
2. The bot will automatically bind to `0.0.0.0` and use the configured port
3. Make sure to set up the iTunes control server on the Pterodactyl node (host machine)

### Example Pterodactyl Startup

```bash
docker-compose up
```

### Environment Variables in Pterodactyl

Add these as environment variables in your Pterodactyl egg:
- `WEB_PORT` - Port allocated by Pterodactyl
- `TS3_HOST` - Your TeamSpeak server
- `TS3_USERNAME` - TeamSpeak query username
- `TS3_PASSWORD` - TeamSpeak query password
- `ADMIN_PASSWORD` - Web GUI admin password
- All other variables from `.env.example`

## Troubleshooting

### Bot can't connect to iTunes

**Problem**: `WARNING: Cannot connect to iTunes`

**Solutions**:
1. Make sure iTunes is **running** on your host machine
2. Verify the iTunes control server is running (`npm run start:windows` or `npm run start:macos`)
3. Check that port 8181 is accessible from Docker (firewall settings)
4. On Windows: Ensure iTunes is installed and not the Microsoft Store version
5. On macOS: Grant terminal permissions to control Music/iTunes in System Preferences

### TeamSpeak connection issues

**Problem**: Bot disconnects or can't connect

**Solutions**:
1. Verify TeamSpeak server credentials
2. Check that query port (10011) is accessible
3. Ensure bot user has sufficient permissions
4. Check TeamSpeak server logs

### Web GUI port issues

**Problem**: Can't access web GUI

**Solutions**:
1. Verify `WEB_PORT` is correctly set in `.env`
2. Check Docker port mapping: `docker-compose ps`
3. Ensure no other service is using the port
4. For Pterodactyl: Verify allocation matches `WEB_PORT`

### Database connection issues

**Problem**: MySQL connection errors

**Solutions**:
1. Wait for MySQL to fully start (check with `docker-compose logs mysql`)
2. Verify MySQL credentials in `.env`
3. Reset database: `docker-compose down -v && docker-compose up -d`

## Development

### Building from source

```bash
docker-compose build
```

### Viewing logs

```bash
# All services
docker-compose logs -f

# Bot only
docker-compose logs -f bot

# MySQL only
docker-compose logs -f mysql
```

### Stopping the bot

```bash
docker-compose down
```

### Resetting the database

```bash
docker-compose down -v
docker-compose up -d
```

## Project Structure

```
itunes-teamspeak-bot/
├── src/
│   ├── index.js              # Main entry point
│   ├── config.js             # Configuration management
│   ├── database.js           # MySQL database handler
│   ├── teamspeak-bot.js      # TeamSpeak bot logic
│   ├── itunes-client.js      # iTunes API client
│   ├── web-server.js         # Express web server
│   └── views/                # EJS templates
│       ├── login.ejs         # Login page
│       ├── dashboard.ejs     # Main dashboard
│       └── history.ejs       # Playback history
├── host-scripts/
│   ├── itunes-server-windows.js  # Windows iTunes control
│   ├── itunes-server-macos.js    # macOS iTunes/Music control
│   └── package.json              # Host server dependencies
├── Dockerfile                # Docker image definition
├── docker-compose.yml        # Docker composition
├── package.json              # Bot dependencies
└── .env.example              # Environment template
```

## Security Notes

- Change default passwords in `.env`
- Use strong `SESSION_SECRET`
- Keep `.env` file secure (never commit to git)
- Use firewall to restrict access to web GUI
- The bot uses basic authentication - consider adding HTTPS for production

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - See LICENSE file for details
