// message/ChatArea.jsx
import React, { useRef, useEffect } from 'react';
import { 
  MoreVertical, Smile, Mic, Paperclip, 
  User, BarChart2, FileText, Image as ImageIcon, Send
} from 'lucide-react';
import { useChat } from './useChat';
import MessageBubble from './MessageBubble';
import useAuth from '../../Context/AuthContext';

const emojis = ['', '❤️', '😂', '🔥', '👍', '🙌', '✨', '🎉', '💡', '✅', '❌', '👀', '🚀', '⭐', '🌈', '🎁'];

const ChatArea = ({ activeUser }) => {
  const { auth } = useAuth();
  const { messages, isLoading, sendMessage, sendFile } = useChat(activeUser?.id);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showAttachments, setShowAttachments] = React.useState(false);
  const [showEmojis, setShowEmojis] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const menuRef = useRef(null);
  const emojiRef = useRef(null);


  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click-away listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.attachment-toggle')) {
        setShowAttachments(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target) && !event.target.closest('.emoji-toggle')) {
        setShowEmojis(false);
      }
    };
    if (showAttachments || showEmojis) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachments, showEmojis]);

  const handleEmojiSelect = (emoji) => {
    setInputValue(prev => prev + emoji);
    setShowEmojis(false);
  };
  
  const handleFileSelect = (e) => {
      if(e.target.files && e.target.files[0]) {
          sendFile(e.target.files[0]);
          setShowAttachments(false);
      }
  };

  if (!activeUser) return <div className="flex-1 bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg flex items-center justify-center text-slate-500">Select a chat</div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg relative overflow-hidden h-full">
      
      {/* 1. Chat Header */}
      <div className="h-20 px-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <img src={activeUser.avatar} alt="active" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-600" />
          <div>
            <h2 className="text-gray-900 dark:text-white font-semibold">{activeUser.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">{activeUser.online ? 'Online' : (activeUser.last_seen || 'Offline')}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* 2. Messages Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-8 pt-8 custom-scrollbar">
            {isLoading ? (
                <div className="text-center text-slate-500 mt-10">Loading conversation...</div>
            ) : (
                messages.map((msg) => (
                    <MessageBubble 
                        key={msg.id} 
                        msg={msg} 
                        isMe={msg.sender === auth?.user?.id || msg.sender === 'me'} 
                    />
                ))
            )}
            <div ref={bottomRef} />
        </div>
      </div>

      {/* 3. Input Area */}
      <div className="p-6 bg-white dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 relative">
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
        />

        {/* Minimalist Attachment Icons */}
        <div 
          ref={menuRef}
          className={`absolute bottom-[90%] left-6 mb-4 flex flex-col gap-3 transition-all duration-300 transform origin-bottom z-10 ${
            showAttachments ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          {/* Quick Files - Trigger Click on hidden input */}
          <button onClick={() => fileInputRef.current.click()} className="w-11 h-11 rounded-full bg-blue-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform" title="Document">
            <FileText size={20} />
          </button>
          <button onClick={() => fileInputRef.current.click()} className="w-11 h-11 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform" title="Poll/Chart">
            <BarChart2 size={20} />
          </button>
          <button onClick={() => fileInputRef.current.click()} className="w-11 h-11 rounded-full bg-purple-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform" title="Image">
            <ImageIcon size={20} />
          </button>
        </div>

        {/* Interactive Emoji Picker */}
        <div 
          ref={emojiRef}
          className={`absolute bottom-[90%] right-14 mb-4 bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 rounded-2xl p-3 w-64 transition-all duration-300 transform origin-bottom-right z-10 ${
            showEmojis ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
          }`}
        >
          <div className="grid grid-cols-4 gap-2">
            {emojis.map((emoji, idx) => (
              <button 
                key={idx} 
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl p-2 flex items-center gap-2 pr-4 shadow-inner">
            {/* Input Left Actions */}
            <button 
              onClick={() => {
                setShowAttachments(!showAttachments);
                setShowEmojis(false);
              }}
              className={`p-3 attachment-toggle transition-colors ${showAttachments ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'}`}
            >
                <Paperclip size={20} />
            </button>

            {/* Input Field */}
            <input 
                type="text" 
                placeholder="Write message here..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent text-gray-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none h-10"
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && inputValue.trim()) {
                        sendMessage(inputValue);
                        setInputValue('');
                        setShowAttachments(false);
                        setShowEmojis(false);
                    }
                }}
            />

            {/* Input Right Actions */}
            <button 
              onClick={() => {
                setShowEmojis(!showEmojis);
                setShowAttachments(false);
              }}
              className={`p-2 emoji-toggle transition-colors ${showEmojis ? 'text-yellow-500' : 'text-slate-500 dark:text-slate-400 hover:text-yellow-500'}`}
            >
                <Smile size={20} />
            </button>
            
            <button 
                onClick={() => {
                    if(inputValue.trim()) {
                        sendMessage(inputValue);
                        setInputValue('');
                        setShowAttachments(false);
                        setShowEmojis(false);
                    }
                }}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
            >
                <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;