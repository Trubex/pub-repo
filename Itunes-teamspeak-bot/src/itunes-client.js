const fetch = require('node-fetch');
const config = require('./config');

class iTunesClient {
  constructor() {
    this.baseUrl = `http://${config.itunes.host}:${config.itunes.port}`;
    this.currentTrack = null;
    this.isPlaying = false;
  }

  async request(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('iTunes request error:', error.message);
      throw error;
    }
  }

  async play(searchQuery = null) {
    if (searchQuery) {
      // Search and play specific track
      const result = await this.request('/play', 'POST', { query: searchQuery });
      this.isPlaying = true;
      return result;
    } else {
      // Resume playback
      const result = await this.request('/play', 'POST');
      this.isPlaying = true;
      return result;
    }
  }

  async pause() {
    const result = await this.request('/pause', 'POST');
    this.isPlaying = false;
    return result;
  }

  async stop() {
    const result = await this.request('/stop', 'POST');
    this.isPlaying = false;
    return result;
  }

  async skip() {
    return await this.request('/next', 'POST');
  }

  async previous() {
    return await this.request('/previous', 'POST');
  }

  async setVolume(volume) {
    // Volume should be 0-100
    const vol = Math.max(0, Math.min(100, parseInt(volume)));
    return await this.request('/volume', 'POST', { volume: vol });
  }

  async getVolume() {
    const result = await this.request('/volume');
    return result.volume;
  }

  async getCurrentTrack() {
    try {
      const result = await this.request('/current');
      this.currentTrack = result;
      return result;
    } catch (error) {
      return null;
    }
  }

  async search(query, limit = 20) {
    return await this.request('/search', 'POST', { query, limit });
  }

  async getPlaylists() {
    return await this.request('/playlists');
  }

  async playPlaylist(playlistName) {
    return await this.request('/playlist/play', 'POST', { name: playlistName });
  }

  async getPlayerState() {
    return await this.request('/state');
  }

  async isConnected() {
    try {
      await this.request('/ping');
      return true;
    } catch (error) {
      return false;
    }
  }

  formatTrackInfo(track) {
    if (!track || !track.name) {
      return 'No track playing';
    }

    let info = `${track.name}`;
    if (track.artist) {
      info += ` - ${track.artist}`;
    }
    if (track.album) {
      info += ` (${track.album})`;
    }
    return info;
  }
}

module.exports = iTunesClient;
