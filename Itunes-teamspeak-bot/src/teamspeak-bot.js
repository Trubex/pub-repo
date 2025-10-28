const SinusBotClient = require('./sinusbot-client');
const config = require('./config');
const logger = require('./logger');
const database = require('./database');

class TeamSpeakBot {
  constructor() {
    this.sinusbot = new SinusBotClient(
      config.sinusbot.host,
      config.sinusbot.username,
      config.sinusbot.password
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
