// import React, { useState } from "react";
// import CreateAnnouncement from "./CreateAnnouncement";
// import SocialPost from "./SocialPost";
// import AnnouncementCard from "./AnnouncementCard";
// import AnnouncementDetails from "./AnnouncementDetails";
// import FileDrawer from "../../../Components/FileDrawer";
// import Header from "../../../Components/Header";
// import { useAnnouncements } from "../../../Context/AnnouncementContext";
// import { getLocalData } from "../../../Hooks/useLocalStorage";

// export default function AnnouncementsPage() {
//   const { announcements, loading } = useAnnouncements();
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const role = getLocalData('role');
//   const [view, setView] = useState(role === 'Manager' ? 'list' : 'feed');

//   // Ensure announcements is always an array
//   const announcementList = Array.isArray(announcements) ? announcements : [];

//   if (loading) {
//     return (
//       <div className="p-20 text-center font-bold text-slate-600">
//         Loading News Feed...
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-slate-50 min-h-screen">
//       <Header Title="Company Feed">
//         {role === 'Manager' && <CreateAnnouncement />}
//       </Header>

//       <div className="mt-6">
//         <div className="flex gap-2 mb-6 max-w-3xl mx-auto">
//           <button
//             onClick={() => setView('feed')}
//             className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-colors ${
//               view === 'feed'
//                 ? 'bg-slate-900 text-white border-slate-900'
//                 : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
//             }`}
//           >
//             FEED
//           </button>
//           <button
//             onClick={() => setView('list')}
//             className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-colors ${
//               view === 'list'
//                 ? 'bg-slate-900 text-white border-slate-900'
//                 : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
//             }`}
//           >
//             LIST
//           </button>
//         </div>

//         <div className="max-w-3xl mx-auto">
//           {announcementList.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-slate-500 text-lg">
//                 No announcements yet.
//               </p>
//               <p className="text-slate-400 text-sm mt-2">
//                 Check back later or create one if you're a manager!
//               </p>
//             </div>
//           ) : view === 'feed' ? (
//             announcementList.map((a) => (
//               <SocialPost
//                 key={a.id || a._id}
//                 announcement={a}
//               />
//             ))
//           ) : (
//             <div className="grid gap-3">
//               {announcementList.map((a) => (
//                 <AnnouncementCard
//                   key={a.id || a._id}
//                   announcement={a}
//                   onOpen={() => {
//                     setSelected(a);
//                     setDrawerOpen(true);
//                   }}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       <FileDrawer
//         isModalOpen={drawerOpen}
//         closeModal={() => setDrawerOpen(false)}
//       >
//         {selected && (
//           <AnnouncementDetails
//             announcement={selected}
//             onClose={() => setDrawerOpen(false)}
//           />
//         )}
//       </FileDrawer>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import CreateAnnouncement from "./CreateAnnouncement";
import SocialPost from "./SocialPost";
import AnnouncementCard from "./AnnouncementCard";
import AnnouncementDetails from "./AnnouncementDetails";
import FileDrawer from "../../../Components/FileDrawer";
import Header from "../../../Components/Header";

import { useAnnouncements } from "../../../Context/AnnouncementContext";
import { getLocalData } from "../../../Hooks/useLocalStorage";

export default function AnnouncementsPage() {
  const { announcements, loading } = useAnnouncements();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  const role = getLocalData('role'); 
  const [view, setView] = useState(role === 'Manager' ? 'list' : 'feed');

  // Ensure announcements is always an array
  const announcementList = Array.isArray(announcements) ? announcements : [];

  if (loading) {
    return <div className="p-20 text-center font-bold text-slate-600">Loading News Feed...</div>;
  }

  return (
    <div className="p-6  dark:bg-slate-800 min-h-screen">
      <Header className="sticky top-0 z-30 bg-white dark:bg-slate-800" Title="Company Feed">
        {role === 'Manager' && (
          <div className="flex gap-2">
             <CreateAnnouncement />
             {editingPost && (
               <CreateAnnouncement 
                 initialData={editingPost} 
                 forceOpen={true} 
                 onClose={() => setEditingPost(null)} 
               />
             )}
          </div>
        )}
      </Header>

      <div className="mt-6">
        <div className="flex gap-2 mb-6 w-full mx-auto">
          <button
            onClick={() => setView('feed')}
            className={`text-[10px] shadow dark:shadow-slate-900 dark:inset-shadow-xs dark:inset-shadow-slate-600 font-black px-4 py-1.5 rounded-full transition-colors ${
              view === 'feed' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            FEED
          </button>
          <button
            onClick={() => setView('list')}
            className={`text-[10px] shadow dark:shadow-slate-900 dark:inset-shadow-xs dark:inset-shadow-slate-600 font-black px-4 py-1.5 rounded-full transition-colors ${
              view === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            LIST
          </button>
        </div>

        <div className="w-full mx-auto">
          {announcementList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No announcements yet.</p>
            </div>
          ) : view === 'feed' ? (
            announcementList.map((a) => (
              <SocialPost key={a.id} announcement={a} onEdit={setEditingPost} />
            ))
          ) : (
            <div className="grid gap-3">
              {announcementList.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  onEdit={setEditingPost}
                  onOpen={() => {
                    setSelected(a);
                    setDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {drawerOpen&&<FileDrawer isModalOpen={drawerOpen} closeModal={() => setDrawerOpen(false)}>
        {selected && (
          <AnnouncementDetails
            announcement={selected}
            onEdit={setEditingPost}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </FileDrawer>}
    </div>
  );
}