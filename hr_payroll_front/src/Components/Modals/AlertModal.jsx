import React, { useEffect, useState } from "react";

const AlertModal = ({ isOpen, close, type = "error", message }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (type === "success") setShowConfetti(true);
      
      const timer = setTimeout(() => {
        close();
        setShowConfetti(false);
      }, 4000); // Extended slightly to enjoy the animation
      return () => clearTimeout(timer);
    }
  }, [isOpen, close, type]);

  if (!isOpen) return null;

  const isError = type === "error";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 px-4 transition-all"
      onClick={close}
    >
      {/* Confetti Animation Container */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-bounce w-3 h-3 rounded-sm ${
                ["bg-yellow-400", "bg-blue-400", "bg-red-500", "bg-emerald-400"][i % 4]
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: 0.7
              }}
            />
          ))}
        </div>
      )}

      <div 
        className={`relative w-full max-w-sm transform overflow-hidden rounded p-8 shadow-2xl transition-all  
          ${isError 
            ? "bg-white dark:bg-slate-800 border-rose-100 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 " 
            : "bg-white dark:bg-slate-800 border-emerald-100 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 "
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration / Error Icon Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className={`mb-4 px-2 pb-4 rounded-full animate-in zoom-in duration-300 ${
            isError ? "bg-rose-50 dark:bg-rose-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"
          }`}>
            {isError ? (
              <span className="text-4xl">⚠️</span>
            ) : (
              <span className="text-5xl animate-bounce inline-block">🎉</span>
            )}
          </div>

          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
            {window.location.hostname}
          </h3>

          <p className={`text-lg font-bold leading-tight mb-2 ${
            isError ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white"
          }`}>
            {isError ? "System Oversight" : "Cheers! Success"}
          </p>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button 
            onClick={close}
            className={`w-full py-3  rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow
              ${isError 
                ? "bg-red-500 text-white shadow-rose-500/20 hover:bg-red-700" 
                : "bg-blue-500 dark:bg-blue-600 text-white shadow-blue-500/20 hover:opacity-90"
              }`}
          >
            Acknowledge
          </button>
        </div>

        {/* Progress Bar (Timer Visual) */}
        
      </div>
    </div>
  );
};

export default AlertModal;


// // Error Usage
// <AlertModal 
//   isOpen={showError} 
//   close={() => setShowError(false)} 
//   type="error" 
//   message="You do not have permission to perform this action." 
// />

// // Success Usage
// <AlertModal 
//   isOpen={showSuccess} 
//   close={() => setShowSuccess(false)} 
//   type="success" 
//   message="Profile updated successfully!" 
// />