import React, { useState } from 'react';
import { 
  Send, 
  Key, 
  Lock, 
  Phone, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Sparkles,
  QrCode,
  Radio
} from 'lucide-react';

export function LoginPage({ 
  onLogin, 
  setCurrentPage, 
  envConfig, 
  hasTelegramCreds 
}) {
  const [authMethod, setAuthMethod] = useState('quick'); // 'quick' | 'phone' | 'profiles'
  const [phone, setPhone] = useState(envConfig.phone || '+1 (555) 349-2041');
  const [passcode, setPasscode] = useState('••••••');
  const [selectedProfileId, setSelectedProfileId] = useState(envConfig.profiles[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = (profile = envConfig.profiles[0]) => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar,
        phone: profile.phone,
        role: profile.role,
        bio: profile.bio,
        apiId: profile.apiId || envConfig.apiId,
        apiHash: profile.apiHash || envConfig.apiHash,
        botToken: profile.botToken || envConfig.botToken,
      });
      setLoading(false);
      setCurrentPage('dashboard');
    }, 400);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'tg-custom-' + Date.now(),
        name: envConfig.accountName || 'Telegram User',
        username: envConfig.username || '@telegram_user',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: phone,
        role: 'Authenticated User',
        bio: 'Connected via Telegram Web credentials',
        apiId: envConfig.apiId,
        apiHash: envConfig.apiHash,
        botToken: envConfig.botToken,
      });
      setLoading(false);
      setCurrentPage('dashboard');
    }, 450);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Telegram Web Card */}
        <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-8 text-center pb-6 bg-gradient-to-b from-[#242f3d]/40 to-transparent">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2481cc] to-[#50a7ea] mx-auto flex items-center justify-center text-white shadow-xl shadow-[#2481cc]/25 mb-4">
              <Send className="w-8 h-8 -rotate-12 translate-x-0.5" />
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to TellMan</h1>
            <p className="text-sm text-slate-400 mt-1">
              Connect to your Telegram dashboard and profiles
            </p>

            {/* Creds status pill */}
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-xs font-medium bg-[#0e1621] border border-[#242f3d]">
              <span className={`w-2 h-2 rounded-full ${hasTelegramCreds ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300">
                {hasTelegramCreds ? '.env Credentials Loaded' : 'Standard Auth Mode'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#242f3d] bg-[#0e1621]/40 px-4">
            <button
              onClick={() => setAuthMethod('quick')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                authMethod === 'quick'
                  ? 'border-[#2481cc] text-[#50a7ea]'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Quick Login
            </button>
            <button
              onClick={() => setAuthMethod('profiles')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                authMethod === 'profiles'
                  ? 'border-[#2481cc] text-[#50a7ea]'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Choose Profile
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
                authMethod === 'phone'
                  ? 'border-[#2481cc] text-[#50a7ea]'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Phone / Passcode
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: QUICK LOGIN */}
            {authMethod === 'quick' && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-[#0e1621] border border-[#242f3d] flex items-center gap-4">
                  <img
                    src={envConfig.profiles[0]?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt="Primary profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#2481cc]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {envConfig.profiles[0]?.name || envConfig.accountName || "Alex Mercer"}
                    </div>
                    <div className="text-xs text-[#50a7ea] truncate">
                      {envConfig.profiles[0]?.username || envConfig.username || "@alex_mercer"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Primary .env Profile
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>

                <div className="bg-[#242f3d]/40 p-3.5 rounded-xl border border-[#242f3d] text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telegram API ID:</span>
                    <span className="font-mono text-slate-200">{envConfig.apiId || '28491024'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-medium">Ready to sync</span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickLogin(envConfig.profiles[0])}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#2481cc] hover:bg-[#1e72b4] text-white font-semibold text-sm shadow-lg shadow-[#2481cc]/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Continue as {envConfig.profiles[0]?.name?.split(' ')[0] || 'Alex'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: CHOOSE SPECIFIC PROFILE FROM .ENV */}
            {authMethod === 'profiles' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 mb-2">
                  Select which profile from your <span className="text-slate-200 font-mono">.env</span> file to log into:
                </p>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {envConfig.profiles.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleQuickLogin(profile)}
                      className="p-3 rounded-xl bg-[#0e1621] hover:bg-[#242f3d] border border-[#242f3d] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-[#50a7ea] transition-colors">
                            {profile.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {profile.username} • {profile.role}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-[#50a7ea] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Sign in <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PHONE & PASSCODE */}
            {authMethod === 'phone' && (
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Telegram Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2481cc]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Passcode / Cloud Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter 2FA passcode"
                      className="w-full bg-[#0e1621] border border-[#242f3d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#2481cc]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-[#2481cc] hover:bg-[#1e72b4] text-white font-semibold text-sm shadow-lg shadow-[#2481cc]/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Phone'}
                </button>
              </form>
            )}

            {/* Footer notice */}
            <div className="mt-6 pt-5 border-t border-[#242f3d] text-center">
              <p className="text-xs text-slate-400">
                By signing in, the website uses your Telegram credentials from <code className="text-[#50a7ea]">.env</code> to activate Telegram Web mode.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
