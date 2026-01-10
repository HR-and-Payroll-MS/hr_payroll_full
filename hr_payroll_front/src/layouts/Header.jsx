import { NavLink, useNavigate } from "react-router-dom";
import DropDownContent from "../Components/DropDownContent";
import Icon from "../Components/Icon";
import InputField from "../Components/InputField";
import NotificationBell  from "../Pages/Notifications/NotificationBell";
import { getLocalData } from "../Hooks/useLocalStorage";
import { useProfile } from "../Context/ProfileContext";
import { useEffect, useState, useMemo } from "react";
import { useAnnouncements } from "../Context/AnnouncementContext";
import { mainHeaderSearch } from "../config/searchSuggestions";

const BASE_URL = import.meta.env.VITE_BASE_URL;
export default function Header(){
  const { profile, getProfile, loading } = useProfile();
    
    useEffect(() => {
      getProfile(); 
    }, [getProfile]);
    const role = getLocalData('role')
    const navigate = useNavigate()
    const { announcements } = useAnnouncements();
    const [unreadNewsCount, setUnreadNewsCount] = useState(0);

    useEffect(() => {
      const lastViewedTime = localStorage.getItem('lastViewedNewsTime');
      const latestAnnouncements = announcements || [];
      if (!lastViewedTime) {
        setUnreadNewsCount(latestAnnouncements.length);
      } else {
        const unread = latestAnnouncements.filter(a => {
           const dateStr = a.created_at || a.createdAt;
           return dateStr && new Date(dateStr) > new Date(lastViewedTime);
        });
        setUnreadNewsCount(unread.length);
      }
    }, [announcements]);

    const [unreadMessagesCount, setUnreadMessagesCount] = useState(2); // Mock count for now

    const handleNewsClick = () => {
      localStorage.setItem('lastViewedNewsTime', new Date().toISOString());
      setUnreadNewsCount(0);
      navigate("news");
    };
        return <div className={`bg-white flex justify-evenly shadow h-14 gap-3 z-40  dark:bg-slate-800 dark:text-white `}> 
        <div id="left" className="flex py-2.5 w-2/5  justify-between items-center p-4 ">
            <div className={`flex relative shadow items-center gap-1.5 justify-start bg-gray-100 w-full h-full rounded-md  dark:bg-slate-700 `}>
                <div className="flex relative flex-1 items-center gap-1.5 py-2 h-full">
                    <img className="h-4 left-2 absolute opacity-45" src="\svg\search-svgrepo-com.svg" alt="" />
                    {/* <input className=" h-full rounded w-full" type="email" name="email" id="email" placeholder="search anything..." /> */}
                    {/* <InputField border="" placeholder="search anything..." icon={false}/> */}
                    <InputField icon={false} border="" maxWidth="w-full pl-5" placeholder="Search..." searchMode="global" globalData={mainHeaderSearch[getLocalData("role")]} displayKey="label" onSelect={(item) => navigate(item.path)} />


                </div>
                <div className={`flex absolute right-2 bg-white items-center justify-center gap-1.5 px-1.5 rounded-md  dark:bg-slate-700 `}>
                    <p className="text-lg font-bold">x</p>
                    <p className="text-sm font-bold">F</p>
                </div>
            </div>

        </div>
        <div id="middle" className="flex w-3/5 justify-start gap-7 items-center ">
                <p onClick={()=>navigate("profile",{state:{position:3}})} className={`font-semibold text-gray-700  text-sm  dark:font-slate-300 dark:text-slate-300 hover:cursor-pointer hover:text-slate-900 `}>Documents</p>
                {role==="Manager"?
                <p onClick={()=>navigate("Announcement",{state:{position:2}})} className={`font-semibold text-gray-700  text-sm  dark:font-slate-300 dark:text-slate-300 hover:cursor-pointer hover:text-slate-900 `}>Announcements</p>:
                <div onClick={handleNewsClick} className="relative cursor-pointer">
                  <p className={`font-semibold text-gray-700  text-sm  dark:font-slate-300 dark:text-slate-300 hover:text-slate-900 `}>News</p>
                  {unreadNewsCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                      {unreadNewsCount > 9 ? '9+' : unreadNewsCount}
                    </span>
                  )}
                </div>
               } <p onClick={()=>navigate("profile",{state:{position:2}})} className={`font-semibold text-gray-700  text-sm  dark:font-slate-300 dark:text-slate-300 hover:cursor-pointer hover:text-slate-900 `}>Payslip</p>
                <p className={`font-semibold text-gray-700  text-sm  dark:font-slate-300 dark:text-slate-300 hover:cursor-pointer hover:text-slate-900 `}>Report</p>
        </div>
        <div id="right" className="flex w-1/5 justify-end items-center px-6 gap-3">
                <div onClick={() => navigate("message")} className="p-2 dark:hover:bg-slate-700 hover:bg-slate-100 rounded-full cursor-pointer transition-colors relative group">
                  <Icon name="MessageSquare" className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-bounce shadow-sm border border-white dark:border-slate-800">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </span>
                  )}
                </div>
                <NotificationBell role={role} onOpenCenter={() => navigate("view_notification")}/>
                {/* <img className="h-6" src="\svg\message-square-lines-svgrepo-com.svg" alt="" /> */}
                <DropDownContent svgs={<div className="flex items-center">
                    {profile?.general?.photo ? (
              <img 
                className="h-6 min-w-6 rounded-full object-cover" 
                src={`${BASE_URL}${profile.general.photo.startsWith('/') ? '' : '/'}${profile.general.photo}`}
                alt="Profile"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className='rounded-full bg-slate-800 dark:bg-slate-600 text-slate-100 h-7 w-7 text-center items-center flex justify-center' 
              style={{ display: profile?.general?.photo ? 'none' : 'flex' }}
            >
                  {(profile?.general?.fullname ?? "")
                    .split(" ")
                    .map(n => n[0])
                    .slice(0, 2)
                    .join("") || "NA"}
            </div>
                </div>}>
                        <ul className="flex flex-col py-2">
                            <li onClick={()=>navigate("profile")} className="px-4 py-1 flex items-center gap-1.5 dark:hover:bg-slate-700 hover:bg-slate-50 cursor-pointer"><Icon name="CircleUser" className="h-4 w-4"/>view profile</li>
                            {/* <li className="px-4 py-1 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"><Icon name="CircleUser" className="h-4 w-4"/><NavLink to="profile">view profile</NavLink></li> */}
                            <li onClick={()=>navigate("/logout")} className="px-4 py-1 flex items-center gap-1.5 dark:hover:bg-slate-700 hover:bg-slate-50 cursor-pointer"><Icon name="LogOut" className="h-4 w-4"/>Logout</li>
                        </ul>
                </DropDownContent>
                
        </div>
    
    </div>
}