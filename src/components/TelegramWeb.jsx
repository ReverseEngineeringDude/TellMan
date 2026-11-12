import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Check, 
  CheckCheck, 
  Pin, 
  Volume2, 
  Info, 
  X, 
  Users, 
  Bot, 
  Hash, 
  ShieldCheck, 
  ArrowLeft,
  Share2,
  Bell,
  Sparkles,
  FileText
} from 'lucide-react';
import { INITIAL_CHATS } from '../data/mockChats';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '👏', '🚀', '🎉', '⚡', '🤖', '😊', '🙌'];

export function TelegramWeb({ activeProfile, envConfig }) {
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState(INITIAL_CHATS[0].id);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'user' | 'group' | 'channel' | 'bot'
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  // Filter chats by tab and search
  const filteredChats = chats.filter(chat => {
    const matchesTab = activeTab === 'all' ? true : chat.type === activeTab;
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Handle message sending
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: 'm-' + Date.now(),
      sender: 'me',
      senderName: activeProfile?.name || 'You',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    const currentChatId = activeChat.id;

    // Update active chat with sent message
    setChats(prevChats => prevChats.map(c => {
      if (c.id === currentChatId) {
        return {
          ...c,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    const sentText = messageText;
    setMessageText('');
    setShowEmojiPicker(false);

    // Simulate realistic typing and response from the chat partner
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyMsg = {
          id: 'rep-' + Date.now(),
          sender: 'them',
          senderName: activeChat.name,
          text: generateSimulatedReply(sentText, activeChat, activeProfile),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };

        setChats(currentList => currentList.map(c => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: [...c.messages, replyMsg]
            };
          }
          return c;
        }));
      }, 1400);
    }, 600);
  };

  const generateSimulatedReply = (userInput, chat, profile) => {
    const input = userInput.toLowerCase();
    if (chat.type === 'bot') {
      if (input.includes('/status') || input.includes('status')) {
        return `🤖 System Status: Connected\nAPI_ID: ${envConfig.apiId || 'Verified'}\nProfile: ${profile?.name}\nLatency: 28ms`;
      }
      if (input.includes('/help') || input.includes('help')) {
        return `Commands:\n/status - Check API status\n/profile - View active profile\n/ping - Connection test`;
      }
      return `TellMan Bot processed your message: "${userInput}". Everything is synced with .env!`;
    }
    if (input.includes('hello') || input.includes('hey') || input.includes('hi')) {
      return `Hey ${profile?.name?.split(' ')[0] || 'there'}! Hope everything is running smoothly on your end.`;
    }
    if (input.includes('telegram') || input.includes('api') || input.includes('creds')) {
      return `Confirmed! The Telegram Web client is responding directly with credentials from .env.`;
    }
    return `Got it! Thanks for the update, ${profile?.name?.split(' ')[0] || 'friend'}.`;
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    // Mark as read
    setChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  return (
    <div className="flex h-[740px] bg-[#0e1621] rounded-2xl border border-[#242f3d] overflow-hidden shadow-2xl relative">
      
      {/* LEFT SIDEBAR: Chats list */}
      <div className="w-full sm:w-80 md:w-96 flex-shrink-0 bg-[#17212b] border-r border-[#242f3d] flex flex-col">
        
        {/* Top Profile / Telegram Brand Header */}
        <div className="p-3.5 border-b border-[#242f3d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={activeProfile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={activeProfile?.name}
                className="w-10 h-10 rounded-full object-cover border border-[#2481cc]"
              />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#17212b] absolute bottom-0 right-0"></span>
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white truncate flex items-center gap-1.5">
                <span>{activeProfile?.name}</span>
              </div>
              <div className="text-xs text-[#50a7ea] truncate">
                {activeProfile?.username || '@telegram_user'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#2481cc]/20 text-[#50a7ea] border border-[#2481cc]/30">
              Web Client
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#242f3d]/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats, bots, channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#242f3d]/70 text-slate-200 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#2481cc]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories / Tabs */}
        <div className="flex items-center px-2 py-1.5 border-b border-[#242f3d]/60 gap-1 overflow-x-auto text-[11px] font-medium text-slate-400">
          {[
            { id: 'all', label: 'All' },
            { id: 'user', label: 'Chats' },
            { id: 'bot', label: 'Bots' },
            { id: 'group', label: 'Groups' },
            { id: 'channel', label: 'Channels' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2481cc] text-white font-semibold'
                  : 'hover:bg-[#242f3d] hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#242f3d]/30">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No chats found
            </div>
          ) : (
            filteredChats.map(chat => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              const isSelected = chat.id === activeChat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2b5278]/40 border-l-4 border-[#2481cc]'
                      : 'hover:bg-[#242f3d]/40'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {chat.status === 'online' && (
                      <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#17212b] absolute bottom-0 right-0"></span>
                    )}
                    {chat.status === 'bot' && (
                      <span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-[#17212b] absolute bottom-0 right-0 flex items-center justify-center text-[8px] text-white font-bold">
                        B
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white truncate flex items-center gap-1">
                        {chat.name}
                        {chat.verified && (
                          <span className="text-[#50a7ea] text-xs" title="Verified">✓</span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {lastMsg ? lastMsg.time : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-400 truncate pr-2">
                        {lastMsg?.sender === 'me' ? (
                          <span className="text-[#50a7ea]">You: </span>
                        ) : null}
                        {lastMsg?.text || 'No messages yet'}
                      </p>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {chat.pinned && (
                          <Pin className="w-3 h-3 text-slate-400 rotate-45" />
                        )}
                        {chat.unread > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#2481cc] text-white text-[11px] font-bold flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER: Active Chat Conversation */}
      <div className="flex-1 flex flex-col bg-[#0e1621] relative">
        
        {/* Active Chat Header */}
        <div className="h-16 px-4 border-b border-[#242f3d] bg-[#17212b]/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={activeChat.avatar}
              alt={activeChat.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-white text-sm truncate">
                  {activeChat.name}
                </h3>
                {activeChat.verified && (
                  <span className="text-[#50a7ea] text-xs">✓</span>
                )}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {isTyping ? (
                  <span className="text-[#50a7ea] font-medium animate-pulse">typing...</span>
                ) : (
                  <span>
                    {activeChat.type === 'bot' 
                      ? 'bot' 
                      : activeChat.type === 'channel'
                      ? activeChat.membersCount
                      : activeChat.type === 'group'
                      ? activeChat.membersCount
                      : activeChat.lastSeen || 'online'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowInfoDrawer(!showInfoDrawer)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#242f3d] transition-colors"
              title="View Chat Details"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-repeat"
          style={{
            backgroundImage: `radial-gradient(#242f3d 0.75px, transparent 0.75px)`,
            backgroundSize: '24px 24px'
          }}
        >
          {/* Telegram Credentials Active Notice in Chat */}
          <div className="text-center my-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17212b]/90 border border-[#242f3d] text-[11px] text-slate-400 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted via Telegram Credentials (<code className="text-[#50a7ea]">{envConfig.apiId || 'API_ID'}</code>)</span>
            </div>
          </div>

          {activeChat.messages.map(msg => {
            const isMe = msg.sender === 'me';
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md relative ${
                    isMe
                      ? 'bg-[#2b5278] text-white rounded-br-none'
                      : 'bg-[#182533] text-slate-100 rounded-bl-none border border-[#242f3d]/60'
                  }`}
                >
                  {!isMe && activeChat.type !== 'user' && (
                    <div className="text-xs font-semibold text-[#50a7ea] mb-1">
                      {msg.senderName}
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>

                  <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                    <span>{msg.time}</span>
                    {isMe && (
                      <span>
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#50a7ea]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-blue-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#182533] rounded-2xl rounded-bl-none px-4 py-3 border border-[#242f3d]/60 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Quick Tray */}
        {showEmojiPicker && (
          <div className="px-4 py-2 bg-[#17212b] border-t border-[#242f3d] flex items-center gap-2 overflow-x-auto">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setMessageText(prev => prev + emoji)}
                className="text-lg hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Form */}
        <div className="p-3 bg-[#17212b] border-t border-[#242f3d]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition-colors ${
                showEmojiPicker ? 'text-[#50a7ea] bg-[#2481cc]/20' : 'text-slate-400 hover:text-white'
              }`}
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setMessageText(prev => prev + ' 📎 file.pdf')}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              type="text"
              placeholder="Write a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-[#0e1621] text-slate-100 placeholder-slate-400 text-sm rounded-xl px-4 py-2.5 border border-[#242f3d] focus:outline-none focus:border-[#2481cc]"
            />

            <button
              type="submit"
              disabled={!messageText.trim()}
              className={`p-2.5 rounded-xl transition-all ${
                messageText.trim()
                  ? 'bg-[#2481cc] text-white shadow-md shadow-[#2481cc]/30 hover:bg-[#1e72b4]'
                  : 'bg-[#242f3d] text-slate-500 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT DRAWER: Chat Details */}
      {showInfoDrawer && (
        <div className="w-72 bg-[#17212b] border-l border-[#242f3d] flex flex-col z-20 transition-all">
          <div className="p-4 border-b border-[#242f3d] flex items-center justify-between">
            <h4 className="font-semibold text-white text-sm">User Info</h4>
            <button
              onClick={() => setShowInfoDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 text-center border-b border-[#242f3d]">
            <img
              src={activeChat.avatar}
              alt={activeChat.name}
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#2481cc]"
            />
            <h3 className="font-bold text-white text-base mt-3">{activeChat.name}</h3>
            <p className="text-xs text-[#50a7ea]">{activeChat.username}</p>
            <p className="text-xs text-slate-400 mt-1">{activeChat.phone || 'Private Number'}</p>
          </div>

          <div className="p-4 space-y-4 text-xs overflow-y-auto flex-1">
            {activeChat.bio && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Bio</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{activeChat.bio}</p>
              </div>
            )}

            <div className="pt-2 border-t border-[#242f3d] space-y-2.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2"><Bell className="w-4 h-4 text-slate-400" /> Notifications</span>
                <span className="text-[#50a7ea] font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2"><Share2 className="w-4 h-4 text-slate-400" /> Shared Files</span>
                <span className="text-slate-400">14 items</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Encryption</span>
                <span className="text-emerald-400">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
