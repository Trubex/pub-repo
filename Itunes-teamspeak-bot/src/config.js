require('dotenv').config();

module.exports = {
  sinusbot: {
    host: process.env.SINUSBOT_HOST || 'http://localhost:8087',
    username: process.env.SINUSBOT_USERNAME || 'admin',
    password: process.env.SINUSBOT_PASSWORD || '',
    instanceId: process.env.SINUSBOT_INSTANCE_ID || null
  },
  teamspeak: {
    host: process.env.TS3_HOST || 'intern-ts3.icefuse.net'
  },
  web: {
    port: parseInt(process.env.WEB_PORT) || 3000,
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
    sessionSecret: process.env.SESSION_SECRET || 'default_secret_change_me'
  },
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'itunesbot',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'itunesbot'
  },
  itunes: {
    platform: process.env.ITUNES_PLATFORM || 'windows',
    host: process.env.ITUNES_HOST || 'host.docker.internal',
    port: parseInt(process.env.ITUNES_PORT) || 8181
  }
};
