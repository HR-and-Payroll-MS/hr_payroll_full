import React, { useEffect, useState } from "react";
import useAuth from "../Context/AuthContext";
import Header from "../Components/Header";
import Table from "../Components/Table";
import EfficiencyReportViewer from "./HR_Manager/Report/EfficiencyReportViewer"; // Import from existing location

export default function EmployeeEfficiencyResult() {
  const { axiosPrivate } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchMyEvaluations = async () => {
      try {
        setLoading(true);
        const response = await axiosPrivate.get("/efficiency/evaluations/my_evaluations/");
        // Transform for Table
        const formatted = response.data.map((ev) => ({
            ...ev,
            display_title: ev.report_data?.title || "Efficiency Report",
            display_score: `${ev.total_score}%`,
            display_date: new Date(ev.submitted_at).toLocaleDateString(),
            action_view: "View"
        }));
        setEvaluations(formatted);
      } catch (error) {
        console.error("Failed to fetch evaluations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvaluations();
  }, [axiosPrivate]);

  const handleRowClick = (rowData, index, fullData) => {
      // Table passes (lastCell, index, fullArray)
      const report = fullData[index];
      setSelectedReport(report);
  };

  // Table Config
  const tableConfig = {
      title: ["TITLE", "SCORE", "DATE", "ACTION"],
      structure: [2, 1, 2, 1], // Adjust column widths
      ke: [["display_title"], ["display_score"], ["display_date"], ["action_view"]]
  };

  if (selectedReport) {
      return (
          <div className="h-full p-4">
            <EfficiencyReportViewer 
                report={selectedReport.report_data}
                fullReport={selectedReport}
                onBack={() => setSelectedReport(null)}
                hideFeedback={true} // As requested by user
            />
          </div>
      );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <Header Title="My Efficiency Results" subTitle="Performance Evaluation History" />
      
      <div className="flex-1 overflow-hidden mt-6 bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800">
        {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>
        ) : evaluations.length > 0 ? (
            <Table
                Data={evaluations}
                title={tableConfig.title}
                Structure={tableConfig.structure}
                ke={tableConfig.ke}
                clickable={true}
                onRowClick={handleRowClick}
            />
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>No efficiency reports found.</p>
            </div>
        )}
      </div>
    </div>
  );
}
