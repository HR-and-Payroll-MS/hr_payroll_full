import { ThemeContext } from './ThemeContext';
import { AuthContextProvider } from './AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function AppProvider({ children }) {
  return (
    <AuthContextProvider>
      <ThemeContext>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </ThemeContext>
    </AuthContextProvider>
  );
}

// return <AuthContext>
//             <ThemeContext>
//                 {children}
//             </ThemeContext>
//         </AuthContext>
