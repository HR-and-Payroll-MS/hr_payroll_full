import React, { useState } from "react";
import InputField from "../Components/InputField";
import Dropdown from "../Components/Dropdown";
import MetricCards from "./MetricCards";
import useAuth from "../Context/AuthContext";
import { useParams } from "react-router-dom";
import Header from "../Components/Header";
import AlertModal from "../Components/Modals/AlertModal";

export default function FormRenderer({ savedForm, employeeId: propEmployeeId }) {
  const { axiosPrivate } = useAuth();
  const { id: routeEmployeeId } = useParams();
  
  // Use the ID passed via props or route
  const employeeId = propEmployeeId || routeEmployeeId; 

  const [answers, setAnswers] = useState({});
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "error",
    message: ""
  });
  
  const [finalScore, setFinalScore] = useState(null);
  const [report, setReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(""); 
  const [isCalculated, setIsCalculated] = useState(false);

  const showAlert = (type, msg) => {
    setAlertConfig({
      isOpen: true,
      type: type,
      message: msg
    });
  };

  const handleChange = (fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Reset calculation state if they change an answer so they have to recalculate
    setIsCalculated(false);
  };

  // STEP 1: CALCULATE ONLY (Show UI results)
  const handleCalculate = () => {
    if (!employeeId) {
      showAlert("error", "Error: Employee ID is missing.");
      return;
    }

    let totalAchieved = 0;
    let totalPossible = 0;
    const metricReports = [];
    const metricSummaries = [];

    savedForm.performanceMetrics.forEach((field) => {
      const answer = answers[field.id];
      let fieldAchieved = 0;
      let fieldPossible = 0;

      if (field.type === "number") {
        fieldPossible = field.weight;
        fieldAchieved = Math.min(Number(answer) || 0, fieldPossible);
      }

      if (field.type === "dropdown") {
        fieldPossible = Math.max(...field.options.map((o) => o.point));
        if (answer) {
          const match = answer.match(/(\d+(\.\d+)?)/);
          fieldAchieved = match ? Number(match[0]) : 0;
        }
      }

      totalAchieved += fieldAchieved;
      totalPossible += fieldPossible;

      metricReports.push({
        id: field.id,
        name: field.name,
        type: field.type,
        weight: field.weight,
        selected: answer ?? null,
        achievedPoints: fieldAchieved,
        possiblePoints: fieldPossible,
      });

      metricSummaries.push({
        name: field.name,
        scored: `${fieldAchieved} out of ${fieldPossible}`,
      });
    });

    const feedbackReports = savedForm.feedbackSections.map((field) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      value: answers[field.id] ?? null,
    }));

    const totalEfficiency = totalPossible > 0 ? (totalAchieved / totalPossible) * 100 : 0;

    const generatedReport = {
      employee_id: employeeId,
      title: savedForm.title,
      totalEfficiency: Number(totalEfficiency.toFixed(1)),
      submitted_at: new Date().toISOString(),
      summary: {
        totalAchieved,
        totalPossible,
        perMetric: metricSummaries,
      },
      performanceMetrics: metricReports,
      feedback: feedbackReports,
    };

    setFinalScore(generatedReport.totalEfficiency);
    setReport(generatedReport);
    setIsCalculated(true);
    setSubmitStatus(""); // Reset status if they recalculate
  };

  // STEP 2: SUBMIT TO BACKEND
  const handleFinalSubmit = async () => {
    if (!report) return;

    setSubmitting(true);
    setSubmitStatus("");

    try {
      await axiosPrivate.post(`/efficiency/evaluations/submit/`, report);
      setSubmitStatus("success");
      showAlert("success", `Efficiency report for employee ${employeeId} submitted successfully!`);
    } catch (error) {
      console.error("Failed to submit report:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to submit report. Please try again.";
      setSubmitStatus("error");
      showAlert("error", "Error: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto h-full p-6 bg-white dark:bg-slate-900 rounded border-slate-200 dark:border-slate-800 transition-colors">
      <AlertModal 
        isOpen={alertConfig.isOpen} 
        close={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
        type={alertConfig.type} 
        message={alertConfig.message} 
      />

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Header Title={`${savedForm?.title}`} subTitle={`Performance Review Preview`} className={" px-0"} >
          <div className="h-8 w-1 bg-green-500 rounded-full" />
        </Header>
      </div>

      {/* PERFORMANCE METRICS SECTION */}
      <div className="h-full space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-2">
          Efficiency Metrics
        </h2>

        {savedForm?.performanceMetrics.map((field) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center group">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {field.name}
              <span className="block text-[9px] font-medium text-slate-400 mt-0.5">Max: {field.weight} pts</span>
            </label>

            <div className="md:col-span-2">
              {field.type === "number" && (
                <input
                  type="number"
                  min="0"
                  max={field.weight}
                  step="0.1"
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs font-semibold focus:border-green-500 transition-all"
                  placeholder="Score value"
                />
              )}

              {(field.type === "dropdown" || field.type === "select") && (
                <Dropdown
                  onChange={(value) => handleChange(field.id, value)}
                  options={field.options.map((item) => `${item.label} (${item.point} pts)`)}
                  placeholder="Select level"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FEEDBACK SECTION */}
      <div className="mt-10 space-y-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">
          Qualitative Notes
        </h2>

        {savedForm?.feedbackSections.map((field) => (
          <div key={field.id} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {field.name}
            </label>

            {field.type === "textarea" ? (
              <textarea
                onChange={(e) => handleChange(field.id, e.target.value)}
                className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs resize-none focus:border-emerald-500 transition-all"
                placeholder="Comments..."
              />
            ) : (field.type === "dropdown" || field.type === "select") ? (
              <Dropdown
                onChange={(value) => handleChange(field.id, value)}
                options={field.options?.map((item) => item.label || item) || []}
                placeholder="Select option"
              />
            ) : (
              <InputField
                border="border border-slate-200 dark:border-slate-800"
                maxWidth="w-full bg-slate-50 dark:bg-slate-950 rounded-lg text-xs"
                suggestion={false}
                icon={false}
                onSelect={(value) => handleChange(field.id, value)}
                placeholder="Short response"
              />
            )}
          </div>
        ))}
      </div>

      {/* ACTION AREA */}
      <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="text-left">
           {submitStatus === "success" && <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-tight">Report Saved</p>}
           {submitStatus === "error" && <p className="text-red-500 text-[10px] font-bold uppercase tracking-tight">Submit Error</p>}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleCalculate}
            className="px-6 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            {isCalculated ? "Recalculate" : "Calculate Score"}
          </button>

          {isCalculated && (
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className={`px-6 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-md ${
                submitting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }`}
            >
              {submitting ? "Processing..." : "Submit Report"}
            </button>
          )}
        </div>
      </div>

      {/* RESULT DISPLAY */}
      {finalScore !== null && (
        <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-between shadow-lg">
            <div className="text-left">
              <p className="text-emerald-100 text-[9px] font-black uppercase tracking-widest">Efficiency Score Preview</p>
              <p className="text-white text-[10px] opacity-80">Target ID: {employeeId}</p>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              {finalScore}%
            </h2>
          </div>
          
          {/* Show MetricCards only after calculation */}
          <MetricCards previewData={report} />
        </div>
      )}
    </div>
  );
}