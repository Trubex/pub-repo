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
      // Start the SinusBot instance
      await this.sinusbot.connectInstance();
      logger.success(`SinusBot instance started for ${config.teamspeak.host}`);
      return { success: true, message: 'SinusBot instance started successfully' };
    } catch (error) {
      logger.error('Failed to start SinusBot instance: ' + error.message);
      return { success: false, message: error.message };
    }
  }

  async disconnectFromTeamSpeak() {
    try {
      await this.sinusbot.disconnectInstance();
      logger.success('SinusBot instance stopped');
      return { success: true, message: 'SinusBot instance stopped successfully' };
    } catch (error) {
      logger.error('Failed to stop SinusBot instance: ' + error.message);
      return { success: false, message: error.message };
    }
  }

  async restartTeamSpeak() {
    try {
      await this.sinusbot.restartInstance();
      logger.success('SinusBot instance restarted');
      return { success: true, message: 'SinusBot instance restarted successfully' };
    } catch (error) {
      logger.error('Failed to restart SinusBot instance: ' + error.message);
      return { success: false, message: error.message };
    }
  }

  async getTeamSpeakConnectionStatus() {
    try {
      const status = await this.sinusbot.getInstanceInfo();
      const isRunning = await this.sinusbot.isInstanceConnected();

      return {
        connected: isRunning,
        server: config.teamspeak.host,
        currentTrack: status.currentTrack || null,
        playing: status.playing || false,
        nickname: 'SinusBot'
      };
    } catch (error) {
      logger.error('Failed to get instance status: ' + error.message);
      return {
        connected: false,
        server: config.teamspeak.host,
        error: error.message
      };
    }
  }

  async updateTeamSpeakServer(serverAddress, serverPassword = '') {
    try {
      logger.info(`Updating TeamSpeak server to: ${serverAddress}`);

      // Update the SinusBot instance settings
      await this.sinusbot.setTeamSpeakServer(serverAddress, serverPassword);

      // Update local config
      config.teamspeak.host = serverAddress;

      logger.success(`TeamSpeak server updated to: ${serverAddress}`);
      return { success: true, message: 'Server updated successfully' };
    } catch (error) {
      logger.error('Failed to update TeamSpeak server: ' + error.message);
      return { success: false, message: error.message };
    }
  }

  async getTeamSpeakServer() {
    try {
      const settings = await this.sinusbot.getInstanceSettings();
      return {
        success: true,
        serverAddress: settings.hostAddress || config.teamspeak.host,
        serverPort: settings.hostPort || 9987
      };
    } catch (error) {
      logger.error('Failed to get TeamSpeak server settings: ' + error.message);
      return {
        success: false,
        serverAddress: config.teamspeak.host,
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
