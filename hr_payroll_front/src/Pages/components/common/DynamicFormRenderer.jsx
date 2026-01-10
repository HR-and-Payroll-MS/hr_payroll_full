// src/components/common/DynamicFormRenderer.jsx
import React, { useState, useEffect } from "react";

const DynamicFormRenderer = ({ schema, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {});

  // Reset form when opening/closing or switching modes
  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      {schema.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 uppercase mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          
          {field.type === "select" ? (
            <select
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">Select...</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 border rounded">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default DynamicFormRenderer;