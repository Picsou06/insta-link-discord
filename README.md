# Instagram to Discord Bot

This Instagram bot automatically forwards received private messages to a Discord channel via webhook.

## 📋 Prerequisites

- Node.js (version 16 or higher)  
- An Instagram account
- A Discord webhook

## 🚀 Installation

1. **Clone or download the project**
   ```bash
   git clone https://github.com/Picsou06/insta-link-discord
   cd insta-link-discord
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## ⚙️ Configuration

1. **Create configuration file**
   ```bash
   cp .env.exemple .env
   ```

2. **Configure environment variables**
   
   Edit the `.env` file and fill in the values:

   ```env
   # Instagram Configuration
   INSTAGRAM_USERNAME=your_instagram_username
   INSTAGRAM_PASSWORD=your_instagram_password

   # Discord Webhook Configuration
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
   ```

### 🔗 Create a Discord webhook

1. Go to your Discord server settings
2. Go to "Integrations" > "Webhooks"
3. Click "Create Webhook"
4. Choose the destination channel
5. Copy the webhook URL and paste it in the `.env` file

## 🎛️ Advanced Configuration (optional)

You can customize polling behavior in the `.env` file:

- `MAX_POLLING_ERRORS` : Number of errors before pause (default: 10)
- `POLLING_DELAY_ON_ERROR` : Pause delay in milliseconds (default: 30000)
- `DAY_START_HOUR` / `DAY_END_HOUR` : Day hours (default: 7am-7pm)
- `DAY_MIN_DELAY` / `DAY_MAX_DELAY` : Day polling delays in ms (default: 5s-20s)
- `NIGHT_MIN_DELAY` / `NIGHT_MAX_DELAY` : Night polling delays in ms (default: 30s-60s)

## 🏃 Getting Started

### Simple start
```bash
npm start
```

### Start with PM2 (recommended for production)
```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start main.js --name "insta-bot"

# View logs
pm2 logs insta-bot

# Stop the bot
pm2 stop insta-bot

# Restart the bot
pm2 restart insta-bot
```

## 📊 Features

- ✅ Automatic Instagram messages transfer to Discord
- ✅ Images and media support
- ✅ Error handling with automatic retry
- ✅ Smart polling with random delays (day/night)
- ✅ Automatic ban notification
- ✅ Automatic correct user retrieval via authorID
- ✅ Automatic reconnection handling

## 🔧 Troubleshooting

### Connection errors
- **400 Bad Request "update Instagram"**: This is a common Instagram API message, often resolved by retrying
- **429 Too Many Requests**: Temporary rate limiting, wait a few minutes before retrying
- Check your Instagram credentials in the `.env` file
- Make sure two-factor authentication is disabled on your Instagram account
- Try logging into Instagram manually from the same network
- If session issues persist, delete `instagram-session.json` and restart

### Discord webhook errors
- Check that the webhook URL is correct
- Make sure the webhook hasn't been deleted
- Check bot permissions on the Discord server

### Polling errors (500 Internal Server Error, 403 Forbidden)
- **500 errors**: Usually indicate Instagram rate limiting
- **403 Forbidden errors**: May indicate temporary Instagram restrictions or account limitations
- The bot automatically pauses and notifies on Discord after too many errors
- Try increasing polling delays in the `.env` file
- If errors persist, wait some time before restarting (Instagram may have imposed temporary restrictions)

### Deprecated packages warnings
If you see deprecated package warnings during installation:
- These warnings are mostly from Instagram API dependencies
- They don't affect the bot's functionality

### Missing dependencies errors
If you encounter "Cannot find module" errors:
- Make sure all dependencies are installed with: `npm install @discordjs/collection jimp get-urls@10.0.1 instagram-private-api@1.41.0 instagram_mqtt@0.2.16`
- These packages are required by the Instagram.js library but may not be automatically installed
- **Important**: Use the exact versions specified, as newer versions have compatibility issues

### ESM compatibility issues
If you see errors like "ERR_REQUIRE_ESM":
- This occurs when ESM-only packages are installed instead of CommonJS compatible versions
- Solution: Uninstall the problematic package and install the correct version specified above
- Example: `npm uninstall get-urls && npm install get-urls@10.0.1`

### Collection import errors
If you see "Collection is not a constructor":
- This indicates an incorrect import of the @discordjs/collection package
- The fix has been applied to use destructured imports: `const { Collection } = require('@discordjs/collection')`

### Instagram API restrictions (403 Forbidden)
If you see repeated 403 Forbidden errors:
- **Most common cause**: Version incompatibility between `instagram_mqtt` and `instagram-private-api`
- **Primary solution**: Ensure correct package versions are installed:
  ```bash
  npm uninstall instagram_mqtt instagram-private-api
  npm install instagram_mqtt@0.2.16 instagram-private-api@1.41.0
  ```
- **Other potential causes:**
  - Instagram may have detected automated activity and imposed temporary restrictions
  - Session corruption - try deleting `instagram-session.json` and restart
  - Network issues or proxy problems
- **Additional solutions:**
  - Wait several hours before restarting the bot
  - Increase polling delays significantly in the `.env` file
  - Try logging into Instagram manually from the same IP address
- The bot will automatically pause after 10 consecutive errors and send a notification to Discord

## 📝 Logs

Bot logs include:
- Connection status
- Messages received and transferred
- Polling errors and retries
- Debug information

## ⚠️ Warnings

- Use this bot responsibly
- Respect Instagram's terms of service
- The bot may be detected by Instagram if used intensively
- Keep your credentials secure and never share them

## 🆘 Support

In case of problems:
1. Check logs with `pm2 logs insta-bot`
2. Restart the bot with `pm2 restart insta-bot`
3. Check your configuration in the `.env` file

## 🙏 Credits

- Thanks to [androz2091](https://github.com/androz2091) for the base Instagram.js library ([insta.js](https://insta.js.org/#))
- Thanks to [venom-exe](https://github.com/venom-exe) for the original bot concept ([insta-chatbot](https://github.com/venom-exe/insta-chatbot))