const SinusBotClient = require('./sinusbot-client');
const config = require('./config');
const logger = require('./logger');
const database = require('./database');

class TeamSpeakBot {
  constructor() {
    this.sinusbot = new SinusBotClient(
      config.sinusbot.host,
      config.sinusbot.username,
      config.sinusbot.password,
      config.sinusbot.instanceId
    );
    this.isConnected = false;
    this.currentChannel = null;
  }

  async connect() {
    try {
      logger.info('Connecting to SinusBot...');
      await this.sinusbot.login();
      this.isConnected = true;
      logger.success('Connected to SinusBot successfully!');

      // Check if instance is already connected to TeamSpeak
      const isConnected = await this.sinusbot.isInstanceConnected();

      if (isConnected) {
        logger.success(`SinusBot instance is already connected to TeamSpeak (${config.teamspeak.host})`);
        logger.info('Skipping reconnection to avoid disrupting the bot');
      } else {
        logger.warn(`SinusBot instance is NOT connected to TeamSpeak`);
        logger.info('Use the admin panel to connect when ready');
      }

      // Get initial status
      const status = await this.sinusbot.getStatus();
      logger.info(`Bot status - Running: ${status.running}, Playing: ${status.playing}`);

      return true;
    } catch (error) {
      logger.error('SinusBot connection failed: ' + error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    logger.info('Disconnecting from SinusBot...');
    this.isConnected = false;
    logger.success('Disconnected from SinusBot');
  }

  async reconnect() {
    logger.info('Reconnecting to SinusBot...');
    try {
      await this.disconnect();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.connect();
      logger.success('Reconnection successful');
    } catch (error) {
      logger.error('Reconnection failed: ' + error.message);
      throw error;
    }
  }

  async connectToTeamSpeak() {
    try {
      // First check if already connected
      const isConnected = await this.sinusbot.isInstanceConnected();

      if (isConnected) {
        logger.info(`SinusBot is already connected to TeamSpeak (${config.teamspeak.host})`);
        return { success: true, message: 'Already connected to TeamSpeak', alreadyConnected: true };
      }

      // Try to connect
      await this.sinusbot.connectInstance();
      logger.success(`SinusBot connected to TeamSpeak at ${config.teamspeak.host}`);
      return { success: true, message: 'Successfully connected to TeamSpeak' };
    } catch (error) {
      logger.error('Failed to connect to TeamSpeak: ' + error.message);
      return { success: false, message: error.message };
    }
  }

  async disconnectFromTeamSpeak() {
    try {
      await this.sinusbot.disconnectInstance();
      logger.success('SinusBot disconnected from TeamSpeak');
      return { success: true, message: 'Successfully disconnected from TeamSpeak' };
    } catch (error) {
      logger.error('Failed to disconnect from TeamSpeak: ' + error.message);
      return { success: false, message: error.message };
    }
  }

  async getTeamSpeakConnectionStatus() {
    try {
      const isConnected = await this.sinusbot.isInstanceConnected();
      const info = await this.sinusbot.getInstanceInfo();
      return {
        connected: isConnected,
        server: config.teamspeak.host,
        instanceRunning: info.running,
        nickname: info.nick || 'SinusBot'
      };
    } catch (error) {
      logger.error('Failed to get TeamSpeak connection status: ' + error.message);
      return {
        connected: false,
        server: config.teamspeak.host,
        error: error.message
      };
    }
  }

  async joinChannel(channelName) {
    logger.warn('Channel joining is managed by SinusBot settings');
    logger.info('Please use the SinusBot web interface to configure the channel');
    return { success: false, message: 'Use SinusBot web interface for channel configuration' };
  }

  async getChannelList() {
    try {
      const data = await this.sinusbot.getChannels();
      return data.channel || [];
    } catch (error) {
      logger.error('Failed to get channel list: ' + error.message);
      return [];
    }
  }

  async getCurrentChannel() {
    // This would need to be tracked separately or retrieved from SinusBot status
    return this.currentChannel;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      serverName: config.sinusbot.host,
      nickname: 'SinusBot',
      currentChannel: this.currentChannel
    };
  }
}

module.exports = TeamSpeakBot;
