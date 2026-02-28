import React from "react";
import Header from "../../../Components/Header";
// import Dropdown from "../../Components/Dropdown";
// import Header from "../../Components/Header";

// Reusing MetricCards if possible, or simple display
// import MetricCards from "../../Examples/MetricCards"; 
const BASE_URL = import.meta.env.VITE_BASE_URL;

export default function EfficiencyReportViewer({ report, fullReport, onBack, hideFeedback }) {
  if (!report) return null;
  console.log("Viewing Report for:", fullReport?.employee_name, "Photo:", fullReport?.employee_photo);

  const { title, summary, performanceMetrics, feedback, totalEfficiency, evaluator_name } = report;

  return (
    <div className="mx-auto h-full relative  w-full p-6 bg-white dark:bg-slate-900 rounded border-slate-200 dark:border-slate-800 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 hover-bar overflow-y-auto">
      
      {/* HEADER & PROFILE */}
      <div className="mb-8 pb-4 sticky z-20 bg-white dark:bg-slate-900 top-0 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1 group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
                </button>
            </div>
            
            <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Score</p>
                <div className="text-4xl font-black text-emerald-600">{totalEfficiency}%</div>
            </div>
        </div>

        {/* PROFILE CARD */}
        {fullReport && (
            <div className="flex items-center space-x-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                 {/* Photo */}
                 <div className="relative shrink-0">
                    {fullReport.employee_photo ? (
                        <img 
                            className="h-20 w-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-sm"
                            src={fullReport.employee_photo.startsWith('http') ? fullReport.employee_photo : `${BASE_URL}${fullReport.employee_photo}`}
                            alt={fullReport.employee_name}
                        />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-2xl ring-4 ring-white dark:ring-slate-800">
                            {(fullReport.employee_name || 'E').charAt(0)}
                        </div>
                    )}
                 </div>

                 {/* Info */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    <div className="col-span-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{fullReport.employee_name}</h2>
                        <p className="text-emerald-600 font-medium">{fullReport.employee_job_title || 'Employee'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Department</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{fullReport.department_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Evaluator</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{evaluator_name || 'Manager'}</p>
                    </div>
                 </div>
            </div>
        )}
        
        <Header Title={title} subTitle={`Submitted on ${new Date(fullReport?.submitted_at || Date.now()).toLocaleDateString()}`} className={"px-0"} >
          <div className="h-8 w-1 bg-green-500 rounded-full" />
        </Header>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full overflow-y-auto pb-20">
          
          {/* LEFT: METRICS */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-2">
            Efficiency Metrics
            </h2>

            {performanceMetrics.map((field) => (
            <div key={field.id} className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                <div>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {field.name}
                    </label>
                    <span className="block text-[10px] font-medium text-slate-400 mt-0.5">Max: {field.weight} pts</span>
                </div>

                <div className="text-right">
                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">{field.achievedPoints}</span>
                    <span className="text-xs text-slate-400 font-medium"> / {field.possiblePoints} pts</span>
                </div>
            </div>
            ))}
          </div>

          {/* RIGHT: FEEDBACK */}
          {!hideFeedback && (
          <div className="space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">
            Qualitative Notes
            </h2>

            {feedback.map((field) => (
            <div key={field.id} className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-dashed border-slate-200 dark:border-slate-700 pb-1 block">
                {field.name}
                </label>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-sm text-slate-600 dark:text-slate-400 min-h-[80px]">
                    {field.value || <span className="italic opacity-50">No feedback provided</span>}
                </div>
            </div>
            ))}
          </div>
          )}
      </div>
    </div>
  );
}
