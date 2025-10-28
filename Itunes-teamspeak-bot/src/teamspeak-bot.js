const { TeamSpeak, QueryProtocol } = require('ts3-nodejs-library');
const config = require('./config');
const iTunesClient = require('./itunes-client');
const database = require('./database');

class TeamSpeakBot {
  constructor() {
    this.ts3 = null;
    this.itunes = new iTunesClient();
    this.commandPrefix = '!';
    this.isConnected = false;
  }

  async connect() {
    try {
      this.ts3 = await TeamSpeak.connect({
        host: config.teamspeak.host,
        queryport: config.teamspeak.queryport,
        serverport: config.teamspeak.serverport,
        username: config.teamspeak.username,
        password: config.teamspeak.password,
        nickname: config.teamspeak.nickname,
        protocol: QueryProtocol.RAW
      });

      console.log('Connected to TeamSpeak 3 server');

      // Move to specified channel if provided
      if (config.teamspeak.channel) {
        const channels = await this.ts3.channelList();
        const targetChannel = channels.find(c => c.name === config.teamspeak.channel);
        if (targetChannel) {
          const self = await this.ts3.whoami();
          await this.ts3.clientMove(self.clientId, targetChannel.cid);
          console.log(`Moved to channel: ${config.teamspeak.channel}`);
        }
      }

      this.isConnected = true;
      this.setupEventHandlers();
    } catch (error) {
      console.error('TeamSpeak connection error:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    // Listen for text messages
    this.ts3.on('textmessage', async (ev) => {
      await this.handleCommand(ev);
    });

    // Listen for client disconnect
    this.ts3.on('clientdisconnect', (ev) => {
      console.log('Client disconnected:', ev.client?.nickname);
    });

    // Listen for errors
    this.ts3.on('error', (error) => {
      console.error('TeamSpeak error:', error);
    });

    // Listen for close
    this.ts3.on('close', () => {
      console.log('TeamSpeak connection closed');
      this.isConnected = false;
    });

    console.log('Event handlers registered');
  }

  async handleCommand(ev) {
    const message = ev.msg.trim();

    // Ignore messages that don't start with command prefix
    if (!message.startsWith(this.commandPrefix)) {
      return;
    }

    const parts = message.slice(this.commandPrefix.length).trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    console.log(`Command received: ${command} from ${ev.invoker.nickname}`);

    try {
      let response = '';

      switch (command) {
        case 'play':
          if (args.length > 0) {
            const query = args.join(' ');
            const result = await this.itunes.play(query);
            response = `Now playing: ${this.itunes.formatTrackInfo(result.track)}`;

            // Add to history
            await database.addToHistory({
              name: result.track.name,
              artist: result.track.artist || '',
              album: result.track.album || '',
              requestedBy: ev.invoker.nickname
            });
          } else {
            await this.itunes.play();
            const track = await this.itunes.getCurrentTrack();
            response = `Resumed playback: ${this.itunes.formatTrackInfo(track)}`;
          }
          break;

        case 'pause':
          await this.itunes.pause();
          response = 'Playback paused';
          break;

        case 'stop':
          await this.itunes.stop();
          response = 'Playback stopped';
          break;

        case 'skip':
        case 'next':
          await this.itunes.skip();
          const nextTrack = await this.itunes.getCurrentTrack();
          response = `Skipped to: ${this.itunes.formatTrackInfo(nextTrack)}`;
          break;

        case 'previous':
        case 'prev':
          await this.itunes.previous();
          const prevTrack = await this.itunes.getCurrentTrack();
          response = `Playing previous: ${this.itunes.formatTrackInfo(prevTrack)}`;
          break;

        case 'volume':
        case 'vol':
          if (args.length > 0) {
            const volume = parseInt(args[0]);
            if (isNaN(volume)) {
              response = 'Invalid volume. Use a number between 0-100';
            } else {
              await this.itunes.setVolume(volume);
              response = `Volume set to ${volume}%`;
            }
          } else {
            const currentVol = await this.itunes.getVolume();
            response = `Current volume: ${currentVol}%`;
          }
          break;

        case 'current':
        case 'np':
        case 'nowplaying':
          const current = await this.itunes.getCurrentTrack();
          response = `Now playing: ${this.itunes.formatTrackInfo(current)}`;
          break;

        case 'search':
          if (args.length > 0) {
            const searchQuery = args.join(' ');
            const results = await this.itunes.search(searchQuery, 5);
            if (results.tracks && results.tracks.length > 0) {
              response = 'Search results:\n' + results.tracks.map((t, i) =>
                `${i + 1}. ${t.name} - ${t.artist || 'Unknown'}`
              ).join('\n');
            } else {
              response = 'No results found';
            }
          } else {
            response = 'Usage: !search <query>';
          }
          break;

        case 'help':
          response = this.getHelpText();
          break;

        default:
          response = `Unknown command: ${command}. Type !help for available commands`;
      }

      // Send response back to user
      if (response) {
        await this.sendMessage(ev.invoker.clid, response);
      }

    } catch (error) {
      console.error('Command error:', error);
      await this.sendMessage(ev.invoker.clid, `Error: ${error.message}`);
    }
  }

  async sendMessage(clientId, message) {
    try {
      await this.ts3.sendTextMessage(clientId, 1, message);
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  getHelpText() {
    return `
Available commands:
!play [search] - Play a track or resume playback
!pause - Pause playback
!stop - Stop playback
!skip/!next - Skip to next track
!previous/!prev - Go to previous track
!volume [0-100] - Set or get volume
!current/!np - Show currently playing track
!search <query> - Search for tracks
!help - Show this help message
    `.trim();
  }

  async disconnect() {
    if (this.ts3) {
      await this.ts3.quit();
      this.isConnected = false;
      console.log('Disconnected from TeamSpeak 3');
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      serverName: config.teamspeak.host,
      nickname: config.teamspeak.nickname
    };
  }
}

module.exports = TeamSpeakBot;
