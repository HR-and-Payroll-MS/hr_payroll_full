import { ThemeContext } from './ThemeContext';
import { AuthContextProvider } from './AuthContext';
import { NetworkProvider } from './NetworkContext';
import { SocketProvider } from './SocketProvider';
import { NotificationProvider } from './NotificationProvider';
import { ChatBadgeProvider } from './ChatBadgeContext';
import { AnnouncementProvider } from './AnnouncementContext';
import { DashboardProvider } from './DashboardContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { TableProvider } from './TableContext';
import { ProfileProvider } from './ProfileContext';
import { DataContextProvider } from './DataContextProvider';

export default function AppProvider({ children }) {
  return (
    <AuthContextProvider>
      <DataContextProvider>
        <SocketProvider>
          <NetworkProvider>
            <DashboardProvider>
              <AnnouncementProvider>
                <NotificationProvider>
                  <ThemeContext>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <ChatBadgeProvider>{children}</ChatBadgeProvider>
                    </LocalizationProvider>
                  </ThemeContext>
                </NotificationProvider>
              </AnnouncementProvider>
            </DashboardProvider>
          </NetworkProvider>
        </SocketProvider>
      </DataContextProvider>
    </AuthContextProvider>
  );
}

// return <AuthContext>
//             <ThemeContext>
//                 {children}
//             </ThemeContext>
//         </AuthContext>
