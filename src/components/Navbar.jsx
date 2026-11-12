import React from 'react';
import { Send, ShieldCheck, UserCheck, LogOut, LogIn, LayoutDashboard, Home, Radio, Sparkles } from 'lucide-react';

export function Navbar({ currentPage, setCurrentPage, user, onLogout, hasTelegramCreds }) {
  return (
    <header className="sticky top-0 z-50 bg-[#17212b]/95 backdrop-blur-md border-b border-[#242f3d] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2481cc] to-[#50a7ea] flex items-center justify-center text-white shadow-lg shadow-[#2481cc]/25 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-[#50a7ea] transition-colors">
                TellMan
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2481cc]/20 text-[#50a7ea] border border-[#2481cc]/30">
                Web 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Telegram Web & Profile Hub</p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0e1621]/60 p-1 rounded-xl border border-[#242f3d]">
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === 'home'
                ? 'bg-[#2481cc] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#242f3d]/50'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === 'dashboard'
                ? 'bg-[#2481cc] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-[#242f3d]/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
            {hasTelegramCreds && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          {!user && (
            <button
              onClick={() => setCurrentPage('login')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === 'login'
                  ? 'bg-[#2481cc] text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#242f3d]/50'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}
        </nav>

        {/* Right Status Badges & Auth */}
        <div className="flex items-center gap-3">
          {/* Telegram Creds Environment Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-[#0e1621] border-[#242f3d]">
            <Radio className={`w-3.5 h-3.5 ${hasTelegramCreds ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              {hasTelegramCreds ? (
                <span className="text-emerald-400 font-semibold">TG Web Mode (.env)</span>
              ) : (
                <span className="text-amber-400 font-medium">Standard Mode</span>
              )}
            </span>
          </div>

          {/* User Profile / Login status */}
          {user ? (
            <div className="flex items-center gap-2">
              <div 
                onClick={() => setCurrentPage('dashboard')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#242f3d]/60 border border-[#242f3d] cursor-pointer hover:border-[#2481cc]/50 transition-all"
              >
                <img
                  src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#2481cc]"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] text-[#50a7ea]">{user.username || '@user'}</div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#2481cc] hover:bg-[#1e72b4] text-white shadow-md shadow-[#2481cc]/20 transition-all hover:shadow-[#2481cc]/40"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#242f3d] py-2 bg-[#0e1621]">
        <button
          onClick={() => setCurrentPage('home')}
          className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg ${
            currentPage === 'home' ? 'text-[#50a7ea] bg-[#2481cc]/15' : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg ${
            currentPage === 'dashboard' ? 'text-[#50a7ea] bg-[#2481cc]/15' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>
        {!user ? (
          <button
            onClick={() => setCurrentPage('login')}
            className={`flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg ${
              currentPage === 'login' ? 'text-[#50a7ea] bg-[#2481cc]/15' : 'text-slate-400'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
        ) : (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-medium py-1 px-3 rounded-lg text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
