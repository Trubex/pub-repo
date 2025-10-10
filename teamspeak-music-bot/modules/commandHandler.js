class CommandHandler {
  constructor(teamspeak, audioPlayer, permissionsManager, config) {
    this.teamspeak = teamspeak;
    this.audioPlayer = audioPlayer;
    this.permissionsManager = permissionsManager;
    this.config = config;
    this.prefix = config.commandPrefix || '!';

    // Define available commands
    this.commands = {
      play: this.handlePlay.bind(this),
      skip: this.handleSkip.bind(this),
      queue: this.handleQueue.bind(this),
      search: this.handleSearch.bind(this),
      pause: this.handlePause.bind(this),
      resume: this.handleResume.bind(this),
      stop: this.handleStop.bind(this),
      current: this.handleCurrent.bind(this),
      remove: this.handleRemove.bind(this),
      clear: this.handleClear.bind(this),
      volume: this.handleVolume.bind(this),
      help: this.handleHelp.bind(this)
    };
  }

  /**
   * Handle incoming text messages
   */
  async handleMessage(event) {
    try {
      const message = event.msg.trim();
      const invoker = event.invoker;

      // Check if message starts with prefix
      if (!message.startsWith(this.prefix)) {
        return;
      }

      // Parse command and arguments
      const args = message.slice(this.prefix.length).trim().split(/\s+/);
      const commandName = args.shift().toLowerCase();

      // Check if command exists
      if (!this.commands[commandName]) {
        return;
      }

      // Check permissions
      const hasPermission = await this.permissionsManager.checkPermission(invoker);
      if (!hasPermission) {
        await this.sendMessage(invoker, 'You do not have permission to use bot commands.');
        return;
      }

      // Execute command
      await this.commands[commandName](invoker, args);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Send a private message to a client
   */
  async sendMessage(client, message) {
    try {
      await this.teamspeak.sendTextMessage(client.clid, 1, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Play command - Add song to queue and play
   */
  async handlePlay(invoker, args) {
    if (args.length === 0) {
      await this.sendMessage(invoker, 'Usage: !play <YouTube URL or search query>');
      return;
    }

    const query = args.join(' ');

    try {
      await this.sendMessage(invoker, `Searching for: ${query}...`);
      const song = await this.audioPlayer.addToQueue(query, invoker.client_nickname);

      const queuePosition = this.audioPlayer.queue.length + (this.audioPlayer.currentSong ? 1 : 0);

      if (queuePosition === 0 || queuePosition === 1) {
        await this.sendMessage(invoker, `Now playing: ${song.title} [${this.formatDuration(song.duration)}]`);
      } else {
        await this.sendMessage(invoker, `Added to queue (position ${queuePosition}): ${song.title} [${this.formatDuration(song.duration)}]`);
      }
    } catch (error) {
      await this.sendMessage(invoker, `Error: ${error.message}`);
    }
  }

  /**
   * Skip command - Skip current song
   */
  async handleSkip(invoker, args) {
    if (!this.audioPlayer.isPlaying) {
      await this.sendMessage(invoker, 'Nothing is currently playing.');
      return;
    }

    const skipped = this.audioPlayer.currentSong;
    this.audioPlayer.skip();
    await this.sendMessage(invoker, `Skipped: ${skipped.title}`);
  }

  /**
   * Queue command - Display current queue
   */
  async handleQueue(invoker, args) {
    const state = this.audioPlayer.getQueue();

    if (!state.current && state.queue.length === 0) {
      await this.sendMessage(invoker, 'Queue is empty.');
      return;
    }

    let message = '';

    if (state.current) {
      message += `[b]Now Playing:[/b] ${state.current.title} [${this.formatDuration(state.current.duration)}]`;
      if (state.isPaused) {
        message += ' [PAUSED]';
      }
      message += '\n';
    }

    if (state.queue.length > 0) {
      message += '\n[b]Queue:[/b]\n';
      state.queue.slice(0, 10).forEach((song, index) => {
        message += `${index + 1}. ${song.title} [${this.formatDuration(song.duration)}] - Requested by ${song.requestedBy}\n`;
      });

      if (state.queue.length > 10) {
        message += `... and ${state.queue.length - 10} more songs`;
      }
    }

    await this.sendMessage(invoker, message);
  }

  /**
   * Search command - Search YouTube
   */
  async handleSearch(invoker, args) {
    if (args.length === 0) {
      await this.sendMessage(invoker, 'Usage: !search <query>');
      return;
    }

    const query = args.join(' ');

    try {
      await this.sendMessage(invoker, `Searching for: ${query}...`);
      const results = await this.audioPlayer.search(query, 5);

      if (results.length === 0) {
        await this.sendMessage(invoker, 'No results found.');
        return;
      }

      let message = '[b]Search Results:[/b]\n';
      results.forEach((video, index) => {
        message += `${index + 1}. ${video.title} [${video.duration}] by ${video.author}\n`;
        message += `   URL: ${video.url}\n`;
      });

      await this.sendMessage(invoker, message);
    } catch (error) {
      await this.sendMessage(invoker, `Error: ${error.message}`);
    }
  }

  /**
   * Pause command - Pause playback
   */
  async handlePause(invoker, args) {
    if (!this.audioPlayer.isPlaying) {
      await this.sendMessage(invoker, 'Nothing is currently playing.');
      return;
    }

    if (this.audioPlayer.isPaused) {
      await this.sendMessage(invoker, 'Playback is already paused. Use !resume to continue.');
      return;
    }

    this.audioPlayer.togglePause();
    await this.sendMessage(invoker, 'Playback paused. Use !resume to continue.');
  }

  /**
   * Resume command - Resume playback
   */
  async handleResume(invoker, args) {
    if (!this.audioPlayer.isPlaying) {
      await this.sendMessage(invoker, 'Nothing is currently playing.');
      return;
    }

    if (!this.audioPlayer.isPaused) {
      await this.sendMessage(invoker, 'Playback is not paused.');
      return;
    }

    this.audioPlayer.togglePause();
    await this.sendMessage(invoker, 'Playback resumed.');
  }

  /**
   * Stop command - Stop playback and clear queue
   */
  async handleStop(invoker, args) {
    await this.audioPlayer.stop();
    await this.sendMessage(invoker, 'Stopped playback and cleared queue.');
  }

  /**
   * Current command - Show currently playing song
   */
  async handleCurrent(invoker, args) {
    const state = this.audioPlayer.getQueue();

    if (!state.current) {
      await this.sendMessage(invoker, 'Nothing is currently playing.');
      return;
    }

    let message = `[b]Now Playing:[/b]\n`;
    message += `${state.current.title}\n`;
    message += `Duration: ${this.formatDuration(state.current.duration)}\n`;
    message += `Requested by: ${state.current.requestedBy}`;

    if (state.isPaused) {
      message += '\n[PAUSED]';
    }

    await this.sendMessage(invoker, message);
  }

  /**
   * Remove command - Remove song from queue
   */
  async handleRemove(invoker, args) {
    if (args.length === 0) {
      await this.sendMessage(invoker, 'Usage: !remove <queue position>');
      return;
    }

    const position = parseInt(args[0]) - 1;

    if (isNaN(position) || position < 0) {
      await this.sendMessage(invoker, 'Invalid queue position.');
      return;
    }

    const removed = this.audioPlayer.removeFromQueue(position);

    if (!removed) {
      await this.sendMessage(invoker, 'Invalid queue position.');
      return;
    }

    await this.sendMessage(invoker, `Removed from queue: ${removed.title}`);
  }

  /**
   * Clear command - Clear the queue
   */
  async handleClear(invoker, args) {
    const count = this.audioPlayer.clearQueue();
    await this.sendMessage(invoker, `Cleared ${count} song(s) from queue.`);
  }

  /**
   * Volume command - Set volume
   */
  async handleVolume(invoker, args) {
    if (args.length === 0) {
      await this.sendMessage(invoker, `Current volume: ${this.audioPlayer.volume}%`);
      return;
    }

    const volume = parseInt(args[0]);

    if (isNaN(volume) || volume < 0 || volume > 100) {
      await this.sendMessage(invoker, 'Volume must be between 0 and 100.');
      return;
    }

    this.audioPlayer.setVolume(volume);
    await this.sendMessage(invoker, `Volume set to ${volume}%`);
  }

  /**
   * Help command - Show available commands
   */
  async handleHelp(invoker, args) {
    const message = `[b]Available Commands:[/b]\n` +
      `${this.prefix}play <URL/query> - Play a song or add to queue\n` +
      `${this.prefix}skip - Skip current song\n` +
      `${this.prefix}queue - Show current queue\n` +
      `${this.prefix}search <query> - Search YouTube\n` +
      `${this.prefix}pause - Pause playback\n` +
      `${this.prefix}resume - Resume playback\n` +
      `${this.prefix}stop - Stop playback and clear queue\n` +
      `${this.prefix}current - Show current song\n` +
      `${this.prefix}remove <position> - Remove song from queue\n` +
      `${this.prefix}clear - Clear queue\n` +
      `${this.prefix}volume [0-100] - Set or show volume\n` +
      `${this.prefix}help - Show this help message`;

    await this.sendMessage(invoker, message);
  }

  /**
   * Format duration from seconds to MM:SS
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

module.exports = CommandHandler;
