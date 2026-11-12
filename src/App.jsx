import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { getEnvConfig } from './utils/envConfig';
import { Send, Shield, Heart } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [envConfig, setEnvConfig] = useState(getEnvConfig());
  const [isCredsOverridden, setIsCredsOverridden] = useState(false);
  const [mockCredsEnabled, setMockCredsEnabled] = useState(true);

  // Authenticated user state, persisted in localStorage
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tellman_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Calculate if Telegram credentials are active
  const hasTelegramCreds = isCredsOverridden
    ? mockCredsEnabled
    : envConfig.hasTelegramCreds;

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tellman_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tellman_user');
    setCurrentPage('home');
  };

  const toggleMockCreds = () => {
    setIsCredsOverridden(true);
    setMockCredsEnabled(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#0e1621] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
        hasTelegramCreds={hasTelegramCreds}
      />

      {/* Main Pages Router */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            setCurrentPage={setCurrentPage}
            user={user}
            envConfig={envConfig}
            hasTelegramCreds={hasTelegramCreds}
            toggleMockCreds={toggleMockCreds}
            isCredsOverridden={isCredsOverridden}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            setCurrentPage={setCurrentPage}
            envConfig={envConfig}
            hasTelegramCreds={hasTelegramCreds}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            user={user}
            setCurrentPage={setCurrentPage}
            envConfig={envConfig}
            hasTelegramCreds={hasTelegramCreds}
            toggleMockCreds={toggleMockCreds}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#242f3d] bg-[#17212b]/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#2481cc] flex items-center justify-center text-white">
              <Send className="w-3 h-3 -rotate-12" />
            </div>
            <span className="font-semibold text-slate-300">TellMan</span>
            <span>— Telegram Web & Profile Dashboard</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${hasTelegramCreds ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{hasTelegramCreds ? 'Telegram Web Mode (.env)' : 'Standard Mode'}</span>
            </span>
            <span>•</span>
            <button 
              onClick={() => setCurrentPage('home')}
              className="hover:text-slate-200 transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className="hover:text-slate-200 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
