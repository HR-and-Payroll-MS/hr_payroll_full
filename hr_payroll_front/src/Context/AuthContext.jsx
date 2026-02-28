import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { setLocalData, getLocalData } from '../Hooks/useLocalStorage';
import useRefreshToken from '../Hooks/useRefreshToken';
import { createAxiosPrivate, axiosPublic } from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthContextProvider({ children }) {
  const [auth, setAuth] = useState({ user: null, accessToken: null });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [searchEmployees, setSearchEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshFn = useRefreshToken();

  const logout = useCallback(() => {
    localStorage.clear();
    setAuth({ user: null, accessToken: null });
    setSearchEmployees([]);
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      const newAccess = await refreshFn();
      if (newAccess) {
        setAuth((prev) => ({ ...prev, accessToken: newAccess }));
        setLocalData('access', newAccess);
        return newAccess;
      }
    } catch (err) {
      console.error('Refresh function failed', err);
    }
    return null;
  }, [refreshFn]);

  const getAccessToken = useCallback(() => {
    return getLocalData('access') || auth.accessToken || null;
  }, [auth.accessToken]);

  // Stable instance with the queueing logic from axiosInstance
  const axiosPrivate = useMemo(() => {
    return createAxiosPrivate({
      getAccessToken,
      onRefresh,
      onLogout: logout,
    });
  }, [getAccessToken, onRefresh, logout]);

  // Sync state with LocalStorage on mount
  useEffect(() => {
    const access = getLocalData('access');
    const userId = getLocalData('id'); // This is username
    const userRole = getLocalData('role');
    const employeeId = getLocalData('user_id');
    const pk = getLocalData('pk'); // User Primary Key

    if (access && userId) {
      setAuth({
        user: {
          id: pk ? parseInt(pk) : null,
          username: userId,
          role: userRole,
          employee_id: employeeId,
        },
        accessToken: access,
      });
    }
    setIsAuthLoading(false);
  }, []);

  // Fetch missing employee_id if logged in but missing from state/local
  useEffect(() => {
    if (auth.accessToken && !auth.user?.employee_id) {
      const fetchMe = async () => {
        try {
          const res = await axiosPublic.get('/users/me/', {
            headers: { Authorization: `Bearer ${auth.accessToken}` },
          });
          const userData = res.data;

          // Also Ensure PK is saved if missing
          if (userData.id && !getLocalData('pk')) {
            setLocalData('pk', userData.id);
            setAuth((prev) => ({
              ...prev,
              user: { ...prev.user, id: userData.id },
            }));
          }

          if (userData.employee_id) {
            console.log(
              'AuthContext: Found employee_id in me:',
              userData.employee_id,
            );
            setLocalData('user_id', userData.employee_id);
            setAuth((prev) => ({
              ...prev,
              user: { ...prev.user, employee_id: userData.employee_id },
            }));
          } else {
            console.warn('AuthContext: No employee_id in userData:', userData);
            try {
              localStorage.removeItem('user_id');
            } catch (e) {
              console.error('AuthContext: Failed to clear user_id', e);
            }
          }
        } catch (err) {
          console.error('AuthContext: Failed to fetch user info:', err);
        }
      };
      fetchMe();
    }
  }, [auth.accessToken, auth.user?.employee_id]);

  // Login Function
  const login = useCallback(async (username, password) => {
    try {
      const res = await axiosPublic.post('/auth/djoser/jwt/create/', {
        username,
        password,
      });
      const { access, refresh } = res.data || {};

      if (!access || !refresh) throw new Error('Invalid auth response');

      setLocalData('access', access);
      setLocalData('refresh', refresh);

      const userRes = await axiosPublic.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` },
      });

      const userData = userRes.data;

      setLocalData('id', userData.username);
      setLocalData('pk', userData.id); // Save PK
      setLocalData('role', userData.groups?.[0] ?? null);
      setLocalData('groups', JSON.stringify(userData.groups || []));
      if (userData.employee_id) {
        setLocalData('user_id', userData.employee_id);
      } else {
        try {
          localStorage.removeItem('user_id');
        } catch (e) {
          console.error('AuthContext: Failed to clear user_id', e);
        }
      }

      setAuth({
        user: {
          id: userData.id,
          username: userData.username,
          role: userData.groups?.[0] ?? null,
          groups: userData.groups || [],
          employee_id: userData.employee_id,
        },
        accessToken: access,
      });

      return userData;
    } catch (error) {
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        isAuthLoading,
        login,
        logout,
        searchEmployees,
        loading,
        axiosPrivate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthContextProvider');
  return ctx;
}

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   useCallback,
//   useMemo,
// } from 'react';
// import { setLocalData, getLocalData } from '../Hooks/useLocalStorage';
// import useRefreshToken from '../Hooks/useRefreshToken';
// import { createAxiosPrivate, axiosPublic } from '../api/axiosInstance';

// const AuthContext = createContext(null);

// export function AuthContextProvider({ children }) {
//   const [auth, setAuth] = useState({ user: null, accessToken: null });
//   const [isAuthLoading, setIsAuthLoading] = useState(true);
//   const [searchEmployees, setSearchEmployees] = useState([]);
//   const [loading, setLoading] = useState(false); // employees loading

//   const refreshFn = useRefreshToken();

//   const logout = useCallback(() => {
//     localStorage.clear();
//     setAuth({ user: null, accessToken: null });
//     setSearchEmployees([]);
//   }, []);

//   const onRefresh = useCallback(async () => {
//     const newAccess = await refreshFn();
//     if (newAccess) {
//       setAuth((prev) => ({ ...prev, accessToken: newAccess }));
//       setLocalData('access', newAccess);
//       return newAccess;
//     }
//     return null;
//   }, [refreshFn]);

//   const getAccessToken = useCallback(() => {
//     return getLocalData('access') || auth.accessToken || null;
//   }, [auth.accessToken]);

//   const axiosPrivate = useMemo(() => {
//     return createAxiosPrivate({
//       getAccessToken,
//       onRefresh,
//       onLogout: logout,
//     });
//   }, [getAccessToken, onRefresh, logout]);

//   useEffect(() => {
//     return () => {
//       if (axiosPrivate && typeof axiosPrivate._ejectInterceptors === 'function') {
//         axiosPrivate._ejectInterceptors();
//       }
//     };
//   }, [axiosPrivate]);

//   useEffect(() => {
//     const access = getLocalData('access');
//     const userId = getLocalData('id');
//     const userRole = getLocalData('role');

//     if (access && userId) {
//       setAuth({
//         user: { username: userId, role: userRole },
//         accessToken: access,
//       });
//     }
//     setIsAuthLoading(false);
//   }, []);

//   useEffect(() => {
//     if (!auth.user || !auth.accessToken) {
//       setSearchEmployees([]);
//       setLoading(false);
//       return;
//     }

//     const fetchEmployees = async () => {
//       setLoading(true);
//       try {
//         const res = await axiosPrivate.get('/employees/');
//         const data = res.data.results.map((e) => ({
//           id: e.id,
//           fullname: e.general?.fullname || '',
//           emailaddress: e.general?.emailaddress || '',
//           photo: e.general?.photo || '/pic/download (48).png',
//           employeeid: e.job?.employeeid || '',
//           department: e.job?.department || '',
//         }));
//         setSearchEmployees(data);
//       } catch (err) {
//         console.error('Failed to fetch employees:', err);
//         if (err?.response?.status === 401) {
//           logout();
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEmployees();
//   }, [auth.user, auth.accessToken, axiosPrivate, logout]);

//   const setUser = useCallback((userData, accessToken) => {
//     if (!userData || !accessToken) return;

//     setLocalData('id', userData.username);
//     setLocalData('role', userData.groups?.[0] ?? null);
//     setLocalData('access', accessToken);

//     setAuth({
//       user: { username: userData.username, role: userData.groups?.[0] ?? null },
//       accessToken,
//     });
//   }, []);

//   const login = useCallback(
//     async (username, password) => {
//       try {
//         const res = await axiosPublic.post('/auth/djoser/jwt/create/', {
//           username,
//           password,
//         });
//         const { access, refresh } = res.data || {};

//         if (!access || !refresh) {
//           throw new Error('Invalid auth response from server');
//         }

//         setLocalData('access', access);
//         setLocalData('refresh', refresh);

//         const userRes = await axiosPublic.get('/users/me/', {
//           headers: {
//             Authorization: `Bearer ${access}`,
//           },
//         });

//         const userData = userRes.data;
//         console.log(userData)
//         console.log(userData, '<-- user data after login');
//         setLocalData('id', userData.username);
//         setLocalData('role', userData.groups?.[0] ?? null);
//         console.log("role",userData.groups?.[0])
//         setLocalData('user_id', userData.employee_id);

//         // Update auth state → triggers employee fetch automatically
//         setAuth({
//           user: { username: userData.username, role: userData.groups?.[0] ?? null },
//           accessToken: access,
//         });

//         return userData;
//       } catch (error) {
//         let msg = 'Something went wrong. Please try again.';

//         if (error?.response?.status === 400 || error?.response?.status === 401) {
//           msg = 'Incorrect username or password.';
//         } else if (error?.response?.status === 403) {
//           msg = "You don't have permission to access this account.";
//         } else if (error?.response?.data?.detail) {
//           msg = error.response.data.detail;
//         } else if (error.message) {
//           msg = error.message;
//         }

//         throw new Error(msg);
//       }
//     },
//     []
//   );

//   return (
//     <AuthContext.Provider
//       value={{
//         auth,
//         setAuth,
//         isAuthLoading,
//         login,
//         logout,
//         setUser,
//         searchEmployees,
//         loading, // employees loading state
//         axiosPrivate,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export default function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) {
//     throw new Error('useAuth must be used inside AuthContextProvider');
//   }
//   return ctx;
// }

// import React, { createContext, useContext, useEffect, useState,useCallback,useMemo } from 'react';
// import {setLocalData , getLocalData} from '../Hooks/useLocalStorage'
// import useRefreshToken  from '../Hooks/useRefreshToken'
// import { createAxiosPrivate, axiosPublic } from '../api/axiosInstance'
// const AuthContext = createContext(null);

// export function AuthContextProvider({ children }){

//   const [auth,setAuth] = useState({user:null, accessToken:null})
//   const [isAuthLoading, setIsAuthLoading] = useState(true);
//   const [searchEmployees, setSearchEmployees] = useState([])
//   const [loading, setLoading] = useState(true);
//   const refreshFn = useRefreshToken();
//   const logout = useCallback(() => {
//     try{
//         localStorage.clear();
//     } catch (e) { console.error('error from the logout .13 :',e)}
//     setAuth({ user:null,accessToken:null });
//   },[])

//   const onRefresh = useCallback(async () => {
//     const newAccess = await refreshFn();
//     if (newAccess) {
//       setAuth(prev => ({...prev, accessToken: newAccess }));
//       setLocalData('access',newAccess)
//       return newAccess;
//     }
//     return null
//   },[refreshFn])

//   const getAccessToken = useCallback(()=>{
//     return getLocalData('access') || auth.accessToken || null;
//   },[auth.accessToken])

//   const axiosPrivate = useMemo(() => {
//     return createAxiosPrivate({
//       getAccessToken,
//       onRefresh,
//       onLogout:logout,
//     });
//   },[getAccessToken, onRefresh, logout])

//   useEffect(()=>{
//     return ()=>{
//       if(axiosPrivate && typeof axiosPrivate._ejectInterceptors === 'function'){
//         axiosPrivate._ejectInterceptors();
//       }
//     };
//   },[axiosPrivate])

//   // useEffect(() => {
//   //   const fetchEmployees = async () => {
//   //     try {
//   //       const res = await axiosPrivate.get("/employees/");
//   //       // pick only necessary fields
//   //       const data = res.data.results.map((e) => ({
//   //         id: e.id,
//   //         fullname: e.general?.fullname || "",
//   //         emailaddress: e.general?.emailaddress || "",
//   //         photo: e.general?.photo || "/pic/download (48).png",
//   //         employeeid: e.job?.employeeid || "",
//   //         department: e.job?.department || "",
//   //       }));

//   //       // console.log(res.data,"<-- res data")
//   //       // console.log(data,"<-- processed data")
//   //       setSearchEmployees(data);
//   //     } catch (err) {
//   //       console.error("Failed to fetch employees:", err);
//   //       // setError(err.message);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };
//   //   fetchEmployees();
//   // }, []);

//   useEffect(() => {
//   // If no authenticated user, don't fetch employees
//   if (!auth.user || !auth.accessToken) {
//     setLoading(false);           // Stop loading indicator
//     setSearchEmployees([]);      // Optional: clear any old data
//     return;
//   }

//   const fetchEmployees = async () => {
//     setLoading(true); // Start loading when we actually fetch
//     try {
//       const res = await axiosPrivate.get("/employees/");
//       const data = res.data.results.map((e) => ({
//         id: e.id,
//         fullname: e.general?.fullname || "",
//         emailaddress: e.general?.emailaddress || "",
//         photo: e.general?.photo || "/pic/download (48).png",
//         employeeid: e.job?.employeeid || "",
//         department: e.job?.department || "",
//       }));

//       setSearchEmployees(data);
//     } catch (err) {
//       console.error("Failed to fetch employees:", err);

//       // Optional: if unauthorized and refresh failed, logout
//       if (err?.response?.status === 401) {
//         logout();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchEmployees();
// }, []); // Empty array → runs only once on mount

//   const setUser = useCallback((userData,accessToken) => {
//     if(!userData || !accessToken) return;
//     setLocalData('id',userData.username);
//     setLocalData('role',userData.groups?.[0]?? null);
//     setLocalData('access',accessToken);
//     setAuth({
//       user: { username: userData.username, role:userData.groups?.[0] ?? null },accessToken
//     })
//   },[])

//   const login = useCallback ( async (username, password) => {
//     try {
//       const res = await axiosPublic.post('/auth/djoser/jwt/create/',{username, password});
//       const { access, refresh } = res.data || {};
//       if ( !access || !refresh ) throw new Error('Invalid auth response from server');

//       setLocalData('access',access);
//       setLocalData('refresh',refresh);

//       console.log(getLocalData('access'),"<--- access \n",getLocalData('refresh'),"<-----refresh")

//       const userRes = await axiosPrivate.get('/users/me/');
//       const userData = userRes.data;
//       console.log(userData,"<-- user data after login")
//       console.log(userData?.id,"<-- user id after login")
//       setLocalData('user_id',userData?.employee_id);

//       setUser(userData, access);
//       return userData;
//     } catch (error) {
//       const status = error?.response?.status
//       if (error.status === 400) throw new Error("Please check your imput fields and try again")
//       // if (error.status === 401) throw new Error("Incorrect email or password. Please try again.")
//       if (error.status === 403) throw new Error("You don't have permission to access this account.")
//       if (error.status === 404) throw new Error("Server not found. Please try again later.")
//       if (error.status === 500) throw new Error("Server error. Please try again later")
//       const msg = error?.response?.data?.detail || error.message || "Something went wrong. Please try again.";
//     throw new Error(msg)

//     }

//   },[axiosPrivate, setUser]);

//   useEffect(() => {
//     const access = getLocalData('access');
//     const userId = getLocalData('id');
//     const userRole = getLocalData('role');
//     if(access && userId) {
//       setAuth({user:{username:userId,role:userRole}, accessToken:access});
//     }
//     setIsAuthLoading(false);
//   },[])

//   return (
//     <AuthContext.Provider value = {{ auth , setAuth , isAuthLoading , login , logout , setUser,searchEmployees , axiosPrivate }} >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export default function useAuth() {
//   const ctx = useContext(AuthContext);
//   if(!ctx) throw new Error('useAuth must be used inside AuthcontextProvider');
//   return ctx;
// }

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { axiosPublic ,axiosPrivate } from '../api/axiosInstance'
// import { setLocalData } from '../Hooks/useLocalStorage';
// const AuthContext = createContext(null);
// const BASE_URL = 'http://localhost:3000/api/v1';

// export function AuthContextProvider({ children }) {
//   const [auth, setAuth] = useState({user: null,accessToken: null,});
//   const [isAuthLoading, setIsAuthLoading] = useState(true);
//   const setUser = (userData, accessToken) => {
//     if (!userData || !accessToken) return;

//     setLocalData('id', userData?.username);
//     setLocalData('role', userData?.groups?.[0]);

//     setAuth({user: { username: userData?.username, role: userData?.groups?.[0] }, accessToken,});};

//   const login = async (username, password) => {
//     try {
//       const response = await axiosPublic.post(`/auth/jwt/create/`,{ username , password} )
//       const { access, refresh } = response.data;
//       localStorage.setItem('access', access);
//       localStorage.setItem('refresh', refresh);

//       const userResponse = await axiosPrivate.get(`/auth/users/me/`);

//       const userData = userResponse.data;
//       console.log(userData)
//       setLocalData('id', userData?.username);
//       setLocalData('role', userData?.groups?.[0]);
//       setAuth({
//         user: { username: userData?.username, role: userData?.groups?.[0] },
//         accessToken: access,
//       });

//       return userData;
//     } catch (error) {
//       if (error.status === 400) throw new Error("Please check your imput fields and try again")
//       else if (error.status === 401) throw new Error("Incorrect email or password. Please try again.")
//       else if (error.status === 403) throw new Error("You don't have permission to access this account.")
//       else if (error.status === 404) throw new Error("Server not found. Please try again later.")
//       else if (error.status === 500) throw new Error("Server error. Please try again later")
//       else throw new Error("Something went wrong. Please try again.")
//     }
//   };

//   useEffect(() => {
//     const accessToken = localStorage.getItem('access');
//     const userId = localStorage.getItem('id');
//     const userRole = localStorage.getItem('role');

//     if (accessToken && userId && userRole) {
//       setAuth({
//         user: { username: userId, role: userRole },
//         accessToken,
//       });
//     }

//     setIsAuthLoading(false);
//   }, []);

//   const logout = () => {
//     localStorage.clear();
//     setAuth({ user: null, accessToken: null });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         auth,
//         setAuth,
//         isAuthLoading,
//         login,
//         logout,
//         setUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export default function useAuth() {
//   return useContext(AuthContext);
// }
