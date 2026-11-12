import React, { useState } from 'react';
import { 
  Users, 
  Send, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  Sliders, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  Copy, 
  Check, 
  LogIn, 
  Zap, 
  Layers, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { TelegramWeb } from '../components/TelegramWeb';

export function DashboardPage({ 
  user, 
  setCurrentPage, 
  envConfig, 
  hasTelegramCreds, 
  toggleMockCreds 
}) {
  const [activeProfile, setActiveProfile] = useState(
    envConfig.profiles.find(p => p.id === user?.id) || envConfig.profiles[0]
  );
  const [viewMode, setViewMode] = useState('telegram'); // 'telegram' | 'profiles' | 'split'
  const [revealedHashes, setRevealedHashes] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  // If user is not logged in, show access prompt
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-[#17212b] border border-[#242f3d] rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-5">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
          <p className="text-sm text-slate-400 mt-2">
            Please log in to view the dashboard, inspect your Telegram profiles loaded from <code className="text-[#50a7ea]">.env</code>, and use the Telegram Web client.
          </p>

          <button
            onClick={() => setCurrentPage('login')}
            className="mt-6 w-full py-3.5 rounded-xl bg-[#2481cc] hover:bg-[#1e72b4] text-white font-semibold text-sm shadow-lg shadow-[#2481cc]/25 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Go to Login Page</span>
          </button>
        </div>
      </div>
    );
  }

  const toggleHashVisibility = (id) => {
    setRevealedHashes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* TOP DASHBOARD CONTROL BAR */}
      <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: User & Status */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={activeProfile?.avatar || user.avatar}
              alt={activeProfile?.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#2481cc]"
            />
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#17212b] absolute bottom-0 right-0"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{activeProfile?.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#2481cc]/20 text-[#50a7ea] font-medium border border-[#2481cc]/30">
                {activeProfile?.role || 'Active Profile'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <span className="text-slate-200">{user.name}</span> • Profiles loaded from <code className="text-[#50a7ea]">.env</code>
            </p>
          </div>
        </div>

        {/* Right: View Modes & Creds Simulator */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* View mode toggle */}
          <div className="bg-[#0e1621] p-1 rounded-xl border border-[#242f3d] flex items-center gap-1">
            <button
              onClick={() => setViewMode('telegram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'telegram'
                  ? 'bg-[#2481cc] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Telegram Web
            </button>

            <button
              onClick={() => setViewMode('profiles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'profiles'
                  ? 'bg-[#2481cc] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Profiles ({envConfig.profiles.length})
            </button>

            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-[#2481cc] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Split View
            </button>
          </div>

          {/* Test toggle button for testing env with/without creds */}
          <button
            onClick={toggleMockCreds}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-[#242f3d] hover:bg-[#2f3d4e] text-slate-300 border border-[#242f3d] transition-all"
            title="Toggle credentials presence to test Telegram Web vs Standard mode"
          >
            <Sliders className="w-3.5 h-3.5 text-[#50a7ea]" />
            <span>{hasTelegramCreds ? 'Simulate Missing Creds' : 'Restore .env Creds'}</span>
          </button>
        </div>
      </div>

      {/* TELEGRAM CREDS DETECTED BANNER */}
      {hasTelegramCreds ? (
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#17212b] to-[#0e1621] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Telegram Credentials Found in .env
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Telegram Web Activated
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                API_ID: <span className="font-mono text-[#50a7ea]">{envConfig.apiId || '28491024'}</span> • 
                API_HASH: <span className="font-mono text-[#50a7ea]">{envConfig.apiHash ? `${envConfig.apiHash.substring(0, 8)}...` : 'Configured'}</span> • 
                Acting as official Telegram Web client.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-400">Online & Ready</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-950/40 via-[#17212b] to-[#0e1621] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                No Telegram Credentials in .env
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Add <code className="text-[#50a7ea]">VITE_TELEGRAM_API_ID</code> and <code className="text-[#50a7ea]">VITE_TELEGRAM_API_HASH</code> to your .env to automatically act as Telegram Web!
              </p>
            </div>
          </div>
          <button
            onClick={toggleMockCreds}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all self-end sm:self-auto"
          >
            Enable Creds Demo
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      
      {/* 1. TELEGRAM WEB MODE (Activated when creds are in .env or user chosen) */}
      {(viewMode === 'telegram' || (viewMode === 'split' && hasTelegramCreds)) && hasTelegramCreds && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#50a7ea]" />
              <h2 className="text-lg font-bold text-white">Telegram Web Interface</h2>
            </div>
            <span className="text-xs text-slate-400">
              Active Profile: <strong className="text-white">{activeProfile?.name}</strong>
            </span>
          </div>

          <TelegramWeb activeProfile={activeProfile} envConfig={envConfig} />
        </section>
      )}

      {/* 2. SPLIT VIEW: When split view is selected */}
      {viewMode === 'split' && hasTelegramCreds && (
        <div className="mt-8 border-t border-[#242f3d] pt-8">
          <h3 className="text-lg font-bold text-white mb-4">Loaded Profiles from .env</h3>
        </div>
      )}

      {/* 3. PROFILES DIRECTORY (Listed according to values from .env) */}
      {(viewMode === 'profiles' || viewMode === 'split' || !hasTelegramCreds) && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#50a7ea]" />
                <h2 className="text-xl font-bold text-white">Telegram Profiles from .env</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Parsed from <code className="text-[#50a7ea] font-mono">VITE_TELEGRAM_PROFILES</code> in your environment file.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Total Profiles: <strong className="text-white">{envConfig.profiles.length}</strong></span>
            </div>
          </div>

          {/* Grid of Profiles from .env */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {envConfig.profiles.map((profile) => {
              const isCurrent = activeProfile?.id === profile.id;
              const isHashRevealed = revealedHashes[profile.id];
              const effectiveApiId = profile.apiId || envConfig.apiId || '28491024';
              const effectiveApiHash = profile.apiHash || envConfig.apiHash || '8f4a7c2e1b3d9501a6723e42f9b8c1d0';

              return (
                <div
                  key={profile.id}
                  className={`bg-[#17212b] border rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-[#2481cc] ring-1 ring-[#2481cc]'
                      : 'border-[#242f3d] hover:border-[#2481cc]/40'
                  }`}
                >
                  <div>
                    {/* Profile Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-[#2481cc]"
                          />
                          <span
                            className={`w-3.5 h-3.5 rounded-full border-2 border-[#17212b] absolute bottom-0 right-0 ${
                              profile.status === 'online'
                                ? 'bg-emerald-400'
                                : profile.status === 'bot'
                                ? 'bg-purple-400'
                                : 'bg-slate-500'
                            }`}
                          ></span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">
                            {profile.name}
                          </h3>
                          <div className="text-xs text-[#50a7ea] font-medium mt-0.5">
                            {profile.username}
                          </div>
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0e1621] text-slate-300 border border-[#242f3d]">
                            {profile.role}
                          </span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-[#2481cc]/20 text-[#50a7ea] border border-[#2481cc]/40">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Bio & Phone */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-4 min-h-[36px]">
                      {profile.bio}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#0e1621] p-3 rounded-xl border border-[#242f3d] mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Phone</span>
                        <div className="font-mono text-slate-200 mt-0.5 truncate">{profile.phone}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">Unread Chats</span>
                        <div className="font-semibold text-emerald-400 mt-0.5">
                          {profile.unreadCount || 0} unread
                        </div>
                      </div>
                    </div>

                    {/* Credential Details from .env */}
                    <div className="space-y-2 bg-[#0e1621]/60 p-3 rounded-xl border border-[#242f3d]/60 text-xs mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-[#50a7ea]" /> API ID:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-200">{effectiveApiId}</span>
                          <button
                            onClick={() => copyToClipboard(effectiveApiId, profile.id + '-id')}
                            className="text-slate-500 hover:text-slate-300"
                            title="Copy API ID"
                          >
                            {copiedKey === profile.id + '-id' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#50a7ea]" /> API Hash:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-200">
                            {isHashRevealed 
                              ? `${effectiveApiHash.substring(0, 12)}...` 
                              : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleHashVisibility(profile.id)}
                            className="text-slate-500 hover:text-slate-300"
                            title={isHashRevealed ? 'Hide Hash' : 'Reveal Hash'}
                          >
                            {isHashRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {profile.botToken && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#242f3d]">
                          <span className="text-slate-400">Bot Token:</span>
                          <span className="font-mono text-purple-400">
                            {profile.botToken.substring(0, 10)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Action */}
                  <div className="mt-2">
                    {isCurrent ? (
                      <button
                        onClick={() => setViewMode('telegram')}
                        className="w-full py-2.5 rounded-xl bg-[#2481cc]/20 border border-[#2481cc]/40 text-[#50a7ea] font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#2481cc]/30 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Chat as this Profile in Telegram Web</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveProfile(profile);
                          if (hasTelegramCreds) setViewMode('telegram');
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2f3d4e] text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-[#2481cc]/40"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#50a7ea]" />
                        <span>Switch to this Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
