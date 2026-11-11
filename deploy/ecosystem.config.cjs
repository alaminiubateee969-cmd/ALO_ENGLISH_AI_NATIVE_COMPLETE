// deploy/ecosystem.config.cjs — PM2 process definition for the production host.
//
// Host: alo-server-lap (103.231.239.79), Ubuntu 22.04, PM2 7.x, Nginx 1.18,
// Cloudflare (proxied) in front. Domain: english.aloeducation.com, port 3055.
//
// Usage on the host:
//   cd ~/projects/alo-english
//   npm ci && npm run build
//   pm2 start deploy/ecosystem.config.cjs --env production
//   pm2 save && pm2 startup   # survive reboots
//
// The app's own entry point (server.js) honours PORT, so the port is set here
// once and the deploy checklist script does not need to wrap `npm start`.

module.exports = {
  apps: [
    {
      name: "english.aloeducation", // matches the host's PM2 naming convention
      script: "server.js",
      cwd: "/home/alamin/projects/alo-english",
      instances: 1, // SQLite: one writer process. Do not scale horizontally on this host.
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3055,
        HOSTNAME: "0.0.0.0",
        // DATABASE_URL and AUTH_SECRET deliberately NOT set here — they belong
        // in the host's environment panel / ~/.ecosystem-private.env so a repo
        // checkout can never leak them. See deploy/README.md.
      },
      // Long-lived Next.js server: restart on crash, but stop thrashing.
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 4000,
      // Graceful shutdown so in-flight exam submissions finish.
      kill_timeout: 10000,
      listen_timeout: 8000,
      // Logs, per the host convention: /home/alamin/.pm2/logs/<app>-*.log
      out_file: "/home/alamin/.pm2/logs/english.aloeducation-out.log",
      error_file: "/home/alamin/.pm2/logs/english.aloeducation-error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
