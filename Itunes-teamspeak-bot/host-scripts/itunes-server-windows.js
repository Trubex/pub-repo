/**
 * iTunes Control Server for Windows
 * This script runs on the Windows host machine and provides HTTP API to control iTunes
 * It uses Windows COM automation to communicate with iTunes
 */

const express = require('express');
const app = express();
const PORT = process.env.ITUNES_PORT || 8181;

app.use(express.json());

// COM automation for iTunes on Windows
let iTunes = null;

function getiTunes() {
  if (!iTunes) {
    try {
      const ActiveXObject = require('winax').Object;
      iTunes = new ActiveXObject('iTunes.Application');
      console.log('Connected to iTunes');
    } catch (error) {
      console.error('Failed to connect to iTunes:', error.message);
      throw new Error('iTunes not available. Make sure iTunes is installed and running.');
    }
  }
  return iTunes;
}

// Ping endpoint
app.get('/ping', (req, res) => {
  try {
    getiTunes();
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

// Get current track
app.get('/current', (req, res) => {
  try {
    const itunes = getiTunes();
    const currentTrack = itunes.CurrentTrack;

    if (currentTrack) {
      res.json({
        name: currentTrack.Name,
        artist: currentTrack.Artist,
        album: currentTrack.Album,
        duration: currentTrack.Duration,
        genre: currentTrack.Genre
      });
    } else {
      res.json({ name: null, artist: null, album: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Play
app.post('/play', (req, res) => {
  try {
    const itunes = getiTunes();
    const { query } = req.body;

    if (query) {
      // Search and play
      const librarySource = itunes.LibrarySource;
      const libraryPlaylist = librarySource.Playlists.ItemByName('Library');

      if (libraryPlaylist) {
        const tracks = libraryPlaylist.Search(query, 5); // ITSearchFieldAll = 5

        if (tracks && tracks.Count > 0) {
          tracks.Item(1).Play();
          const track = tracks.Item(1);

          res.json({
            success: true,
            track: {
              name: track.Name,
              artist: track.Artist,
              album: track.Album
            }
          });
        } else {
          res.status(404).json({ error: 'No tracks found' });
        }
      } else {
        res.status(404).json({ error: 'Library not found' });
      }
    } else {
      // Just play/resume
      itunes.Play();
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause
app.post('/pause', (req, res) => {
  try {
    const itunes = getiTunes();
    itunes.Pause();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop
app.post('/stop', (req, res) => {
  try {
    const itunes = getiTunes();
    itunes.Stop();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Next track
app.post('/next', (req, res) => {
  try {
    const itunes = getiTunes();
    itunes.NextTrack();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Previous track
app.post('/previous', (req, res) => {
  try {
    const itunes = getiTunes();
    itunes.PreviousTrack();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get volume
app.get('/volume', (req, res) => {
  try {
    const itunes = getiTunes();
    res.json({ volume: itunes.SoundVolume });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set volume
app.post('/volume', (req, res) => {
  try {
    const itunes = getiTunes();
    const { volume } = req.body;
    itunes.SoundVolume = Math.max(0, Math.min(100, parseInt(volume)));
    res.json({ success: true, volume: itunes.SoundVolume });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tracks
app.post('/search', (req, res) => {
  try {
    const itunes = getiTunes();
    const { query, limit = 20 } = req.body;

    const librarySource = itunes.LibrarySource;
    const libraryPlaylist = librarySource.Playlists.ItemByName('Library');

    if (libraryPlaylist) {
      const tracks = libraryPlaylist.Search(query, 5); // ITSearchFieldAll = 5
      const results = [];

      const count = Math.min(tracks.Count, limit);
      for (let i = 1; i <= count; i++) {
        const track = tracks.Item(i);
        results.push({
          name: track.Name,
          artist: track.Artist,
          album: track.Album,
          duration: track.Duration
        });
      }

      res.json({ tracks: results });
    } else {
      res.status(404).json({ error: 'Library not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player state
app.get('/state', (req, res) => {
  try {
    const itunes = getiTunes();
    // ITPlayerState: 0 = Stopped, 1 = Playing
    const state = itunes.PlayerState;

    res.json({
      playing: state === 1,
      stopped: state === 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get playlists
app.get('/playlists', (req, res) => {
  try {
    const itunes = getiTunes();
    const librarySource = itunes.LibrarySource;
    const playlists = librarySource.Playlists;
    const results = [];

    for (let i = 1; i <= playlists.Count; i++) {
      const playlist = playlists.Item(i);
      results.push({
        name: playlist.Name,
        trackCount: playlist.Tracks.Count
      });
    }

    res.json({ playlists: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Play playlist
app.post('/playlist/play', (req, res) => {
  try {
    const itunes = getiTunes();
    const { name } = req.body;

    const librarySource = itunes.LibrarySource;
    const playlist = librarySource.Playlists.ItemByName(name);

    if (playlist && playlist.Tracks.Count > 0) {
      playlist.PlayFirstTrack();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Playlist not found or empty' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`iTunes Control Server running on port ${PORT}`);
  console.log('Make sure iTunes is running on this machine');
  console.log('Press Ctrl+C to stop');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down iTunes Control Server...');
  process.exit(0);
});
