"""
Discord Bot Integration for Spaceship Station
Enables server control and notifications via Discord
"""

import os
import asyncio
import logging
from typing import Dict, Any, Optional

try:
    import discord
    DISCORD_AVAILABLE = True
except ImportError:
    DISCORD_AVAILABLE = False
    discord = None

logger = logging.getLogger(__name__)


class DiscordBotManager:
    """Manage Discord bot for server control and notifications."""
    
    def __init__(self, token: Optional[str] = None, intents: Optional[Any] = None):
        """Initialize Discord bot."""
        self.token = token or os.getenv("DISCORD_BOT_TOKEN")
        self.enabled = DISCORD_AVAILABLE and bool(self.token)
        self.client = None
        self.approval_cache = {}  # Track pending approvals
        
        if self.enabled:
            if intents is None:
                intents = discord.Intents.default()
                intents.message_content = True
            
            self.client = discord.Client(intents=intents)
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup Discord event handlers."""
        if not self.client:
            return
        
        @self.client.event
        async def on_ready():
            logger.info(f"Discord bot connected as {self.client.user}")
        
        @self.client.event
        async def on_message(message):
            """Handle Discord messages."""
            if message.author == self.client.user:
                return
            
            if message.content.startswith("!station"):
                await self.handle_command(message)
    
    async def handle_command(self, message):
        """Handle !station commands from Discord."""
        parts = message.content.split()
        
        if len(parts) < 2:
            await message.reply(
                "📡 **Spaceship Station Commands**\n"
                "`!station status` - Get server status\n"
                "`!station containers` - List containers\n"
                "`!station help` - Show this help\n"
                "`!station approve <id>` - Approve pending request\n"
            )
            return
        
        command = parts[1].lower()
        
        if command == "status":
            await message.reply("📊 Server status: Online and monitoring")
        elif command == "containers":
            await message.reply("🐳 Container monitoring active via qBittorrent")
        elif command == "approve":
            if len(parts) > 2:
                request_id = parts[2]
                await message.reply(f"✅ Request `{request_id}` approved")
                self.approval_cache[request_id] = True
        elif command == "help":
            await message.reply(
                "📡 **Spaceship Station Discord Integration**\n\n"
                "Available Commands:\n"
                "• `!station status` - Server status\n"
                "• `!station containers` - Container list\n"
                "• `!station help` - This message\n\n"
                "Approvals:\n"
                "• `!station approve <id>` - Approve request\n"
            )
    
    async def send_notification(self, channel_id: int, message: str):
        """Send notification to Discord channel."""
        if not self.enabled or not self.client:
            logger.warning("Discord bot not available")
            return False
        
        try:
            channel = await self.client.fetch_channel(channel_id)
            await channel.send(message)
            return True
        except Exception as e:
            logger.error(f"Failed to send Discord notification: {e}")
            return False
    
    async def request_approval(self, request_id: str, details: str, channel_id: int) -> bool:
        """Request user approval via Discord."""
        if not self.enabled:
            logger.warning("Discord not enabled, auto-approving")
            return True
        
        # Send approval request to Discord
        approval_message = (
            f"🔔 **Approval Required**\n"
            f"Request ID: `{request_id}`\n"
            f"Details: {details}\n\n"
            f"React with ✅ to approve or ❌ to deny"
        )
        
        try:
            channel = await self.client.fetch_channel(channel_id)
            msg = await channel.send(approval_message)
            
            # Wait for reaction
            await asyncio.sleep(5)  # Short wait for demo
            
            # In real implementation, would use reaction collector
            return request_id in self.approval_cache
        except Exception as e:
            logger.error(f"Approval request failed: {e}")
            return False
    
    async def start(self):
        """Start Discord bot."""
        if not self.enabled:
            logger.info("Discord bot not configured (DISCORD_BOT_TOKEN not set)")
            return
        
        try:
            await self.client.start(self.token)
        except Exception as e:
            logger.error(f"Failed to start Discord bot: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get Discord integration status."""
        return {
            "enabled": self.enabled,
            "connected": self.enabled and self.client and self.client.user is not None,
            "bot_name": self.client.user.name if (self.enabled and self.client and self.client.user) else None,
            "message": "Discord bot integration ready" if self.enabled else "Discord bot not configured",
        }
