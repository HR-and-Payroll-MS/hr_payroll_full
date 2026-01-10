import React, { useEffect, useState, useRef } from "react";
import Table from "../../../Components/Table";
import Header from "../../../Components/Header";
import { AttendanceStatus } from "../../../Components/Level2Hearder";
import AttendanceCorrectionPage from "./AttendanceCorrectionPage";
import useAuth from "../../../Context/AuthContext";
import { Atom } from "react-loading-indicators";
import EmployeeAttendanceListSkeleton from "../../../animations/Skeleton/EmployeeAttendanceListSkeleton";

const TABLE_MODES = {
  DEPARTMENT: "DEPARTMENT",
  EMPLOYEE: "EMPLOYEE",
};
function EmployeeAttendanceList() {
  const { axiosPrivate } = useAuth();

  const [tableMode, setTableMode] = useState(TABLE_MODES.DEPARTMENT);
  const [tableConfig, setTableConfig] = useState(null);
  const [history, setHistory] = useState([]);
  const [dep, setDep] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function loadDepartments() {
      try {
        setLoading(true);

        const res = await axiosPrivate.get("/attendances/departments/");
        const departmentData = Array.isArray(res.data) ? res.data : [];
        console.log(departmentData)
        setTableConfig({
          clickable: true,
          Data: departmentData,
          title: ["DEPARTMENT", "PRESENT", "ABSENT", "LATE", "PERMISSION", "OVERTIME"],
          structure: [1, 1, 1, 1, 1, 1],
          ke: [
            ["department_name"],
            ["present"],
            ["absent"],
            ["late"],
            ["permission"],
            ["overtime"],
            ["department_id"]
          ],
        });
      } catch (err) {
        console.error("Department fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDepartments();
  }, [axiosPrivate]);
const onRowClick = async (rowIndex,index,data) => {
  console.log(rowIndex , "rowIndex")
  console.log(index , "index")
  console.log(data , "data")
  setDep(data[index]?.department_name)
  const id=data[index]?.department_id
  console.log("id",id)
  setLoading(true)
  setHistory((prev) => [...prev, tableConfig]);
  setTableMode(TABLE_MODES.EMPLOYEE);

  try {
    const res = await axiosPrivate.get(
      `/attendances/departments/${id}/`
    );

    const employeeData = res.data || [];
    console.log(employeeData)

    setTableConfig({
      clickable: false,
      Data: employeeData,
      title: [
        "EMPLOYEE",
        "DATE",
        "CLOCK IN",
        "CLOCK IN LOCATION",
        "CLOCK OUT",
        "STATUS",
        "CLOCK OUT LOCATION",
        "WORK SCHEDULES",
        "PAID TIME",
        "NOTES",
        "ACTION",
      ],
      structure: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 61],
      ke: [
        ["employee_name"],
        ["date"],
        ["clock_in"],
        ["clock_in_location"],
        ["clock_out"],
        ["status"],
        ["clock_out_location"],
        ["work_schedule_hours"],
        ["paid_time"],
        ["notes"],
        ["view"],
        ["id"],
      ],
    });
  } catch (err) {
    console.error("Failed to load employees:", err);
    setTableConfig((prev) => ({
      ...prev,
      Data: [],
    }));
  }
  finally{
    setLoading(false);
  }
};

  const handleBack = () => {
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setTableConfig(prev);
    setTableMode(TABLE_MODES.DEPARTMENT);
  };

  if (!tableConfig) {
   return <EmployeeAttendanceListSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col overflow-hidden h-full">
      {tableMode !== TABLE_MODES.DEPARTMENT && (
        <div className="flex gap-4 items-center mb-2">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 cursor-pointer hover:underline dark:text-white rounded"
          >
            ← Back
          </button>
          <p className="font-semibold dark:text-slate-200 text-slate-800 text-lg">{dep} Department</p>
        </div>
      )}

      {tableMode === TABLE_MODES.DEPARTMENT && (
        <Header
          Title="Department Attendance"
          subTitle="View department attendance and drill down into employees"
        />
      )}

      <AttendanceStatus onFiltersChange={() => {}} />

      <Table
        components={AttendanceCorrectionPage}
        clickable={tableConfig.clickable}
        Data={tableConfig.Data}
        title={tableConfig.title}
        Structure={tableConfig.structure}
        ke={tableConfig.ke}
        onRowClick={onRowClick}
        pages={9}
        loading={loading}
      />
    </div>
  );
}

export default EmployeeAttendanceList;