const YouTubeHandler = require('./youtube');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');

class AudioPlayer {
  constructor(teamspeak, config) {
    this.teamspeak = teamspeak;
    this.config = config;
    this.youtube = new YouTubeHandler();
    this.queue = [];
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.ffmpegProcess = null;
    this.volume = config.defaultVolume || 50;
  }

  /**
   * Add a song to the queue
   */
  async addToQueue(input, requestedBy) {
    try {
      let videoId;

      // Check if it's a URL or video ID
      if (this.youtube.isValidYouTubeUrl(input)) {
        videoId = this.youtube.extractVideoId(input);
      } else {
        // Treat as search query
        const results = await this.youtube.search(input, 1);
        if (results.length === 0) {
          throw new Error('No results found');
        }
        videoId = results[0].id;
      }

      if (!videoId) {
        throw new Error('Invalid YouTube URL or video ID');
      }

      // Get video info
      const videoInfo = await this.youtube.getVideoInfo(videoId);

      const song = {
        ...videoInfo,
        requestedBy,
        addedAt: Date.now()
      };

      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        throw new Error(`Queue is full (max ${this.config.maxQueueSize} songs)`);
      }

      this.queue.push(song);

      // Start playing if nothing is currently playing
      if (!this.isPlaying) {
        await this.playNext();
      }

      return song;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Play the next song in the queue
   */
  async playNext() {
    if (this.queue.length === 0) {
      this.currentSong = null;
      this.isPlaying = false;
      return null;
    }

    this.currentSong = this.queue.shift();
    this.isPlaying = true;
    this.isPaused = false;

    try {
      // Download the audio
      const audioPath = await this.youtube.downloadAudio(this.currentSong.id);

      // Play the audio
      await this.playAudio(audioPath);

      return this.currentSong;
    } catch (error) {
      console.error('Error playing song:', error);
      this.isPlaying = false;
      // Try to play next song
      return await this.playNext();
    }
  }

  /**
   * Play audio file through TeamSpeak
   */
  async playAudio(filePath) {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        if (this.ffmpegProcess) {
          this.ffmpegProcess.kill();
        }

        // FFmpeg command to play audio
        const args = [
          '-re',
          '-i', filePath,
          '-af', `volume=${this.volume / 100}`,
          '-ac', '2',
          '-ar', '48000',
          '-f', 's16le',
          '-acodec', 'pcm_s16le',
          'pipe:1'
        ];

        this.ffmpegProcess = spawn(ffmpeg, args);

        // Pipe audio to TeamSpeak
        this.ffmpegProcess.stdout.on('data', (data) => {
          if (!this.isPaused) {
            this.teamspeak.sendAudio(data);
          }
        });

        this.ffmpegProcess.on('error', (error) => {
          console.error('FFmpeg error:', error);
          reject(error);
        });

        this.ffmpegProcess.on('close', (code) => {
          console.log(`Finished playing: ${this.currentSong?.title}`);
          this.isPlaying = false;
          this.ffmpegProcess = null;

          // Play next song in queue
          this.playNext();
          resolve();
        });

        this.ffmpegProcess.stderr.on('data', (data) => {
          // Log FFmpeg errors/info
          // console.log('FFmpeg:', data.toString());
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Skip the current song
   */
  skip() {
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill();
      return true;
    }
    return false;
  }

  /**
   * Pause/resume playback
   */
  togglePause() {
    if (this.isPlaying) {
      this.isPaused = !this.isPaused;
      return this.isPaused;
    }
    return false;
  }

  /**
   * Stop playback and clear queue
   */
  async stop() {
    this.queue = [];
    if (this.ffmpegProcess) {
      this.ffmpegProcess.kill();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSong = null;
  }

  /**
   * Get current queue
   */
  getQueue() {
    return {
      current: this.currentSong,
      queue: this.queue,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused
    };
  }

  /**
   * Remove song from queue by index
   */
  removeFromQueue(index) {
    if (index >= 0 && index < this.queue.length) {
      return this.queue.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    const queueLength = this.queue.length;
    this.queue = [];
    return queueLength;
  }

  /**
   * Set volume (0-100)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(100, vol));
    return this.volume;
  }

  /**
   * Search YouTube
   */
  async search(query, limit = 5) {
    return await this.youtube.search(query, limit);
  }
}

module.exports = AudioPlayer;
