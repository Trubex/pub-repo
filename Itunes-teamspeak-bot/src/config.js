require('dotenv').config();

module.exports = {
  teamspeak: {
    host: process.env.TS3_HOST || 'localhost',
    queryport: parseInt(process.env.TS3_QUERY_PORT) || 10011,
    serverport: parseInt(process.env.TS3_SERVER_PORT) || 9987,
    username: process.env.TS3_USERNAME || 'serveradmin',
    password: process.env.TS3_PASSWORD || '',
    nickname: process.env.TS3_NICKNAME || 'iTunes Bot',
    channel: process.env.TS3_CHANNEL || ''
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
