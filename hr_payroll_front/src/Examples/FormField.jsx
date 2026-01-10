// FormFieldEditor.jsx
import React from "react";
import InputField from "../Components/InputField";
import Dropdown from "../Components/Dropdown";
import Icon from "../Components/Icon";

export default function FormFieldEditor({
  field,
  section,
  onUpdate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}) {
  const isScorable = section === "performanceMetrics";
  const types = isScorable
    ? ["number", "dropdown"]
    : ["text", "textarea", "dropdown"];
return (
  <div className="mb-3 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all">
    <div className="flex gap-4 items-start">
      
      <div className="flex-1 flex flex-col gap-3">
        {/* Row 1: Label and Delete */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight mb-1 block">Field Label</label>
            <InputField 
              searchMode="input" 
              border="border border-slate-200 dark:border-slate-700" 
              maxWidth="bg-white dark:bg-slate-900" 
              suggestion={false} 
              placeholder="e.g., Performance" 
              icon={false} 
              value={field.name}
              onSelect={(e) => onUpdate(field.id, { name: e })}
            />
          </div>
          
          <button 
            onClick={onDelete} 
            className="mt-5 p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Icon name="Trash" className="w-4 h-4"/>
          </button>
        </div>

        {/* Row 2: Type & Weight (Compact Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Type</label>
            <Dropdown 
              placeholder={field.type} 
              className="bg-white dark:bg-slate-900 py-1"
              onChange={(e) => onUpdate(field.id, { type: e, options: e !== "dropdown" ? [] : field.options })} 
              options={types}
            />
          </div>

          {isScorable && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Weight</label>
              <input 
                type="number" 
                value={field.weight || 0} 
                onChange={(e) => onUpdate(field.id, { weight: +e.target.value })} 
                className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 outline-none rounded focus:border-blue-500 transition-all" 
                min="0" 
              />
            </div>
          )}
        </div>

        {/* COMPACT DROPDOWN OPTIONS */}
        {field.type === "dropdown" && (
          <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-2">
              {field.options.map((opt) => (
                <div key={opt.id} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <InputField 
                      searchMode="input"
                      border="border-slate-200 dark:border-slate-700"
                      maxWidth="bg-white dark:bg-slate-900"
                      suggestion={false} 
                      placeholder="Label" 
                      icon={false} 
                      value={opt.label}
                      onSelect={(e) => onUpdateOption(opt.id, { label: e })}
                    />
                  </div>

                  {isScorable && (
                    <input
                      type="number"
                      value={opt.point || 0}
                      onChange={(e) => onUpdateOption(opt.id, { point: +e.target.value })}
                      className="w-14 text-[10px] font-bold p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded"
                      placeholder="Pts"
                    />
                  )}
                  
                  <button onClick={() => onDeleteOption(opt.id)} className="text-slate-300 hover:text-red-500">
                    <Icon name="Trash" className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={onAddOption}
              className="mt-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:underline"
            >
              + Add Option
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
}