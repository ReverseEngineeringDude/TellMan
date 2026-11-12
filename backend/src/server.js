import express from 'express';
import cors from 'cors';
import {
  getClients,
  getStats,
  activateSubscription,
  getSubscriptionStatus
} from './storage.js';
import { sendVideoToClient, broadcastVideo, getVideoConfig, setVideoConfig } from './videoManager.js';
import {
  getChannelVideos,
  getChannelVideoCount,
  addChannelVideo,
  sendRandomVideoToClient,
  broadcastRandomVideo,
  clearChannelVideos
} from './channelManager.js';

export function createServer(bot) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health and stats endpoint
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      service: 'TellMan Telegram Channel Random Video Bot API',
      version: '1.1.0',
      stats: getStats(),
      channelVideosCount: getChannelVideoCount(),
      videoConfig: getVideoConfig()
    });
  });

  // Get bot statistics
  app.get('/api/stats', (req, res) => {
    res.json({
      ...getStats(),
      channelVideosCount: getChannelVideoCount()
    });
  });

  // Get registered clients
  app.get('/api/clients', (req, res) => {
    const activeOnly = req.query.active === 'true';
    const clients = getClients(activeOnly);
    res.json({
      total: clients.length,
      clients
    });
  });

  // Get client subscription status
  app.get('/api/subscription/:chatId', (req, res) => {
    const { chatId } = req.params;
    const status = getSubscriptionStatus(chatId);
    res.json(status);
  });

  // Activate client subscription (API or webhook)
  app.post('/api/subscription/activate', (req, res) => {
    const { chatId, days = 1, starsPaid = 0, chargeId = 'api' } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'Missing chatId' });
    }

    const durationMs = parseInt(days, 10) * 24 * 60 * 60 * 1000;
    const sub = activateSubscription(chatId, {
      plan: `${days}_day`,
      durationMs,
      starsPaid,
      chargeId
    });

    if (!sub) {
      return res.status(404).json({ error: 'Client not found. Client must start the bot first.' });
    }

    res.json({ success: true, subscription: sub });
  });

  // Get channel video catalog
  app.get('/api/channel-videos', (req, res) => {
    const videos = getChannelVideos();
    res.json({
      total: videos.length,
      videos
    });
  });

  // Send a random channel video to a client
  app.post('/api/send-random-video', async (req, res) => {
    const { chatId, caption } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: 'Missing required field: chatId' });
    }

    try {
      const result = await sendRandomVideoToClient(bot, chatId, { customCaption: caption });
      if (result.success) {
        return res.json({ success: true, message: `Random video sent to ${chatId}`, result });
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Broadcast random channel video to all clients
  app.post('/api/broadcast-random-video', async (req, res) => {
    const { caption, clientIds: targetIds } = req.body;
    const clients = getClients(true);
    const clientIds = (Array.isArray(targetIds) && targetIds.length > 0)
      ? targetIds
      : clients.map(c => c.id);

    if (clientIds.length === 0) {
      return res.status(400).json({ error: 'No active clients found to broadcast to.' });
    }

    try {
      const result = await broadcastRandomVideo(bot, clientIds, { customCaption: caption });
      return res.json({ success: true, broadcastSummary: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Manually add video to channel catalog
  app.post('/api/add-channel-video', (req, res) => {
    const { fileId, channelId, messageId, caption } = req.body;
    if (!fileId && (!channelId || !messageId)) {
      return res.status(400).json({ error: 'Provide either fileId, or channelId with messageId' });
    }

    const result = addChannelVideo({
      fileId,
      channelId,
      messageId,
      caption,
      sourceType: 'api'
    });

    res.json({ success: true, result });
  });

  // Clear channel catalog
  app.post('/api/clear-channel-videos', (req, res) => {
    clearChannelVideos();
    res.json({ success: true, message: 'Channel catalog cleared.' });
  });

  // Send video to a specific client (direct)
  app.post('/api/send-video', async (req, res) => {
    const { chatId, caption, videoUrl, videoPath, fileId } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'Missing required field: chatId' });
    }

    let customOptions = {};
    if (caption) customOptions.caption = caption;

    if (fileId) {
      customOptions.type = 'file_id';
      customOptions.source = fileId;
    } else if (videoUrl) {
      customOptions.type = 'url';
      customOptions.source = videoUrl;
    } else if (videoPath) {
      customOptions.type = 'local';
      customOptions.source = videoPath;
    }

    try {
      const result = await sendVideoToClient(bot, chatId, customOptions);
      if (result.success) {
        return res.json({ success: true, message: `Video sent to chat ${chatId}`, result });
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Broadcast video to all registered clients
  app.post('/api/broadcast-video', async (req, res) => {
    const { caption, videoUrl, videoPath, fileId, clientIds: targetIds } = req.body;

    const clients = getClients(true);
    const clientIds = (Array.isArray(targetIds) && targetIds.length > 0)
      ? targetIds
      : clients.map(c => c.id);

    if (clientIds.length === 0) {
      return res.status(400).json({ error: 'No active clients found to broadcast to.' });
    }

    let customOptions = {};
    if (caption) customOptions.caption = caption;

    if (fileId) {
      customOptions.type = 'file_id';
      customOptions.source = fileId;
    } else if (videoUrl) {
      customOptions.type = 'url';
      customOptions.source = videoUrl;
    } else if (videoPath) {
      customOptions.type = 'local';
      customOptions.source = videoPath;
    }

    try {
      const result = await broadcastVideo(bot, clientIds, customOptions);
      return res.json({
        success: true,
        broadcastSummary: result
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}
