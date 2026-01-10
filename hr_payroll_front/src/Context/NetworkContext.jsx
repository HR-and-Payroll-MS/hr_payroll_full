import React, { createContext, useContext, useEffect, useState } from "react";
import useAuth from "./AuthContext";
import { getLocalData } from "../Hooks/useLocalStorage";

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isLocal, setIsLocal] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);

  const { axiosPrivate, auth } = useAuth();

  useEffect(() => {
    const id = getLocalData("user_id");
    
    // Safety check: Don't call API if user isn't logged in
    if (!id || !auth?.accessToken) {
      setChecking(false);
      return;
    }

    let active = true;

    const safeCheck = async () => {
      try {
        setChecking(true);
        console.log("NetworkProvider: Checking status for user", id);
        
        const res = await axiosPrivate.get(`/company-info/check-network/`);
        console.log("Network status response:", res);
        if (!active) return;
        setIsLocal(res.data.is_local);
        setError(null);
      } catch (err) {
        if (!active) return;
        // Interceptor handles 401, we only handle other network errors
        if (err?.response?.status !== 401) {
          setError(err.message || "Failed to check network status");
        }
        setIsLocal(false);
      } finally {
        if (active) setChecking(false);
      }
    };

    safeCheck();

    return () => {
      active = false;
    };
    // Re-run if axiosPrivate instance changes or if a new token is issued
  }, [axiosPrivate, auth?.accessToken]);

  return (
    <NetworkContext.Provider value={{ isLocal, checking, error }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}




































































// import { createContext, useContext, useEffect, useState, useCallback } from "react";
// import useAuth from "./AuthContext";
// import { getLocalData } from "../Hooks/useLocalStorage";

// const NetworkContext = createContext(null);

// export function NetworkProvider({ children }) {
//   const [isLocal, setIsLocal] = useState(null);//default :null
//   const [checking, setChecking] = useState(true);//default :true
//   const [error, setError] = useState(null);

//   const { axiosPrivate } = useAuth();


//   useEffect(() => {
//     const id = getLocalData("user_id")
//     let active = true;

//   //   // wrap checkLocal so it won't set state after unmount
//     const safeCheck = async () => {
//       try {
        
//       console.log("Checking network status...",id);

//         // const res = await axiosPrivate.get("/attendances/check-network/");
//         const res = await axiosPrivate.get(`/employees/${id}/attendances/network-status/`);
//         console.log(res)
//         if (!active) return;
//         setIsLocal(res.data.is_office_network);
//         console.log("here",res.data.is_office_network)
//         // setIsLocal(res.data?.is_office_network ?? false);
//         setError(null);
//       } catch (err) {
//         if (!active) return;

//         if (err?.response?.status !== 401) {
//           setError(err.message);
//         }
//         setIsLocal(false);
//       } finally {
//         if (active) setChecking(false);
//       }
//     };


//     id?safeCheck():[];
//     return () => {
//       active = false;

//     };
//   }, [axiosPrivate]);

//   // safe for re-renders
//   // const refresh = useCallback(() => {
//   //   checkLocal();
//   // }, [checkLocal]);

//   return (
//     <NetworkContext.Provider value={{ 
//       isLocal,
//        checking,
//         error,
//         //  refresh 
//          }}>
//       {children}
//     </NetworkContext.Provider>
//   );
// }

// export function useNetwork() {
//   return useContext(NetworkContext);
// }
