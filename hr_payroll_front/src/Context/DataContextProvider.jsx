import React, { createContext, useContext, useMemo } from "react";
import useAuth from "./AuthContext";
import useCachedResource from "../Hooks/useCachedResource";

const DataContext = createContext(null);

export function DataContextProvider({ children }) {
  const { axiosPrivate } = useAuth();

  const employees = useCachedResource({
    fetcher: async () => {
      let allResults = [];
      let url = "/employees/";
      while (url) {
        const res = await axiosPrivate.get(url);
        const data = res.data.results || res.data;
        allResults = [...allResults, ...(Array.isArray(data) ? data : [])];
        url = res.data.next ? res.data.next.split('/v1')[1] : null;
      }
      return { data: allResults };
    },
    transform: (response) =>
      response.data.map((e) => ({
        id: e.id,
        fullname: e.general?.fullname || "",
        emailaddress: e.general?.emailaddress || "",
        photo: e.general?.photo || "",
        employeeid: e.job?.employeeid || "",
        department: e.job?.department || "",
        jobtitle: e.job?.jobtitle || "",
        ...e 
      })),
    cacheTime: 10 * 60 * 1000,
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });

  const departments = useCachedResource({
    fetcher: async () => {
      let allResults = [];
      let url = "/departments/";
      while (url) {
        const res = await axiosPrivate.get(url);
        const data = res.data.results || res.data;
        allResults = [...allResults, ...(Array.isArray(data) ? data : [])];
        url = res.data.next ? res.data.next.split('/v1')[1] : null;
      }
      return { data: allResults };
    },
    transform: (res) => res.data,
    cacheTime: 10 * 60 * 1000,
    autoRefresh: true,
    refreshInterval: 10 * 60 * 1000,
  });

 const value = useMemo(
  () => ({
    employees: {
      ...employees,
      getById: (id) => employees.data?.find((e) => e.id == id),
    },
    departments: {
      ...departments,
      getById: (id) => departments.data?.find((d) => d.id == id),
    },
  }),
  [employees, departments]
);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export default function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataContextProvider");
  }
  return context;
}
















































// import React, { createContext, useContext, useState, useCallback, useMemo, } from "react";
// import useAuth from "./AuthContext";
// const DataContext = createContext(null);

// export function DataContextProvider({ children }) {
//   const { axiosPrivate } = useAuth();

//   const [employeesState, setEmployeesState] = useState({
//     data: null,
//     loading: false,
//     error: null,
//     timestamp: null,
//   });

//   const CACHE_TIME = 30 * 60 * 1000; // 5 minutes

//   const fetchEmployees = useCallback(
//     async (forceRefresh = false) => {
//       const now = Date.now();
//       if (
//         !forceRefresh &&
//         employeesState.data &&
//         employeesState.timestamp &&
//         now - employeesState.timestamp < CACHE_TIME
//       ) {
//         return employeesState.data;
//       }
//       if (employeesState.loading) {
//         return employeesState.data;
//       }

//       setEmployeesState((prev) => ({
//         ...prev,
//         loading: true,
//         error: null,
//       }));

//       try {
//         const response = await axiosPrivate.get("/employees/");
//         console.log("Fetched Employees:", response.data.results[0]);
//         const transformed = response.data.results.map((e) => ({
//           id: e.id,
//           fullname: e.general?.fullname || "",
//           emailaddress: e.general?.emailaddress || "",
//           photo: e.general?.photo || "/pic/download (48).png",
//           employeeid: e.job?.employeeid || "",
//           department: e.job?.department || "",
//         }));

//         setEmployeesState({
//           data: transformed,
//           loading: false,
//           error: null,
//           timestamp: now,
//         });

//         return transformed;
//       } catch (err) {
//         setEmployeesState((prev) => ({
//           ...prev,
//           loading: false,
//           error: err.message || "Failed to load employees",
//         }));
//         return null;
//       }
//     },
//     [axiosPrivate, employeesState]
//   );

//   const value = useMemo(
//     () => ({
//       employees: {
//         data: employeesState.data,
//         loading: employeesState.loading,
//         error: employeesState.error,
//         get: () => fetchEmployees(false),
//         refresh: () => fetchEmployees(true),
//         getById: (id) =>
//           employeesState.data?.find((e) => e.id === id),
//       },
//     }),
//     [employeesState, fetchEmployees]
//   );

//   return (
//     <DataContext.Provider value={value}>
//       {children}
//     </DataContext.Provider>
//   );
// }

// export default function useData() {
//   const context = useContext(DataContext);
//   if (!context) {
//     throw new Error("useData must be used within DataContextProvider");
//   }
//   return context;
// }
