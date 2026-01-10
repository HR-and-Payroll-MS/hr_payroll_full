import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import InputField from '../../Components/InputField';

const NodeModal = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [formData, setFormData] = useState({ name: '', role: '', department: '', image: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { name: '', role: '', department: '', image: '' });
    }
  }, [isOpen, initialData]);

  const selectEmployee = (emp) => {
    console.log(emp?.photo); 
    setFormData({
      name: emp.fullname || emp.name, 
      role: emp.role || 'Staff', 
      department: emp.department || (emp.job ? emp.job.department : ''),
      image: emp.photo || (emp.general ? emp.general.photo : '')
    });
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/50 dark:bg-slate-950/75 backdrop-blur-sm p-4">
    {/* MODAL CONTAINER */}
    <div className="text-center gap-3.5 justify-center dark:shadow-2xl dark:inset-shadow-2xs dark:inset-shadow-slate-700 shadow-2xl inset-shadow-2xs inset-shadow-white items-center rounded h-fit lg:w-4/12 sm:w-3/5 md:w-5/12 px-6 pb-8 dark:bg-slate-800 dark:text-slate-300 bg-white flex flex-col animate-scaleIn relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col items-center gap-1 pt-6 w-full relative">
        <div className="flex justify-end w-full absolute top-0 right-0">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="font-bold text-3xl text-slate-800 dark:text-slate-100">
          {mode === 'edit' ? 'Edit Details' : 'Add Employee'}
        </p>
        <p className="font-semibold text-wrap dark:text-slate-400 text-slate-500 text-sm">
          Search and assign employee details
        </p>
      </div>

      {/* FORM SECTION */}
      <form 
        className="w-full space-y-4 text-left mt-4" 
        onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}
      >
        
        {/* SEARCH FIELD - Removed overflow-hidden so suggestions can show */}
        <div className="relative z-50"> 
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
            Search Employee
          </label>
          <InputField 
            maxWidth='w-full' 
            icon={true} 
            searchMode='api' 
            apiEndpoint="/employees/" 
            displayKey="fullname" 
            onSelect={selectEmployee} 
          />
        </div>

        {/* AUTO-FILL FIELDS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Name (Auto)
            </label>
            <input 
              disabled 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-none rounded text-sm font-semibold text-slate-700 dark:text-slate-400 cursor-not-allowed shadow-sm" 
              value={formData.name} 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
              Role (Auto)
            </label>
            <input 
              disabled 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-none rounded text-sm font-semibold text-slate-700 dark:text-slate-400 cursor-not-allowed shadow-sm" 
              value={formData.role} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
            Department (Auto)
          </label>
          <input 
            disabled 
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-none rounded text-sm font-semibold text-slate-700 dark:text-slate-400 cursor-not-allowed shadow-sm" 
            value={formData.department} 
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="pt-4 flex flex-col gap-2">
          <button 
            type="submit" 
            className="bg-slate-800 dark:bg-green-800 cursor-pointer w-full text-slate-100 py-2.5 rounded font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-transform"
          >
            {mode === 'edit' ? 'Save Changes' : 'Confirm & Add'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="w-full text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors py-1"
          >
            Discard
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export default NodeModal;