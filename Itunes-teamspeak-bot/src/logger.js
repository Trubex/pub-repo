class Logger {
  constructor(maxLogs = 500) {
    this.logs = [];
    this.maxLogs = maxLogs;
  }

  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console with color
    const colors = {
      info: '\x1b[36m',    // Cyan
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      success: '\x1b[32m', // Green
      reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`);
    if (data) {
      console.log(data);
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  success(message, data = null) {
    this.log('success', message, data);
  }

  getLogs(limit = 100) {
    return this.logs.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
  }
}

module.exports = new Logger();
