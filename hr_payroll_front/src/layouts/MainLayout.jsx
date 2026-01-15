import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../Context/ThemeContext';
import KeyboardShortcuts from '../Components/KeyboardShrotCuts';
export default function MainLayout() {
  const { theme } = useTheme();
  return (
    <div
      className={`bg-gray-50 flex h-screen gap-0.5 ${theme} dark:bg-slate-900`}
    >
      <Sidebar />
      <div className="flex-1 h-full overflow-x-hidden flex flex-col">
        <Header />
        <div className="h-full p-4 flex-1 overflow-y-scroll scrollbar-hidden">
          <div className="h-full max-w-full shadow bg-white rounded-md hover-bar overflow-y-auto dark:bg-slate-800">
            
            <KeyboardShortcuts/>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
