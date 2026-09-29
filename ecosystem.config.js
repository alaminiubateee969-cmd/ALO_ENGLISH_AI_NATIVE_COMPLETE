/** Canonical single-process production configuration. */
module.exports = {
  apps: [{
    name: 'alo-english',
    script: '.next/standalone/server.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production', PORT: 3016, HOSTNAME: '127.0.0.1' },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    time: true,
  }],
};
