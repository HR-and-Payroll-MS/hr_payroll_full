import React from "react";
import Icon from "./Icon";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function SuggestionBox({
  suggestions = [],
  onSelect,
  query,
  suggestion,
  displayKey = "name",
}) {
  return (
    <ul className="absolute top-full left-0 w-full min-w-64 bg-white dark:bg-slate-800 dark:border-slate-600 rounded-md mt-1 scrollbar-hidden shadow-lg z-20 max-h-60 overflow-y-auto">
      {suggestions.length > 0 ? (
        suggestions.map((item, index) => (
          <li
            key={item.id || index}
            onClick={() => onSelect(item)}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            {/* Avatar (Employee) */}
            {item.photo ? (
              <img
                className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-slate-600"
                src={`${BASE_URL}${item.photo}`}
                alt={item.fullname || item.employeeid}
              />
            ) : item.fullname ? (
              <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-sm">
                {item.fullname
                  ?.trim()
                  .split(" ")
                  .map(n => n[0]?.toUpperCase() || "")
                  .slice(0, 2)
                  .join("")}
              </div>
            ) : (
              <div className="h-4 w-4 rounded-md flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                <Icon name="FolderOpen" className="h-3 w-3" />
              </div>
            )}

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                {item[displayKey] || item.fullname || item.employeeid}
              </p>

              {item.emailaddress && (
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                  {item.emailaddress} • {item.department || "No Department"}
                </p>
              )}

              {item.path && (
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
                  {item.path}
                </p>
              )}
            </div>
          </li>
        ))
      ) : query.trim().length >= 2 && suggestion ? (
        <li className="px-3 py-2.5 text-gray-500 dark:text-slate-400 text-sm">
          No results found
        </li>
      ) : null}
    </ul>
  );
}

export default SuggestionBox;


















































// import React from 'react'

// const BASE_URL = import.meta.env.VITE_BASE_URL;

// function SuggestionBox({ suggestions = [], onSelect, query ,suggestion}) {
//   // Always render the <ul>, show "No results" if empty
//   return (
//     <ul className="absolute top-full left-0 w-full min-w-64 bg-white dark:bg-slate-800  dark:border-slate-600 rounded-md mt-1 scrollbar-hidden shadow-lg z-20 max-h-60 overflow-y-auto">
//       {suggestions.length > 0  ? (
//         suggestions.map((item) => (
//           <li
//             key={item.id}
//             onClick={() => onSelect(item)}
//             className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
//           >
//             {item.photo ? (
//               <img
//                 className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-slate-600"
//                 src={`${BASE_URL}${item.photo}`}
//                 alt={item.fullname || item.employeeid}
//               />
//             ) : (
//               <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-sm">
//                 {item.fullname
//                   ?.trim()
//                   .split(' ')
//                   .map(n => n[0]?.toUpperCase() || '')
//                   .slice(0, 2)
//                   .join('') || 'NA'}
//               </div>
//             )}
//             <div className="min-w-0 flex-1">
//               <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
//                 {item.fullname || item.employeeid}
//                 <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-slate-400">
//                   • {item.employeeid}
//                 </span>
//               </p>
//               <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
//                 {item.emailaddress} • {item.department || 'No Department'}
//               </p>
//             </div>
//           </li>
//         ))
//       ) : query.trim().length >= 2 && suggestion ? (
//         <li className="px-3 py-2.5 text-gray-500 dark:text-slate-400 text-sm">
//           No results found
//         </li>
//       ) : null}
//     </ul>
//   )
// }

// export default SuggestionBox





























// import React from 'react'


// const BASE_URL = import.meta.env.VITE_BASE_URL;

// function SuggestionBox({ suggestions = [], onSelect }) {
//   if (!suggestions.length) return null

//   const getInitials = (name) => {
//     if (!name) return 'NA'
//     return name
//       .trim()
//       .split(' ')
//       .map(n => n[0]?.toUpperCase() || '')
//       .slice(0, 2)
//       .join('')
//   }

//   return (
//     <ul className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-md mt-1 shadow-lg z-20 max-h-60 overflow-y-auto">
//       {suggestions.map((item) => (
//         <li
//           key={item.id}
//           onClick={() => onSelect(item)}
//           className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
//         >
//           {/* Avatar with fallback */}
//           {item.photo ? (
//             <img
//               className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-slate-600"
//               src={`${BASE_URL}${item.photo}`}
//               alt={item.fullname || item.employeeid}
//             />
//           ) : (
//             <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-sm">
//               {getInitials(item.fullname)}{console.log("item fullname:", item.fullname)}
//             </div>
//           )}

//           {/* Text content */}
//           <div className="min-w-0 flex-1">
//             <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
//               {item.fullname || item.employeeid}
//               <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-slate-400">
//                 • {item.employeeid}
//               </span>
//             </p>
//             <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
//               {item.emailaddress} • {item.department || 'No Department'}
//             </p>
//           </div>
//         </li>
//       ))}
//     </ul>
//   )
// }

// export default SuggestionBox