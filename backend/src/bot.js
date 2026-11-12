import { Telegraf, Markup } from 'telegraf';
import {
  registerClient,
  getClients,
  getStats,
  getClient,
  activateSubscription,
  getSubscriptionStatus,
  canUserAccessVideo,
  incrementFreeVideoUsed
} from './storage.js';
import { sendVideoToClient, broadcastVideo, getVideoConfig, setVideoConfig } from './videoManager.js';
import {
  addChannelVideo,
  getChannelVideos,
  getChannelVideoCount,
  sendRandomVideoToClient,
  broadcastRandomVideo,
  clearChannelVideos
} from './channelManager.js';

export function createBot(token) {
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required to initialize the bot.');
  }

  const bot = new Telegraf(token);
  const adminChatId = process.env.ADMIN_CHAT_ID ? String(process.env.ADMIN_CHAT_ID) : null;
  const configuredChannel = process.env.CHANNEL_ID || process.env.TELEGRAM_CHANNEL;
  const autoSendOnStart = process.env.AUTO_SEND_ON_START === 'true';

  // Global Error Handler to ensure the bot never crashes
  bot.catch((err, ctx) => {
    console.error(`[BotError] Error for update type ${ctx.updateType}:`, err.message || err);
    try {
      ctx.reply('⚠️ An error occurred processing this request. Please try again.').catch(() => {});
    } catch {}
  });

  // Helper to check if a user is admin
  const isAdmin = (ctx) => {
    if (!adminChatId) return true; // If admin ID is not set, allow sender
    return String(ctx.from?.id) === adminChatId;
  };

  // Main Persistent Keyboard Menu
  const mainKeyboard = Markup.keyboard([
    ['🎲 Random Video', '⭐ 1-Day Pass'],
    ['📊 My Stats', '📩 Request'],
    ['❓ Help']
  ]).resize();

  // Helper to escape HTML characters
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  // In-memory conversation state for requests and admin replies
  const userSessions = new Map();

  // Middleware: Automatically register any user who messages the bot
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      registerClient(ctx.from);
    }
    return next();
  });

  // ==========================================
  // CHANNEL AUTO-INDEXING LISTENERS
  // ==========================================

  // Helper to extract video media from any message or channel post
  const extractVideoMedia = (msg) => {
    if (!msg) return null;
    if (msg.video) return { media: msg.video, type: 'video' };
    if (msg.animation) return { media: msg.animation, type: 'animation' };
    if (msg.document && (
      msg.document.mime_type?.startsWith('video/') ||
      msg.document.file_name?.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/i)
    )) {
      return { media: msg.document, type: 'document_video' };
    }
    return null;
  };

  // Automatically index any video posted in channels where the bot is added as admin
  bot.on('channel_post', async (ctx) => {
    const post = ctx.channelPost;
    const extracted = extractVideoMedia(post);

    if (post && extracted) {
      const media = extracted.media;
      const result = addChannelVideo({
        fileId: media.file_id,
        fileUniqueId: media.file_unique_id,
        channelId: post.chat.id,
        channelTitle: post.chat.title || '',
        channelUsername: post.chat.username ? `@${post.chat.username}` : '',
        messageId: post.message_id,
        caption: post.caption || '',
        duration: media.duration || 0,
        width: media.width || null,
        height: media.height || null,
        sourceType: 'channel_post'
      });

      console.log(`[ChannelPost] Video (${extracted.type}) indexed from channel "${post.chat.title || post.chat.id}". Total videos in catalog: ${result.total}`);
    }
  });

  bot.on('edited_channel_post', async (ctx) => {
    const post = ctx.channelPost;
    const extracted = extractVideoMedia(post);
    if (post && extracted) {
      const media = extracted.media;
      addChannelVideo({
        fileId: media.file_id,
        fileUniqueId: media.file_unique_id,
        channelId: post.chat.id,
        channelTitle: post.chat.title || '',
        channelUsername: post.chat.username ? `@${post.chat.username}` : '',
        messageId: post.message_id,
        caption: post.caption || '',
        duration: media.duration || 0,
        sourceType: 'channel_post_edited'
      });
    }
  });

  // Automatically detect when bot is added to a channel as Admin
  bot.on('my_chat_member', async (ctx) => {
    const member = ctx.myChatMember;
    const chat = member?.chat;
    const newStatus = member?.new_chat_member?.status;

    if (chat && (newStatus === 'administrator' || newStatus === 'member')) {
      const channelIdentifier = chat.username ? `@${chat.username}` : chat.id;
      console.log(`[ChannelConnect] Bot added to ${chat.type} "${chat.title}" (${channelIdentifier})`);

      // Notify the admin directly so they know the connection succeeded
      if (adminChatId) {
        await bot.telegram.sendMessage(
          adminChatId,
          `🎉 <b>Channel Connected Successfully!</b>\n\n` +
          `• <b>Channel Name:</b> ${chat.title}\n` +
          `• <b>Channel ID:</b> <code>${chat.id}</code>\n` +
          `• <b>Username:</b> ${chat.username ? `@${chat.username}` : 'Private channel'}\n\n` +
          `Any video you post in this channel will now automatically be indexed and sent to your clients!`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }
    }
  });

  // ==========================================
  // CLIENT COMMANDS & INTERACTIONS
  // ==========================================

  // Send Telegram Stars Invoice for 1-Day Pass
  const sendStarsInvoice = async (chatId) => {
    const starsPrice = parseInt(process.env.STARS_1DAY_PRICE || '50', 10);
    return await bot.telegram.sendInvoice(chatId, {
      title: '⭐ 1-Day VIP Video Pass',
      description: 'Unlock 24 hours of unlimited random channel videos with high definition streaming!',
      payload: `sub_1day_${chatId}_${Date.now()}`,
      currency: 'XTR',
      prices: [{ label: '1-Day VIP Pass (24 Hours)', amount: starsPrice }],
      provider_token: '' // Telegram Stars requires an empty provider_token
    });
  };

  // /start command
  bot.command('start', async (ctx) => {
    const user = ctx.from;
    registerClient(user);
    const videoCount = getChannelVideoCount();
    const subStatus = getSubscriptionStatus(ctx.chat.id);
    const starsPrice = parseInt(process.env.STARS_1DAY_PRICE || '50', 10);

    const subBadge = subStatus.isSubscribed
      ? `🟢 <b>VIP Active</b> (${subStatus.isAdmin ? 'Lifetime Admin' : `${subStatus.remainingHours}h remaining`})`
      : `⚪ <b>Free Tier</b>`;

    const welcomeMsg = `
👋 <b>Hello, ${user.first_name || 'Friend'}!</b>

Welcome to the <b>TellMan Channel Video Bot</b>!
I deliver high-definition random videos directly from our Telegram channel.

📼 <b>Available Videos:</b> <code>${videoCount}</code> in catalog
⭐ <b>Status:</b> ${subBadge}

💡 <b>Choose an option below:</b>
• Tap <b>🎲 Random Video</b> to watch a clip.
• Tap <b>⭐ 1-Day Pass</b> for 24h unlimited access (${starsPrice} Stars).
• Tap <b>📊 My Stats</b> to view your profile and watch history.
`.trim();

    const inlineButtons = [
      [Markup.button.callback('🎲 Watch Random Video', 'action_random_video')]
    ];

    if (!subStatus.isSubscribed) {
      inlineButtons.push([Markup.button.callback(`⭐ Buy 1-Day VIP Pass (${starsPrice} Stars)`, 'action_buy_stars_1day')]);
    }

    inlineButtons.push([
      Markup.button.callback('📩 Request Admin', 'action_request'),
      Markup.button.callback('📊 My Stats', 'action_stats')
    ]);

    await ctx.reply(welcomeMsg, {
      parse_mode: 'HTML',
      ...mainKeyboard
    });

    await ctx.reply('Quick actions:', Markup.inlineKeyboard(inlineButtons));

    // If auto-send on start is configured
    if (autoSendOnStart) {
      await handleRandomVideo(ctx);
    }
  });

  // /random & /video commands with subscription paywall
  const handleRandomVideo = async (ctx) => {
    const access = canUserAccessVideo(ctx.chat.id);
    const starsPrice = parseInt(process.env.STARS_1DAY_PRICE || '50', 10);

    if (!access.allowed) {
      const paywallMsg = `
⭐ <b>VIP Subscription Required</b>

You have used your free preview.
Unlock <b>24 hours of unlimited random channel videos</b> with our 1-Day VIP Pass!

💰 <b>Price:</b> <code>${starsPrice} Telegram Stars (XTR)</code>
⏱️ <b>Duration:</b> 24 Hours
✨ <b>Includes:</b> Unlimited random videos, HD streaming & zero ads
`.trim();

      return ctx.reply(paywallMsg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(`⭐ Unlock 1-Day Pass (${starsPrice} Stars)`, 'action_buy_stars_1day')],
          [Markup.button.callback('📩 Request Admin', 'action_request')]
        ])
      });
    }

    if (access.reason === 'free_trial') {
      incrementFreeVideoUsed(ctx.chat.id);
    }

    const res = await sendRandomVideoToClient(bot, ctx.chat.id);
    if (!res.success) {
      await ctx.reply(`⚠️ Could not retrieve video: ${res.error}`);
    }
  };

  bot.command(['random', 'video'], handleRandomVideo);
  bot.hears('🎲 Random Video', handleRandomVideo);

  // Callback query: action_random_video (triggered from inline button)
  bot.action('action_random_video', async (ctx) => {
    await ctx.answerCbQuery('🎲 Checking access...');
    await handleRandomVideo(ctx);
  });

  // Plan / Subscribe Commands
  const showSubscriptionPlan = async (ctx) => {
    const subStatus = getSubscriptionStatus(ctx.chat.id);
    const starsPrice = parseInt(process.env.STARS_1DAY_PRICE || '50', 10);

    if (subStatus.isSubscribed) {
      const expText = subStatus.isAdmin
        ? 'Lifetime Admin Access'
        : `Active (Expires in ~${subStatus.remainingHours} hours: ${new Date(subStatus.expiresAt).toLocaleString()})`;

      return ctx.reply(
        `⭐ <b>Your VIP Subscription</b>\n\n` +
        `• <b>Status:</b> 🟢 Active\n` +
        `• <b>Expiration:</b> ${expText}\n` +
        `• <b>Perks:</b> Unlimited random channel videos\n\n` +
        `Want to extend your pass by another 24 hours?`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(`⭐ Extend by 1 Day (+${starsPrice} Stars)`, 'action_buy_stars_1day')],
            [Markup.button.callback('🎲 Watch Random Video', 'action_random_video')]
          ])
        }
      );
    }

    const planMsg = `
⭐ <b>TellMan VIP Subscription Plan</b>

Get full, unlimited access to our entire catalog of channel videos!

📋 <b>Plan Details:</b>
• <b>Duration:</b> 1 Day (24 Hours)
• <b>Price:</b> <code>${starsPrice} Telegram Stars (XTR)</code>
• <b>Features:</b>
  ✅ Unlimited random video delivery
  ✅ Instant playback without wait times
  ✅ Access to all current & future channel clips

Click below to purchase using your Telegram Stars balance:
`.trim();

    await ctx.reply(planMsg, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback(`⭐ Pay ${starsPrice} Stars (1-Day Pass)`, 'action_buy_stars_1day')]
      ])
    });
  };

  bot.command(['plan', 'subscribe', 'sub', 'vip'], showSubscriptionPlan);
  bot.hears('⭐ 1-Day Pass', showSubscriptionPlan);
  bot.action('action_sub_info', async (ctx) => {
    await ctx.answerCbQuery();
    await showSubscriptionPlan(ctx);
  });

  // Trigger invoice creation
  bot.action('action_buy_stars_1day', async (ctx) => {
    await ctx.answerCbQuery('Generating Telegram Stars invoice...');
    try {
      await sendStarsInvoice(ctx.chat.id);
    } catch (err) {
      console.error('[StarsInvoiceError]', err.message);
      await ctx.reply(`⚠️ Could not create Stars invoice: ${err.message}`);
    }
  });

  // ==========================================
  // TELEGRAM STARS PAYMENT LISTENERS
  // ==========================================

  // Pre-checkout query handler (MUST reply within 10s to approve)
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      // Approve checkout
      await ctx.answerPreCheckoutQuery(true);
      console.log(`[TelegramStars] Pre-checkout approved for user ${ctx.from?.id} (${ctx.from?.first_name})`);
    } catch (err) {
      console.error('[PreCheckoutError]', err.message);
      await ctx.answerPreCheckoutQuery(false, 'Checkout could not be completed. Please try again.');
    }
  });

  // Successful payment handler
  bot.on('successful_payment', async (ctx) => {
    const payment = ctx.message.successful_payment;
    const starsAmount = payment.total_amount;
    const chargeId = payment.telegram_payment_charge_id;

    console.log(`[TelegramStars] Payment confirmed! User ${ctx.chat.id} paid ${starsAmount} XTR (Charge: ${chargeId})`);

    const sub = activateSubscription(ctx.chat.id, {
      plan: '1_day',
      durationMs: 24 * 60 * 60 * 1000,
      starsPaid: starsAmount,
      chargeId: chargeId
    });

    const expiresDateStr = new Date(sub.expiresAt).toLocaleString();

    await ctx.reply(
      `🎉 <b>Payment Successful!</b>\n\n` +
      `⭐ <b>1-Day VIP Video Pass Activated!</b>\n` +
      `• <b>Amount Paid:</b> ${starsAmount} Telegram Stars (XTR)\n` +
      `• <b>Valid Until:</b> ${expiresDateStr}\n` +
      `• <b>Status:</b> 24 Hours Unlimited Access\n\n` +
      `Enjoy watching! Tap below to start receiving random videos:`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎲 Watch Random Video Now', 'action_random_video')]
        ])
      }
    );

    // Notify admin of sale
    if (adminChatId && String(ctx.chat.id) !== adminChatId) {
      await bot.telegram.sendMessage(
        adminChatId,
        `💰 <b>New Telegram Stars Sale!</b>\n` +
        `• <b>User:</b> ${ctx.from.first_name} (@${ctx.from.username || 'NoUsername'}) [ID: <code>${ctx.chat.id}</code>]\n` +
        `• <b>Amount:</b> ${starsAmount} Stars\n` +
        `• <b>Plan:</b> 1-Day Pass`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    }
  });

  // ==========================================
  // REQUEST / DOUBT & ADMIN ASSISTANCE SYSTEM
  // ==========================================

  // Prompt the user to enter their request or question
  const handleRequestPrompt = async (ctx) => {
    userSessions.set(ctx.from.id, { state: 'WAITING_REQUEST' });

    const msg = `
📩 <b>Request a Video or Ask Any Doubt</b>

Looking for a specific video, having payment issues, or have any question?

✍️ <b>Type and send your message below!</b>
<i>You can send text, or attach a photo / video clip. Your message will be sent directly to the admin.</i>

<i>Tap /cancel anytime to return to the main menu.</i>
`.trim();

    await ctx.reply(msg, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel Request', 'action_cancel_request')]
      ])
    });
  };

  // Forward the submitted request to admin
  const processUserRequest = async (ctx, userMessageText) => {
    userSessions.delete(ctx.from.id);

    // Confirm to the user
    await ctx.reply(
      `✅ <b>Request Submitted to Admin!</b>\n\n` +
      `Your message has been delivered to our admin. We will review it and reply back to you here shortly! 🙏`,
      {
        parse_mode: 'HTML',
        ...mainKeyboard
      }
    );

    // Send notification to admin
    if (adminChatId) {
      const fromUser = ctx.from;
      const userName = [fromUser.first_name, fromUser.last_name].filter(Boolean).join(' ');
      const userHandle = fromUser.username ? `@${fromUser.username}` : 'No username';

      const adminAlert = `
📩 <b>New User Request / Doubt</b>

👤 <b>From:</b> <b>${escapeHtml(userName)}</b> (${userHandle})
🆔 <b>User ID:</b> <code>${fromUser.id}</code>
🕒 <b>Time:</b> ${new Date().toLocaleString()}

💬 <b>Message:</b>
${escapeHtml(userMessageText || '(Media attached)')}
`.trim();

      try {
        await bot.telegram.sendMessage(adminChatId, adminAlert, {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Reply to User', `admin_reply_${fromUser.id}`)]
          ])
        });

        // Forward any media sent with the request
        if (ctx.message && (ctx.message.photo || ctx.message.video || ctx.message.document || ctx.message.voice || ctx.message.audio)) {
          await bot.telegram.forwardMessage(adminChatId, ctx.chat.id, ctx.message.message_id);
        }
      } catch (err) {
        console.error('[AdminNotifyError] Failed to forward request to admin:', err.message);
      }
    }
  };

  // User triggers for Request
  bot.hears(['📩 Request', 'Request', 'request'], handleRequestPrompt);
  bot.command(['request', 'ask'], async (ctx) => {
    const text = ctx.message.text.replace(/^\/(request|ask)(@\w+)?\s*/i, '').trim();
    if (!text) {
      return handleRequestPrompt(ctx);
    }
    await processUserRequest(ctx, text);
  });

  bot.action('action_request', async (ctx) => {
    await ctx.answerCbQuery();
    await handleRequestPrompt(ctx);
  });

  bot.action('action_cancel_request', async (ctx) => {
    userSessions.delete(ctx.from?.id);
    await ctx.answerCbQuery('Request cancelled');
    await ctx.reply('❌ Request cancelled.', mainKeyboard);
  });

  // Cancel command
  bot.command('cancel', async (ctx) => {
    if (userSessions.has(ctx.from?.id)) {
      userSessions.delete(ctx.from?.id);
      return ctx.reply('❌ Action cancelled.', mainKeyboard);
    }
    return ctx.reply('ℹ️ No active action to cancel.', mainKeyboard);
  });

  // Admin reply button callback
  bot.action(/^admin_reply_(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Unauthorized');
    const targetUserId = ctx.match[1];
    await ctx.answerCbQuery();

    userSessions.set(ctx.from.id, {
      state: 'WAITING_ADMIN_REPLY',
      targetUserId: targetUserId
    });

    await ctx.reply(
      `✍️ <b>Replying to User:</b> <code>${targetUserId}</code>\n\n` +
      `Send your reply below (text, video, photo, or document).\n` +
      `It will be delivered directly to the user.\n\n` +
      `<i>Type /cancel to cancel.</i>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel Reply', 'admin_cancel_reply')]
        ])
      }
    );
  });

  bot.action('admin_cancel_reply', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Unauthorized');
    userSessions.delete(ctx.from.id);
    await ctx.answerCbQuery('Reply cancelled');
    await ctx.reply('❌ Admin reply cancelled.');
  });

  // /reply <user_id> <message> command for admin
  bot.command('reply', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('⛔ Admin only.');

    const parts = ctx.message.text.split(' ').filter(Boolean);
    const targetUserId = parts[1];
    const replyText = parts.slice(2).join(' ');

    if (!targetUserId || !replyText) {
      return ctx.reply('Usage: <code>/reply &lt;user_id&gt; &lt;message&gt;</code>\nExample: <code>/reply 12345678 Sure, I uploaded the video!</code>', { parse_mode: 'HTML' });
    }

    try {
      await bot.telegram.sendMessage(
        targetUserId,
        `📬 <b>Message from Admin:</b>\n\n${escapeHtml(replyText)}`,
        { parse_mode: 'HTML' }
      );
      await ctx.reply(`✅ Reply sent successfully to user <code>${targetUserId}</code>!`, { parse_mode: 'HTML' });
    } catch (err) {
      await ctx.reply(`⚠️ Failed to deliver reply to user <code>${targetUserId}</code>: ${err.message}`, { parse_mode: 'HTML' });
    }
  });

  // /stats command & button
  const showUserStats = async (ctx) => {
    if (isAdmin(ctx)) {
      const globalStats = getStats();
      const videoCount = getChannelVideoCount();

      const adminStatsMsg = `
👑 <b>Admin Control & Channel Stats</b>

👥 <b>Total Clients:</b> ${globalStats.totalClients}
🟢 <b>Active Subscribers:</b> ${globalStats.activeClients}
📼 <b>Channel Videos in Catalog:</b> ${videoCount}
🎥 <b>Total Videos Delivered:</b> ${globalStats.totalVideosSent}
📢 <b>Broadcasts Completed:</b> ${globalStats.broadcastsCount}
`.trim();

      const adminKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🎲 Broadcast Random to All', 'admin_prompt_bcast_random')],
        [Markup.button.callback('📋 View Clients', 'admin_list_clients')]
      ]);

      return ctx.reply(adminStatsMsg, { parse_mode: 'HTML', ...adminKeyboard });
    }

    const client = getClient(ctx.chat.id);
    const subStatus = getSubscriptionStatus(ctx.chat.id);
    const subText = subStatus.isSubscribed
      ? `🟢 Active (${subStatus.isAdmin ? 'Admin' : `Expires in ${subStatus.remainingHours}h`})`
      : `⚪ Free User (Free Videos Used: ${client?.freeVideosUsed || 0})`;

    const userStatsMsg = `
📊 <b>Your Profile & Watch Stats</b>

👤 <b>Client:</b> ${client?.firstName || ctx.from.first_name || 'Client'}
🆔 <b>Chat ID:</b> <code>${ctx.chat.id}</code>
⭐ <b>Subscription:</b> ${subText}
🎬 <b>Videos Watched:</b> ${client?.videosReceived || 0}
📅 <b>Member Since:</b> ${client?.firstSeen ? new Date(client.firstSeen).toLocaleDateString() : 'Today'}
`.trim();

    const buttons = [];
    if (!subStatus.isSubscribed) {
      const starsPrice = parseInt(process.env.STARS_1DAY_PRICE || '50', 10);
      buttons.push([Markup.button.callback(`⭐ Get 1-Day Pass (${starsPrice} Stars)`, 'action_buy_stars_1day')]);
    }
    buttons.push([Markup.button.callback('🎲 Watch Random Video', 'action_random_video')]);

    await ctx.reply(userStatsMsg, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons)
    });
  };

  bot.command('stats', showUserStats);
  bot.hears('📊 My Stats', showUserStats);
  bot.action('action_stats', async (ctx) => {
    await ctx.answerCbQuery();
    await showUserStats(ctx);
  });

  // Admin command: /grant_sub <chat_id> [days]
  bot.command('grant_sub', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('⛔ Admin only.');

    const parts = ctx.message.text.split(' ').filter(Boolean);
    const targetChatId = parts[1];
    const days = parseInt(parts[2] || '1', 10);

    if (!targetChatId) {
      return ctx.reply('Usage: <code>/grant_sub &lt;chat_id&gt; [days]</code>\nExample: <code>/grant_sub 1296727385 1</code>', { parse_mode: 'HTML' });
    }

    const durationMs = days * 24 * 60 * 60 * 1000;
    const sub = activateSubscription(targetChatId, {
      plan: `${days}_day_gift`,
      durationMs,
      starsPaid: 0,
      chargeId: 'admin_gift'
    });

    if (!sub) {
      return ctx.reply(`⚠️ User <code>${targetChatId}</code> not found in database. Make sure they have pressed /start once.`, { parse_mode: 'HTML' });
    }

    await ctx.reply(`✅ Granted <b>${days} day(s)</b> VIP subscription to user <code>${targetChatId}</code>! Expires: ${new Date(sub.expiresAt).toLocaleString()}`, { parse_mode: 'HTML' });

    // Notify the user
    await bot.telegram.sendMessage(
      targetChatId,
      `🎁 <b>Congratulations!</b> You have been granted a <b>${days}-Day VIP Pass</b> by an administrator!\n\n` +
      `Valid until: ${new Date(sub.expiresAt).toLocaleString()}\nTap below to start watching:`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎲 Watch Random Video', 'action_random_video')]
        ])
      }
    ).catch(() => {});
  });

  // /help command
  const showHelp = async (ctx) => {
    let helpMsg = `
📖 <b>How to use:</b>

/random - Get a random video from our channel
/start - Restart bot and open main menu
/stats - View your watch statistics
/request - Request a specific video or ask any doubt to admin
/cancel - Cancel any current request or operation
/help - Show this message
`.trim();

    if (isAdmin(ctx)) {
      helpMsg += `\n\n👑 <b>Admin Instructions:</b>
1. <b>Auto-Sync:</b> Add this bot as an Admin to your Telegram Channel. All future videos posted in the channel will automatically be indexed!
2. <b>Reply to Users:</b> Swipe & reply to any user request, or use <code>/reply &lt;user_id&gt; &lt;text&gt;</code>!
3. <b>Commands:</b>
   • /reply &lt;user_id&gt; &lt;message&gt; - Reply directly to user
   • /grant_sub &lt;user_id&gt; [days] - Grant VIP subscription
   • /broadcast_random - Send a random video to all clients
   • /sync_channel &lt;min_id&gt; &lt;max_id&gt; - Scan channel message IDs
   • /clear_channel - Clear catalog`;
    }

    await ctx.reply(helpMsg, { parse_mode: 'HTML' });
  };

  bot.command('help', showHelp);
  bot.hears('❓ Help', showHelp);

  // ==========================================
  // INCOMING MESSAGE LISTENER
  // ==========================================

  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;
    if (!msg) return next();

    // 0. Admin native swipe-to-reply handling
    if (isAdmin(ctx) && msg.reply_to_message) {
      const repliedText = msg.reply_to_message.text || msg.reply_to_message.caption || '';
      const idMatch = repliedText.match(/User ID:\s*<code>?(\d+)<\/code>?/i) || repliedText.match(/User ID:\s*(\d+)/i);
      if (idMatch && idMatch[1]) {
        const targetId = idMatch[1];
        try {
          if (msg.text) {
            await bot.telegram.sendMessage(
              targetId,
              `📬 <b>Message from Admin:</b>\n\n${escapeHtml(msg.text)}`,
              { parse_mode: 'HTML' }
            );
          } else {
            await bot.telegram.copyMessage(targetId, ctx.chat.id, msg.message_id, {
              caption: msg.caption ? `📬 <b>Message from Admin:</b>\n\n${escapeHtml(msg.caption)}` : '📬 <b>Message from Admin</b>',
              parse_mode: 'HTML'
            });
          }
          return ctx.reply(`✅ Response delivered to user <code>${targetId}</code>!`, { parse_mode: 'HTML' });
        } catch (err) {
          return ctx.reply(`⚠️ Could not send reply to user <code>${targetId}</code>: ${err.message}`, { parse_mode: 'HTML' });
        }
      }
    }

    // 1. Admin waiting to reply via inline button
    const adminSession = userSessions.get(ctx.from?.id);
    if (isAdmin(ctx) && adminSession?.state === 'WAITING_ADMIN_REPLY') {
      if (msg.text === '/cancel') {
        userSessions.delete(ctx.from.id);
        return ctx.reply('❌ Admin reply cancelled.');
      }
      const targetId = adminSession.targetUserId;
      userSessions.delete(ctx.from.id);

      try {
        if (msg.text) {
          await bot.telegram.sendMessage(
            targetId,
            `📬 <b>Message from Admin:</b>\n\n${escapeHtml(msg.text)}`,
            { parse_mode: 'HTML' }
          );
        } else {
          await bot.telegram.copyMessage(targetId, ctx.chat.id, msg.message_id, {
            caption: msg.caption ? `📬 <b>Message from Admin:</b>\n\n${escapeHtml(msg.caption)}` : '📬 <b>Message from Admin</b>',
            parse_mode: 'HTML'
          });
        }
        return ctx.reply(`✅ Response delivered to user <code>${targetId}</code>!`, { parse_mode: 'HTML' });
      } catch (err) {
        return ctx.reply(`⚠️ Failed to deliver reply to user <code>${targetId}</code>: ${err.message}`, { parse_mode: 'HTML' });
      }
    }

    // 2. User waiting to submit request / doubt
    const userSession = userSessions.get(ctx.from?.id);
    if (userSession?.state === 'WAITING_REQUEST') {
      const text = msg.text || msg.caption || '';
      // If user typed a command or tapped a main menu button, exit request mode and let next() handle it
      if (text.startsWith('/') || ['🎲 Random Video', '⭐ 1-Day Pass', '📊 My Stats', '📩 Request', '❓ Help'].includes(text)) {
        userSessions.delete(ctx.from.id);
        return next();
      }
      return processUserRequest(ctx, text);
    }

    // Check if message is a forwarded video from a channel
    const isForwarded = msg.forward_from_chat || msg.forward_origin?.chat;
    const forwardChat = msg.forward_from_chat || msg.forward_origin?.chat;
    const forwardMsgId = msg.forward_from_message_id || msg.forward_origin?.message_id;

    // Check if message contains video or video document
    const extracted = extractVideoMedia(msg);
    if (!extracted) return next();

    const media = extracted.media;

    // 1. Forwarded video from a channel
    if (isForwarded) {
      if (!isAdmin(ctx)) {
        return ctx.reply('🎬 Thanks for the forwarded video!');
      }

      const channelTitle = forwardChat.title || 'Channel';
      const channelId = forwardChat.id;
      const channelUsername = forwardChat.username ? `@${forwardChat.username}` : '';

      const addResult = addChannelVideo({
        fileId: media.file_id,
        fileUniqueId: media.file_unique_id,
        channelId: channelId,
        channelTitle: channelTitle,
        channelUsername: channelUsername,
        messageId: forwardMsgId || null,
        caption: msg.caption || '',
        duration: media.duration || 0,
        width: media.width || null,
        height: media.height || null,
        sourceType: 'forward'
      });

      if (addResult.added) {
        return ctx.reply(
          `✅ <b>Video Indexed from "${channelTitle}"!</b>\n` +
          `• <b>File ID:</b> <code>${media.file_id}</code>\n` +
          `• <b>Total Videos in Catalog:</b> <code>${addResult.total}</code>\n\n` +
          `Clients will now receive this video in their random rotation!`,
          {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🎲 Test Random Video Now', 'action_random_video')]
            ])
          }
        );
      } else {
        return ctx.reply(`ℹ️ This video is already in the channel catalog (Total: ${addResult.total}).`);
      }
    }

    // 2. Direct video sent to the bot (by admin)
    if (isAdmin(ctx)) {
      const addResult = addChannelVideo({
        fileId: media.file_id,
        fileUniqueId: media.file_unique_id,
        caption: msg.caption || '🎬 Random Video',
        duration: media.duration || 0,
        width: media.width || null,
        height: media.height || null,
        sourceType: 'admin_upload'
      });

      return ctx.reply(
        `✅ <b>Video Added to Random Catalog!</b>\n` +
        `• <b>Format:</b> ${extracted.type}\n` +
        `• <b>File ID:</b> <code>${media.file_id}</code>\n` +
        `• <b>Duration:</b> ${media.duration || 0}s\n` +
        `• <b>Total Videos in Catalog:</b> <code>${addResult.total}</code>\n\n` +
        `Clients can now get this video randomly!`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🎲 Test Random Video Now', 'action_random_video')]
          ])
        }
      );
    }

    return next();
  });

  // ==========================================
  // ADMIN COMMANDS
  // ==========================================

  // /broadcast_random: Broadcast random video to all clients
  bot.command(['broadcast_random', 'broadcast'], async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply('⛔ Only admins can execute broadcasts.');
    }

    const clients = getClients(true);
    if (clients.length === 0) {
      return ctx.reply('⚠️ No registered clients found to broadcast to yet.');
    }

    await ctx.reply(`📢 Initiating random video broadcast to <b>${clients.length}</b> client(s)...`, { parse_mode: 'HTML' });

    const clientIds = clients.map(c => c.id);
    const results = await broadcastRandomVideo(bot, clientIds);

    await ctx.reply(`
✅ <b>Broadcast Completed!</b>
• <b>Total Clients:</b> ${results.total}
• <b>Successfully Delivered:</b> ${results.sent}
• <b>Failed:</b> ${results.failed}
`.trim(), { parse_mode: 'HTML' });
  });

  // Admin inline action: admin_prompt_bcast_random
  bot.action('admin_prompt_bcast_random', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Unauthorized');
    await ctx.answerCbQuery();

    const clients = getClients(true);
    await ctx.reply(`⚠️ Broadcast a random channel video to <b>${clients.length}</b> subscribers?`, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Yes, Send Random Video', 'admin_confirm_bcast_random')],
        [Markup.button.callback('❌ Cancel', 'admin_cancel')]
      ])
    });
  });

  bot.action('admin_confirm_bcast_random', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Unauthorized');
    await ctx.answerCbQuery('Broadcasting...');

    const clients = getClients(true);
    const results = await broadcastRandomVideo(bot, clients.map(c => c.id));
    await ctx.reply(`✅ Broadcast sent to ${results.sent} client(s).`);
  });

  // /sync_channel <min_id> <max_id>: Scan a range of message IDs in the channel
  bot.command('sync_channel', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('⛔ Admin only command.');

    const parts = ctx.message.text.split(' ').filter(Boolean);
    const minId = parseInt(parts[1], 10);
    const maxId = parseInt(parts[2], 10);
    const channel = configuredChannel;

    if (!channel) {
      return ctx.reply('⚠️ Please set CHANNEL_ID in your .env file first (e.g. @your_channel).');
    }

    if (isNaN(minId) || isNaN(maxId) || minId > maxId) {
      return ctx.reply('Usage: <code>/sync_channel &lt;min_message_id&gt; &lt;max_message_id&gt;</code>\nExample: <code>/sync_channel 1 50</code>', { parse_mode: 'HTML' });
    }

    const count = maxId - minId + 1;
    if (count > 200) {
      return ctx.reply('⚠️ Please scan in batches of 200 messages or fewer to avoid Telegram rate limits.');
    }

    await ctx.reply(`🔍 Scanning channel messages ${minId} to ${maxId}...`);

    let indexed = 0;
    for (let msgId = minId; msgId <= maxId; msgId++) {
      try {
        // Attempt to copy message to test if valid message
        // Telegraf forward/copy will verify message existence
        const copyResult = await bot.telegram.copyMessage(ctx.chat.id, channel, msgId);
        if (copyResult) {
          // If message arrived and has video or is valid, index it
          addChannelVideo({
            channelId: channel,
            messageId: msgId,
            sourceType: 'scan'
          });
          indexed++;
        }
      } catch (err) {
        // message does not exist or not accessible
      }
      await new Promise(r => setTimeout(r, 80)); // Rate limit safeguard
    }

    await ctx.reply(`✅ Channel scan complete! Indexed <b>${indexed}</b> new items. Total catalog: <b>${getChannelVideoCount()}</b>`, { parse_mode: 'HTML' });
  });

  // /add_link <t.me link>: Information on channel links
  bot.command('add_link', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('⛔ Admin only.');

    return ctx.reply(
      `⚠️ <b>Channel Link Notice:</b>\n\n` +
      `Your channel has <i>"Restrict saving content"</i> (Content Protection) enabled.\n` +
      `Because of this, Telegram replaces post links with a redirect link rather than sending the actual video file.\n\n` +
      `🎬 <b>How to send real playable videos instead:</b>\n` +
      `1. <b>Send Video File:</b> Send or drag-and-drop any video file directly to this chat with the bot. The bot will save the video file and clients will receive the real video player!\n` +
      `2. <b>Post to Channel:</b> Post any video into your channel — because the bot is an admin in your channel, it captures the real video file on upload!\n` +
      `3. <b>Disable Content Protection:</b> In your channel settings ➔ <i>Channel Type</i> ➔ turn off <i>"Restrict saving content"</i>.`,
      { parse_mode: 'HTML' }
    );
  });

  // /clear_channel
  bot.command('clear_channel', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply('⛔ Admin only.');
    clearChannelVideos();
    return ctx.reply('🗑️ Channel video catalog has been cleared.');
  });

  // Admin list clients
  bot.action('admin_list_clients', async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCbQuery('Unauthorized');
    await ctx.answerCbQuery();

    const clients = getClients(false);
    if (clients.length === 0) return ctx.reply('No registered clients yet.');

    let text = `📋 <b>Clients (${clients.length}):</b>\n\n`;
    clients.slice(0, 25).forEach((c, i) => {
      text += `${i + 1}. <b>${c.firstName}</b> ${c.username ? `(${c.username})` : ''} - ID: <code>${c.id}</code> (Videos: ${c.videosReceived || 0})\n`;
    });
    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  bot.action('admin_cancel', async (ctx) => {
    await ctx.answerCbQuery('Cancelled');
    await ctx.reply('❌ Action cancelled.');
  });

  return bot;
}
