import React from "react";
// import { formatTime, notificationIcon } from "./utils";
import Icon from "../../../../Components/Icon";

export default function NewsCard({ post, onView }) {
  // Logic to detect file type
  const fileUrl = post.attachment_url; 
  const isImage = fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isDoc = fileUrl?.match(/\.(pdf|docx|doc|txt)$/i);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${
      post.unread ? "border-blue-200 ring-1 ring-blue-50" : "border-slate-200"
    }`}>
      
      {/* 1. Header with UNREAD LABEL */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            {notificationIcon(post.category)}
          </div> */}
          <div>
            <h3 className="text-sm font-bold text-slate-900">{post.title}</h3>
            {/* <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {formatTime(post.created_at || post.createdAt)}
            </p> */}
          </div>
        </div>

        {/* 🔹 The "NEW" Label logic */}
        {post.unread && (
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md animate-pulse">
            NEW
          </span>
        )}
      </div>

      {/* 2. Body Text */}
      <div className="px-4 pb-4">
        <div 
          className="text-slate-700 text-sm leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.message }} 
        />
        <button 
          onClick={onView}
          className="text-blue-600 text-xs font-bold mt-2 hover:text-blue-800"
        >
          Read Full Story
        </button>
      </div>

      {/* 3. Media Section (Handles Image vs File) */}
      {fileUrl && (
        <div className="border-t border-slate-100">
          {isImage ? (
            <div className="relative group cursor-pointer" onClick={onView}>
              <img 
                src={fileUrl} 
                alt="attachment" 
                className="w-full h-auto max-h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
            </div>
          ) : (
            <div className="m-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-white p-2 rounded shadow-sm">
                  <Icon name="FileText" className="text-red-500 w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {fileUrl.split('/').pop()}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Document Attachment</p>
                </div>
              </div>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white border border-slate-300 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Open
              </a>
            </div>
          )}
        </div>
      )}

      {/* 4. Interaction Footer */}
      <div className="px-4 py-3 bg-slate-50/50 rounded-b-2xl border-t border-slate-100 flex items-center gap-6">
        <button 
          onClick={onView}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <Icon name="MessageSquare" className="w-4 h-4" />
          <span className="text-xs font-bold">View Details</span>
        </button>
        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
          <Icon name="Share2" className="w-4 h-4" />
          <span className="text-xs font-bold">Internal Share</span>
        </button>
      </div>
    </div>
  );
}