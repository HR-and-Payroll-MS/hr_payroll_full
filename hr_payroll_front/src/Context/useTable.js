import { useEffect, useRef } from 'react';
import { useTableContext } from './TableContext';
import { TABLE_ENDPOINTS } from '../config/tableConfig';

// Keep the cache fresh so newly created records (like employees) show up as soon as you revisit a table.
const STALE_AFTER_MS = 60 * 1000; // Revalidate after 1 minute

export const useTable = (tableName, extraPath = '') => {
  const { tableCache, loadingStates, getTableData, refreshTableSilently } =
    useTableContext();
  const baseUrl = TABLE_ENDPOINTS[tableName];
  const fetchUrl = extraPath ? `${baseUrl}${extraPath}/` : baseUrl;
  console.log('Final URL being requested:', fetchUrl);
  const cacheKey = extraPath ? `${tableName}_${extraPath}` : tableName;
  const hasRevalidated = useRef(false);

  // Reset the one-time revalidation flag when the cache key changes.
  useEffect(() => {
    hasRevalidated.current = false;
  }, [cacheKey]);

  useEffect(() => {
    if (!fetchUrl) return;

    const cachedEntry = tableCache[cacheKey];
    const isStale =
      !cachedEntry || Date.now() - cachedEntry.lastUpdated > STALE_AFTER_MS;

    if (!cachedEntry || isStale) {
      // No cache or stale cache: force a fresh fetch.
      getTableData(cacheKey, fetchUrl, !!cachedEntry);
      return;
    }

    if (!hasRevalidated.current) {
      // Cached but potentially out-of-date: revalidate once in the background.
      hasRevalidated.current = true;
      refreshTableSilently(cacheKey, fetchUrl);
    }
  }, [cacheKey, fetchUrl, getTableData, refreshTableSilently, tableCache]);

  return {
    data: tableCache[cacheKey]?.data || [],
    isLoading: loadingStates[cacheKey] || false,
    refresh: () => refreshTableSilently(cacheKey, fetchUrl),
  };
};

// import { useEffect, useRef } from 'react';
// import { useTableContext } from './TableContext';
// import { TABLE_ENDPOINTS } from '../config/tableConfig';

// export const useTable = (tableName,data) => {
//   const { tableCache, loadingStates, getTableData, refreshTableSilently } = useTableContext();
//   // const fetchUrl = TABLE_ENDPOINTS[tableName]+data??""
//   console.log(data)
//   if(data) tableName=`${tableName+data}`
//   const fetchUrl = TABLE_ENDPOINTS[tableName]
//   console.log(fetchUrl,"this is fetch url")

//   // Use a ref to prevent re-fetching if tableName hasn't changed
//   const hasFetched = useRef(false);

//   useEffect(() => {
//     if (fetchUrl && !tableCache[tableName] && !hasFetched.current) {
//       getTableData(tableName, fetchUrl);
//       hasFetched.current = true;
//     }
//   }, [tableName, fetchUrl, getTableData, tableCache]);

//   return {
//     data: tableCache[tableName]?.data || [],
//     isLoading: loadingStates[tableName] || false,
//     // Calling this will update the table without a full-page reload feel
//     refresh: () => refreshTableSilently(tableName),
//   };
// };
