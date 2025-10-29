const fetch = require('node-fetch');
const logger = require('./logger');

class SinusBotClient {
  constructor(host, username, password, instanceId = null) {
    // Remove any trailing slashes or hash fragments from host
    // Handle both /#/ and trailing slashes
    this.host = host
      .replace(/\/#.*$/, '')  // Remove /#/ and everything after
      .replace(/#.*$/, '')     // Remove # and everything after
      .replace(/\/$/, '');     // Remove trailing slash

    logger.info(`SinusBot host cleaned: ${this.host}`);
    this.username = username;
    this.password = password;
    this.token = null;
    this.botId = null;
    this.instanceId = instanceId; // Can be pre-configured
    this.isConnected = false;
  }

  async login() {
    try {
      logger.info(`Logging into SinusBot at ${this.host}...`);

      // First, try to get bot list to find the botId
      let botId = null;
      try {
        const botsResponse = await fetch(`${this.host}/api/v1/botId`);
        if (botsResponse.ok) {
          const botsData = await botsResponse.json();
          if (botsData.defaultBotId) {
            botId = botsData.defaultBotId;
            logger.info(`Found default bot ID: ${botId}`);
          }
        }
      } catch (error) {
        logger.warn('Could not get bot ID, will try login without it');
      }

      const loginBody = {
        username: this.username,
        password: this.password
      };

      if (botId) {
        loginBody.botId = botId;
      }

      const response = await fetch(`${this.host}/api/v1/bot/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginBody)
      });

      const responseText = await response.text();
      logger.info(`Response status: ${response.status}, body: ${responseText.substring(0, 300)}`);

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      this.token = data.token;
      this.botId = data.botId || botId;

      logger.success('Successfully logged into SinusBot');
      logger.info(`Token: ${this.token ? 'received' : 'missing'}`);
      logger.info(`Bot ID: ${this.botId}`);

      // Get instances
      await this.getInstances();

      this.isConnected = true;
      return true;
    } catch (error) {
      logger.error('SinusBot login failed: ' + error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async getInstances() {
    // If instance ID is pre-configured, use it
    if (this.instanceId) {
      logger.info(`Using pre-configured instance ID: ${this.instanceId}`);
      return;
    }

    try {
      const response = await fetch(`${this.host}/api/v1/bot/instances`, {
        headers: {
          'Authorization': `bearer ${this.token}`
        }
      });

      const data = await response.json();

      if (data.instances && data.instances.length > 0) {
        // Use the first running instance or just the first one
        const instance = data.instances.find(i => i.running) || data.instances[0];
        this.instanceId = instance.uuid;

        logger.success(`Connected to instance: ${instance.nick || instance.name}`);
        logger.info(`Instance ID: ${this.instanceId}`);
        logger.info(`Running: ${instance.running}`);
      } else {
        throw new Error('No instances found');
      }
    } catch (error) {
      logger.error('Failed to get instances: ' + error.message);
      throw error;
    }
  }

  async request(endpoint, method = 'GET', body = null) {
    if (!this.token) {
      throw new Error('Not logged in to SinusBot');
    }

    const options = {
      method,
      headers: {
        'Authorization': `bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const fullUrl = `${this.host}${endpoint}`;
    logger.info(`Making API request to: ${fullUrl}`);
    const response = await fetch(fullUrl, options);

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`API request failed: ${response.status} ${response.statusText}`);
      logger.error(`Response body: ${errorBody.substring(0, 200)}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const htmlBody = await response.text();
      logger.error(`Expected JSON but got: ${contentType}`);
      logger.error(`Response body (first 300 chars): ${htmlBody.substring(0, 300)}`);
      logger.error(`Final URL after redirects: ${response.url}`);
      throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
    }

    return await response.json();
  }

  async getStatus() {
    const data = await this.request(`/api/v1/bot/i/${this.instanceId}/status`);
    return data;
  }

  async getInstanceInfo() {
    // Use the status endpoint which actually exists in the SinusBot API
    const data = await this.request(`/api/v1/bot/i/${this.instanceId}/status`);
    return data;
  }

  async isInstanceConnected() {
    try {
      const status = await this.getInstanceInfo();
      // Check if the instance is running based on status
      // Status includes fields like: currentTrack, position, shuffle, repeat, etc.
      return status && typeof status === 'object';
    } catch (error) {
      logger.error('Failed to check instance connection: ' + error.message);
      return false;
    }
  }

  async connectInstance() {
    try {
      logger.info('Starting SinusBot instance...');
      await this.request(`/api/v1/bot/i/${this.instanceId}/spawn`, 'POST');
      logger.success('SinusBot instance started');
      return true;
    } catch (error) {
      logger.error('Failed to start instance: ' + error.message);
      throw error;
    }
  }

  async disconnectInstance() {
    try {
      logger.info('Stopping SinusBot instance...');
      await this.request(`/api/v1/bot/i/${this.instanceId}/kill`, 'POST');
      logger.success('SinusBot instance stopped');
      return true;
    } catch (error) {
      logger.error('Failed to stop instance: ' + error.message);
      throw error;
    }
  }

  async restartInstance() {
    try {
      logger.info('Restarting SinusBot instance...');
      await this.request(`/api/v1/bot/i/${this.instanceId}/respawn`, 'POST');
      logger.success('SinusBot instance restarted');
      return true;
    } catch (error) {
      logger.error('Failed to restart instance: ' + error.message);
      throw error;
    }
  }

  async getInstanceSettings() {
    try {
      const data = await this.request(`/api/v1/bot/i/${this.instanceId}/settings`);
      return data;
    } catch (error) {
      logger.error('Failed to get instance settings: ' + error.message);
      throw error;
    }
  }

  async updateInstanceSettings(settings) {
    try {
      logger.info('Updating instance settings...');
      const data = await this.request(`/api/v1/bot/i/${this.instanceId}/settings`, 'POST', settings);
      logger.success('Instance settings updated successfully');
      return data;
    } catch (error) {
      logger.error('Failed to update instance settings: ' + error.message);
      throw error;
    }
  }

  async setTeamSpeakServer(serverAddress, serverPassword = '') {
    try {
      logger.info(`Setting TeamSpeak server to: ${serverAddress}`);
      const settings = await this.getInstanceSettings();

      // Update the server address and password
      settings.hostAddress = serverAddress;
      if (serverPassword) {
        settings.serverPassword = serverPassword;
      }

      await this.updateInstanceSettings(settings);
      logger.success(`TeamSpeak server updated to: ${serverAddress}`);
      return true;
    } catch (error) {
      logger.error('Failed to set TeamSpeak server: ' + error.message);
      throw error;
    }
  }

  async play(trackId = null) {
    if (trackId) {
      return await this.request(`/api/v1/bot/i/${this.instanceId}/play/byId/${trackId}`, 'POST');
    } else {
      return await this.request(`/api/v1/bot/i/${this.instanceId}/play`, 'POST');
    }
  }

  async pause() {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/pause`, 'POST');
  }

  async stop() {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/stop`, 'POST');
  }

  async skip() {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/playNext`, 'POST');
  }

  async previous() {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/playPrevious`, 'POST');
  }

  async setVolume(volume) {
    const vol = Math.max(0, Math.min(100, parseInt(volume)));
    return await this.request(`/api/v1/bot/i/${this.instanceId}/volume/set/${vol}`, 'POST');
  }

  async getChannels() {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/channels`);
  }

  async getFiles() {
    return await this.request(`/api/v1/bot/files`);
  }

  async searchFiles(query) {
    const files = await this.getFiles();
    if (!files.mediainfo) return [];

    return files.mediainfo.filter(file => {
      const searchText = `${file.title} ${file.artist} ${file.album}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }

  async playUrl(url) {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/playUrl?url=${encodeURIComponent(url)}`, 'POST');
  }

  async addToQueue(trackId) {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/queue/append/${trackId}`, 'POST');
  }

  async getQueue() {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/queue`);
  }

  async say(text, locale = 'en') {
    return await this.request(`/api/v1/bot/i/${this.instanceId}/say`, 'POST', {
      text,
      locale
    });
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      host: this.host,
      instanceId: this.instanceId
    };
  }
}

module.exports = SinusBotClient;
