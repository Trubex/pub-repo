const YTDlpWrap = require('yt-dlp-wrap').default;
const ytsr = require('ytsr');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class YouTubeHandler {
  constructor() {
    this.downloadDir = path.join(__dirname, '..', 'downloads');
    this.ensureDownloadDir();

    // Initialize yt-dlp wrapper
    // This will use yt-dlp from PATH if available, or you can specify a path
    this.ytDlp = new YTDlpWrap();
  }

  ensureDownloadDir() {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Validate if a string is a YouTube URL or video ID
   */
  isValidYouTubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
    return pattern.test(url) || videoIdPattern.test(url);
  }

  /**
   * Extract video ID from URL or return the ID if already provided
   */
  extractVideoId(input) {
    try {
      // If it's already a video ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
      }

      // Extract from URL
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
      ];

      for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get video information using yt-dlp
   */
  async getVideoInfo(videoId) {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      // Get video info using yt-dlp
      const info = await this.ytDlp.getVideoInfo(url);

      return {
        id: videoId,
        title: info.title,
        duration: parseInt(info.duration) || 0,
        url: url,
        thumbnail: info.thumbnail || null,
        author: info.uploader || info.channel || 'Unknown'
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw new Error('Failed to get video information');
    }
  }

  /**
   * Search YouTube for videos using ytsr
   */
  async search(query, limit = 5) {
    try {
      const filters = await ytsr.getFilters(query);
      const filter = filters.get('Type').get('Video');

      const searchResults = await ytsr(filter.url, { limit });

      return searchResults.items.map(item => ({
        id: item.id,
        title: item.title,
        duration: item.duration,
        url: item.url,
        thumbnail: item.bestThumbnail?.url || null,
        author: item.author?.name || 'Unknown'
      }));
    } catch (error) {
      console.error('Error searching YouTube:', error);
      throw new Error('Failed to search YouTube');
    }
  }

  /**
   * Download audio from YouTube video using yt-dlp
   */
  async downloadAudio(videoId, onProgress = null) {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const outputPath = path.join(this.downloadDir, `${videoId}.opus`);

      // Check if already downloaded
      if (fs.existsSync(outputPath)) {
        console.log(`Using cached file for ${videoId}`);
        return outputPath;
      }

      console.log(`Downloading: ${videoId}`);

      // Download using yt-dlp with best audio quality
      await this.ytDlp.execPromise([
        url,
        '-f', 'bestaudio/best',
        '-x', // Extract audio
        '--audio-format', 'opus',
        '--audio-quality', '0', // Best quality
        '-o', outputPath,
        '--no-playlist',
        '--quiet',
        '--no-warnings'
      ]);

      console.log(`Downloaded: ${videoId}`);
      return outputPath;
    } catch (error) {
      console.error('Error downloading audio:', error);

      // Clean up partial download
      const outputPath = path.join(this.downloadDir, `${videoId}.opus`);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      throw new Error('Failed to download audio');
    }
  }

  /**
   * Alternative download method with progress tracking
   */
  async downloadAudioWithProgress(videoId, onProgress = null) {
    return new Promise((resolve, reject) => {
      try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const outputPath = path.join(this.downloadDir, `${videoId}.opus`);

        // Check if already downloaded
        if (fs.existsSync(outputPath)) {
          console.log(`Using cached file for ${videoId}`);
          resolve(outputPath);
          return;
        }

        // Spawn yt-dlp process with progress
        const ytDlpProcess = spawn('yt-dlp', [
          url,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'opus',
          '--audio-quality', '0',
          '-o', outputPath,
          '--no-playlist',
          '--newline' // Output progress on new lines
        ]);

        ytDlpProcess.stdout.on('data', (data) => {
          const output = data.toString();

          // Parse progress from yt-dlp output
          const progressMatch = output.match(/(\d+\.\d+)%/);
          if (progressMatch && onProgress) {
            onProgress(progressMatch[1]);
          }
        });

        ytDlpProcess.stderr.on('data', (data) => {
          console.error('yt-dlp stderr:', data.toString());
        });

        ytDlpProcess.on('close', (code) => {
          if (code === 0) {
            console.log(`Downloaded: ${videoId}`);
            resolve(outputPath);
          } else {
            // Clean up partial download
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
            reject(new Error(`yt-dlp exited with code ${code}`));
          }
        });

        ytDlpProcess.on('error', (error) => {
          console.error('yt-dlp process error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clean up old downloaded files
   */
  cleanupDownloads(maxAgeHours = 24) {
    try {
      const files = fs.readdirSync(this.downloadDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.downloadDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up downloads:', error);
    }
  }

  /**
   * Format duration from seconds to MM:SS
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Check if yt-dlp is installed
   */
  async checkYtDlpInstalled() {
    try {
      await this.ytDlp.execPromise(['--version']);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = YouTubeHandler;
