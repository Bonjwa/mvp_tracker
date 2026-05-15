# Boss Respawn Tracker

Discord bot for tracking boss respawn timers. Bosses have a fixed 3-hour respawn — log a kill and it pings you a minute before they're back.

## Commands

- `/kill <boss>` — log that a boss just died (respawn = now + 3h)
- `/tomb <boss> <HH:MM>` — log a kill at a specific UTC time (respawn = that time + 3h)
- `/timers` — show all tracked bosses with countdown
- `/remove <boss>` — stop tracking a boss

Times are entered in UTC (24h format like `14:30`) and displayed as Discord timestamps that auto-convert to each user's local timezone.

## Setup

1. Install Node.js 16+
2. Create a Discord application + bot at https://discord.com/developers/applications and grab the token
3. In this folder:

   ```
   npm install
   ```

4. Make a `.env` file with:

   ```
   DISCORD_BOT_TOKEN=your_token_here
   ```

5. Start it:

   ```
   node index.js
   ```

You should see `Logged in as <BotName>!` in the console.

## Keeping it running

If you close the terminal the bot stops. I use  PM2:

```
npm install -g pm2
pm2 start index.js --name boss-bot
pm2 save
```

## Notes

- Timers live in `data.json` next to `index.js`, so they survive restarts
- Reminders fire 1 minute before respawn in the channel where the kill was logged
- Multiple servers are supported — timers are scoped per guild
