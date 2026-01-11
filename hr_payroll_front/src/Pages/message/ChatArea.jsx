// message/ChatArea.jsx
import React, { useRef, useEffect } from 'react';
import {
  MoreVertical,
  Smile,
  Mic,
  Paperclip,
  User,
  BarChart2,
  FileText,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import { useChat } from './useChat';
import { useSocket } from '../../Context/SocketProvider';
import MessageBubble from './MessageBubble';
import useAuth from '../../Context/AuthContext';

const emojis = [
  '',
  '❤️',
  '😂',
  '🔥',
  '👍',
  '🙌',
  '✨',
  '🎉',
  '💡',
  '✅',
  '❌',
  '👀',
  '🚀',
  '⭐',
  '🌈',
  '🎁',
];

const ChatArea = ({ activeUser }) => {
  const { auth } = useAuth();
  const {
    messages,
    isLoading,
    sendMessage,
    sendFile,
    isTyping,
    setReplyTarget,
    clearReplyTarget,
  } = useChat(activeUser?.id);
  const { socket } = useSocket();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = React.useState(null);
  const [pendingCaption, setPendingCaption] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [replyTarget, setReplyTargetState] = React.useState(null);
  const [showAttachments, setShowAttachments] = React.useState(false);
  const [showEmojis, setShowEmojis] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const lastTypingEmit = useRef(0);
  const menuRef = useRef(null);
  const emojiRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click-away listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !event.target.closest('.attachment-toggle')
      ) {
        setShowAttachments(false);
      }
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target) &&
        !event.target.closest('.emoji-toggle')
      ) {
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
    setInputValue((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      console.log('[chat] file selected:', f);
      if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
        setPendingFile(f);
        setPendingCaption('');
        try {
          const url = URL.createObjectURL(f);
          setPreviewUrl(url);
        } catch {}
      } else {
        sendFile(f);
        setShowAttachments(false);
      }
    }
  };

  const confirmSendPending = () => {
    if (!pendingFile) return;
    sendFile(
      pendingFile,
      pendingCaption?.trim() ? pendingCaption.trim() : undefined
    );
    setPendingFile(null);
    setPendingCaption('');
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setPreviewUrl(null);
    setShowAttachments(false);
  };

  if (!activeUser)
    return (
      <div className="flex-1 bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg flex items-center justify-center text-slate-500">
        Select a chat
      </div>
    );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg relative overflow-hidden h-full">
      {/* 1. Chat Header */}
      <div className="h-20 px-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-800/50">
        <div className="flex items-center gap-4">
          <img
            src={activeUser.avatar}
            alt="active"
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-600"
          />
          <div>
            <h2 className="text-gray-900 dark:text-white font-semibold">
              {activeUser.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
              {activeUser.online ? 'Online' : activeUser.last_seen || 'Offline'}
              {isTyping && (
                <span className="text-xs text-slate-500 animate-pulse">
                  Typing…
                </span>
              )}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* 2. Messages Area */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-100 dark:bg-slate-900" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E")`,
      }}>
        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-8 pt-8 custom-scrollbar">
          {isLoading ? (
            <div className="text-center text-slate-500 mt-10">
              Loading conversation...
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={msg.sender === auth?.user?.id || msg.sender === 'me'}
                onReply={() => {
                  setReplyTargetState({
                    id: msg.id,
                    type: msg.type,
                    text: msg.content,
                    mediaUrl: msg.mediaUrl,
                    sender: msg.sender,
                  });
                  setReplyTarget(msg.id);
                }}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 3. Input Area */}
      <div className="p-6 bg-white dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 relative">
        {(pendingFile || replyTarget) && (
          <div className="mb-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-xl">
            {/* Reply preview bar */}
            {replyTarget && (
              <div className="mb-2 px-3 py-2 rounded-lg text-xs bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100">
                <span className="font-semibold mr-1">Replying to:</span>
                {replyTarget.type !== 'text'
                  ? replyTarget.type
                  : replyTarget.text?.slice(0, 40) || 'Message'}
              </div>
            )}
            {/* File preview area - Telegram style */}
            {pendingFile && (
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                  {pendingFile.type.startsWith('image/') && previewUrl && (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {pendingFile.type.startsWith('video/') && previewUrl && (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                      muted
                      controls
                    />
                  )}
                  {!pendingFile.type.startsWith('image/') &&
                    !pendingFile.type.startsWith('video/') && (
                      <FileText
                        size={24}
                        className="text-slate-800 dark:text-slate-200"
                      />
                    )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-600 dark:text-slate-300 mb-1 truncate">
                    {pendingFile.name}
                  </div>
                  <input
                    type="text"
                    value={pendingCaption}
                    onChange={(e) => setPendingCaption(e.target.value)}
                    placeholder="Add a caption"
                    className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-md px-3 py-2 border border-slate-300 dark:border-slate-600"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        confirmSendPending();
                      }}
                      className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => {
                        setPendingFile(null);
                        setPendingCaption('');
                        setReplyTargetState(null);
                        clearReplyTarget();
                        if (previewUrl) {
                          try {
                            URL.revokeObjectURL(previewUrl);
                          } catch {}
                        }
                        setPreviewUrl(null);
                      }}
                      className="px-3 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!pendingFile && replyTarget && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    /* reply set via hook; sending happens on Enter/Send */
                  }}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
                >
                  Set Reply
                </button>
                <button
                  onClick={() => {
                    setReplyTargetState(null);
                    clearReplyTarget();
                  }}
                  className="px-3 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 rounded-md"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
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
            showAttachments
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          {/* Quick Files - Trigger Click on hidden input */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-11 h-11 rounded-full bg-blue-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
            title="Document"
          >
            <FileText size={20} />
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-11 h-11 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
            title="Poll/Chart"
          >
            <BarChart2 size={20} />
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-11 h-11 rounded-full bg-purple-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
            title="Image"
          >
            <ImageIcon size={20} />
          </button>
        </div>

        {/* Interactive Emoji Picker */}
        <div
          ref={emojiRef}
          className={`absolute bottom-[90%] right-14 mb-4 bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 rounded-2xl p-3 w-64 transition-all duration-300 transform origin-bottom-right z-10 ${
            showEmojis
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-10 scale-95 pointer-events-none'
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
            className={`p-3 attachment-toggle transition-colors ${
              showAttachments
                ? 'text-emerald-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
            }`}
          >
            <Paperclip size={20} />
          </button>

          {/* Input Field */}
          <input
            type="text"
            placeholder="Write message here..."
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value;
              setInputValue(val);
              const now = Date.now();
              if (
                socket &&
                activeUser?.id &&
                now - lastTypingEmit.current > 800
              ) {
                const payload = {
                  receiverId: activeUser.id,
                  isTyping: true,
                  conversationId:
                    messages?.[0]?.conversation ||
                    messages?.[0]?.conversation_id ||
                    null,
                  from: auth?.user?.id,
                };
                console.log('[socket] emit typing:', payload);
                socket.emit('typing', payload);
                lastTypingEmit.current = now;
              }
            }}
            className="flex-1 bg-transparent text-gray-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none h-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                // set replyTo in hook ref via socket context
                sendMessage(inputValue);
                setInputValue('');
                setShowAttachments(false);
                setShowEmojis(false);
                setReplyTargetState(null);
                clearReplyTarget();
              }
            }}
          />

          {/* Input Right Actions */}
          <button
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowAttachments(false);
            }}
            className={`p-2 emoji-toggle transition-colors ${
              showEmojis
                ? 'text-yellow-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-yellow-500'
            }`}
          >
            <Smile size={20} />
          </button>

          <button
            onClick={() => {
              if (inputValue.trim()) {
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
        {/* Typing indicator shown in header next to status */}
      </div>
    </div>
  );
};

export default ChatArea;
