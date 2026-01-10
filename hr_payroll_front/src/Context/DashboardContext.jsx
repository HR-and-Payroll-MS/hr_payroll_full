import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useAuth from './AuthContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { axiosPrivate, auth } = useAuth();
  
  const fetchDashboardStats = useCallback(async () => {
    if (!auth?.accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await axiosPrivate.get('/company-info/dashboard-stats/');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, auth?.accessToken]);
  
  // Fetch dashboard data on mount and when auth changes
  useEffect(() => {
    if (auth?.accessToken) {
      fetchDashboardStats();
    }
  }, [auth?.accessToken, fetchDashboardStats]);
  
  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);
  
  return (
    <DashboardContext.Provider value={{ 
      dashboardData, 
      loading, 
      error, 
      refresh,
      summaryCards: dashboardData?.summary_cards || [],
      recentActivities: dashboardData?.recent_activities || [],
      chartData: dashboardData?.chart_data || {},
      quickAccess: dashboardData?.quick_access || []
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default useDashboard;
