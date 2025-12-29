module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        // Copy this file to ecosystem.config.cjs and add your API keys:
        // OPENAI_API_KEY: 'your-api-key-here',
        // OPENAI_BASE_URL: 'https://api.openai.com/v1'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
