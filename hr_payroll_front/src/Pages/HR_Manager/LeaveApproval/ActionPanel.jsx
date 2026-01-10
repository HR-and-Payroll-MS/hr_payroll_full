import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

export default function ActionPanel({ request, onApprove, onDeny }) {
  const [comment, setComment] = useState('');

  // Status checks
  const isApproved = request.status === 'approved';
  const isDenied = request.status === 'denied';

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-slate-700 p-4 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex flex-col gap-4 transition-colors">
      
      {/* Header with Icon */}
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-2">
        <MessageSquare size={16} className="text-blue-500" />
        <p className="font-bold text-sm uppercase tracking-wider">Review Action</p>
      </div>

      {/* Comment Area */}
      <div className="flex flex-col gap-1.5 flex-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">
          Admin Comment
        </label>
        <textarea
          className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none flex-1"
          rows={4}
          placeholder="Type the reason for approval or denial here..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          disabled={isApproved}
          onClick={() => {
            onApprove(comment);
            setComment('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded py-2.5 text-sm font-bold transition-all shadow-sm ${
            isApproved
              ? 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
          }`}
        >
          <CheckCircle size={16} /> 
          {isApproved ? 'Approved' : 'Approve'}
        </button>

        <button
          disabled={isDenied}
          onClick={() => {
            onDeny(comment);
            setComment('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 rounded py-2.5 text-sm font-bold transition-all shadow-sm ${
            isDenied
              ? 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
              : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
          }`}
        >
          <XCircle size={16} /> 
          {isDenied ? 'Denied' : 'Deny'}
        </button>
      </div>
      
      {/* Subtle footer status */}
      {(isApproved || isDenied) && (
        <p className="text-[10px] text-center italic text-slate-400 dark:text-slate-500">
          This request has already been finalized.
        </p>
      )}
    </div>
  );
}








// import React, { useState } from 'react';
// import { CheckCircle, XCircle } from 'lucide-react';

// export default function ActionPanel({ request, onApprove, onDeny }) {
//   const [comment, setComment] = useState('');

//   // Determine if actions should be disabled
//   const isApprovedOrDenied = request.status === 'approved' || request.status === 'denied';

//   return (
//     <div className="h-full gap-2 flex flex-col rounded py-3">
//       <p className="font-semibold text-sm">Add Comment</p>
//       <textarea
//         className="w-full bg-slate-100 rounded p-2 text-sm"
//         rows={3}
//         placeholder="Add a comment..."
//         value={comment}
//         onChange={(e) => setComment(e.target.value)}
//         // disabled={isApprovedOrDenied} 
//       />
//       <div className="flex items-end flex-1 gap-2 mt-3">
//         <button
//           disabled={request.status === 'approved'}
//           onClick={() => {
//             onApprove(comment);
//             setComment('');
//           }}
//           className={`flex-1 h-fit flex items-center justify-center gap-2 rounded py-2 ${
//             request.status === 'approved'
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-green-600 hover:cursor-pointer text-white'
//           }`}
//         >
//           <CheckCircle size={16} /> Approve
//         </button>

//         <button
//           disabled={request.status === 'denied'}
//           onClick={() => {
//             onDeny(comment);
//             setComment('');
//           }}
//           className={`flex-1 h-fit flex items-center justify-center gap-2 rounded py-2 ${
//             request.status === 'denied'
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-red-600 hover:cursor-pointer text-white'
//           }`}
//         >
//           <XCircle size={16} /> Deny
//         </button>
//       </div>
//     </div>
//   );
// }

