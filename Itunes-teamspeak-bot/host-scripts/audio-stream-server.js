/**
 * Audio Stream Server
 * Captures system/iTunes audio output and streams it as HTTP audio
 * This allows SinusBot to play the stream via URL
 */

const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.AUDIO_STREAM_PORT || 8182;

let streamClients = [];
let ffmpegProcess = null;

// Check if FFmpeg is available
function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('error', () => resolve(false));
    ffmpeg.on('close', (code) => resolve(code === 0));
  });
}

// Start audio capture
async function startAudioCapture() {
  const hasFFmpeg = await checkFFmpeg();

  if (!hasFFmpeg) {
    console.error('FFmpeg not found! Please install FFmpeg:');
    console.error('1. Download from https://ffmpeg.org/download.html');
    console.error('2. Add to system PATH');
    console.error('Or use chocolatey: choco install ffmpeg');
    process.exit(1);
  }

  // Capture audio from default audio device (Windows)
  // For Windows, we use dshow (DirectShow) to capture audio
  // Note: This captures ALL system audio. To capture only iTunes,
  // you would need a virtual audio cable routing iTunes output specifically

  const ffmpegArgs = [
    '-f', 'dshow',
    '-i', 'audio=Stereo Mix',  // Windows default audio capture device
    // If "Stereo Mix" doesn't work, you might need to enable it in Windows Sound settings
    // Or use a virtual audio cable like VB-Audio Cable
    '-acodec', 'libmp3lame',
    '-ab', '192k',
    '-ac', '2',
    '-ar', '44100',
    '-f', 'mp3',
    '-'  // Output to stdout
  ];

  console.log('Starting audio capture with FFmpeg...');
  console.log('Command:', 'ffmpeg', ffmpegArgs.join(' '));

  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  ffmpegProcess.stdout.on('data', (data) => {
    // Broadcast audio data to all connected clients
    streamClients.forEach(client => {
      try {
        client.write(data);
      } catch (err) {
        // Client disconnected
      }
    });
  });

  ffmpegProcess.stderr.on('data', (data) => {
    // FFmpeg logs go to stderr
    const log = data.toString();
    if (log.includes('Error') || log.includes('error')) {
      console.error('FFmpeg error:', log);
    }
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    if (code !== 0 && code !== null) {
      console.error('Audio capture failed. Common issues:');
      console.error('1. "Stereo Mix" might be disabled in Windows Sound settings');
      console.error('2. Enable it: Control Panel > Sound > Recording > Enable Stereo Mix');
      console.error('3. Or install VB-Audio Virtual Cable for better audio routing');
    }
  });

  ffmpegProcess.on('error', (err) => {
    console.error('Failed to start FFmpeg:', err);
  });
}

// Stream endpoint
app.get('/stream', (req, res) => {
  console.log('New client connected to audio stream');

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  streamClients.push(res);

  req.on('close', () => {
    const index = streamClients.indexOf(res);
    if (index > -1) {
      streamClients.splice(index, 1);
    }
    console.log('Client disconnected from audio stream');
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    streaming: ffmpegProcess !== null,
    clients: streamClients.length,
    streamUrl: `http://localhost:${PORT}/stream`
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n========================================`);
  console.log(`Audio Stream Server running on port ${PORT}`);
  console.log(`Stream URL: http://localhost:${PORT}/stream`);
  console.log(`========================================\n`);

  console.log('IMPORTANT SETUP STEPS:');
  console.log('1. Enable "Stereo Mix" in Windows Sound Settings:');
  console.log('   - Right-click sound icon > Sound > Recording tab');
  console.log('   - Right-click > Show Disabled Devices');
  console.log('   - Enable "Stereo Mix" and set as default');
  console.log('');
  console.log('2. Or install VB-Audio Virtual Cable for better quality:');
  console.log('   - Download from: https://vb-audio.com/Cable/');
  console.log('   - Set iTunes output to "CABLE Input"');
  console.log('   - Change line 38 to: audio=CABLE Output');
  console.log('');
  console.log('Starting audio capture in 3 seconds...\n');

  setTimeout(async () => {
    await startAudioCapture();
  }, 3000);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nStopping audio stream server...');
  if (ffmpegProcess) {
    ffmpegProcess.kill();
  }
  process.exit(0);
});
