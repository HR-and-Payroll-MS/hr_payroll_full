import { useCallback } from "react";
import { axiosPublic } from "../api/axiosInstance";
import { getLocalData, setLocalData } from "./useLocalStorage";

export default function useRefreshToken(){
  const refresh = useCallback(async () => {
    const runRefreshLogic = async () => {
      try {
        const refreshToken = getLocalData('refresh');
        if (!refreshToken) return null;
        const lastRefreshStr = getLocalData('last_refresh_time');
        if (lastRefreshStr) {
          const lastRefresh = parseInt(lastRefreshStr, 10);
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
        return null; 
      } catch (error) {
        console.error('useRefreshToken: refresh failed', error);
        throw error;
      }
    };
    if (navigator.locks) {
      return navigator.locks.request('auth_refresh_mutex', runRefreshLogic);
    } else {
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