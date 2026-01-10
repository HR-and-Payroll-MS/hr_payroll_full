import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import useAuth from './AuthContext';
import { getLocalData } from '../Hooks/useLocalStorage';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { axiosPrivate, auth } = useAuth();
  const employeeId = auth?.user?.employee_id || getLocalData('user_id');
  
  const getProfile = useCallback(async (forceRefresh = false) => {
    console.log("ProfileContext: getProfile called. employeeId:", employeeId);
    if (!employeeId) {
        console.warn("ProfileContext: No employeeId available, skipping fetch.");
        return null;
    }
    
    if (profile && !forceRefresh) {
      console.log("ProfileContext: Returning cached profile");
      return profile;
    }

    setLoading(true);
    try {
      console.log(`ProfileContext: Fetching /employees/${employeeId}/`);
      const response = await axiosPrivate.get(`/employees/${employeeId}/`);
      console.log("ProfileContext: Fetch success:", response.data);
      const data = response.data;
      setProfile(data);
      return data;
    } catch (error) {
      console.error("ProfileContext: Profile fetch failed:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, profile, employeeId]);
  const refreshProfile = useCallback(async () => {
    if (!employeeId) return;
    try {
      const response = await axiosPrivate.get(`/employees/${employeeId}/`);
      const data = response.data;
      setProfile(data);
    } catch (error) {
      console.error("Silent profile refresh failed:", error);
    }
  }, [axiosPrivate, employeeId]);
  const clearProfile = useCallback(() => setProfile(null), []);
  const value = useMemo(() => ({
    profile,
    loading,
    getProfile,
    refreshProfile,
    clearProfile
  }), [profile, loading, getProfile, refreshProfile, clearProfile]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }
  return context;
};
