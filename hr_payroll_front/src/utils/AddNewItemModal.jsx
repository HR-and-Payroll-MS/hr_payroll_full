import React, { useState, useEffect, useMemo, useCallback } from "react";
import Modal from "../Components/Modal";
import FieldRenderer from "./FieldRenderer";
import { X } from "lucide-react"; // Matching your icon set

const AddNewItemModal = ({ isOpen, onClose, onSave, title = "Add item", fields = {}, initial = {} }) => {
  const [form, setForm] = useState({});

  const stableFields = useMemo(() => fields, [JSON.stringify(fields)]);
  const stableInitial = useMemo(() => initial, [JSON.stringify(initial)]);

  useEffect(() => {
    if (!isOpen) return;

    const init = {};
    Object.keys(stableFields).forEach((k) => {
      init[k] = stableInitial[k] ?? (stableFields[k].default ?? "");
    });

    setForm(init);
  }, [isOpen, stableFields, stableInitial]); 

  const setField = useCallback((k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} location="center" className="px-4">
      {/* Container with High-Fidelity Shadow and Border */}
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all duration-200 ease-out">
        <div className="animate-modal-in">
          
          {/* Header - Slate Dark Theme */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {Object.entries(stableFields).map(([key, def]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  {/* Field Label - Styled to match our FieldRenderer set */}
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                    {key.replace(/([A-Z])/g, ' $1').trim()} 
                  </label>
                  <FieldRenderer
                    fieldKey={key}
                    fieldDef={def}
                    value={form[key]}
                    onChange={(v) => setField(key, v)}
                  />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
              >
                Save {title.split(' ')[1] || 'Item'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-modal-in { animation: modalIn 220ms cubic-bezier(0.4, 0, 0.2, 1) both; }
      `}</style>
    </Modal>
  );
};

export default AddNewItemModal;