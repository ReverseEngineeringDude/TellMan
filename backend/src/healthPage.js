/**
 * Generates the HTML web interface for /health
 */
export function renderHealthPage(data) {
  const {
    status = 'healthy',
    timestamp = new Date().toISOString(),
    uptimeSeconds = Math.floor(process.uptime()),
    botInfo = {},
    database = {},
    channels = {},
    stats = {},
    channelVideosCount = 0,
    serverEnv = {}
  } = data;

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const isHealthy = status === 'healthy' || status === 'online';
  const statusColor = isHealthy ? '#10b981' : '#ef4444';
  const statusBadge = isHealthy ? 'HEALTHY' : 'DEGRADED';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TellMan System Health | Render</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151d30;
      --border: #23314f;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --success: #10b981;
      --success-bg: rgba(16, 185, 129, 0.12);
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container {
      width: 100%;
      max-width: 960px;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .brand-icon {
      font-size: 2.2rem;
      background: linear-gradient(135deg, #0284c7, #6366f1);
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    }
    .brand h1 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }
    .brand p {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--success-bg);
      color: var(--success);
      padding: 0.45rem 1rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--success);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.35rem;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .card:hover {
      border-color: #3b82f6;
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .card-title {
      font-size: 0.88rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .card-tag {
      font-size: 0.75rem;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-weight: 600;
    }
    .tag-green {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .tag-blue {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    .metric-value {
      font-size: 1.85rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.35rem;
    }
    .metric-label {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .info-list {
      margin-top: 0.85rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      font-size: 0.84rem;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .info-key {
      color: var(--text-muted);
    }
    .info-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #e2e8f0;
      font-weight: 500;
    }
    .actions-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.9rem 1.25rem;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .actions-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 0.5rem 0.95rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #334155;
      border-color: #475569;
    }
    .btn-primary {
      background: #0284c7;
      border-color: #0284c7;
    }
    .btn-primary:hover {
      background: #0369a1;
    }
    footer {
      font-size: 0.78rem;
      color: #64748b;
      text-align: center;
      margin-top: auto;
      padding-top: 1rem;
    }
    footer a {
      color: #38bdf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">🤖</div>
        <div>
          <h1>TellMan Bot Health Check</h1>
          <p>Render Web Service Monitor • tellman.onrender.com</p>
        </div>
      </div>
      <div class="status-badge">
        <span class="pulse-dot"></span>
        <span>STATUS: ${statusBadge}</span>
      </div>
    </header>

    <div class="actions-bar">
      <div class="actions-left">
        <span>⏱️ Uptime: <strong>${formatUptime(uptimeSeconds)}</strong></span>
        <span>•</span>
        <span id="last-updated">Last checked: ${new Date(timestamp).toLocaleTimeString()}</span>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <label style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" id="autorefresh" checked> Auto-refresh (10s)
        </label>
        <button class="btn btn-primary" onclick="window.location.reload()">🔄 Refresh Now</button>
        <a class="btn" href="/health?format=json" target="_blank">📄 Raw JSON</a>
      </div>
    </div>

    <div class="grid">
      <!-- Telegram Bot Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🤖 Telegram Bot</span>
          <span class="card-tag tag-green">${botInfo.status || 'ONLINE'}</span>
        </div>
        <div class="metric-value">@${botInfo.username || 'chugan_video_bot'}</div>
        <div class="metric-label">${botInfo.firstName || 'Chugan bot'} (ID: ${botInfo.id || '6557438353'})</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Connected Channels</span>
            <span class="info-val">${channels.active || 1} active (${channels.total || 1} joined)</span>
          </div>
          <div class="info-item">
            <span class="info-key">Channel Connection</span>
            <span class="info-val" style="color: #38bdf8;">🔒 Admin Manual</span>
          </div>
          <div class="info-item">
            <span class="info-key">Stars 1-Day Price</span>
            <span class="info-val">${process.env.STARS_1DAY_PRICE || '50'} XTR</span>
          </div>
          <div class="info-item">
            <span class="info-key">Free Trial Limit</span>
            <span class="info-val">${process.env.FREE_VIDEOS_LIMIT || '1'} video</span>
          </div>
        </div>
      </div>

      <!-- Cloud Firestore Database Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔥 Cloud Database</span>
          <span class="card-tag ${database.enabled ? 'tag-green' : 'tag-blue'}">
            ${database.enabled ? 'FIRESTORE ACTIVE' : 'LOCAL JSON'}
          </span>
        </div>
        <div class="metric-value">${database.enabled ? 'Google Cloud' : 'Local Storage'}</div>
        <div class="metric-label">Project: ${database.projectId || 'tellman-1a7ea'}</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Cloud Sync</span>
            <span class="info-val">${database.enabled ? '🟢 Real-time' : '⚪ Standalone'}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Collections</span>
            <span class="info-val">clients, payments, stats</span>
          </div>
          <div class="info-item">
            <span class="info-key">Persistence</span>
            <span class="info-val">Survives Render Restarts</span>
          </div>
        </div>
      </div>

      <!-- Video Catalog Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📼 Video Catalog</span>
          <span class="card-tag tag-green">READY</span>
        </div>
        <div class="metric-value">${channelVideosCount.toLocaleString()}</div>
        <div class="metric-label">Channel videos indexed & ready to deliver</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Delivery Format</span>
            <span class="info-val">Native MP4 (Playable)</span>
          </div>
          <div class="info-item">
            <span class="info-key">Auto Indexing</span>
            <span class="info-val">Active (Silent)</span>
          </div>
          <div class="info-item">
            <span class="info-key">Selection</span>
            <span class="info-val">Smart Random + Unseen</span>
          </div>
        </div>
      </div>

      <!-- Subscribers & Stats Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📊 Users & Delivery</span>
          <span class="card-tag tag-blue">ACTIVE</span>
        </div>
        <div class="metric-value">${stats.totalVideosSent || 0}</div>
        <div class="metric-label">Total videos successfully delivered</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Registered Clients</span>
            <span class="info-val">${stats.totalClients || 0}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Active VIP Subscribers</span>
            <span class="info-val">${stats.activeClients || 0}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Broadcasts Sent</span>
            <span class="info-val">${stats.broadcastsCount || 0}</span>
          </div>
        </div>
      </div>

      <!-- System & Runtime Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚡ Server Runtime</span>
          <span class="card-tag tag-green">HEALTHY</span>
        </div>
        <div class="metric-value">${serverEnv.memoryRss || '48 MB'}</div>
        <div class="metric-label">Memory Usage (RSS)</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Node Runtime</span>
            <span class="info-val">${serverEnv.nodeVersion || process.version}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Host Platform</span>
            <span class="info-val">${process.platform} (${process.arch})</span>
          </div>
          <div class="info-item">
            <span class="info-key">Listening Port</span>
            <span class="info-val">${serverEnv.port || 3001}</span>
          </div>
        </div>
      </div>

      <!-- Bot Features & Endpoints Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔗 Quick Endpoints</span>
          <span class="card-tag tag-blue">HTTP API</span>
        </div>
        <div class="metric-value">REST API</div>
        <div class="metric-label">Live monitoring & webhook endpoints</div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Health JSON</span>
            <span class="info-val"><a href="/health?format=json" style="color: #38bdf8;">/health?format=json</a></span>
          </div>
          <div class="info-item">
            <span class="info-key">Bot Stats</span>
            <span class="info-val"><a href="/api/stats" style="color: #38bdf8;">/api/stats</a></span>
          </div>
          <div class="info-item">
            <span class="info-key">Catalog JSON</span>
            <span class="info-val"><a href="/api/channel-videos" style="color: #38bdf8;">/api/channel-videos</a></span>
          </div>
          <div class="info-item">
            <span class="info-key">Channels API</span>
            <span class="info-val"><a href="/api/channels" style="color: #38bdf8;">/api/channels</a></span>
          </div>
        </div>
      </div>
    </div>

    <footer>
      Powered by <strong>TellMan Engine</strong> • Deployed on <a href="https://render.com" target="_blank" rel="noopener">Render</a> • Connected to Telegram Bot API
    </footer>
  </div>

  <script>
    // Automatic 10-second reload if enabled
    let timer = null;
    function setupAutoRefresh() {
      const checkbox = document.getElementById('autorefresh');
      if (checkbox.checked) {
        timer = setTimeout(() => {
          window.location.reload();
        }, 10000);
      }
    }
    document.getElementById('autorefresh').addEventListener('change', (e) => {
      if (e.target.checked) {
        setupAutoRefresh();
      } else if (timer) {
        clearTimeout(timer);
      }
    });
    setupAutoRefresh();
  </script>
</body>
</html>`;
}
