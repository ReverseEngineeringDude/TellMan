import React from 'react';
import { 
  Send, 
  ShieldCheck, 
  Users, 
  Key, 
  Bot, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Sparkles, 
  MessageSquare, 
  Cpu, 
  Zap, 
  ExternalLink,
  Lock
} from 'lucide-react';

export function HomePage({ 
  setCurrentPage, 
  user, 
  envConfig, 
  hasTelegramCreds, 
  toggleMockCreds, 
  isCredsOverridden 
}) {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2481cc]/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2481cc]/15 border border-[#2481cc]/30 text-[#50a7ea] text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 animate-spin text-[#50a7ea]" style={{ animationDuration: '6s' }} />
            <span>React + Vite • Telegram Web Integration • .env Configured</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Manage Multi-Profiles & <br />
            <span className="bg-gradient-to-r from-[#50a7ea] via-[#2481cc] to-cyan-400 bg-clip-text text-transparent">
              Act as Telegram Web
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            A comprehensive React platform that reads Telegram credentials and profiles straight from your{' '}
            <code className="text-[#50a7ea] bg-[#17212b] px-2 py-0.5 rounded border border-[#242f3d] font-mono text-sm">.env</code>{' '}
            file. When credentials are provided, it dynamically unlocks the full{' '}
            <strong className="text-white font-semibold">Telegram Web Client</strong> in your dashboard!
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#2481cc] hover:bg-[#1e72b4] text-white font-semibold text-base shadow-lg shadow-[#2481cc]/30 hover:shadow-[#2481cc]/50 transition-all transform hover:-translate-y-0.5"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage('login')}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#2481cc] hover:bg-[#1e72b4] text-white font-semibold text-base shadow-lg shadow-[#2481cc]/30 hover:shadow-[#2481cc]/50 transition-all transform hover:-translate-y-0.5"
              >
                <span>Login to Access Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setCurrentPage('dashboard')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#17212b] hover:bg-[#242f3d] text-slate-200 border border-[#242f3d] font-medium text-base transition-all"
            >
              <Send className="w-4 h-4 text-[#50a7ea]" />
              <span>Preview Telegram Web</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live .env Detection Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#242f3d]">
            <div>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${hasTelegramCreds ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                <h2 className="text-xl font-bold text-white">Environment Configuration Status</h2>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Values parsed dynamically from <span className="text-slate-200 font-mono">.env</span> (import.meta.env)
              </p>
            </div>

            {/* Test toggle button */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMockCreds}
                className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-[#242f3d] hover:bg-[#2f3d4e] text-slate-200 border border-slate-700 transition-all"
                title="Toggle credential state to test both modes"
              >
                <Sliders className="w-3.5 h-3.5 text-[#50a7ea]" />
                <span>Simulate: {hasTelegramCreds ? 'Disable Creds' : 'Enable Creds'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Telegram Web Mode Status */}
            <div className="bg-[#0e1621] p-4 rounded-xl border border-[#242f3d]/80">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Telegram Web Mode</span>
                <Zap className={`w-4 h-4 ${hasTelegramCreds ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <div className="mt-2 text-base font-bold text-white flex items-center gap-2">
                {hasTelegramCreds ? (
                  <span className="text-emerald-400">Activated</span>
                ) : (
                  <span className="text-amber-400">Standard Mode</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {hasTelegramCreds ? 'Creds present in .env' : 'No credentials in .env'}
              </p>
            </div>

            {/* API ID */}
            <div className="bg-[#0e1621] p-4 rounded-xl border border-[#242f3d]/80">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>VITE_TELEGRAM_API_ID</span>
                <Key className="w-4 h-4 text-[#50a7ea]" />
              </div>
              <div className="mt-2 text-base font-mono font-semibold text-slate-200">
                {envConfig.apiId ? envConfig.apiId : <span className="text-slate-500">Not set</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">App Client ID</p>
            </div>

            {/* API Hash */}
            <div className="bg-[#0e1621] p-4 rounded-xl border border-[#242f3d]/80">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>VITE_TELEGRAM_API_HASH</span>
                <Lock className="w-4 h-4 text-[#50a7ea]" />
              </div>
              <div className="mt-2 text-base font-mono font-semibold text-slate-200 truncate">
                {envConfig.apiHash ? `${envConfig.apiHash.substring(0, 10)}...` : <span className="text-slate-500">Not set</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Secure MD5 Hash</p>
            </div>

            {/* Profiles loaded */}
            <div className="bg-[#0e1621] p-4 rounded-xl border border-[#242f3d]/80">
              <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>VITE_TELEGRAM_PROFILES</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-base font-bold text-white">
                {envConfig.profiles.length} Profiles
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Synchronized from env</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Telegram Power Users</h2>
          <p className="text-slate-400 text-sm mt-2">Everything you need from your .env configuration to interactive chat</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#17212b] border border-[#242f3d] p-6 rounded-2xl hover:border-[#2481cc]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#2481cc]/15 text-[#50a7ea] flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Telegram Web Interface</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              When credentials exist in your .env, the dashboard instantly transforms into a full Telegram Web client with live chat, search, and message dispatch.
            </p>
          </div>

          <div className="bg-[#17212b] border border-[#242f3d] p-6 rounded-2xl hover:border-[#2481cc]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Profile Hub</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Configure personal, bot, channel admin, and developer profiles inside .env. Seamlessly switch between active identities without re-authenticating.
            </p>
          </div>

          <div className="bg-[#17212b] border border-[#242f3d] p-6 rounded-2xl hover:border-[#2481cc]/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Environment Driven</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Zero hardcoding. API ID, API Hash, Bot Tokens, and custom profile lists are loaded securely via Vite environment variables.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-b from-[#17212b] to-[#0e1621] border border-[#242f3d] rounded-2xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white text-center mb-8">How TellMan Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#2481cc] text-white flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h4 className="font-semibold text-white">Add Telegram Creds to .env</h4>
              <p className="text-xs text-slate-400 mt-2">
                Populate <code className="text-[#50a7ea]">VITE_TELEGRAM_API_ID</code> and <code className="text-[#50a7ea]">VITE_TELEGRAM_API_HASH</code> in your .env file.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#2481cc] text-white flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h4 className="font-semibold text-white">Authenticate on Login</h4>
              <p className="text-xs text-slate-400 mt-2">
                Log in via demo button or your phone/credentials. Session state is preserved safely.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#2481cc] text-white flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h4 className="font-semibold text-white">Experience Telegram Web</h4>
              <p className="text-xs text-slate-400 mt-2">
                Your dashboard acts as Telegram Web with all your .env profiles listed and ready to message.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
