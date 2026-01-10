import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeDirectorySkeleton from '../../animations/Skeleton/EmployeeDirectorySkeleton';
import Header from '../../Components/Header';
import Icon from '../../Components/Icon';
import ExportTable from '../../Components/ExportTable';
import { SearchStatus } from '../../Components/Level2Hearder';
import Table from '../../Components/Table';
import { useProfile } from '../../Context/ProfileContext';
import { useTable } from '../../Context/useTable';

function EmployeeEfficiency() {
  const [isRotating, setIsRotating] = useState(false);

  const { refreshProfile } = useProfile();

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 500);
    refreshProfile();
  };
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [ExportData, setExportData] = useState(null);

  const { data, isLoading, refresh } = useTable('users');

  const onRowClick = (id) => navigate(`/department_manager/efficiency_fill_form/${id}`);
//   const onRowClick = (id) => console.log(id);
  //    const handleSearchClick = (e) => navigate(`/hr_dashboard/users/${e}`);
  const setFilter = (e) => {
    setSearchTerm(e);
  };

  const handleExportData = useCallback((newData) => {
    setExportData(newData);
  }, []);

  const filteredData = useMemo(() => {
    const sourceData = data?.results || data || [];

    return sourceData.filter((item) => {
      const matchesSearch = item?.general?.fullname
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return (
          item.general?.[key] === value ||
          item.payroll?.[key] === value ||
          item.job?.[key] === value
        );
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, filters, searchTerm]);

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
        onFiltersChange={setSearchTerm}
        setFilter={setFilter}
      />
      {console.log(filteredData)}
      <div className="flex-1 mt-4 h-full max-h-9/12">
        <Table
          pages={9}
          Data={filteredData}
          setExportData={handleExportData}
          title={title}
          Structure={structure}
          ke={ke2}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
}

export default EmployeeEfficiency;
