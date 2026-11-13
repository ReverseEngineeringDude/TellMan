import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFirestoreDb, isFirestoreEnabled } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial storage files if not existing
if (!fs.existsSync(CLIENTS_FILE)) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(STATS_FILE)) {
  fs.writeFileSync(STATS_FILE, JSON.stringify({ videosSent: 0, broadcastsSent: 0 }, null, 2));
}

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

/**
 * Async sync helper to Firestore (fire-and-forget so Telegraf never blocks)
 */
function syncClientToFirestore(clientData) {
  if (!isFirestoreEnabled() || !clientData?.id) return;
  const db = getFirestoreDb();
  if (!db) return;

  const payload = { ...clientData };
  // CRITICAL PROTECTION: Never send `subscription: null` to Firestore if local cache is fresh or uninitialized,
  // so an active VIP pass in Cloud Firestore is NEVER wiped out!
  if (!payload.subscription || !payload.subscription.isActive) {
    delete payload.subscription;
  }

  db.collection('clients')
    .doc(String(clientData.id))
    .set(payload, { merge: true })
    .catch(err => {
      console.error(`[FirestoreSyncError] Failed to sync client ${clientData.id}:`, err.message);
    });
}

/**
 * Initial load of clients from Firestore into cache on startup
 */
export async function loadClientsFromFirestore() {
  if (!isFirestoreEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const snapshot = await db.collection('clients').get();
    if (!snapshot.empty) {
      const localClients = readJsonFile(CLIENTS_FILE, {});
      snapshot.forEach(doc => {
        const remote = doc.data();
        const local = localClients[doc.id] || {};

        // Merge intelligently: preserve active subscriptions from either side
        let bestSubscription = remote.subscription || local.subscription || null;
        if (remote.subscription?.expiresAt && local.subscription?.expiresAt) {
          const remoteExp = new Date(remote.subscription.expiresAt).getTime();
          const localExp = new Date(local.subscription.expiresAt).getTime();
          bestSubscription = remoteExp >= localExp ? remote.subscription : local.subscription;
        }

        localClients[doc.id] = {
          ...local,
          ...remote,
          subscription: bestSubscription,
          videosReceived: Math.max(remote.videosReceived || 0, local.videosReceived || 0),
          freeVideosUsed: Math.max(remote.freeVideosUsed || 0, local.freeVideosUsed || 0),
          seenVideos: Array.from(new Set([...(remote.seenVideos || []), ...(local.seenVideos || [])]))
        };
      });
      writeJsonFile(CLIENTS_FILE, localClients);
      console.log(`✅ [Firestore] Synced ${snapshot.size} client(s) from Cloud Firestore.`);
    }
  } catch (err) {
    console.error('⚠️ [Firestore] Error syncing clients on boot:', err.message);
  }
}

/**
 * Initial load of global stats from Firestore on startup
 */
export async function loadStatsFromFirestore() {
  if (!isFirestoreEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const doc = await db.collection('stats').doc('global').get();
    if (doc.exists) {
      const remote = doc.data();
      const local = readJsonFile(STATS_FILE, { videosSent: 0, broadcastsSent: 0 });
      const merged = {
        videosSent: Math.max(remote.videosSent || 0, local.videosSent || 0),
        broadcastsSent: Math.max(remote.broadcastsSent || 0, local.broadcastsSent || 0),
        lastSentAt: remote.lastSentAt || local.lastSentAt || null
      };
      writeJsonFile(STATS_FILE, merged);
      console.log(`✅ [Firestore] Synced global stats from Cloud Firestore (${merged.videosSent} videos sent).`);
    }
  } catch (err) {
    console.error('⚠️ [Firestore] Error syncing stats on boot:', err.message);
  }
}

/**
 * Register or update a client (chat)
 */
export function registerClient(user) {
  const clients = readJsonFile(CLIENTS_FILE, {});
  const idStr = String(user.id);
  const existing = clients[idStr] || {};

  const now = new Date().toISOString();
  clients[idStr] = {
    ...existing,
    id: user.id,
    firstName: user.first_name || existing.firstName || '',
    lastName: user.last_name || existing.lastName || '',
    username: user.username ? `@${user.username.replace(/^@/, '')}` : (existing.username || ''),
    isActive: true,
    firstSeen: existing.firstSeen || now,
    lastSeen: now,
    videosReceived: existing.videosReceived || 0,
    seenVideos: existing.seenVideos || [],
    subscription: existing.subscription || null,
    freeVideosUsed: existing.freeVideosUsed || 0
  };

  writeJsonFile(CLIENTS_FILE, clients);
  syncClientToFirestore(clients[idStr]);
  return clients[idStr];
}

/**
 * Mark a client as inactive (e.g. if bot was blocked)
 */
export function deactivateClient(chatId, reason = 'bot_blocked') {
  const clients = readJsonFile(CLIENTS_FILE, {});
  const idStr = String(chatId);
  if (clients[idStr]) {
    clients[idStr].isActive = false;
    clients[idStr].deactivatedReason = reason;
    clients[idStr].deactivatedAt = new Date().toISOString();
    writeJsonFile(CLIENTS_FILE, clients);
    syncClientToFirestore(clients[idStr]);
  }
}

/**
 * Retrieve all registered clients
 */
export function getClients(activeOnly = false) {
  const clients = readJsonFile(CLIENTS_FILE, {});
  const list = Object.values(clients);
  if (activeOnly) {
    return list.filter(c => c.isActive !== false);
  }
  return list;
}

/**
 * Get client by ID
 */
export function getClient(chatId) {
  const clients = readJsonFile(CLIENTS_FILE, {});
  return clients[String(chatId)] || null;
}

/**
 * Record a video sent event for a client
 */
export function recordVideoSent(chatId, videoId = null) {
  const clients = readJsonFile(CLIENTS_FILE, {});
  const idStr = String(chatId);
  if (clients[idStr]) {
    clients[idStr].videosReceived = (clients[idStr].videosReceived || 0) + 1;
    clients[idStr].lastVideoAt = new Date().toISOString();
    if (videoId) {
      if (!Array.isArray(clients[idStr].seenVideos)) {
        clients[idStr].seenVideos = [];
      }
      if (!clients[idStr].seenVideos.includes(videoId)) {
        clients[idStr].seenVideos.push(videoId);
      }
    }
    writeJsonFile(CLIENTS_FILE, clients);
    syncClientToFirestore(clients[idStr]);
  }

  // Update global stats
  const stats = readJsonFile(STATS_FILE, { videosSent: 0, broadcastsSent: 0 });
  stats.videosSent = (stats.videosSent || 0) + 1;
  stats.lastSentAt = new Date().toISOString();
  writeJsonFile(STATS_FILE, stats);

  // Sync stats to Firestore
  if (isFirestoreEnabled()) {
    const db = getFirestoreDb();
    db?.collection('stats').doc('global').set(stats, { merge: true }).catch(() => {});
  }
}

/**
 * Activate or extend a subscription for a client
 */
export function activateSubscription(chatId, { plan = '1_day', durationMs = 24 * 60 * 60 * 1000, starsPaid = 0, chargeId = '' } = {}) {
  const clients = readJsonFile(CLIENTS_FILE, {});
  const idStr = String(chatId);
  const existing = clients[idStr];
  if (!existing) return null;

  const now = Date.now();
  let baseTime = now;

  // If already active, extend from previous expiration
  if (existing.subscription?.expiresAt) {
    const prevExpires = new Date(existing.subscription.expiresAt).getTime();
    if (prevExpires > now) {
      baseTime = prevExpires;
    }
  }

  const expiresAt = new Date(baseTime + durationMs).toISOString();

  existing.subscription = {
    isActive: true,
    plan,
    activatedAt: new Date(now).toISOString(),
    expiresAt,
    starsPaid,
    chargeId
  };

  writeJsonFile(CLIENTS_FILE, clients);
  syncClientToFirestore(existing);

  // Also record payment record in Firestore
  if (isFirestoreEnabled() && chargeId) {
    const db = getFirestoreDb();
    db?.collection('payments').doc(chargeId).set({
      chatId: String(chatId),
      plan,
      starsPaid,
      chargeId,
      paidAt: new Date().toISOString(),
      expiresAt
    }).catch(() => {});
  }

  return existing.subscription;
}

/**
 * Check subscription status of a client
 */
export function getSubscriptionStatus(chatId) {
  const adminId = process.env.ADMIN_CHAT_ID ? String(process.env.ADMIN_CHAT_ID) : null;
  if (adminId && String(chatId) === adminId) {
    return {
      isSubscribed: true,
      isAdmin: true,
      remainingHours: 9999,
      expiresAt: null
    };
  }

  const client = getClient(chatId);
  if (!client || !client.subscription?.expiresAt) {
    return {
      isSubscribed: false,
      remainingHours: 0,
      expiresAt: null
    };
  }

  const now = Date.now();
  const expires = new Date(client.subscription.expiresAt).getTime();

  if (expires > now) {
    const diffMs = expires - now;
    const remainingHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return {
      isSubscribed: true,
      remainingHours,
      expiresAt: client.subscription.expiresAt,
      plan: client.subscription.plan
    };
  }

  return {
    isSubscribed: false,
    remainingHours: 0,
    expiresAt: client.subscription.expiresAt,
    isExpired: true
  };
}

/**
 * Async version of getSubscriptionStatus with live Firestore fallback
 */
export async function getSubscriptionStatusAsync(chatId) {
  const status = getSubscriptionStatus(chatId);
  if (status.isSubscribed) return status;

  // Fallback: If not found in local memory, check Firestore directly!
  if (isFirestoreEnabled()) {
    try {
      const db = getFirestoreDb();
      const doc = await db?.collection('clients').doc(String(chatId)).get();
      if (doc && doc.exists) {
        const data = doc.data();
        if (data.subscription?.expiresAt) {
          const now = Date.now();
          const expires = new Date(data.subscription.expiresAt).getTime();
          if (expires > now) {
            // Restore client into local cache immediately!
            const clients = readJsonFile(CLIENTS_FILE, {});
            clients[String(chatId)] = { ...(clients[String(chatId)] || {}), ...data };
            writeJsonFile(CLIENTS_FILE, clients);

            const diffMs = expires - now;
            const remainingHours = Math.ceil(diffMs / (1000 * 60 * 60));
            return {
              isSubscribed: true,
              remainingHours,
              expiresAt: data.subscription.expiresAt,
              plan: data.subscription.plan
            };
          }
        }
      }
    } catch (err) {
      console.error(`[FirestoreFallbackError] Failed to fetch client ${chatId}:`, err.message);
    }
  }

  return status;
}

/**
 * Async version of canUserAccessVideo with live Firestore fallback
 */
export async function canUserAccessVideoAsync(chatId) {
  const status = await getSubscriptionStatusAsync(chatId);
  if (status.isSubscribed) {
    return { allowed: true, reason: 'subscribed', status };
  }

  const freeLimit = parseInt(process.env.FREE_VIDEOS_LIMIT ?? '1', 10);
  const client = getClient(chatId);
  const used = client?.freeVideosUsed || 0;

  if (used < freeLimit) {
    return { allowed: true, reason: 'free_trial', remainingFree: freeLimit - used, status };
  }

  return { allowed: false, reason: 'subscription_required', status };
}

/**
 * Determine if user can watch video (subscription or free trial)
 */
export function canUserAccessVideo(chatId) {
  const status = getSubscriptionStatus(chatId);
  if (status.isSubscribed) {
    return { allowed: true, reason: 'subscribed', status };
  }

  const freeLimit = parseInt(process.env.FREE_VIDEOS_LIMIT ?? '1', 10);
  const client = getClient(chatId);
  const used = client?.freeVideosUsed || 0;

  if (used < freeLimit) {
    return { allowed: true, reason: 'free_trial', remainingFree: freeLimit - used, status };
  }

  return { allowed: false, reason: 'subscription_required', status };
}

/**
 * Record usage of free trial video
 */
export function incrementFreeVideoUsed(chatId) {
  const clients = readJsonFile(CLIENTS_FILE, {});
  const idStr = String(chatId);
  if (clients[idStr]) {
    clients[idStr].freeVideosUsed = (clients[idStr].freeVideosUsed || 0) + 1;
    writeJsonFile(CLIENTS_FILE, clients);
    syncClientToFirestore(clients[idStr]);
  }
}

/**
 * Get seen videos for a specific client
 */
export function getClientSeenVideos(chatId) {
  const client = getClient(chatId);
  return client?.seenVideos || [];
}

/**
 * Record broadcast stats
 */
export function recordBroadcast(recipientCount) {
  const stats = readJsonFile(STATS_FILE, { videosSent: 0, broadcastsSent: 0 });
  stats.broadcastsSent = (stats.broadcastsSent || 0) + 1;
  stats.lastBroadcastAt = new Date().toISOString();
  stats.lastBroadcastRecipients = recipientCount;
  writeJsonFile(STATS_FILE, stats);
}

/**
 * Get overall bot statistics
 */
export function getStats() {
  const clients = getClients(false);
  const activeClients = clients.filter(c => c.isActive !== false);
  const now = Date.now();
  const subscribedClients = clients.filter(c => {
    if (!c.subscription?.expiresAt) return false;
    return new Date(c.subscription.expiresAt).getTime() > now;
  });
  const stats = readJsonFile(STATS_FILE, { videosSent: 0, broadcastsSent: 0 });

  return {
    totalClients: clients.length,
    activeClients: activeClients.length,
    subscribedClients: subscribedClients.length,
    inactiveClients: clients.length - activeClients.length,
    totalVideosSent: stats.videosSent || 0,
    broadcastsCount: stats.broadcastsSent || 0,
    lastSentAt: stats.lastSentAt || null,
    isFirestoreActive: isFirestoreEnabled()
  };
}
