// FormBuilder.jsx
import React, { useState } from "react";
import FormFieldEditor from "./FormField";
import InputField from "../Components/InputField";
import FormRenderer from "./FormRenderer";
import FileDrawer from "../Components/FileDrawer";

export default function FormBuilder({ formData, setFormData }) {
  const addField = (section) => {
    const newField = {
      id: Date.now().toString(),
      name: "New Field",
      type: section === "performanceMetrics" ? "number" : "text",
      weight: section === "performanceMetrics" ? 10 : 0,
      options: [],
    };

    setFormData((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), newField],
    }));
  };

  const updateField = (section, id, updates) => {
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] || []).map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  };

  const deleteField = (section, id) => {
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] || []).filter((f) => f.id !== id),
    }));
  };

  const addOption = (section, fieldId) => {
    const newOpt = { id: Date.now().toString(), label: "Option", point: 0 };
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] || []).map((f) =>
        f.id === fieldId
          ? { ...f, options: [...(f.options || []), newOpt] }
          : f
      ),
    }));
  };

  const updateOption = (section, fieldId, optId, updates) => {
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] || []).map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          options: (f.options || []).map((o) =>
            o.id === optId ? { ...o, ...updates } : o
          ),
        };
      }),
    }));
  };

  const deleteOption = (section, fieldId, optId) => {
    setFormData((prev) => ({
      ...prev,
      [section]: (prev[section] || []).map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          options: (f.options || []).filter((o) => o.id !== optId),
        };
      }),
    }));
  };

  const [isFormPreviewOpen, setFormPreviewOpen] = useState(false);
  const [isJsonPreviewOpen, setJsonPreviewOpen] = useState(false);

  const openFormPreview = () => {
    setJsonPreviewOpen(false);
    setFormPreviewOpen(true);
  };

  const openJsonPreview = () => {
    setFormPreviewOpen(false);
    setJsonPreviewOpen(true);
  };
return (
  <div className="mx-auto p-8 bg-white dark:bg-slate-800 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 border-slate-200  rounded-2xl  transition-colors shadow-sm">
    <div className="mb-10 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
        Form Title
      </label>
      <InputField
        searchMode="input"
        border="inset-shadow-2xs border border-slate-200 dark:border-slate-700"
        maxWidth="bg-white dark:bg-slate-900"
        suggestion={false}
        placeholder="Employee Efficiency Format"
        icon={false}
        value={formData?.title || ""}
        onSelect={(e) => setFormData({ ...formData, title: e })}
      />
    </div>
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
          Performance Metrics <span className="text-slate-400 font-medium ml-2">(Scorable)</span>
        </h2>
      </div>

      <div className="space-y-4">
        {(formData?.performanceMetrics || []).map((field) => (
          <FormFieldEditor
            key={field.id}
            field={field}
            section="performanceMetrics"
            onUpdate={(id, updates) => updateField("performanceMetrics", id, updates)}
            onDelete={() => deleteField("performanceMetrics", field.id)}
            onAddOption={() => addOption("performanceMetrics", field.id)}
            onUpdateOption={(optId, updates) => updateOption("performanceMetrics", field.id, optId, updates)}
            onDeleteOption={(optId) => deleteOption("performanceMetrics", field.id, optId)}
          />
        ))}
      </div>

      <button
        onClick={() => addField("performanceMetrics")}
        className="mt-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
      >
        <span className="text-blue-500 text-lg leading-none">+</span> Add Scorable Field
      </button>
    </section>
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
          Feedback Sections <span className="text-slate-400 font-medium ml-2">(Non-scorable)</span>
        </h2>
      </div>

      <div className="space-y-4">
        {(formData?.feedbackSections || []).map((field) => (
          <FormFieldEditor
            key={field.id}
            field={field}
            section="feedbackSections"
            onUpdate={(id, updates) => updateField("feedbackSections", id, updates)}
            onDelete={() => deleteField("feedbackSections", field.id)}
            onAddOption={() => addOption("feedbackSections", field.id)}
            onUpdateOption={(optId, updates) => updateOption("feedbackSections", field.id, optId, updates)}
            onDeleteOption={(optId) => deleteOption("feedbackSections", field.id, optId)}
          />
        ))}
      </div>

      <button
        onClick={() => addField("feedbackSections")}
        className="mt-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
      >
        <span className="text-emerald-500 text-lg leading-none">+</span> Add Feedback Field
      </button>
    </section>
    <div className="flex gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
      <button
        onClick={() => setFormPreviewOpen(true)}
        className="text-[11px] font-black uppercase tracking-widest px-6 py-3 bg-slate-800 dark:bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all active:scale-95"
      >
        Live Preview
      </button>

      <button
        onClick={() => setJsonPreviewOpen(true)}
        className="text-[11px] font-black uppercase tracking-widest px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all active:scale-95"
      >
        Live JSON
      </button>
    </div>
    {isFormPreviewOpen && (
      <FileDrawer
        transparency="bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm"
        width="w-1/2"
        isModalOpen={isFormPreviewOpen}
        closeModal={() => setFormPreviewOpen(false)}
      >
        <div className="p-8 bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6">Live FORM Preview</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <FormRenderer savedForm={formData} />
          </div>
        </div>
      </FileDrawer>
    )}
    {isJsonPreviewOpen && (
      <FileDrawer
        transparency="bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm"
        width="w-1/2"
        isModalOpen={isJsonPreviewOpen}
        closeModal={() => setJsonPreviewOpen(false)}
      >
        <div className="p-8 bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-6">Live JSON Preview</h3>
          <pre className="bg-slate-900 dark:bg-black text-emerald-400 p-6 rounded-xl overflow-x-auto text-xs font-mono shadow-2xl border border-slate-800 leading-relaxed">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </FileDrawer>
    )}
  </div>
);
}