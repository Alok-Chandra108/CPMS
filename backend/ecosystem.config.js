module.exports = {
  apps: [
    {
      name: 'cpms-backend',
      script: 'server.js',

      // Spawns 1 worker process per CPU core for maximum throughput
      // Can be overridden via PM2_INSTANCES env variable (e.g. PM2_INSTANCES=2)
      instances: process.env.PM2_INSTANCES || 'max',

      // Enables cluster mode for multi-core load balancing
      exec_mode: 'cluster',

      // Distinguishes cluster workers (primary worker 0 runs cron jobs)
      instance_var: 'NODE_APP_INSTANCE',

      // Auto-restart worker if RAM usage exceeds 500MB
      max_memory_restart: '500M',

      // Zero-downtime reload settings
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Fault tolerance
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 1000,

      // Environments
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
