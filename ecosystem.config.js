/**
 * PM2 Ecosystem Configuration
 *
 * Start:  pm2 start ecosystem.config.js --name alo-english
 * Stop:   pm2 stop alo-english
 * Restart: pm2 restart alo-english
 * Logs:   pm2 logs alo-english
 * Status: pm2 status
 *
 * Auto-start on boot:
 *   pm2 startup
 *   pm2 save
 */

module.exports = {
  apps: [
    {
      name: 'alo-english',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_file: './logs/combined.log',
      time: true,
    },
    {
      name: 'alo-english-examiner-stream',
      script: 'mini-services/examiner-stream/index.ts',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/examiner-stream-error.log',
      out_file: './logs/examiner-stream-out.log',
      time: true,
    },
  ],
};
