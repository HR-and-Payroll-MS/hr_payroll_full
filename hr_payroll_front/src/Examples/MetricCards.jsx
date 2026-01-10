// MetricCards.jsx
import React, { useState, useEffect } from "react";
import useAuth from "../Context/AuthContext";

 function MetricCards({
  employeeId,
  reportId,
  endpoint = null,
  previewData = null // New prop for direct rendering
}) {
  const { axiosPrivate } = useAuth();
  const [fullReport, setFullReport] = useState(null); 
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(!previewData); // Don't load if previewData exists
  const [error, setError] = useState("");

  useEffect(() => {
    // If previewData is provided, use it directly
    if (previewData) {
        setFullReport({
            total_efficiency: previewData.totalEfficiency,
            status: "preview",
            created_at: new Date().toISOString(),
            employee: previewData.employee_id || "N/A",
            evaluator: "You",
            department: "N/A"
        });
        setReportData(previewData);
        setLoading(false);
        return;
    }

    const fetchReport = async () => {
      if (!employeeId && !reportId && !endpoint) {
        // Only error if we are supposed to fetch but have no IDs
        setError("No employee ID, report ID, or endpoint provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const url = endpoint || `/efficiency/evaluations/employee/${employeeId}/`;

        const response = await axiosPrivate.get(url);
        const result = response.data.results[0]; // First evaluation
        console.log(result)
        setFullReport(result);
        setReportData(result?.data); // The actual form data
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError("Failed to load efficiency report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [employeeId, reportId, endpoint, axiosPrivate]);

  // Loading
  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl p-12 text-center border border-slate-200 max-w-4xl mx-auto">
        <div className="animate-spin h-12 w-12 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">Loading efficiency report...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-8 text-center max-w-4xl mx-auto">
        <p className="text-red-700 font-semibold text-lg">{error}</p>
      </div>
    );
  }

  // No Data
  if (!fullReport || !reportData) {
    return (
      <div className="bg-gray-50 border border-slate-200 rounded-xl p-12 text-center max-w-4xl mx-auto">
        <p className="text-slate-600 text-lg">No efficiency report found for this employee.</p>
      </div>
    );
  }

  const { total_efficiency, status, created_at, employee, evaluator, department } = fullReport;
  const { title, performanceMetrics, feedback, summary } = reportData;

  return (
    <div className="bg-white shadow-2xl rounded-2xl p-10 border border-slate-200 w-full max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-8 border-b border-slate-200">
        <div>
          <p className="text-sm text-slate-500">Employee ID</p>
          <p className="text-xl font-bold text-slate-800">#{employee}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Status</p>
          <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
            status === "submitted" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div>
          <p className="text-sm text-slate-500">Submitted On</p>
          <p className="text-lg font-semibold text-slate-800">
            {new Date(created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-4xl font-extrabold text-center text-slate-800 mb-8">
        {title || "Employee Efficiency Report"}
      </h2>

      {/* Total Efficiency Score */}
      <div className="text-center mb-12 p-10 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-200">
        <p className="text-7xl font-black text-green-700 mb-2">
          {total_efficiency}%
        </p>
        <p className="text-2xl font-bold text-green-800">Total Efficiency Score</p>
        <p className="text-lg text-green-700 mt-3">
          {summary.totalAchieved} out of {summary.totalPossible} points achieved
        </p>
      </div>

      {/* Performance Metrics */}
      <div className="mb-12">
        <h3 className="text-3xl font-bold text-slate-800 mb-8 text-center">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(summary.perMetric || []).map((metric, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition"
            >
              <h4 className="text-xl font-bold text-slate-800 mb-3">{metric.name}</h4>
              <p className="text-3xl font-extrabold text-indigo-700">{metric.scored}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div>
        <h3 className="text-3xl font-bold text-slate-800 mb-8 text-center">
          Feedback & Comments
        </h3>
        <div className="space-y-6">
          {(feedback || []).map((fb, index) => (
            <div
              key={fb.id || index}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-md"
            >
              <h4 className="text-xl font-semibold text-slate-800 mb-3">{fb.name}</h4>
              <p className="text-lg text-slate-700 leading-relaxed">
                {fb.value || (
                  <span className="italic text-slate-400">No feedback provided</span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* If no feedback */}
        {(!feedback || feedback.length === 0) && (
          <p className="text-center text-slate-500 italic mt-8">
            No feedback was provided in this evaluation.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
        <p>Evaluator ID: #{evaluator} • Department ID: #{department}</p>
        <p>Report ID: #{fullReport.id}</p>
      </div>
    </div>
  );
}

export default MetricCards
























// MetricCards.jsx
// import React, { useState, useEffect } from "react";
// import useAuth from "../Context/AuthContext"; // your auth context with axiosPrivate

// export default function MetricCards({
//   employeeId=20,     // Required if fetching by employee
//   reportId,       // Optional: direct report ID if available
//   endpoint = null // Optional: custom endpoint override
// }) {
//   const { axiosPrivate } = useAuth();
//   const [report, setReport] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchReport = async () => {
//       if (!employeeId && !reportId && !endpoint) {
//         setError("No employee ID, report ID, or endpoint provided.");
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         setError("");

//         let url;
//         // if (endpoint) {
//         //   url = endpoint;
//         // } else if (reportId) {
//         //   url = `/efficiency/reports/${reportId}/`;
//         // } else if (employeeId) {
//           url = `/efficiency/evaluations/employee/${employeeId}/`; // adjust to your API
//           // Or: `/employees/${employeeId}/efficiency-report/`
//         // }

//         const response = await axiosPrivate.get(url);
//         const data = response.data.results[0].data;
//         console.log(data)

//         // Handle both single object or array
//         setReport(Array.isArray(data) ? data[0] : data);
//       } catch (err) {
//         console.error("Failed to fetch report:", err);
//         setError("Failed to load efficiency report.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReport();
//   }, [employeeId, reportId, endpoint, axiosPrivate]);

//   // Loading State
//   if (loading) {
//     return (
//       <div className="bg-white shadow-lg rounded-lg p-10 border border-slate-200 w-full max-w-3xl mx-auto text-center">
//         <div className="animate-spin h-10 w-10 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4"></div>
//         <p className="text-slate-600">Loading efficiency report...</p>
//       </div>
//     );
//   }

//   // Error State
//   if (error) {
//     return (
//       <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full max-w-3xl mx-auto text-center">
//         <p className="text-red-700 font-medium">{error}</p>
//       </div>
//     );
//   }

//   // No Data
//   if (!report) {
//     return (
//       <div className="bg-gray-50 border border-slate-200 rounded-lg p-10 w-full max-w-3xl mx-auto text-center">
//         <p className="text-slate-600">No efficiency report found.</p>
//       </div>
//     );
//   }

//   // Success: Render Report
//   return (
//     <div className="bg-white shadow-xl rounded-xl p-8 border border-slate-200 w-full max-w-4xl mx-auto">
//       {/* Title */}
//       <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">
//         {report.title || "Efficiency Report"}
//       </h2>

//       {/* Total Efficiency - Highlighted */}
//       <div className="text-center mb-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
//         <p className="text-5xl font-extrabold text-green-700">
//           {report.totalEfficiency}%
//         </p>
//         <p className="text-xl text-green-800 mt-2 font-medium">Total Efficiency Score</p>
//       </div>

//       {/* Performance Metrics */}
//       <div className="mb-10">
//         <h3 className="text-2xl font-bold text-slate-700 mb-5">Performance Metrics</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {(report.summary?.perMetric || []).map((metric, index) => (
//             <div
//               key={index}
//               className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-300 rounded-lg p-5 shadow hover:shadow-md transition"
//             >
//               <h4 className="text-lg font-semibold text-slate-800">{metric.name}</h4>
//               <p className="text-2xl font-bold text-green-600 mt-2">{metric.scored}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Feedback */}
//       <div>
//         <h3 className="text-2xl font-bold text-slate-700 mb-5">Feedback</h3>
//         <div className="space-y-4">
//           {(report.feedback || []).map((fb, index) => (
//             <div
//               key={index}
//               className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-sm"
//             >
//               <h4 className="text-lg font-semibold text-slate-700 mb-2">{fb.name}</h4>
//               <p className="text-slate-600 leading-relaxed">
//                 {fb.value || <span className="italic text-slate-400">No feedback provided</span>}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Optional: Submitted Date */}
//       {report.submitted_at && (
//         <p className="text-center text-sm text-slate-500 mt-8">
//           Report submitted on: {new Date(report.submitted_at).toLocaleDateString()}
//         </p>
//       )}
//     </div>
//   );
// }







// import React from "react";

// export default function MetricCards() {


//   return (
//     <div className="bg-white shadow-lg rounded-lg p-6 border border-slate-200 w-full max-w-3xl mx-auto">
//       {/* Title */}
//       <h2 className="text-2xl font-bold text-slate-800 mb-4">
//         {Data.title}
//       </h2>

//       {/* Total Efficiency */}
//       <p className="text-green-700 font-semibold mb-4">
//         Total Efficiency: {Data.totalEfficiency}%
//       </p>

//       {/* Metrics */}
//       <div className="mb-6">
//         <h3 className="text-xl font-semibold text-slate-700 mb-2">
//           Performance Metrics
//         </h3>
//         <div className="space-y-3">
//           {Data.summary.perMetric.map((metric, index) => (
//             <div key={index} className="bg-slate-50 border border-slate-200 rounded p-3">
//               <h4 className="text-lg font-medium text-slate-700">
//                 {metric.name}
//               </h4>
//               <p className="text-green-600 font-bold">{metric.scored}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Feedback */}
//       <div>
//         <h3 className="text-xl font-semibold text-slate-700 mb-2">
//           Feedback
//         </h3>
//         <div className="space-y-3">
//           {Data.feedback.map((fb, index) => (
//             <div key={index} className="bg-slate-50 border border-slate-200 rounded p-3">
//               <h4 className="text-lg font-medium text-slate-700">{fb.name}</h4>
//               <p className="text-slate-600">{fb.value || "No feedback provided"}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
