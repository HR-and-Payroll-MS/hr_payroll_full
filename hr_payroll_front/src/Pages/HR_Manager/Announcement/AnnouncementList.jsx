import React, { useState } from "react";
import AnnouncementCard from "./AnnouncementCard"; 
import SocialPost from "./SocialPost"; 
import { AnnouncementSearch } from "../../../Components/Level2Hearder";
import { getLocalData } from "../../../Hooks/useLocalStorage";

export default function AnnouncementList({ announcements = [], onOpen }) {
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("All Priority");
  const role = getLocalData('role');
  const [viewMode, setViewMode] = useState(role === 'Manager' ? 'list' : 'feed');

  const filtered = announcements.filter(a => {
    if (q && !(a.title + " " + a.body).toLowerCase().includes(q.toLowerCase())) return false;
    if (priority !== "All Priority" && a.priority !== priority) return false;
    return true;
  });

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="mb-6 space-y-3">
        <AnnouncementSearch setPriority={setPriority} setQ={setQ}/>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('feed')} className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all ${viewMode === 'feed' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>NEWS FEED</button>
          <button onClick={() => setViewMode('list')} className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>ADMIN LIST</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden pb-10">
        {viewMode === 'list' ? (
          <div className="grid gap-3">
            {filtered.map(a => <AnnouncementCard key={a.id} announcement={a} onOpen={() => onOpen(a)} />)}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {filtered.map(a => <SocialPost key={a.id} announcement={a} />)}
          </div>
        )}
      </div>
    </div>
  );
}