const TeamSpeakBot = require('./teamspeak-bot');
const iTunesClient = require('./itunes-client');
const WebServer = require('./web-server');
const database = require('./database');
const config = require('./config');

class iTunesTeamSpeakBot {
  constructor() {
    this.itunesClient = new iTunesClient();
    this.tsBot = new TeamSpeakBot();
    this.webServer = new WebServer(this.tsBot, this.itunesClient);
    this.isRunning = false;
  }

  async start() {
    try {
      console.log('Starting iTunes TeamSpeak Bot...');

      // Connect to MySQL
      console.log('Connecting to MySQL...');
      await database.connect();

      // Start web server
      console.log('Starting web server...');
      await this.webServer.start();

      // Connect to TeamSpeak (optional - will not fail if connection fails)
      console.log('Connecting to TeamSpeak 3...');
      try {
        await this.tsBot.connect();
        console.log('TeamSpeak connection successful');
      } catch (error) {
        console.warn('WARNING: Cannot connect to TeamSpeak:', error.message);
        console.warn('The bot will continue to run without TeamSpeak integration.');
      }

      // Check iTunes connection
      console.log('Checking iTunes connection...');
      const itunesConnected = await this.itunesClient.isConnected();
      if (itunesConnected) {
        console.log('iTunes connection successful');
      } else {
        console.warn('WARNING: Cannot connect to iTunes. Make sure iTunes control script is running on host.');
      }

      this.isRunning = true;
      console.log('\n========================================');
      console.log('iTunes TeamSpeak Bot is now running!');
      console.log(`Web GUI: http://localhost:${config.web.port}`);
      if (this.tsBot.isConnected) {
        console.log(`TeamSpeak: Connected to ${config.teamspeak.host}`);
      } else {
        console.log('TeamSpeak: Not connected (web GUI still available)');
      }
      console.log('========================================\n');

    } catch (error) {
      console.error('Failed to start bot:', error);
      await this.stop();
      process.exit(1);
    }
  }

  async stop() {
    console.log('Stopping iTunes TeamSpeak Bot...');

    try {
      if (this.tsBot) {
        await this.tsBot.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting TeamSpeak:', error);
    }

    try {
      if (this.webServer) {
        await this.webServer.stop();
      }
    } catch (error) {
      console.error('Error stopping web server:', error);
    }

    try {
      if (database) {
        await database.close();
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }

    this.isRunning = false;
    console.log('Bot stopped');
  }
}

// Create and start bot
const bot = new iTunesTeamSpeakBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
bot.start();
