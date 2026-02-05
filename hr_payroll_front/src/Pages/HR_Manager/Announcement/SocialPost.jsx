import React, { useState, useEffect } from "react";
import { useAnnouncements } from "../../../Context/AnnouncementContext";
import useAuth from "../../../Context/AuthContext";
import Icon from "../../../Components/Icon";

export default function SocialPost({ announcement, isDetailView = false, onEdit = null }) {
  const { id, title, content, priority, created_at, createdAt, attachments = [], views = 0 } = announcement;
  const { removeAnnouncement, trackView } = useAnnouncements();
  const { auth } = useAuth();
  
  const displayDate = created_at || createdAt;
  const [expanded, setExpanded] = useState(isDetailView);

  const isHR = auth?.user?.role === 'Manager';
  
  useEffect(() => {
    if (id) {
       trackView(id);
    }
  }, [id]);
  
  // Logic to handle both local preview URLs and server URLs
  const getUrl = (url) => {
    if (!url) return "";
    if (url instanceof File) return URL.createObjectURL(url);
    if (typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('http'))) return url;
    const baseUrl = (import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const path = typeof url === 'string' ? url.replace(/^\//, '') : '';
    return `${baseUrl}/${path}`;
  };

  const media = attachments.filter(a => a.file_type === 'image' || a.file_type === 'video');
  const files = attachments.filter(a => a.file_type === 'file');
  const [activeMedia, setActiveMedia] = useState(media[0] || null);

  useEffect(() => { setActiveMedia(media[0]); }, [announcement]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      await removeAnnouncement(id);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 overflow-hidden relative ${isDetailView ? '' : 'rounded shadow  dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 mb-3'}`}>
      
      {isHR && !isDetailView && (
        <div className="absolute top-4 right-4 flex gap-1 z-10">
          <button 
            onClick={() => onEdit && onEdit(announcement)}
            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            title="Edit Announcement"
          >
            <Icon name="Edit" className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Delete Announcement"
          >
            <Icon name="Trash2" className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-5 flex gap-4 items-center">
        {(announcement.author?.photo || announcement.created_by?.photo) ? (
          <img 
            src={getUrl(announcement.author?.photo || announcement.created_by?.photo)} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs">HR</div>
        )}
        <div className="flex-1">
          <div className="font-black text-sm text-slate-800 dark:text-slate-200">Human Resources</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {displayDate ? new Date(displayDate).toLocaleDateString() : 'Date'} • {priority} Priority
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <h4 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{title}</h4>
        <div className={`text-sm leading-relaxed text-slate-600 dark:text-slate-300 ${(!expanded && !isDetailView) ? 'line-clamp-3' : ''}`} 
             dangerouslySetInnerHTML={{ __html: content || "" }} />
        {(content || "").length > 200 && !isDetailView && (
          <button onClick={() => setExpanded(!expanded)} className="text-blue-600 font-bold mt-2 text-xs">
            {expanded ? "Show Less" : "Read More"}
          </button>
        )}
      </div>

      {media.length > 0 && (
        <div className="px-6 pb-6">
          <div className="rounded-2xl overflow-hidden border dark:border-slate-700 bg-black aspect-video flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {activeMedia?.file_type === 'image' ? (
                <img src={getUrl(activeMedia.file)} className="w-full h-full object-contain" alt="Preview" />
              ) : (
                <video src={getUrl(activeMedia?.file)} controls className="w-full h-full" />
              )}
            </div>
            {media.length > 1 && (
              <div className="flex gap-2 p-2 bg-white/10 backdrop-blur-md border-t border-white/10 overflow-x-auto">
                {media.map((m, i) => (
                  <button key={i} onClick={() => setActiveMedia(m)} 
                    className={`w-16 h-10 rounded overflow-hidden border-2 flex-shrink-0 transition ${activeMedia?.file === m.file ? 'border-blue-500' : 'border-transparent opacity-50'}`}>
                    {m.file_type === 'image' ? <img src={getUrl(m.file)} className="w-full h-full object-cover" /> : <div className="bg-slate-700 h-full flex items-center justify-center text-[6px] text-white">VIDEO</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="px-6 pb-6 space-y-2">
          {files.map((f, i) => (
            <a key={i} href={getUrl(f.file)} download={f.file.split('/').pop()} className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group">
              <div className="flex items-center gap-3 truncate">
                <span className="text-xl">📄</span>
                <div className="truncate text-left">
                  <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{f.name || f.file.split('/').pop()}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{f.size || 'File'}</p>
                </div>
              </div>
              <span className="text-blue-600 font-black text-[10px] opacity-0 group-hover:opacity-100 uppercase">Download</span>
            </a>
          ))}
        </div>
      )}

      <div className="px-6 py-4 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-[10px] font-black text-slate-400">
        <span className="uppercase tracking-widest">{views} Views</span>
        <span className="uppercase tracking-widest">Company Announcement</span>
      </div>
    </div>
  );
}
