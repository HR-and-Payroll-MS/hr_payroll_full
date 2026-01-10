import React, { useEffect, useState } from "react";
import Table from "../../../Components/Table";
import Header from "../../../Components/Header";
import useAuth from "../../../Context/AuthContext";
import EfficiencyReportViewer from "./EfficiencyReportViewer";

const TABLE_MODES = {
  DEPARTMENT: "DEPARTMENT",
  EMPLOYEE: "EMPLOYEE",
  DETAIL: "DETAIL"
};

function EfficiencyReport() {
  const { axiosPrivate } = useAuth();
  
  const [tableMode, setTableMode] = useState(TABLE_MODES.DEPARTMENT);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  // Table Configs
  const [tableConfig, setTableConfig] = useState({
    clickable: true,
    Data: [],
    title: ["DEPARTMENT", "EVALUATED EMPLOYEES", "AVG SCORE (%)"],
    structure: [1, 1, 1],
    ke: [["department_name"], ["count"], ["avg_score"]]
  });

  // Fetch all data once
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        const res = await axiosPrivate.get('/efficiency/evaluations/');
        // Enrich data with defaults
        // Enrich data with defaults
        const rawData = res.data.map(item => ({
            ...item,
            employee_name: item.employee_name || 'Unknown',
            // Backend now sends department_name correctly via serializer
        }));
        setAllEvaluations(rawData);
      } catch (err) {
        console.error("Failed to fetch evaluations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, [axiosPrivate]);

  // Aggregate Data for Department View
  useEffect(() => {
    if (tableMode === TABLE_MODES.DEPARTMENT && allEvaluations.length > 0) {
        const deptMap = {};
        
        allEvaluations.forEach(ev => {
            // Check if backend sends department info inside 'employee' object or separate.
            // Currently serializer: employee (id), employee_name.
            // I need to update serializer to send { employee: { id, department: "IT" } } or flatten it.
            // For now, let's group by "General" if not available, but I SHOULD fix the backend.
            // Assuming I'll fix backend serializer to include 'department_name'
            const dept = ev.department_name || "General"; 
            
            if (!deptMap[dept]) {
                deptMap[dept] = { count: 0, totalScore: 0, name: dept };
            }
            deptMap[dept].count += 1;
            deptMap[dept].totalScore += ev.total_score;
        });

        const deptData = Object.values(deptMap).map(d => ({
            department_name: d.name,
            count: d.count,
            avg_score: (d.totalScore / d.count).toFixed(1)
        }));

        setTableConfig({
            clickable: true,
            Data: deptData,
            title: ["DEPARTMENT", "EVALUATED EMPLOYEES", "AVG SCORE (%)"],
            structure: [1, 1, 1],
            ke: [["department_name"], ["count"], ["avg_score"]]
        });
    }
  }, [allEvaluations, tableMode]);

  const handleDeptClick = (rowValue, index, pageData) => {
    // Table passes (lastCellValue, index, pageDataArray)
    // We need the full object to get department_name
    const rowObj = pageData[index];
    const deptName = rowObj.department_name;
    
    setSelectedDept(deptName);
    setTableMode(TABLE_MODES.EMPLOYEE);

    const filtered = allEvaluations.filter(ev => (ev.department_name || "General") === deptName)
        .map(ev => ({
            ...ev,
            display_score: `${ev.total_score}%`,
            display_date: new Date(ev.submitted_at).toLocaleDateString(),
            action_view: "View Report"
        }));

    setTableConfig({
        clickable: false, 
        Data: filtered,
        title: ['EMPLOYEE','EVALUATOR','SCORE','DATE', 'ACTION'],
        structure: [3, 3, 1, 1, 1],
        ke: [
            ["employee_photo", "employee_name", "employee_job_title"], 
            ["evaluator_photo", "evaluator_name", "evaluator_job_title"], 
            ["display_score"], 
            ["display_date"],
            ["action_view"]
        ]
    });
  };

  const handleRowClick = (id) => {
      // In TABLE_MODES.EMPLOYEE, row click implies viewing detail.
      // Table component passes only column values? Or ID?
      // Our Table component usually calls onRowClick with (id) if clickable=true.
      // But for Employee table, we want specific action.
      // Let's rely on Table's row click returning the ID if we passed data with 'id'.
      // If tableConfig.clickable is false, Table might not call onRowClick.
      // Assuming Table handles it differently based on implementation.
      // If we enable clickable: true for employee list:
      const report = allEvaluations.find(ev => ev.id === id);
      if (report) {
          setSelectedReport(report);
          setTableMode(TABLE_MODES.DETAIL);
      }
  };

  return (
    <div className="p-4 flex flex-col overflow-hidden h-full"> 
      {/* HEADER LOGIC */}
      {tableMode === TABLE_MODES.DEPARTMENT && (
          <Header Title="Efficiency Reports" subTitle="Overview by Department" />
      )}
      
      {tableMode === TABLE_MODES.EMPLOYEE && (
          <div className="flex gap-4 items-center mb-4">
              <button 
                onClick={() => setTableMode(TABLE_MODES.DEPARTMENT)} 
                className="px-4 py-2 bg-slate-800 text-slate-100 rounded hover:bg-slate-700 transition-colors" 
              > 
                ← Back 
              </button>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{selectedDept} Department</h2>
          </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="p-10 text-center text-gray-500">Loading data...</div>
      ) : (
        <>
            {tableMode !== TABLE_MODES.DETAIL ? (
                <Table 
                    clickable={true} 
                    Data={tableConfig.Data} 
                    title={tableConfig.title} 
                    Structure={tableConfig.structure} 
                    ke={tableConfig.ke} 
                    totPage={10} 
                    onRowClick={tableMode === TABLE_MODES.DEPARTMENT ? handleDeptClick : handleRowClick}
                />
            ) : (
                <EfficiencyReportViewer 
                    report={selectedReport?.report_data} 
                    fullReport={selectedReport} // Pass full object for profile headers
                    onBack={() => setTableMode(TABLE_MODES.EMPLOYEE)}
                />
            )}
        </>
      )}
    </div>
  );
}

export default EfficiencyReport;



