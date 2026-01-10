

const ClockoutModal = ({ isOpen, close , onclick }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35  px-4"
      onClick={close}
    >
      {/* Modal Container */}
      <div 
        className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Clock out at 08:00:05
        </h2>
        
        {/* Info Row */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>
            Your total working time for today is <span className="font-bold text-slate-900">08h 00m 05s</span>
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-500 mb-2">
            Notes
          </label>
          <textarea 
            className="w-full min-h-[120px] rounded-lg border border-slate-200 p-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
            placeholder="Input notes here"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={close}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              console.log("Clocked out successfully");
              close();
            }}
            className="flex-1 rounded-lg bg-[#0f172a] py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
          >
            Clock Out
          </button>
        </div>
      </div>
    </div>
  );
};
export default ClockoutModal