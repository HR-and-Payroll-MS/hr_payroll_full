import React from "react";
import SocialPost from "./SocialPost";
import { useAnnouncements } from "../../../Context/AnnouncementContext";

export default function AnnouncementDetails({ announcement, onClose, onEdit }) {
  const { removeAnnouncement } = useAnnouncements();

  const handleDelete = async () => {
    if (window.confirm("Archive this post?")) {
      await removeAnnouncement(announcement.id || announcement._id);
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full dark:bg-slate-800 bg-white">
      <div className="flex-1 overflow-y-auto hover-bar p-2">
        <SocialPost announcement={announcement} isDetailView={true} />
      </div>
      <div className="p-4 border-t flex justify-between items-center dark:bg-slate-800 bg-slate-50">
        <span className="text-[10px] font-black text-slate-400 uppercase">Manager Mode</span>
        <div className="flex gap-2">
          <button 
            onClick={() => { onEdit(announcement); onClose(); }} 
            className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl text-xs font-black border border-blue-100"
          >
            Edit Post
          </button>
          <button onClick={handleDelete} className="bg-red-50 text-red-600 px-6 py-2 rounded-xl text-xs font-black border border-red-100">
            Archive Post
          </button>
        </div>
      </div>
    </div>
  );
}




































// import React from "react";
// import SocialPost from "./SocialPost";

// export default function AnnouncementDetails({ announcement, onDelete }) {
//   return (
//     <div className="flex flex-col h-full bg-white dark:bg-slate-950">
//       <div className="flex-1 overflow-y-auto scrollbar-hidden">
//         {/* We reuse SocialPost with isDetailView=true to show everything expanded */}
//         <SocialPost announcement={announcement} isDetailView={true} />
//       </div>

//       <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex items-center justify-between">
//         <div>
//            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Manager Controls</p>
//            <p className="text-xs text-slate-500 font-medium">{announcement.reads} Views generated so far</p>
//         </div>
//         <button 
//           onClick={() => onDelete(announcement.id)} 
//           className="bg-red-50 dark:bg-red-900/20 text-red-600 px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-red-100 transition border border-red-100 dark:border-red-900/50"
//         >
//           Archive Post
//         </button>
//       </div>
//     </div>
//   );
// }