import React, { useEffect } from 'react'
import useAuth from '../Context/useAuth'
import useRefreshToken from './useRefreshToken';
import {axiosPrivate} from '../api/axiosInstance';
function useAxiosPrivate() {
    const {auth, logout } = useAuth();
    const refresh = useRefreshToken();
    useEffect(()=>{
        const reqInterceptor = axiosPrivate.interceptors.request.use(
            (config) => {
                const access = localStorage.getItem("access")
                if(access) config.headers.Authorization=`Bearer ${access}`
                return config;
            },
            (error) => Promise.reject(error)
        );
        const resInterceptor = axiosPrivate.interceptors.response.use(
            (response) =>response,
            async (error) =>{
                const originalRequest = error?.config;
                if(error.response?.status === 401 && !originalRequest._retry){
                    originalRequest._retry = true;

                    const newAccess = await refresh();
                    if(newAccess){
                        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                        return axiosPrivate(originalRequest)
                    }
                    else{
                        logout()
                    }                  
                }
                return Promise.reject(error)
            }
        );
        return () => {
            axiosPrivate.interceptors.request.eject(reqInterceptor);
            axiosPrivate.interceptors.response.eject(resInterceptor);
        };
    },[logout,refresh]);
    return axiosPrivate;
}
export default useAxiosPrivate