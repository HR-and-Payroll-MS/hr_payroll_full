// message/MessageBubble.jsx
import React from 'react';
import { Play, Pause, Check, CheckCheck } from 'lucide-react';

const AudioPlayer = ({ duration }) => (
  <div className="flex items-center gap-3 w-48">
    <button className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-slate-800 hover:bg-white">
      <Play fill="currentColor" size={14} />
    </button>
    <div className="flex-1 flex items-center gap-[2px] h-6 overflow-hidden">
        {/* Fake Audio Visualizer */}
        {[...Array(20)].map((_, i) => (
            <div key={i} className={`w-1 bg-emerald-500 rounded-full`} style={{height: `${Math.random() * 100}%`}}></div>
        ))}
    </div>
    <span className="text-xs text-slate-300 font-mono">{duration}</span>
  </div>
);

// Helper to get full URL
const getMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const BASE_URL = "http://localhost:8001"; // Or process.env.REACT_APP_API_URL
    return `${BASE_URL}${path}`;
};

const MessageBubble = ({ msg, isMe }) => {
  // const isMe = msg.sender === 'me'; // Handled by parent
  
  return (
    <div className={`flex w-full mb-6 ${isMe ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
      
      {/* Message Container */}
      <div className={`relative max-w-[65%] group`}>
        
        {/* The Bubble */}
        <div className={`p-4 rounded-2xl shadow-sm ${
            isMe 
            ? 'bg-emerald-600 dark:bg-emerald-600 text-white rounded-tr-sm' 
            : 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 rounded-tl-sm border border-gray-100 dark:border-slate-500'
        }`}>
            
            {/* Text Type */}
            {msg.type === 'text' && (
                <p className="text-sm leading-relaxed">{msg.content}</p>
            )}

            {/* Audio Type */}
            {msg.type === 'audio' && (
                <AudioPlayer duration={msg.content} />
            )}

            {/* Image Type */}
            {msg.type === 'image' && (
                <div className="space-y-2">
                    <img src={getMediaUrl(msg.content || msg.attachment)} alt="attachment" className="rounded-lg w-full h-auto object-cover max-h-60" />
                    {msg.caption && <p className="text-sm font-medium">{msg.caption}</p>}
                </div>
            )}

            {/* Video Type */}
            {msg.type === 'video' && (
                <video src={getMediaUrl(msg.content || msg.attachment)} controls className="rounded-lg w-full max-h-60" />
            )}

            {/* File Type */}
            {msg.type === 'file' && (
                <a href={getMediaUrl(msg.content || msg.attachment)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-slate-700 rounded text-blue-600 dark:text-blue-400 underline break-all">
                    <span>DOCUMENT LINK</span>
                </a>
            )}
        </div>

        {/* Metadata (Time & Ticks) */}
        <div className={`flex items-center gap-1 mt-1 text-xs text-slate-500 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span>{msg.time}</span>
            {isMe && (
               msg.status === 'read' 
               ? <CheckCheck size={14} className="text-emerald-500" /> 
               : <Check size={14} />
            )}
        </div>

        {/* Floating Reactions Bar (Simulated hover effect from screenshot) */}
        {msg.reactions && (
            <div className="absolute -top-8 right-0 bg-[#0f172a] border border-slate-700 p-1.5 rounded-full flex gap-2 shadow-lg z-10">
                {msg.reactions.map(r => <span key={r} className="text-sm hover:scale-125 cursor-pointer transition-transform">{r}</span>)}
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