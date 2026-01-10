import React from 'react';

const DynamicFormRenderer = ({ schema, formData, onChange }) => {
  const handleNestedChange = (fieldName, index, subFieldName, value) => {
    const updatedArray = [...(formData[fieldName] || [])];
    updatedArray[index] = { ...updatedArray[index], [subFieldName]: value };
    onChange(fieldName, updatedArray);
  };

  const addNestedRow = (fieldName, fields) => {
    const newRow = fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {});
    onChange(fieldName, [...(formData[fieldName] || []), newRow]);
  };

  return (
    <div className="space-y-6">
      {schema.map((field) => {
        const val = formData[field.name] || '';

        // Handle standard inputs
        if (['text', 'number', 'date', 'time'].includes(field.type)) {
          return (
            <div key={field.name}>
              <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={val}
                onChange={(e) => onChange(field.name, e.target.value)}
              />
            </div>
          );
        }

        // Handle dropdowns
        if (field.type === 'dropdown') {
          return (
            <div key={field.name}>
              <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
              <select
                className="w-full border rounded-lg p-2 bg-white"
                value={val}
                onChange={(e) => onChange(field.name, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          );
        }

        // Handle Nested Arrays (Tax Brackets)
        if (field.type === 'nested_array') {
          return (
            <div key={field.name} className="border-t pt-4 mt-4">
              <label className="block text-sm font-black text-blue-900 uppercase mb-3">{field.label}</label>
              <div className="space-y-2">
                {(formData[field.name] || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-gray-50 p-2 rounded border">
                    {field.fields.map(sub => (
                      <div key={sub.name} className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">{sub.label}</label>
                        <input
                          type={sub.type}
                          className="w-full border text-sm p-1 rounded"
                          value={item[sub.name] || ''}
                          onChange={(e) => handleNestedChange(field.name, idx, sub.name, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => addNestedRow(field.name, field.fields)}
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  + Add {field.label} Row
                </button>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default DynamicFormRenderer;