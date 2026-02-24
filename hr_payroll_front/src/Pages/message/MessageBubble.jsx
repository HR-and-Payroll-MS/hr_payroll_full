// message/MessageBubble.jsx
import React from 'react';
import {
  Play,
  Pause,
  Check,
  CheckCheck,
  FileText,
  CornerUpLeft,
} from 'lucide-react';

const AudioPlayer = ({ duration }) => (
  <div className="flex items-center gap-3 w-48">
    <button className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-slate-800 hover:bg-white">
      <Play fill="currentColor" size={14} />
    </button>
    <div className="flex-1 flex items-center gap-[2px] h-6 overflow-hidden">
      {/* Fake Audio Visualizer */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-emerald-500 rounded-full`}
          style={{ height: `${Math.random() * 100}%` }}
        ></div>
      ))}
    </div>
    <span className="text-xs text-slate-300 font-mono">{duration}</span>
  </div>
);

// Helper to get full URL
const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Derive host from API base, stripping the /api/v1 suffix
  const apiBase =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_BASE_URL ||
    'http://localhost:8001/api/v1';
  const hostBase = apiBase.replace(/\/api\/v\d+$/, '');
  return `${hostBase}${path}`;
};

const MessageBubble = ({ msg, isMe, onReply }) => {
  const fileNameFromUrl = (url) => {
    try {
      const u = new URL(url, window.location.origin);
      const parts = u.pathname.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch (e) {
      return url;
    }
  };

  const ReplyPreview = ({ rp }) =>
    rp ? (
      <div
        className={`mb-2 px-3 py-2 rounded-lg text-xs ${
          isMe
            ? 'bg-emerald-700/40 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
        }`}
      >
        <span className="font-semibold mr-1">Replying to:</span>
        {rp.type !== 'text' ? rp.type : rp.text || 'Message'}
      </div>
    ) : null;
  // const isMe = msg.sender === 'me'; // Handled by parent

  return (
    <div
      className={`flex w-full mb-6 ${
        isMe ? 'justify-start flex-row-reverse' : 'justify-start'
      }`}
    >
      {/* Message Container */}
      <div className={`relative max-w-[65%] group`}>
        {/* The Bubble */}
        <div
          className={`p-4 rounded-2xl shadow-sm ${
            isMe
              ? 'bg-emerald-600 dark:bg-emerald-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 rounded-tl-sm border border-gray-100 dark:border-slate-500'
          }`}
        >
          {/* Reply Preview */}
          <ReplyPreview rp={msg.replyPreview} />
          {/* Text Type */}
          {msg.type === 'text' && (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          )}

          {/* Audio Type */}
          {msg.type === 'audio' && <AudioPlayer duration={msg.content} />}

          {/* Image Type */}
          {msg.type === 'image' && (
            <div className="space-y-2">
              <img
                src={getMediaUrl(msg.mediaUrl || msg.content || msg.attachment)}
                alt="attachment"
                className="rounded-lg w-full h-auto object-cover max-h-60"
              />
              {msg.content && (
                <p className="text-sm font-medium">{msg.content}</p>
              )}
            </div>
          )}

          {/* Video Type */}
          {msg.type === 'video' && (
            <div className="space-y-2">
              <video
                src={getMediaUrl(msg.mediaUrl || msg.content || msg.attachment)}
                controls
                className="rounded-lg w-full max-h-60"
              />
              {msg.content && (
                <p className="text-sm font-medium">{msg.content}</p>
              )}
            </div>
          )}

          {/* File Type */}
          {msg.type === 'file' && (
            <a
              href={getMediaUrl(msg.mediaUrl || msg.content || msg.attachment)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isMe
                  ? 'bg-emerald-700/40 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400'
              } hover:opacity-90`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isMe ? 'bg-emerald-800' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {fileNameFromUrl(
                    msg.mediaUrl || msg.content || msg.attachment
                  )}
                </div>
                {msg.content && (
                  <div className="text-xs opacity-80 truncate">
                    {msg.content}
                  </div>
                )}
              </div>
            </a>
          )}
          {/* Actions */}
          <div
            className={`mt-2 flex ${isMe ? 'justify-end' : 'justify-start'}`}
          >
            <button
              onClick={onReply}
              className="text-xs opacity-70 hover:opacity-100 flex items-center gap-1"
            >
              <CornerUpLeft size={14} /> Reply
            </button>
          </div>
        </div>

        {/* Metadata (Time & Ticks) */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs text-slate-500 ${
            isMe ? 'flex-row-reverse' : ''
          }`}
        >
          <span>{msg.time}</span>
          {isMe &&
            (msg.status === 'read' ? (
              <CheckCheck size={14} className="text-emerald-500" />
            ) : (
              <Check size={14} />
            ))}
        </div>

        {/* Floating Reactions Bar (Simulated hover effect from screenshot) */}
        {msg.reactions && (
          <div className="absolute -top-8 right-0 bg-[#0f172a] border border-slate-700 p-1.5 rounded-full flex gap-2 shadow-lg z-10">
            {msg.reactions.map((r) => (
              <span
                key={r}
                className="text-sm hover:scale-125 cursor-pointer transition-transform"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Attached Reaction */}
        {msg.reaction && (
          <div className="absolute -bottom-3 -left-2 bg-slate-700 rounded-full p-1 border-2 border-[#0f172a] text-xs">
            {msg.reaction}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
