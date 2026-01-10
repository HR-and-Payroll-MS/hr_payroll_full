import React from "react";

export default function PunchTimeline({ loading, punches = [] }) {
  if (loading) {
    return <div className="text-gray-500 italic">Loading today's punches...</div>;
  }

  // Ensure punches is always an array (defensive programming)
  const safePunches = Array.isArray(punches) ? punches : [];

  if (safePunches.length === 0) {
    return <div className="text-gray-500 italic">No punches recorded today.</div>;
  }

  return (
    <ol className="border-l-2 dark:text-slate-400 border-gray-200 pl-6 space-y-4">
      {safePunches.map((p, idx) => {
        // Safely format the type (fallback if missing or invalid)
        const displayType = p?.type
          ? p.type.replace(/_/g, " ").toUpperCase()
          : "UNKNOWN ACTION";

        // Safely format time
        const timeString = p?.time
          ? new Date(p.time).toLocaleTimeString()
          : "Invalid time";

        // Safely get location
        const location = p?.location || "Unknown location";

        return (
          <li key={p._id || p.id || idx} className="relative">
            <div className="absolute -left-3 top-0 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white" />
            <div className="ml-2">
              <div className="text-sm font-semibold dark:text-slate-200 text-gray-700">
                {displayType}
              </div>
              <div className="text-xs text-gray-400">
                {timeString} • {location}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}



// import React from "react";

// export default function PunchTimeline({ loading, punches }) {
//   if (loading)
//     return <div className="text-gray-500 italic">Loading today's punches...</div>;
//   if (!punches.length)
//     return <div className="text-gray-500 italic">No punches recorded today.</div>;

//   return (
//     <ol className="border-l-2 border-gray-200 pl-6 space-y-4">
//       {punches.map((p, idx) => (
//         <li key={idx} className="relative">
//           <div className="absolute -left-3 top-0 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white" />
//           <div className="ml-2">
//             <div className="text-sm font-semibold text-gray-700">
//               {p.type.replace("_", " ").toUpperCase()}
//             </div>
//             <div className="text-xs text-gray-400">
//               {new Date(p.time).toLocaleTimeString()} • {p.location || "Unknown"}
//             </div>
//           </div>
//         </li>
//       ))}
//     </ol>
//   );
// }
