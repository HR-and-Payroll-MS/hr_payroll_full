import InputField from './InputField';
import Dropdown from './Dropdown';
import SearchDate from './SearchDate';
import Button from './Button';
import { useState } from 'react';
import ConfirmPopup from './ConfirmPopup';

export function SearchStatus({
  onFiltersChange,
  setFilter,
  employeeClicked,
  showSort = false,
  onSortChange,
}) {
  const handleFilter = (item, key) => {
    if (!item) return;
    // console.log("Dropdown selected:", item, "key:", key);
    if (
      item === 'Job Type' ||
      item === 'Department' ||
      item === 'Gender' ||
      item === 'Status'
    )
      onFiltersChange({ [key]: '' });
    else onFiltersChange({ [key]: item.content || item });
  };

  const handleEmployeeSelect = (employee) => {
    // console.log(employee)
    if (employeeClicked) employeeClicked(employee?.id);
    // onFiltersChange({ employee: employee.name });
  };

  // const viewOptions = [
  //   { content: 'Card View', svg: 'Grip' },
  //   { content: 'Tabular View', svg: 'Grid3x3' },
  // ];
  // const depOptions = [
  //   { content: 'Department', svg: null, placeholder: true },
  //   { content: 'Human Resource', svg: null },
  //   { content: 'Finance', svg: null },
  //   { content: 'IT', svg: null },
  // ];
  const genderOptions = [
    { content: 'Gender', svg: null, placeholder: true },
    { content: 'Female', svg: null },
    { content: 'Male', svg: null },
    { content: 'What else ?', svg: null },
  ];
  // const jobOptions = [
  //   { content: 'Job Type', svg: null, placeholder: true },
  //   { content: 'fullTime', svg: null },
  //   { content: 'PartTime', svg: null },
  // ];
  const statOptions = [
    { content: 'Status', svg: null, placeholder: true },
    { content: 'Active', svg: null },
    { content: 'InActive', svg: null },
  ];

  const handleSortChange = (val) => {
    if (!onSortChange) return;
    // Normalize to internal keys
    switch (val) {
      case 'Name (A → Z)':
        onSortChange('name-asc');
        break;
      case 'Name (Z → A)':
        onSortChange('name-desc');
        break;
      case 'Join Date (Newest)':
        onSortChange('date-desc');
        break;
      case 'Join Date (Oldest)':
        onSortChange('date-asc');
        break;
      default:
        onSortChange('name-asc');
    }
  };

  const sortOptions = [
    { content: 'Sort By', placeholder: true },
    { content: 'Name (A → Z)' },
    { content: 'Name (Z → A)' },
    { content: 'Join Date (Newest)' },
    { content: 'Join Date (Oldest)' },
  ];

  return (
    <div
      id="left"
      className="flex py-2 justify-start gap-4 items-center flex-wrap"
    >
      <InputField
        searchMode="input"
        placeholder={'Search Employee'}
        apiEndpoint="/api/employees/search"
        displayKey="name"
        onSelect={(e) => employeeClicked(e)}
      />

      <div className="flex gap-4 dark:text-slate-300  dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i, 'gender')}
          options={genderOptions}
          text="text-xs font-semibold"
          placeholder="Gender"
          border="border gap-1 border-gray-100"
        />
        <Dropdown
          onChange={(i) => handleFilter(i, 'is_active')}
          options={statOptions}
          text="text-xs font-semibold"
          placeholder="All Status"
          border="border gap-1 border-gray-100"
        />
        {showSort && (
          <Dropdown
            onChange={handleSortChange}
            options={sortOptions}
            text="text-xs font-semibold"
            placeholder="Sort By"
            border="border gap-1 border-gray-100"
          />
        )}
      </div>

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        {/* <SearchDate/> */}
      </div>
    </div>
  );
}

export function DateStatus() {
  const left = (
    <div
      id="left"
      className="flex py-2.5 gap-3  justify-between items-center  "
    >
      <div
        className={`flex  dark:text-slate-300 dark:border-slate-700 flex-1  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <p className="text-xs font-semibold">01 Jan 2023 - 10 Mar 2023</p>
        <img className="h-4" src="\svg\date-2-svgrepo-com.svg" alt="" />
      </div>
      <div
        className={`flex  dark:text-slate-300 dark:border-slate-700  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <p className="text-xs font-semibold">All Record</p>
        <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
      </div>
      <div
        className={`flex  dark:text-slate-300 dark:border-slate-700  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <p className="text-xs font-semibold">All Location</p>
        <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
      </div>
      <div
        className={`flex dark:text-slate-300 dark:border-slate-700  text-gray-700 border border-gray-100 items-center  justify-between gap-1.5 px-5 py-2.5 rounded-md`}
      >
        <div
          onClick={() => setOpen((set) => !set)}
          className="text-xs cursor-pointer  font-semibold"
        >
          All Status
        </div>
        <img className="h-4" src="\svg\down-arrow-5-svgrepo-com.svg" alt="" />
      </div>
    </div>
  );
  return <>{left}</>;
}
export function AttendanceFilterBar({ filters, setFilters }) {
  const months = [
    { content: 'All' },
    { content: 'January' },
    { content: 'February' },
    { content: 'March' },
    { content: 'April' },
    { content: 'May' },
    { content: 'June' },
    { content: 'July' },
    { content: 'August' },
    { content: 'September' },
    { content: 'October' },
    { content: 'November' },
    { content: 'December' },
  ];
  const currentYear = new Date().getFullYear();
  const years = [
    { content: 'All' },
    ...Array.from({ length: 5 }, (_, i) => ({ content: currentYear - i })),
  ];
  const statuses = [
    { content: 'All' },
    { content: 'Present' },
    { content: 'Absent' },
    { content: 'Late' },
    { content: 'Leave' },
  ];

  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
  };

  return (
    <div className="flex gap-3 max-w-full items-center bg-white dark:bg-slate-800 border dark:border-slate-700 rounded p-3 shadow-sm">
      <div className="flex gap-3">
        <Dropdown
          placeholder="Month"
          options={months}
          value={
            localFilters.month === 'All' || localFilters.month === 0
              ? 'All'
              : months[localFilters.month]?.content
          }
          onChange={(e) => {
            const mIndex = months.findIndex((m) => m.content === e);
            setLocalFilters((f) => ({
              ...f,
              month: mIndex === 0 ? 'All' : mIndex,
            }));
          }}
        />
        <Dropdown
          placeholder="Year"
          options={years}
          value={localFilters.year}
          onChange={(e) => setLocalFilters((f) => ({ ...f, year: e }))}
        />
        <Dropdown
          placeholder="Status"
          options={statuses}
          value={localFilters.status}
          onChange={(e) => setLocalFilters((f) => ({ ...f, status: e }))}
        />
      </div>
      <button
        onClick={handleApply}
        className="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-sm transition-all active:scale-95 shadow-sm"
      >
        Apply
      </button>
    </div>
  );
}

export function ApproveReject({ FiltersChange }) {
  const handleFilter = (employee) => {
    console.log('search', employee); // prints status like all, pending,approval,denied
    FiltersChange((prev) => ({ ...prev, status: employee }));
  };

  const handleEmployeeSelect = (employee) => {
    console.log('search', employee); //prints what we've put in the input field
    FiltersChange((prev) => ({ ...prev, q: employee }));
  };

  const status = [
    { content: 'all', svg: null, placeholder: true },
    { content: 'pending', svg: null },
    { content: 'approved', svg: null },
    { content: 'denied', svg: null },
  ];

  return (
    <div
      id="left"
      className="flex py-2.5 gap-3 w-full justify-start items-center"
    >
      <InputField
        searchMode="input"
        placeholder={'Search Employee'}
        displayKey="name"
        onSelect={handleEmployeeSelect}
      />

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i)}
          options={status}
          text="text-xs font-semibold"
          placeholder="all"
          border="border gap-1 border-gray-100"
        />
      </div>
    </div>
  );
}
export function LeaveRequest({ setQ, setdate, setstatus }) {
  // 🔹 STATUS (Dropdown emits STRING)
  const handleFilter = (value) => {
    if (!value) {
      setstatus('all');
      return;
    }
    setstatus(value.toLowerCase());
  };

  // 🔹 SEARCH
  const handleEmployeeSelect = (searchTerm) => {
    setQ(searchTerm || '');
  };

  // 🔹 DATE (SearchDate emits {type, from, to} OR {type, date})
  const handleDateChange = (payload) => {
    console.log('date payload', payload);
    if (!payload) {
      setdate('all');
      return;
    }
    // if(payload.from===null&&payload.to===null&&payload.date===null){setdate("all"); return;}

    // Single date
    if (payload.type === 'single') {
      setdate(payload.date);
      return;
    }

    // Range date
    if (payload.type === 'range') {
      const from = payload.from;
      const to = payload.to;

      if (from && to) {
        // normalize order
        setdate(from <= to ? `${from}:${to}` : `${to}:${from}`);
      } else if (from) {
        setdate(from);
      } else {
        setdate('all');
      }
    }
  };

  const status = [
    { content: 'All', svg: null, placeholder: true },
    { content: 'Approved', svg: null },
    { content: 'Denied', svg: null },
    { content: 'Pending', svg: null },
  ];

  return (
    <div className="flex py-2.5 gap-3 w-full justify-start items-center">
      <InputField
        searchMode="input"
        placeholder={'Search title or content...'}
        displayKey="name"
        onSelect={handleEmployeeSelect}
      />

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={handleFilter} // ✅ string-based
          options={status}
          text="text-xs font-semibold"
          placeholder="All Priority"
          border="border gap-1 border-gray-100"
        />
      </div>

      <SearchDate
        style=""
        applyButton={false}
        isSingle={false}
        onSubmit={handleDateChange} // ✅ fixed
      />
    </div>
  );
}

export function AnnouncementSearch({ setQ, setPriority }) {
  const handleFilter = (employee) => {
    console.log('search', employee);
    setPriority(employee);
  };

  const handleEmployeeSelect = (employee) => {
    setQ(employee);
  };

  const status = [
    { content: 'All Priority', svg: null, placeholder: true },
    { content: 'Low', svg: null },
    { content: 'Normal', svg: null },
    { content: 'High', svg: null },
    { content: 'Urgent', svg: null },
  ];

  return (
    <div
      id="left"
      className="flex py-2.5 gap-3 w-full justify-start items-center"
    >
      <InputField
        searchMode="input"
        placeholder={'Search title or content...'}
        displayKey="name"
        onSelect={handleEmployeeSelect}
      />

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i)}
          options={status}
          text="text-xs font-semibold"
          placeholder="All Priority"
          border="border gap-1 border-gray-100"
        />
      </div>
    </div>
  );
}
export function Generatepayroll({ setPriority, employees }) {
  const handleFilter = (employee) => {
    console.log('search', employee);
    setPriority(employee);
  };
  const PayrollCycle = [
    { content: 'Monthly', svg: null },
    { content: 'Weekly', svg: null },
  ];
  const Department = [
    { content: 'Department 0', svg: null },
    { content: 'Department 1', svg: null },
    { content: 'Department 2', svg: null },
    { content: 'Department 3', svg: null },
  ];

  return (
    <div className="px-6 dark:border-slate-700   border-slate-200 dark:bg-slate-800 flex justify-between items-center bg-white">
      <h3 className="font-semibold dark:text-slate-300 text-slate-800">
        Employee Payroll Sheet
      </h3>
      <div className="flex gap-2">
        <div className="flex dark:text-slate-300  dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
          <Dropdown
            options={Department}
            text="text-xs font-semibold"
            placeholder="Department 1"
            border="border gap-1 border-gray-100"
          />
        </div>
        <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
          <Dropdown
            onChange={(i) => handleFilter(i)}
            options={PayrollCycle}
            text="text-xs font-semibold"
            placeholder="Monthly"
            border="border gap-1 border-gray-100"
          />
        </div>
        <div className="flex dark:text-slate-200 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
          <span className="text-xs p-4 h-fit font-medium  text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
            {employees} Active Records
          </span>
        </div>
      </div>
    </div>
  );
}
export function ViewEditPayslips({ setQ, setPriority, action }) {
  const handleFilter = (employee) => {
    console.log('search', employee);
    setPriority(employee);
  };
  const handleEmployeeSelect = (employee) => {
    setQ(employee);
  };
  const [popup, setpopup] = useState(false);
  const PayrollCycle = [
    { content: 'Monthly', svg: null },
    { content: 'Weekly', svg: null },
  ];
  const Department = [
    { content: 'Department 0', svg: null },
    { content: 'Department 1', svg: null },
    { content: 'Department 2', svg: null },
    { content: 'Department 3', svg: null },
  ];

  return (
    <div
      id="left"
      className="flex p-2.5 gap-3 w-full justify-between items-center"
    >
      <div className="flex gap-3 flex-1">
        <SearchDate style="" />
        <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
          <Dropdown
            onChange={(i) => handleFilter(i)}
            options={Department}
            text="text-xs font-semibold"
            placeholder="Department 1"
            border="border gap-1 border-gray-100"
          />
        </div>
        <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
          <Dropdown
            onChange={(i) => handleFilter(i)}
            options={PayrollCycle}
            text="text-xs font-semibold"
            placeholder="Monthly"
            border="border gap-1 border-gray-100"
          />
        </div>
      </div>
      <InputField
        searchMode="input"
        placeholder={'Search title or content...'}
        displayKey="name"
        onSelect={handleEmployeeSelect}
      />
      {/* <Button onClick={()=>setpopup(true)} text='Re-Generate Payroll' icon={"CloudLightning"}/> */}
      {/* {popup&&<ConfirmPopup onConfirm={action} confirmText='Generate Payroll' message='are you sure you want to Re-Generate payroll?' onCancel={()=>setpopup(false)} isOpen={popup}/>} */}
    </div>
  );
}

export function AttendanceStatus({ onFiltersChange }) {
  const handleFilter = (item, key) => {
    if (!item) return;
    // console.log("Dropdown selected:", item, "key:", key);
    if (
      item === 'Job Type' ||
      item === 'Department' ||
      item === 'Gender' ||
      item === 'Status'
    )
      onFiltersChange({ [key]: '' });
    else onFiltersChange({ [key]: item.content || item });
  };

  const handleEmployeeSelect = (employee) => {
    onFiltersChange({ employee: employee.name });
  };

  const viewOptions = [
    { content: 'Card View', svg: 'Grip' },
    { content: 'Tabular View', svg: 'Grid3x3' },
  ];
  const depOptions = [
    { content: 'Department', svg: null, placeholder: true },
    { content: 'Human Resource', svg: null },
    { content: 'Finance', svg: null },
    { content: 'IT', svg: null },
  ];
  const genderOptions = [
    { content: 'Gender', svg: null, placeholder: true },
    { content: 'Female', svg: null },
    { content: 'Male', svg: null },
    { content: 'What else ?', svg: null },
  ];
  const jobOptions = [
    { content: 'Job Type', svg: null, placeholder: true },
    { content: 'fullTime', svg: null },
    { content: 'PartTime', svg: null },
  ];
  const statOptions = [
    { content: 'Status', svg: null, placeholder: true },
    { content: 'Active', svg: null },
    { content: 'InActive', svg: null },
  ];

  return (
    <div
      id="left"
      className="flex py-2.5 gap-3 justify-between max-w-full items-center"
    >
      <InputField
        searchMode="api"
        placeholder={'Search Employee'}
        apiEndpoint="/api/employees/search"
        displayKey="name"
        onSelect={handleEmployeeSelect}
      />

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i, 'job_type')}
          options={jobOptions}
          text="text-xs font-semibold"
          placeholder="Job Type"
          border="border gap-1 border-gray-100"
        />
      </div>

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i, 'gender')}
          options={genderOptions}
          text="text-xs font-semibold"
          placeholder="Gender"
          border="border gap-1 border-gray-100"
        />
      </div>

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i, 'department')}
          options={depOptions}
          text="text-xs font-semibold"
          placeholder="Department"
          border="border gap-1 border-gray-100"
        />
      </div>

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <Dropdown
          onChange={(i) => handleFilter(i, 'is_active')}
          options={statOptions}
          text="text-xs font-semibold"
          placeholder="All Status"
          border="border gap-1 border-gray-100"
        />
      </div>

      <div className="flex dark:text-slate-300 dark:border-slate-700 text-gray-700 items-center justify-between rounded-md">
        <SearchDate isSingle={true} style="" />
      </div>
    </div>
  );
}

{
  /* <div>
        <label className="text-xs block">Month</label>
        <select
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: +e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
      </div> */
}

{
  /* <div>
        <label className="text-xs block">Year</label>
        <select
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: +e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div> */
}

{
  /* <div>
        <label className="text-xs block">Status</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="border rounded px-2 py-1 text-sm"
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div> */
}
