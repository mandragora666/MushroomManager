// PM2 Konfiguration für Mushroom Manager Development
module.exports = {
  apps: [
    {
      name: 'mushroom-manager',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=mushroom-manager-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        CLOUDFLARE_EMAIL: 'c.leitgeb@gmx.net',
        CLOUDFLARE_API_KEY: '2f9d5e3008398c577490e9e24ab705b12a9e5'
      },
      watch: false, // Disable PM2 file monitoring (wrangler has its own)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      // Restart configuration
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s',
      // Logging
      log_file: '/home/user/.pm2/logs/mushroom-manager.log',
      out_file: '/home/user/.pm2/logs/mushroom-manager-out.log',
      error_file: '/home/user/.pm2/logs/mushroom-manager-error.log',
      merge_logs: true,
      time: true
    }
  ]
}