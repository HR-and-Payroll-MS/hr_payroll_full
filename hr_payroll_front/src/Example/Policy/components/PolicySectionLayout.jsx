import React from 'react';

const PolicySectionLayout = ({ 
  title, 
  description, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onAddNew, 
  children 
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              {onAddNew && (
                <button 
                  onClick={onAddNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold transition-colors"
                >
                  <span className="text-lg">➕</span> Add New
                </button>
              )}
              <button 
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
              >
                <span>✏️</span> Edit Section
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={onSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-100 transition-all"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={`p-6 ${isEditing ? 'bg-blue-50/10' : 'bg-white'}`}>
        {children}
      </div>
    </div>
  );
};

export default PolicySectionLayout;