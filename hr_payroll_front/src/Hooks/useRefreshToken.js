import { useCallback } from "react";
import { axiosPublic } from "../api/axiosInstance";
import { getLocalData, setLocalData } from "./useLocalStorage";

export default function useRefreshToken(){
  const refresh = useCallback(async () => {
    // Helper to safely run logic (locking if supported)
    const runRefreshLogic = async () => {
      try {
        const refreshToken = getLocalData('refresh');
        if (!refreshToken) return null;

        // 1. Check if another tab just refreshed it
        const lastRefreshStr = getLocalData('last_refresh_time');
        if (lastRefreshStr) {
          const lastRefresh = parseInt(lastRefreshStr, 10);
          // If refreshed within the last 5 seconds, use the existing token
          if (Date.now() - lastRefresh < 5000) {
            console.log("Token refreshed recently by another tab. Reusing.");
            const storedAccess = getLocalData('access');
            if (storedAccess) return storedAccess;
          }
        }

        console.log("Refreshing token...");
        const res = await axiosPublic.post('/auth/djoser/jwt/refresh/', { refresh: refreshToken });
        
        const newAccess = res?.data?.access;
        const newRefresh = res?.data?.refresh;

        if (newAccess) {
          console.log("useRefreshToken: token refreshed successfully", res?.data);
          setLocalData('access', newAccess);
          setLocalData('last_refresh_time', Date.now().toString());
          
          if (newRefresh) {
             setLocalData('refresh', newRefresh);
          }
          return newAccess;
        }
        return null; // Should not happen if api succeeds
      } catch (error) {
        console.error('useRefreshToken: refresh failed', error);
        throw error; // Let axios interceptor handle the logout if needed
      }
    };

    if (navigator.locks) {
      // Use Web Locks API to prevent race conditions across tabs
      return navigator.locks.request('auth_refresh_mutex', runRefreshLogic);
    } else {
      // Fallback for older browsers
      return runRefreshLogic();
    }
  }, []);

  return refresh;
}


// import axios from 'axios';

// const useRefreshToken = () => {
//   const refresh = async () => {
//     const storedRefresh = localStorage.getItem('refresh');
//     if (!storedRefresh) return null;

//     try {
//       const response = await axios.post('http://localhost:8000/auth/jwt/refresh', {
//         refresh: storedRefresh,
//       });

//       const newAccess = response.data.access;
//       localStorage.setItem('access', newAccess);
//       return newAccess;
//     } catch (err) {
//       console.error('Failed to refresh token:', err);
//       return null;
//     }
//   };

//   return refresh;
// };

// export default useRefreshToken;