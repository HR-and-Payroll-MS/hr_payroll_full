import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import useAuth from './AuthContext';
import { TABLE_ENDPOINTS } from '../config/tableConfig';

const TableContext = createContext();
const CACHE_TIME_MS = 5 * 60 * 1000; 

export const TableProvider = ({ children }) => {
  const [tableCache, setTableCache] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const { axiosPrivate } = useAuth();

  // Core fetcher
  const getTableData = useCallback(async (tableName, url, forceRefresh = false) => {
    const now = Date.now();
    const cachedEntry = tableCache[tableName];
    
    if (cachedEntry && (now - cachedEntry.lastUpdated < CACHE_TIME_MS) && !forceRefresh) {
      return cachedEntry.data;
    }

    setLoadingStates(prev => ({ ...prev, [tableName]: true }));
    try {
      let allResults = [];
      let currentUrl = url;
      
      while (currentUrl) {
        console.log(`Fetching: ${currentUrl}`);
        const response = await axiosPrivate.get(currentUrl);
        const data = response.data.results || response.data;
        allResults = [...allResults, ...(Array.isArray(data) ? data : [])];
        
        // Handle pagination
        if (response.data.next) {
          // Extract the path from the absolute URL returned by DRF
          // e.g. "http://localhost:8001/api/v1/employees/?page=2" -> "/employees/?page=2"
          currentUrl = response.data.next.split('/v1')[1];
        } else {
          currentUrl = null;
        }
      }

      setTableCache(prev => ({
        ...prev,
        [tableName]: { data: allResults, lastUpdated: now }
      }));
    } catch (error) {
      console.error(`Fetch error for ${tableName}:`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [tableName]: false }));
    }
  }, [axiosPrivate, tableCache]);

  // SILENT REFRESH: Updates cache without global loading triggers
  const refreshTableSilently = useCallback(async (tableName, initialUrl) => {
    // Note: if initialUrl is not provided, we fall back to TABLE_ENDPOINTS
    const baseUrl = initialUrl || TABLE_ENDPOINTS[tableName];
    if (!baseUrl) return;
    
    try {
      let allResults = [];
      let currentUrl = baseUrl;
      
      while (currentUrl) {
        const response = await axiosPrivate.get(currentUrl);
        const data = response.data.results || response.data;
        allResults = [...allResults, ...(Array.isArray(data) ? data : [])];
        
        if (response.data.next) {
          currentUrl = response.data.next.split('/v1')[1];
        } else {
          currentUrl = null;
        }
      }

      setTableCache(prev => ({
        ...prev,
        [tableName]: { data: allResults, lastUpdated: Date.now() }
      }));
    } catch (err) {
      console.error("Silent refresh failed", err);
    }
  }, [axiosPrivate]);

  const value = useMemo(() => ({
    tableCache,
    loadingStates,
    getTableData,
    refreshTableSilently
  }), [tableCache, loadingStates, getTableData, refreshTableSilently]);

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
};

export const useTableContext = () => useContext(TableContext);