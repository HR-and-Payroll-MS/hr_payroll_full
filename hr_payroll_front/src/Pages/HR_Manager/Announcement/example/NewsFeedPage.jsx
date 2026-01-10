import React, { useMemo } from "react";
import { useAnnouncements } from "../../../../Context/AnnouncementContext";
import SocialPost from "../SocialPost";
import Icon from "../../../../Components/Icon";

export default function NewsFeedPage() {
  const { announcements } = useAnnouncements();

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [announcements]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen ">
      <div className="w-full relative py-2 mx-auto px-4">
        {/* Header */}
        <div className="flex sticky top-0 z-10 items-center justify-between mb-2 bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Company News Feed</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Latest updates, announcements, and events</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Icon name="Newspaper" className="w-6 h-6" />
          </div>
        </div>
        
        {/* Feed */}
        <div className="space-y-6">
          {sortedAnnouncements.length > 0 ? (
            sortedAnnouncements.map((post) => (
              <SocialPost 
                key={post.id || post._id} 
                announcement={post} 
                isDetailView={false}
              />
            ))
          ) : (
            <div className="bg-white dark:bg-slate-800 p-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Icon name="Inbox" className="w-8 h-8 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold">No announcements yet.</p>
              <p className="text-xs text-slate-400 mt-1">Check back later for company updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}