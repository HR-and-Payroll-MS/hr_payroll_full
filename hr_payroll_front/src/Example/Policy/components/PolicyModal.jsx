import React, { useState, useEffect } from 'react';
import DynamicFormRenderer from './DynamicFormRenderer';

export default function PolicyModal ({ isOpen, onClose, onSave, schema, initialData, title }) {
  const [draftData, setDraftData] = useState({});

  useEffect(() => {
    if (isOpen) setDraftData(initialData || {});
  }, [isOpen, initialData]);

  const handleChange = (name, value) => {
    setDraftData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          <DynamicFormRenderer 
            schema={schema} 
            formData={draftData} 
            onChange={handleChange} 
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(draftData)} 
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};