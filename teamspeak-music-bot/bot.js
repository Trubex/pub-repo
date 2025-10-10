const { TeamSpeak } = require('ts3-nodejs-library');
const fs = require('fs');
const path = require('path');
const AudioPlayer = require('./modules/audioPlayer');
const CommandHandler = require('./modules/commandHandler');
const PermissionsManager = require('./modules/permissions');

class MusicBot {
  constructor() {
    this.config = this.loadConfig();
    this.teamspeak = null;
    this.audioPlayer = null;
    this.commandHandler = null;
    this.permissionsManager = null;
    this.botClient = null;
  }

  loadConfig() {
    const configPath = path.join(__dirname, 'config.json');
    if (!fs.existsSync(configPath)) {
      console.error('Config file not found! Please copy config.example.json to config.json and configure it.');
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  async connect() {
    try {
      console.log('Connecting to TeamSpeak server...');

      this.teamspeak = await TeamSpeak.connect({
        host: this.config.teamspeak.host,
        queryport: this.config.teamspeak.queryport,
        serverport: this.config.teamspeak.serverport,
        username: this.config.teamspeak.username,
        password: this.config.teamspeak.password,
        nickname: this.config.teamspeak.nickname
      });

      console.log('Connected to TeamSpeak server!');

      // Get bot client
      this.botClient = await this.teamspeak.whoami();
      console.log(`Bot client ID: ${this.botClient.client_id}`);

      // Initialize modules
      this.permissionsManager = new PermissionsManager(this.config.permissions, this.teamspeak);
      this.audioPlayer = new AudioPlayer(this.teamspeak, this.config.bot);
      this.commandHandler = new CommandHandler(
        this.teamspeak,
        this.audioPlayer,
        this.permissionsManager,
        this.config.bot
      );

      // Move to specified channel
      await this.moveToChannel();

      // Set up event handlers
      this.setupEventHandlers();

      console.log('Bot is ready!');
    } catch (error) {
      console.error('Failed to connect:', error);
      process.exit(1);
    }
  }

  async moveToChannel() {
    try {
      const channels = await this.teamspeak.channelList();
      const targetChannel = channels.find(
        channel => channel.name === this.config.teamspeak.channel
      );

      if (targetChannel) {
        await this.teamspeak.clientMove(this.botClient.client_id, targetChannel.cid);
        console.log(`Moved to channel: ${this.config.teamspeak.channel}`);
      } else {
        console.warn(`Channel "${this.config.teamspeak.channel}" not found. Staying in current channel.`);
      }
    } catch (error) {
      console.error('Failed to move to channel:', error);
    }
  }

  setupEventHandlers() {
    // Handle text messages
    this.teamspeak.on('textmessage', async (event) => {
      await this.commandHandler.handleMessage(event);
    });

    // Handle client connections
    this.teamspeak.on('clientconnect', (event) => {
      console.log(`Client connected: ${event.client.nickname}`);
    });

    // Handle errors
    this.teamspeak.on('error', (error) => {
      console.error('TeamSpeak error:', error);
    });

    // Handle close
    this.teamspeak.on('close', () => {
      console.log('Connection closed. Attempting to reconnect...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  async shutdown() {
    console.log('Shutting down bot...');
    if (this.audioPlayer) {
      await this.audioPlayer.stop();
    }
    if (this.teamspeak) {
      await this.teamspeak.quit();
    }
    process.exit(0);
  }
}

// Create and start bot
const bot = new MusicBot();
bot.connect();

// Handle graceful shutdown
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());
