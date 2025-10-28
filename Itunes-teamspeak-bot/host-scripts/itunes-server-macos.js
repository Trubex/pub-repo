/**
 * iTunes/Music Control Server for macOS
 * This script runs on the macOS host machine and provides HTTP API to control iTunes/Music app
 * It uses AppleScript via osascript to communicate with iTunes/Music
 */

const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.ITUNES_PORT || 8181;

app.use(express.json());

// Execute AppleScript
async function executeAppleScript(script) {
  try {
    const { stdout, stderr } = await execPromise(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    if (stderr) {
      console.error('AppleScript stderr:', stderr);
    }
    return stdout.trim();
  } catch (error) {
    throw new Error(`AppleScript error: ${error.message}`);
  }
}

// Get app name (iTunes or Music)
async function getMusicApp() {
  try {
    // Try Music first (newer macOS versions)
    await executeAppleScript('tell application "Music" to get name');
    return 'Music';
  } catch (error) {
    // Fall back to iTunes
    return 'iTunes';
  }
}

// Ping endpoint
app.get('/ping', async (req, res) => {
  try {
    const appName = await getMusicApp();
    await executeAppleScript(`tell application "${appName}" to get name`);
    res.json({ status: 'ok', app: appName });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

// Get current track
app.get('/current', async (req, res) => {
  try {
    const appName = await getMusicApp();

    const script = `
      tell application "${appName}"
        if player state is not stopped then
          set trackName to name of current track
          set trackArtist to artist of current track
          set trackAlbum to album of current track
          set trackDuration to duration of current track
          return trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & trackDuration
        else
          return "|||"
        end if
      end tell
    `;

    const result = await executeAppleScript(script);
    const parts = result.split('|||');

    if (parts[0]) {
      res.json({
        name: parts[0] || null,
        artist: parts[1] || null,
        album: parts[2] || null,
        duration: parseInt(parts[3]) || 0
      });
    } else {
      res.json({ name: null, artist: null, album: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Play
app.post('/play', async (req, res) => {
  try {
    const appName = await getMusicApp();
    const { query } = req.body;

    if (query) {
      // Search and play
      const script = `
        tell application "${appName}"
          set searchResults to search playlist "Library" for "${query.replace(/"/g, '\\"')}"
          if (count of searchResults) > 0 then
            set firstTrack to item 1 of searchResults
            play firstTrack
            set trackName to name of firstTrack
            set trackArtist to artist of firstTrack
            set trackAlbum to album of firstTrack
            return trackName & "|||" & trackArtist & "|||" & trackAlbum
          else
            return "NOTFOUND"
          end if
        end tell
      `;

      const result = await executeAppleScript(script);

      if (result === 'NOTFOUND') {
        res.status(404).json({ error: 'No tracks found' });
      } else {
        const parts = result.split('|||');
        res.json({
          success: true,
          track: {
            name: parts[0] || null,
            artist: parts[1] || null,
            album: parts[2] || null
          }
        });
      }
    } else {
      // Just play/resume
      await executeAppleScript(`tell application "${appName}" to play`);
      res.json({ success: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause
app.post('/pause', async (req, res) => {
  try {
    const appName = await getMusicApp();
    await executeAppleScript(`tell application "${appName}" to pause`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop
app.post('/stop', async (req, res) => {
  try {
    const appName = await getMusicApp();
    await executeAppleScript(`tell application "${appName}" to stop`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Next track
app.post('/next', async (req, res) => {
  try {
    const appName = await getMusicApp();
    await executeAppleScript(`tell application "${appName}" to next track`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Previous track
app.post('/previous', async (req, res) => {
  try {
    const appName = await getMusicApp();
    await executeAppleScript(`tell application "${appName}" to previous track`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get volume
app.get('/volume', async (req, res) => {
  try {
    const appName = await getMusicApp();
    const volume = await executeAppleScript(`tell application "${appName}" to get sound volume`);
    res.json({ volume: parseInt(volume) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set volume
app.post('/volume', async (req, res) => {
  try {
    const appName = await getMusicApp();
    const { volume } = req.body;
    const vol = Math.max(0, Math.min(100, parseInt(volume)));
    await executeAppleScript(`tell application "${appName}" to set sound volume to ${vol}`);
    res.json({ success: true, volume: vol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tracks
app.post('/search', async (req, res) => {
  try {
    const appName = await getMusicApp();
    const { query, limit = 20 } = req.body;

    const script = `
      tell application "${appName}"
        set searchResults to search playlist "Library" for "${query.replace(/"/g, '\\"')}"
        set resultList to {}
        set resultCount to count of searchResults
        if resultCount > ${limit} then
          set resultCount to ${limit}
        end if

        repeat with i from 1 to resultCount
          set currentTrack to item i of searchResults
          set trackName to name of currentTrack
          set trackArtist to artist of currentTrack
          set trackAlbum to album of currentTrack
          set trackDuration to duration of currentTrack
          set end of resultList to trackName & "||" & trackArtist & "||" & trackAlbum & "||" & trackDuration
        end repeat

        set AppleScript's text item delimiters to "|||"
        return resultList as string
      end tell
    `;

    const result = await executeAppleScript(script);

    if (result) {
      const tracks = result.split('|||').map(track => {
        const parts = track.split('||');
        return {
          name: parts[0] || 'Unknown',
          artist: parts[1] || 'Unknown',
          album: parts[2] || 'Unknown',
          duration: parseInt(parts[3]) || 0
        };
      });

      res.json({ tracks });
    } else {
      res.json({ tracks: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player state
app.get('/state', async (req, res) => {
  try {
    const appName = await getMusicApp();
    const state = await executeAppleScript(`tell application "${appName}" to get player state as string`);

    res.json({
      playing: state === 'playing',
      stopped: state === 'stopped',
      paused: state === 'paused'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get playlists
app.get('/playlists', async (req, res) => {
  try {
    const appName = await getMusicApp();

    const script = `
      tell application "${appName}"
        set playlistList to {}
        repeat with aPlaylist in user playlists
          set playlistName to name of aPlaylist
          set trackCount to count of tracks of aPlaylist
          set end of playlistList to playlistName & "||" & trackCount
        end repeat

        set AppleScript's text item delimiters to "|||"
        return playlistList as string
      end tell
    `;

    const result = await executeAppleScript(script);

    if (result) {
      const playlists = result.split('|||').map(playlist => {
        const parts = playlist.split('||');
        return {
          name: parts[0],
          trackCount: parseInt(parts[1]) || 0
        };
      });

      res.json({ playlists });
    } else {
      res.json({ playlists: [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Play playlist
app.post('/playlist/play', async (req, res) => {
  try {
    const appName = await getMusicApp();
    const { name } = req.body;

    const script = `
      tell application "${appName}"
        play playlist "${name.replace(/"/g, '\\"')}"
      end tell
    `;

    await executeAppleScript(script);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  try {
    const appName = await getMusicApp();
    console.log(`iTunes/Music Control Server running on port ${PORT}`);
    console.log(`Controlling: ${appName}`);
    console.log('Make sure iTunes/Music is running on this machine');
    console.log('Press Ctrl+C to stop');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Make sure iTunes or Music app is installed and running');
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down iTunes/Music Control Server...');
  process.exit(0);
});
