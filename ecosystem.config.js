module.exports = {
  apps: [
    {
      name: 'car-reservation-api',
      cwd: './backend',
      script: 'npm',
      args: 'run dev',
      env: { NODE_ENV: 'development', PORT: 4050 },
      watch: false,
      autorestart: true,
    },
    {
      name: 'car-reservation-web',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev -- --port 3050',
      env: { NODE_ENV: 'development', PORT: 3050 },
      watch: false,
      autorestart: true,
    },
  ],
};
