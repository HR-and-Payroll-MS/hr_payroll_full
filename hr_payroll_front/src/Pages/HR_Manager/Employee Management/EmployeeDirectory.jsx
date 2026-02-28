import React, { useCallback, useState, useMemo, useEffect } from 'react';
import Table from '../../../Components/Table';
import Header from '../../../Components/Header';
import { SearchStatus } from '../../../Components/Level2Hearder';
import { useNavigate } from 'react-router-dom';
import ExportTable from '../../../Components/ExportTable';
import { useTable } from '../../../Context/useTable';
import Icon from '../../../Components/Icon';
import { useProfile } from '../../../Context/ProfileContext';
import EmployeeDirectorySkeleton from '../../../animations/Skeleton/EmployeeDirectorySkeleton';
import { DirectoryList } from '../Employee/Employee_Sub/DirectoryList';

function EmployeeDirectory() {
  const [isRotating, setIsRotating] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('employeeDirectoryView') || 'table';
    } catch (e) {
      return 'table';
    }
  });

  const handleViewChange = (v) => {
    setViewMode(v);
    try {
      localStorage.setItem('employeeDirectoryView', v);
    } catch (e) {
      // ignore
    }
  };

  const { refreshProfile } = useProfile();

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);
    refreshProfile();
  };
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('employeeDirectoryFilters')) || {};
    } catch (e) {
      return {};
    }
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return localStorage.getItem('employeeDirectorySearch') || '';
    } catch (e) {
      return '';
    }
  });
  const [ExportData, setExportData] = useState(null);
  const [sortOption, setSortOption] = useState(() => {
    try {
      return localStorage.getItem('employeeDirectorySort') || 'name-asc';
    } catch (e) {
      return 'name-asc';
    }
  });

  const { data, isLoading, refresh } = useTable('users');

  const onRowClick = (id) => navigate(`/hr_dashboard/users/${id}`);
  const handleSearchClick = (e) => navigate(`/hr_dashboard/users/${e}`);
  const setFilter = (e) => {
    setSearchTerm(e);
    try {
      localStorage.setItem('employeeDirectorySearch', e || '');
    } catch (err) {}
  };
  const updateFilter = (obj) => {
    const key = Object.keys(obj)[0];
    const value = obj[key];
    setFilters((prev) => {
      if (value == null || value === '') {
        const { [key]: removed, ...rest } = prev;
        try {
          localStorage.setItem(
            'employeeDirectoryFilters',
            JSON.stringify(rest),
          );
        } catch (err) {}
        return rest;
      }
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(
          'employeeDirectoryFilters',
          JSON.stringify(updated),
        );
      } catch (err) {}
      return updated;
    });
  };

  useEffect(() => {
    try {
      localStorage.setItem('employeeDirectorySort', sortOption);
    } catch (err) {}
  }, [sortOption]);

  const handleExportData = useCallback((newData) => {
    setExportData(newData);
  }, []);

  const filteredData = useMemo(() => {
    const sourceData = data?.results || data || [];
    const filtered = sourceData.filter((item) => {
      const matchesSearch = item?.general?.fullname
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        // Handle Status filter mapping
        if (key === 'is_active') {
          // value is 'Active' or 'InActive' from Dropdown
          // item.payroll?.employeestatus is typically 'Active', 'Terminated', 'Resigned', etc.
          const status = item.payroll?.employeestatus || '';
          if (value === 'Active') return status === 'Active';
          if (value === 'InActive') return status !== 'Active';
          return true;
        }

        return (
          item.general?.[key] === value ||
          item.payroll?.[key] === value ||
          item.job?.[key] === value
        );
      });

      return matchesSearch && matchesFilters;
    });

    const sorted = [...filtered];
    const getName = (item) => (item?.general?.fullname || '').toLowerCase();
    const getDate = (item) =>
      new Date(item?.job?.joindate || item?.job?.join_date || 0).getTime();

    switch (sortOption) {
      case 'name-desc':
        sorted.sort((a, b) => getName(b).localeCompare(getName(a)));
        break;
      case 'date-desc':
        sorted.sort((a, b) => getDate(b) - getDate(a));
        break;
      case 'date-asc':
        sorted.sort((a, b) => getDate(a) - getDate(b));
        break;
      case 'name-asc':
      default:
        sorted.sort((a, b) => getName(a).localeCompare(getName(b)));
        break;
    }

    return sorted;
    // If filters or search are active but produced zero results while
    // the backend returned items, fall back to showing all items so
    // the directory doesn't appear empty due to stale localStorage.
    const final =
      sorted.length === 0 &&
      sourceData.length > 0 &&
      (searchTerm || Object.keys(filters).length > 0)
        ? sourceData
        : sorted;

    return final;
  }, [data, filters, searchTerm, sortOption]);
  const structure = [3, 1, 1, 1, 1, 1];
  const title = [
    'USER',
    'PHONE',
    'JOIN DATE',
    'GENDER',
    'STATUS',
    'MARITAL STATUS',
  ];
  const ke2 = [
    ['general_photo', 'general_fullname', 'general_emailaddress'],
    ['general_phonenumber'],
    ['job_joindate'],
    ['general_gender'],
    ['payroll_employeestatus'],
    ['general_maritalstatus'],
  ];

  if (isLoading && (!data || data.length === 0))
    return <EmployeeDirectorySkeleton />;

  return (
    <div className="p-4 flex flex-col h-full">
      <Header
        Title="Employee Directory"
        subTitle="View all employees and click to view detail"
      >
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-4 py-2 text-blue-600 rounded-lg transition-colors"
          >
            <Icon
              name="RotateCw"
              onClick={handleRotate}
              className={`w-4 h-4 transition-transform duration-500 cursor-pointer ${
                isRotating ? 'rotate-[360deg]' : 'rotate-0'
              }`}
            />
          </button>
        </div>

        {ExportData && (
          <ExportTable
            data={filteredData}
            title={title}
            bodyStructure={structure}
            keys={ke2}
          />
        )}
      </Header>

      <SearchStatus
        employeeClicked={setSearchTerm}
        onFiltersChange={updateFilter}
        setFilter={setFilter}
        showSort
        onSortChange={setSortOption}
        onViewChange={handleViewChange}
      />
      {console.log(filteredData)}
      <div className="flex-1 mt-4 h-full max-h-9/12">
        {viewMode === 'grid' ? (
          <DirectoryList data={filteredData} onItemClick={onRowClick} />
        ) : (
          <Table
            pages={9}
            Data={filteredData}
            setExportData={handleExportData}
            title={title}
            Structure={structure}
            ke={ke2}
            onRowClick={onRowClick}
          />
        )}
      </div>
    </div>
  );
}

export default EmployeeDirectory;

// import React, { useCallback, useState } from 'react';
// import Table from '../../../Components/Table';
// import Header from '../../../Components/Header';
// import { SearchStatus } from '../../../Components/Level2Hearder';
// import { useNavigate } from "react-router-dom";
// import ExportTable from '../../../Components/ExportTable';

// function EmployeeDirectory() {
//   const navigate = useNavigate();
//   const handleSearchClick=(e)=>navigate(`/hr_dashboard/users/${e}`);
//   const onRowClick = (id) => navigate(`/hr_dashboard/users/${id}`);
//   const [filters, setFilters] = useState({});
//   const [ExportData,setExportData]= useState(null)
//   function updateFilter(obj){
//       const key = Object.keys(obj)[0];
//       const value = obj[key]
//       setFilters(prev =>{
//           if(value == null || value === "" ){
//               const {[key]:removed, ...rest}=prev;
//               return rest;
//           }
//           return {...prev,[key]:value};
//       });
//   }
//   const handleExportData = useCallback((newData) => {
//   setExportData(newData);
//   }, []);
//   const queryString = new URLSearchParams(
//     Object.entries(filters).filter(([k,v]) => v && v !== "")
//   ).toString();
//   const dynamicURL = queryString ? `/employees/?${queryString}` : "/employees/";
//   console.log("Dynamic URL:", dynamicURL);
//   const structure = [3,1,1,1,1,1];
//   const ke2 = [
//     ["general_photo", "general_fullname", "general_emailaddress"],
//     ["general_phonenumber"],
//     ["job_joindate"],
//     ["general_gender"],
//     ["payroll_employeestatus"],
//     ["general_maritalstatus"],
//   ];
//   const title = ['USER','PHONE','JOIN DATE','GENDER','STATUS','MARITAL STATUS'];
//   return (
//     <div className='p-4 flex flex-col h-full'>
//       <Header Title="Employee Directory" subTitle="view all employees and click to view detail">
//         {ExportData&&<ExportTable data={ExportData} title={title} bodyStructure={structure} keys={ke2}/>}
//       </Header>
//       <SearchStatus employeeClicked={handleSearchClick} onFiltersChange={updateFilter} />
//         {console.log(dynamicURL)}
//       <Table Data={[]} setExportData={handleExportData} URL={dynamicURL} title={title} Structure={structure} ke={ke2} onRowClick={onRowClick} />
//     </div>
//   );
// }

// export default EmployeeDirectory;

// // EmployeeDirectory.jsx
// import React, { useCallback, useMemo, useState } from 'react';
// import Table from '../../../Components/Table';
// import Header from '../../../Components/Header';
// import { SearchStatus } from '../../../Components/Level2Hearder';
// import { useNavigate } from "react-router-dom";
// import ExportTable from '../../../Components/ExportTable';

// function EmployeeDirectory() {
//   const navigate = useNavigate();

//   const onRowClick = useCallback((id) => {
//     navigate(`/hr_dashboard/users/${id}`);
//   }, [navigate]);

//   const [filters, setFilters] = useState({});
//   const [ExportData, setExportData] = useState(null);

//   const updateFilter = useCallback((obj) => {
//     const key = Object.keys(obj)[0];
//     const value = obj[key];

//     setFilters(prev => {
//       if (value == null || value === "") {
//         const { [key]: removed, ...rest } = prev;
//         return rest;
//       }
//       return { ...prev, [key]: value };
//     });
//   }, []);

//   // Memoize query string and dynamic URL to prevent unnecessary re-creation
//   const queryString = useMemo(() => {
//     const params = new URLSearchParams(
//       Object.entries(filters).filter(([k, v]) => v && v !== "")
//     );
//     return params.toString();
//   }, [filters]);

//   const dynamicURL = useMemo(() => {
//     return queryString ? `/employees/?${queryString}` : "/employees/";
//   }, [queryString]);

//   // Memoize static configuration to prevent new references on every render
//   const title = useMemo(() => [
//     'USER', 'PHONE', 'JOIN DATE', 'GENDER', 'STATUS', 'MARITAL STATUS'
//   ], []);

//   const structure = useMemo(() => [3, 1, 1, 1, 1, 1], []);

//   const ke2 = useMemo(() => [
//     ["general_photo", "general_fullname", "general_emailaddress"],
//     ["general_phonenumber"],
//     ["job_joindate"],
//     ["general_gender"],
//     ["payroll_employeestatus"],
//     ["general_maritalstatus"],
//   ], []);

//   // Stable callback for exporting data
//   const handleExportData = useCallback((newData) => {
//     setExportData(newData);
//   }, []);

//   return (
//     <div className='p-4 flex flex-col h-full'>
//       <Header
//         Title="Employee Directory"
//         subTitle="view all employees and click to view detail"
//       >
//         {ExportData && ExportData.length > 0 && (
//           <ExportTable
//             data={ExportData}
//             title={title}
//             bodyStructure={structure}
//             keys={ke2}
//             fileName="Employee Directory"
//           />
//         )}
//       </Header>

//       <SearchStatus onFiltersChange={updateFilter} />

//       <Table
//         Data={[]}
//         setExportData={handleExportData}
//         URL={dynamicURL}
//         title={title}
//         Structure={structure}
//         ke={ke2}
//         onRowClick={onRowClick}
//       />
//     </div>
//   );
// }

// export default EmployeeDirectory;
