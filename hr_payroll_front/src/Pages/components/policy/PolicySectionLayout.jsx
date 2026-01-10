// src/components/policy/PolicySectionLayout.jsx
import React from 'react';

const PolicySectionLayout = ({ 
  title, 
  description, 
  children, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] flex flex-col">
      {/* --- Standardized Header --- */}
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-xl">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>

        {/* --- Action Buttons --- */}
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={onSave}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded shadow-sm hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button 
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit Section
            </button>
          )}
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="p-8 flex-1">
        {/* We use a ring to highlight the area when in edit mode */}
        <div className={`transition-all duration-300 ${isEditing ? 'p-4 -m-4 rounded-lg bg-white ring-2 ring-blue-100' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PolicySectionLayout;