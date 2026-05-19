module.exports = {
  apps: [
    {
      name: 'car-reservation-api',
      cwd: './backend',
      script: 'node',
      args: 'dist/index.js',
      env: { NODE_ENV: 'production', PORT: 4050 },
      watch: false,
      autorestart: true,
    },
    {
      name: 'car-reservation-web',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'start --port 3050',
      env: { NODE_ENV: 'production', PORT: 3050 },
      watch: false,
      autorestart: true,
    },
  ],
};
