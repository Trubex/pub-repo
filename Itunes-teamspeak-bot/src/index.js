const TeamSpeakBot = require('./teamspeak-bot');
const iTunesClient = require('./itunes-client');
const WebServer = require('./web-server');
const database = require('./database');
const config = require('./config');
const logger = require('./logger');

class iTunesTeamSpeakBot {
  constructor() {
    this.itunesClient = new iTunesClient();
    this.tsBot = new TeamSpeakBot();
    this.webServer = new WebServer(this.tsBot, this.itunesClient);
    this.isRunning = false;
  }

  async start() {
    try {
      logger.info('Starting iTunes TeamSpeak Bot...');

      // Connect to MySQL
      logger.info('Connecting to MySQL...');
      await database.connect();
      logger.success('MySQL connected successfully');

      // Start web server
      logger.info('Starting web server...');
      await this.webServer.start();
      logger.success(`Web server running on port ${config.web.port}`);

      // Connect to TeamSpeak (optional - will not fail if connection fails)
      logger.info('Connecting to TeamSpeak 3...');
      try {
        await this.tsBot.connect();
        logger.success('TeamSpeak connection successful');
      } catch (error) {
        logger.warn('Cannot connect to TeamSpeak: ' + error.message);
        logger.warn('The bot will continue to run without TeamSpeak integration.');
      }

      // Check iTunes connection
      logger.info('Checking iTunes connection...');
      const itunesConnected = await this.itunesClient.isConnected();
      if (itunesConnected) {
        logger.success('iTunes connection successful');
      } else {
        logger.warn('Cannot connect to iTunes. Make sure iTunes control script is running on host.');
      }

      this.isRunning = true;
      logger.success('\n========================================');
      logger.success('iTunes TeamSpeak Bot is now running!');
      logger.info(`Web GUI: http://localhost:${config.web.port}`);
      if (this.tsBot.isConnected) {
        logger.info(`TeamSpeak: Connected to ${config.teamspeak.host}`);
      } else {
        logger.warn('TeamSpeak: Not connected (web GUI still available)');
      }
      logger.success('========================================\n');

    } catch (error) {
      logger.error('Failed to start bot: ' + error.message, error);
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
