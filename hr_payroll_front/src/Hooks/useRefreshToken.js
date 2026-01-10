import { useCallback } from "react";
import { axiosPublic } from "../api/axiosInstance";
import { getLocalData, setLocalData } from "./useLocalStorage";

export default function useRefreshToken(){
  const refresh = useCallback(async () => {
    try{
      const refreshToken = getLocalData('refresh');
      if (!refreshToken) return null;
      console.log(refreshToken)
      const res = await axiosPublic.post('/auth/djoser/jwt/refresh/',{refresh: refreshToken ,})
      const newAccess = res?.data?.access;
      const newrefresh = res?.data?.refresh;
      if(newAccess){
        console.log("useRefreshToken: token refreshed successfully   useRefreshToken.js .18 :  ", res?.data);
        setLocalData('refresh',newrefresh);
        setLocalData('access',newAccess);
        return newAccess;
      }
      return null;
    }
    catch( error ){
      console.log(getLocalData('refresh'))
      console.error('useRefreshToken: refresh failed """ useRefreshToken.js .18', error);
      return null;
    }
  },[])

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