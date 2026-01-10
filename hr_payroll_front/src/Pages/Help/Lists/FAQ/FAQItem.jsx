import React, { useState } from 'react';

const FAQItem = ({ faq, userRole, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`
        transition-all duration-300 rounded-xl border 
        
        bg-white border-gray-100 shadow
        
        dark:bg-[#1e293b]/40 dark:border-slate-800/60 dark:shadow-xs dark:shadow-slate-900 dark:inset-shadow-xs dark:inset-shadow-green-700/25 backdrop-blur-sm
        ${isOpen ? 'ring-1 ring-green-500/50' : 'hover:border-green-400 dark:hover:border-slate-600'}
        w-full mb-4
      `}
    >
      
      {/* Header / Question */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-6 cursor-pointer flex justify-between items-center select-none"
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
              {faq.category}
            </span>
            {/* HR Status Badge */}
            {userRole === 'HR_ADMIN' && faq.status === 'draft' && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">
                Draft
              </span>
            )}
          </div>
          <h3 className={`text-base font-semibold transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {faq.question}
          </h3>
        </div>

        {/* Chevron Icon (Matching your SVG style) */}
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <img 
            className="h-4 dark:invert opacity-50" 
            src="\svg\down-arrow-5-svgrepo-com.svg" 
            alt="toggle" 
          />
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-[300px] opacity-100 overflow-y-auto hover-bar' : 'max-h-0 opacity-0 overflow-hidden'}
        `}
      >
        <div className="px-6 pb-6">
          <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5">
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">
              {faq.answer}
            </p>
            
            {/* HR ACTIONS */}
            {(userRole === 'HR_ADMIN' || userRole === 'Manager') && (
              <div className="mt-6 flex gap-5 justify-end border-t border-dashed border-gray-100 dark:border-slate-800 pt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(faq); }}
                  className="text-[11px] uppercase tracking-wider text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>✏️</span> Edit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(faq.id); }}
                  className="text-[11px] uppercase tracking-wider text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQItem;