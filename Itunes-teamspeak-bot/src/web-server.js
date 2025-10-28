const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const config = require('./config');
const database = require('./database');
const logger = require('./logger');

class WebServer {
  constructor(tsBot, itunesClient) {
    this.app = express();
    this.tsBot = tsBot;
    this.itunes = itunesClient;
    this.server = null;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // View engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));

    // Static files
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Body parser
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // Session
    this.app.use(session({
      secret: config.web.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
  }

  setupRoutes() {
    // Authentication middleware
    const requireAuth = (req, res, next) => {
      if (req.session.authenticated) {
        next();
      } else {
        res.redirect('/login');
      }
    };

    // Login page
    this.app.get('/login', (req, res) => {
      if (req.session.authenticated) {
        return res.redirect('/');
      }
      res.render('login', { error: null });
    });

    // Login POST
    this.app.post('/login', async (req, res) => {
      const { username, password } = req.body;

      if (username === config.web.adminUsername && password === config.web.adminPassword) {
        req.session.authenticated = true;
        req.session.username = username;
        res.redirect('/');
      } else {
        res.render('login', { error: 'Invalid username or password' });
      }
    });

    // Logout
    this.app.get('/logout', (req, res) => {
      req.session.destroy();
      res.redirect('/login');
    });

    // Dashboard (protected)
    this.app.get('/', requireAuth, async (req, res) => {
      try {
        const currentTrack = await this.itunes.getCurrentTrack();
        const volume = await this.itunes.getVolume();
        const tsStatus = this.tsBot.getStatus();
        const itunesConnected = await this.itunes.isConnected();

        res.render('dashboard', {
          username: req.session.username,
          currentTrack,
          volume,
          tsStatus,
          itunesConnected
        });
      } catch (error) {
        console.error('Dashboard error:', error);
        res.render('dashboard', {
          username: req.session.username,
          currentTrack: null,
          volume: 0,
          tsStatus: this.tsBot.getStatus(),
          itunesConnected: false
        });
      }
    });

    // Logs page (protected)
    this.app.get('/logs', requireAuth, (req, res) => {
      res.render('logs', {
        username: req.session.username
      });
    });

    // History page (protected)
    this.app.get('/history', requireAuth, async (req, res) => {
      try {
        const history = await database.getHistory(100);
        res.render('history', {
          username: req.session.username,
          history
        });
      } catch (error) {
        console.error('History error:', error);
        res.render('history', {
          username: req.session.username,
          history: []
        });
      }
    });

    // API Routes (protected)

    // Play
    this.app.post('/api/play', requireAuth, async (req, res) => {
      try {
        const { query } = req.body;
        const result = await this.itunes.play(query || null);
        res.json({ success: true, track: result.track });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Pause
    this.app.post('/api/pause', requireAuth, async (req, res) => {
      try {
        await this.itunes.pause();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Stop
    this.app.post('/api/stop', requireAuth, async (req, res) => {
      try {
        await this.itunes.stop();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Skip
    this.app.post('/api/skip', requireAuth, async (req, res) => {
      try {
        await this.itunes.skip();
        const track = await this.itunes.getCurrentTrack();
        res.json({ success: true, track });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Previous
    this.app.post('/api/previous', requireAuth, async (req, res) => {
      try {
        await this.itunes.previous();
        const track = await this.itunes.getCurrentTrack();
        res.json({ success: true, track });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Set volume
    this.app.post('/api/volume', requireAuth, async (req, res) => {
      try {
        const { volume } = req.body;
        await this.itunes.setVolume(volume);
        res.json({ success: true, volume });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Search
    this.app.post('/api/search', requireAuth, async (req, res) => {
      try {
        const { query, limit } = req.body;
        const results = await this.itunes.search(query, limit || 20);
        res.json({ success: true, results });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get current track
    this.app.get('/api/current', requireAuth, async (req, res) => {
      try {
        const track = await this.itunes.getCurrentTrack();
        const volume = await this.itunes.getVolume();
        res.json({ success: true, track, volume });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get status
    this.app.get('/api/status', requireAuth, async (req, res) => {
      try {
        const tsStatus = this.tsBot.getStatus();
        const itunesConnected = await this.itunes.isConnected();
        const currentTrack = await this.itunes.getCurrentTrack();
        const currentChannel = await this.tsBot.getCurrentChannel();

        res.json({
          success: true,
          teamspeak: {
            ...tsStatus,
            currentChannel
          },
          itunes: {
            connected: itunesConnected,
            currentTrack
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Get channel list
    this.app.get('/api/teamspeak/channels', requireAuth, async (req, res) => {
      try {
        const channels = await this.tsBot.getChannelList();
        res.json({ success: true, channels });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Join channel
    this.app.post('/api/teamspeak/join', requireAuth, async (req, res) => {
      try {
        const { channelName } = req.body;
        if (!channelName) {
          return res.status(400).json({ success: false, error: 'Channel name required' });
        }
        const result = await this.tsBot.joinChannel(channelName);
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Disconnect
    this.app.post('/api/teamspeak/disconnect', requireAuth, async (req, res) => {
      try {
        await this.tsBot.disconnect();
        res.json({ success: true, message: 'Disconnected from TeamSpeak' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Reconnect
    this.app.post('/api/teamspeak/reconnect', requireAuth, async (req, res) => {
      try {
        await this.tsBot.reconnect();
        res.json({ success: true, message: 'Reconnected to TeamSpeak' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Connect bot to TeamSpeak server
    this.app.post('/api/teamspeak/connect-ts', requireAuth, async (req, res) => {
      try {
        const result = await this.tsBot.connectToTeamSpeak();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Disconnect bot from TeamSpeak server
    this.app.post('/api/teamspeak/disconnect-ts', requireAuth, async (req, res) => {
      try {
        const result = await this.tsBot.disconnectFromTeamSpeak();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Get TeamSpeak connection status
    this.app.get('/api/teamspeak/ts-status', requireAuth, async (req, res) => {
      try {
        const status = await this.tsBot.getTeamSpeakConnectionStatus();
        res.json({ success: true, ...status });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Get server settings
    this.app.get('/api/teamspeak/server', requireAuth, async (req, res) => {
      try {
        const result = await this.tsBot.getTeamSpeakServer();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // TeamSpeak: Update server settings
    this.app.post('/api/teamspeak/server', requireAuth, async (req, res) => {
      try {
        const { serverAddress, serverPassword } = req.body;
        if (!serverAddress) {
          return res.status(400).json({ success: false, error: 'Server address is required' });
        }
        const result = await this.tsBot.updateTeamSpeakServer(serverAddress, serverPassword || '');
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get logs
    this.app.get('/api/logs', requireAuth, (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const logs = logger.getLogs(limit);
      res.json({ success: true, logs });
    });

    // Clear logs
    this.app.post('/api/logs/clear', requireAuth, (req, res) => {
      logger.clearLogs();
      res.json({ success: true, message: 'Logs cleared' });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(config.web.port, '0.0.0.0', () => {
          console.log(`Web server running on port ${config.web.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Web server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = WebServer;
