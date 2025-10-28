const mysql = require('mysql2/promise');
const config = require('./config');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      console.log('MySQL connected successfully');
      await this.initializeSchema();
    } catch (error) {
      console.error('MySQL connection error:', error);
      throw error;
    }
  }

  async initializeSchema() {
    const connection = await this.pool.getConnection();
    try {
      // Create sessions table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          data TEXT,
          expires DATETIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create playback history table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS playback_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          track_name VARCHAR(255),
          artist VARCHAR(255),
          album VARCHAR(255),
          requested_by VARCHAR(255),
          played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create queue table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS queue (
          id INT AUTO_INCREMENT PRIMARY KEY,
          track_name VARCHAR(255),
          artist VARCHAR(255),
          album VARCHAR(255),
          requested_by VARCHAR(255),
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          position INT DEFAULT 0
        )
      `);

      // Create settings table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key_name VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      console.log('Database schema initialized');
    } catch (error) {
      console.error('Schema initialization error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async query(sql, params = []) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async addToHistory(track) {
    return this.query(
      'INSERT INTO playback_history (track_name, artist, album, requested_by) VALUES (?, ?, ?, ?)',
      [track.name, track.artist, track.album, track.requestedBy]
    );
  }

  async getHistory(limit = 50) {
    return this.query(
      'SELECT * FROM playback_history ORDER BY played_at DESC LIMIT ?',
      [limit]
    );
  }

  async addToQueue(track) {
    const maxPosition = await this.query(
      'SELECT MAX(position) as max_pos FROM queue'
    );
    const nextPosition = (maxPosition[0]?.max_pos || 0) + 1;

    return this.query(
      'INSERT INTO queue (track_name, artist, album, requested_by, position) VALUES (?, ?, ?, ?, ?)',
      [track.name, track.artist, track.album, track.requestedBy, nextPosition]
    );
  }

  async getQueue() {
    return this.query(
      'SELECT * FROM queue ORDER BY position ASC'
    );
  }

  async removeFromQueue(id) {
    return this.query('DELETE FROM queue WHERE id = ?', [id]);
  }

  async clearQueue() {
    return this.query('DELETE FROM queue');
  }

  async getSetting(key) {
    const result = await this.query(
      'SELECT value FROM settings WHERE key_name = ?',
      [key]
    );
    return result[0]?.value || null;
  }

  async setSetting(key, value) {
    return this.query(
      'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, value, value]
    );
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('MySQL connection closed');
    }
  }
}

module.exports = new Database();
