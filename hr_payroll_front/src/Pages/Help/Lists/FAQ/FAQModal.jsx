import React, { useState, useEffect } from 'react';

const FAQModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    category: 'General',
    question: '',
    answer: '',
    status: 'published'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/50 dark:bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="text-center gap-3.5 justify-center dark:shadow-2xl dark:inset-shadow-2xs dark:inset-shadow-slate-700 shadow-2xl inset-shadow-2xs inset-shadow-white items-center rounded h-fit lg:w-4/12 sm:w-3/5 md:w-5/12 px-6 pb-8 dark:bg-slate-800 dark:text-slate-300 bg-white flex flex-col animate-scaleIn">
        
        {/* Modal Header */}
        <div className="flex flex-col items-center gap-1 pt-6 w-full">
          <div className="flex justify-end w-full absolute top-4 right-6">
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 transition-colors">
               ✕
             </button>
          </div>
          <p className="font-bold text-3xl text-slate-800 dark:text-slate-100">
            {initialData ? 'Edit FAQ' : 'Add New FAQ'}
          </p>
          <p className="font-semibold text-wrap dark:text-slate-400 text-slate-500 text-sm">
            Configure the details below
          </p>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 text-left mt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded p-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-800 outline-none dark:text-slate-200"
              >
                <option value="General">General</option>
                <option value="Payroll">Payroll</option>
                <option value="Leave">Leave</option>
                <option value="Benefits">Benefits</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded p-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-800 outline-none dark:text-slate-200"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Question</label>
            <input 
              type="text" 
              required
              value={formData.question}
              onChange={(e) => setFormData({...formData, question: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded p-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-800 outline-none dark:text-slate-200"
              placeholder="Enter the question..."
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Answer</label>
            <textarea 
              required
              rows="4"
              value={formData.answer}
              onChange={(e) => setFormData({...formData, answer: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded p-2 text-sm font-semibold shadow-sm focus:ring-2 focus:ring-slate-800 dark:focus:ring-green-800 outline-none dark:text-slate-200 resize-none"
              placeholder="Enter the detailed answer..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-2">
            <button 
              type="submit"
              className="bg-slate-800 dark:bg-green-800 cursor-pointer w-full text-slate-100 py-2.5 rounded font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-transform"
            >
              Save Changes
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
            >
              Discard and Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FAQModal;