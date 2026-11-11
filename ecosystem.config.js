module.exports = {
  apps: [
    {
      name: 'alo-english',
      script: 'node_modules/.bin/next',
      args: 'start -p 3060',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3060,
        HOSTNAME: '0.0.0.0',
      },
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      time: true,
    },
  ],
};
