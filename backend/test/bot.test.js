import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  registerClient,
  getClients,
  getStats,
  deactivateClient,
  recordVideoSent,
  getClientSeenVideos,
  activateSubscription,
  getSubscriptionStatus,
  canUserAccessVideo
} from '../src/storage.js';
import { getVideoConfig, setVideoConfig, getTelegrafVideoSource } from '../src/videoManager.js';
import {
  addChannelVideo,
  getChannelVideos,
  getChannelVideoCount,
  pickRandomVideo,
  removeChannelVideo,
  clearChannelVideos
} from '../src/channelManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running tests for TellMan Channel Random Video Bot...');

// Test 1: Register client
const mockUser = {
  id: 99887766,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser'
};

const registered = registerClient(mockUser);
assert.strictEqual(registered.id, 99887766, 'Client ID should match');
assert.strictEqual(registered.firstName, 'Test', 'First name should match');
assert.strictEqual(registered.isActive, true, 'Client should be active');
console.log('✅ Test 1 Passed: Client registration and persistent storage works');

// Backup existing channel videos so test does not wipe production data
const backupVideos = getChannelVideos();
clearChannelVideos();
assert.strictEqual(getChannelVideoCount(), 0, 'Catalog should be empty after clear');

// Add 3 sample channel videos
const v1 = addChannelVideo({
  id: 'vid_1',
  fileId: 'FILE_ID_111',
  fileUniqueId: 'UNIQ_111',
  channelId: '@my_test_channel',
  messageId: 10,
  caption: 'First channel clip'
});
assert.strictEqual(v1.added, true, 'Video 1 should be added');

const v2 = addChannelVideo({
  id: 'vid_2',
  fileId: 'FILE_ID_222',
  fileUniqueId: 'UNIQ_222',
  channelId: '@my_test_channel',
  messageId: 11,
  caption: 'Second channel clip'
});
assert.strictEqual(v2.added, true, 'Video 2 should be added');

const v3 = addChannelVideo({
  id: 'vid_3',
  fileId: 'FILE_ID_333',
  fileUniqueId: 'UNIQ_333',
  channelId: '@my_test_channel',
  messageId: 12,
  caption: 'Third channel clip'
});
assert.strictEqual(v3.added, true, 'Video 3 should be added');
assert.strictEqual(getChannelVideoCount(), 3, 'Catalog count should be 3');
console.log('✅ Test 2 Passed: Channel video addition and counting works');

// Test 3: Deduplication
const dupResult = addChannelVideo({
  fileId: 'FILE_ID_111',
  fileUniqueId: 'UNIQ_111'
});
assert.strictEqual(dupResult.added, false, 'Duplicate video should not be re-added');
assert.strictEqual(getChannelVideoCount(), 3, 'Catalog count should remain 3');
console.log('✅ Test 3 Passed: Video deduplication works properly');

// Test 4: Random selection & unseen video preference
const randomChoice = pickRandomVideo([]);
assert(randomChoice, 'A random video must be returned');
assert(['vid_1', 'vid_2', 'vid_3'].includes(randomChoice.id), 'Picked video must be one of the cataloged items');

// If client has already seen vid_1 and vid_2, pickRandomVideo should return vid_3
const unseenChoice = pickRandomVideo(['vid_1', 'vid_2']);
assert.strictEqual(unseenChoice.id, 'vid_3', 'Random picker should prioritize unseen videos');
console.log('✅ Test 4 Passed: Random selection and un-seen filter works');

// Test 5: Client seen tracking
recordVideoSent(mockUser.id, 'vid_1');
const seenList = getClientSeenVideos(mockUser.id);
assert(seenList.includes('vid_1'), 'Client seenVideos should include vid_1');
console.log('✅ Test 5 Passed: Client video history tracking works');

// Test 6: Remove channel video
removeChannelVideo('vid_1');
assert.strictEqual(getChannelVideoCount(), 2, 'Catalog count should be 2 after removing vid_1');
console.log('✅ Test 6 Passed: Channel video deletion works');

// Test 7: Subscription Activation and Expiration Check
const sub = activateSubscription(mockUser.id, {
  plan: '1_day',
  durationMs: 24 * 60 * 60 * 1000,
  starsPaid: 50,
  chargeId: 'test_charge_123'
});
assert(sub, 'Subscription should be returned');
assert.strictEqual(sub.isActive, true, 'Subscription should be active');
assert.strictEqual(sub.starsPaid, 50, 'Stars paid should be 50');

const status = getSubscriptionStatus(mockUser.id);
assert.strictEqual(status.isSubscribed, true, 'User should be marked as subscribed');
assert(status.remainingHours > 0, 'Remaining hours should be positive');
console.log('✅ Test 7 Passed: Subscription activation and status check works');

// Test 8: canUserAccessVideo logic
const access = canUserAccessVideo(mockUser.id);
assert.strictEqual(access.allowed, true, 'Subscribed user must have video access');
console.log('✅ Test 8 Passed: User video access permission check works');

// Channel Registry Tests
const {
  initChannelRegistry,
  getChannels,
  getChannel,
  isChannelApproved,
  registerOrUpdateChannel,
  setChannelStatus,
  removeChannel
} = await import('../src/channelRegistry.js');

// Test 9: Channel registry initialization and manual connection requirement
initChannelRegistry('-1003865751619', 'Collections');
assert.strictEqual(isChannelApproved('-1003865751619'), true, 'Configured default channel should be approved');
assert.strictEqual(isChannelApproved('-1009999999999'), false, 'Unknown group must NOT be approved');
console.log('✅ Test 9 Passed: Channel registry default approval & unknown group restriction works');

// Test 10: New channel or group defaults to pending (not auto-connected)
const pendingGroup = registerOrUpdateChannel({
  id: '-1009999999999',
  title: 'Random Telegram Group',
  type: 'supergroup'
});
assert.strictEqual(pendingGroup.status, 'pending', 'Newly joined group must start as pending');
assert.strictEqual(isChannelApproved('-1009999999999'), false, 'Pending group must not have video access');
console.log('✅ Test 10 Passed: Newly joined group is quarantined in pending state');

// Test 11: Admin manual connect and disconnect
setChannelStatus('-1009999999999', 'active');
assert.strictEqual(isChannelApproved('-1009999999999'), true, 'Manually connected group should now be approved');
setChannelStatus('-1009999999999', 'disconnected');
assert.strictEqual(isChannelApproved('-1009999999999'), false, 'Disconnected group should lose access');
removeChannel('-1009999999999');
console.log('✅ Test 11 Passed: Admin manual connect, disconnect, and removal works properly');

// Test 12: Restart simulation test — client and subscription recovery across disk wipe
const {
  loadClientsFromFirestore,
  getSubscriptionStatusAsync,
  canUserAccessVideoAsync
} = await import('../src/storage.js');

// 1. Activate subscription for a test user and sync
activateSubscription(99887766, {
  plan: 'restart_proof_pass',
  durationMs: 48 * 3600 * 1000,
  starsPaid: 50,
  chargeId: 'test_restart_proof'
});

// 2. Wait 500ms to ensure Firestore write completes
await new Promise(r => setTimeout(r, 600));

// 3. Simulate severe server restart / ephemeral disk wipe by emptying clients.json
const clientsPath = path.join(__dirname, '../data/clients.json');
const savedLocal = fs.readFileSync(clientsPath, 'utf8');
fs.writeFileSync(clientsPath, JSON.stringify({}, null, 2));

// 4. Verify that canUserAccessVideoAsync recovers VIP access directly from Cloud Firestore even with empty disk
const directRecovered = await canUserAccessVideoAsync(99887766);
assert.strictEqual(directRecovered.allowed, true, 'User must recover VIP access from Cloud Firestore');
assert.strictEqual(directRecovered.reason, 'subscribed', 'Access reason must be subscribed');

// 5. Restore full database using loadClientsFromFirestore
await loadClientsFromFirestore();
const restoredStatus = await getSubscriptionStatusAsync(99887766);
assert.strictEqual(restoredStatus.isSubscribed, true, 'Client subscription must be restored after boot sync');
console.log('✅ Test 12 Passed: Restart simulation verified — client subscription fully preserved and restored');

// Clean up: Restore backup
clearChannelVideos();
backupVideos.forEach(v => addChannelVideo(v));

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
process.exit(0);
