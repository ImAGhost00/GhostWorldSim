# 💬 Discord Integration Setup Guide

## Why Discord Instead of AI?

Your hardware specs:
- **GPU**: GTX 1070 (4GB VRAM)
- **CPU**: Ryzen 7 3700X
- **RAM**: 46GB

The problem with AI:
- Ollama requires 8GB+ VRAM for smooth inference
- Your 4GB GPU would bottleneck severely
- CPU fallback would be very slow

**Solution**: Use Discord bot for natural interaction without VRAM requirements!

---

## Quick Setup (5 minutes)

### Step 1: Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click **"New Application"** (top right)
3. Give it a name: `Spaceship Station`
4. Click **"Create"**

### Step 2: Create Bot User

1. Click **"Bot"** in left menu
2. Click **"Add Bot"** button
3. Under TOKEN section, click **"Copy"**
4. Save this token somewhere safe

### Step 3: Configure Permissions

1. Click **"OAuth2"** in left menu
2. Click **"URL Generator"**
3. Under **SCOPES** select:
   - ✅ `bot`
4. Under **PERMISSIONS** select:
   - ✅ `Send Messages`
   - ✅ `Read Message History`
   - ✅ `Add Reactions`
5. Copy the generated URL at bottom

### Step 4: Add Bot to Your Server

1. Paste the URL from Step 3 in your browser
2. Select your Discord server
3. Click **"Authorize"**
4. Bot should now appear in your server

### Step 5: Configure Environment

1. Edit `backend/.env`:
   ```bash
   DISCORD_BOT_TOKEN=your_token_from_step_2
   ```

2. Start the backend:
   ```bash
   cd backend
   MOCK_MODE=true python main.py
   ```

3. You should see in console:
   ```
   Discord bot connected as Spaceship Station#1234
   ```

---

## Using Discord Commands

Once bot is running, use these commands in any Discord channel:

### Available Commands

```
!station status          # Get server status
!station containers      # List monitored containers
!station help            # Show all commands
!station approve <id>    # Approve pending action
```

### Example Usage

```
User: !station status
Bot:  📊 Server status: Online and monitoring

User: !station containers
Bot:  🐳 Container monitoring active

User: !station help
Bot:  [Shows command list]
```

---

## Testing Without Setup

If you don't set up Discord right away:

1. AI Core button will be **disabled** (greyed out)
2. Clicking it shows helpful message
3. All other features work normally
4. You can set up Discord anytime later

---

## Troubleshooting

### Bot doesn't connect

**Check**:
1. `DISCORD_BOT_TOKEN` is set correctly in `.env`
2. Token has no extra spaces
3. Backend logs show "Discord bot connected"

**Fix**:
```bash
# Restart backend
pkill -f "python main.py"
python backend/main.py
```

### Commands don't work

**Check**:
1. Bot has MESSAGE permission in channel
2. You're using correct command format
3. Backend console shows message received

**Fix**:
1. Re-authorize bot in Discord
2. Make sure bot role is above "default" role

### "Add Reactions" failing

**Reason**: Approval reactions need this permission

**Fix**:
1. Check bot role permissions
2. Server permissions shouldn't block bot
3. Try giving bot "Administrator" role temporarily

---

## Advanced Configuration

### Multiple Approval Channels

Edit `backend/discord_integration.py`:

```python
async def send_notification(self, channel_id: int, message: str):
    # Send to multiple channels
    channels = [
        DISCORD_CHANNEL_NOTIFICATIONS,
        DISCORD_CHANNEL_APPROVALS,
        DISCORD_CHANNEL_STATUS
    ]
    for channel_id in channels:
        await self.client.fetch_channel(channel_id).send(message)
```

### Custom Command Prefixes

Change `!station` to something else:

```python
@self.client.event
async def on_message(message):
    if message.content.startswith("!mystatus"):  # Changed prefix
        await self.handle_command(message)
```

### Add New Commands

In `backend/discord_integration.py`, add to `handle_command()`:

```python
elif command == "restart":
    container = parts[2]
    # Call your API
    response = requests.post(f"/api/containers/{container}/restart")
    await message.reply(f"Restarted {container}")
```

---

## API Endpoints for Discord

The bot uses these endpoints under the hood:

```
GET /api/status                 # Server status
GET /api/containers             # Container list
POST /api/control/request       # Request approval
GET /api/discord/status         # Bot connection status
```

You can also call these directly:

```bash
curl http://localhost:8000/api/discord/status

# Response:
{
  "enabled": true,
  "connected": true,
  "bot_name": "Spaceship Station",
  "message": "Discord bot integration ready"
}
```

---

## Next Steps

1. ✅ Create Discord app and bot
2. ✅ Add token to `.env`
3. ✅ Restart backend
4. ✅ Test with `!station status`
5. ✅ Add to your monitoring workflow

---

## Benefits Over AI

| Feature | Discord Bot | AI Core |
|---------|------------|---------|
| VRAM Required | 0 MB | 4000+ MB |
| Latency | <100ms | 1-5s |
| Natural Language | ✅ Yes | ✅ Yes |
| Approval Workflow | ✅ Reactions | ❌ No |
| Setup Time | 5 min | 30+ min |
| Your Hardware | ✅ Perfect | ❌ Bottleneck |

---

## Support

**Having issues?**

1. Check Discord bot has correct permissions
2. Verify token in `.env`
3. Check backend logs: `grep -i discord`
4. Try restarting backend
5. Check Discord bot client status in browser

**Need help?**

See backend logs for detailed error messages:

```bash
tail -f backend/debug.log | grep -i discord
```

---

**Ready to control your server via Discord?** 🚀

Once set up, you can:
- ✅ Check status anywhere
- ✅ Get notifications on actions
- ✅ Approve operations
- ✅ Monitor in real-time

All from Discord! No web browser needed.

---

**Status**: Discord bot module complete and ready to use!
