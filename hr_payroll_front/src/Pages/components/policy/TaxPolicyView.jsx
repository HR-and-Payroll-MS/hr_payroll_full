// src/components/policy/TaxPolicyView.jsx
import React, { useState } from 'react';
import PolicySectionLayout from './PolicySectionLayout'; // Wrapper for Title/Save/Cancel
import PolicyModal from '../common/PolicyModal';
import DynamicFormRenderer from '../common/DynamicFormRenderer';
import { formSchemas } from '../utils/formSchemas';

// Mock Data Structure
const INITIAL_DATA = [
  {
    id: 1,
    code: "PAYE",
    description: "Pay As You Earn",
    versions: [
      { id: 101, versionName: "2024 Rates", percentage: 30, validFrom: "2024-01-01", isActive: "true" }
    ]
  }
];

const TaxPolicyView = () => {
  const [taxCodes, setTaxCodes] = useState(INITIAL_DATA);
  const [isEditingSection, setIsEditingSection] = useState(false);
  
  // Modal State: Controls visibility and context (Are we editing a code? or a version?)
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    schemaType: null, // 'taxCode' or 'taxVersion'
    parentId: null,   // Needed when adding a version to a specific tax code
    data: null        // If null -> ADD mode. If object -> EDIT mode.
  });

  // --- ACTIONS ---

  // 1. Open Modal for NEW Tax Code
  const handleAddTaxCode = () => {
    setModalConfig({ isOpen: true, schemaType: 'taxCode', data: null });
  };

  // 2. Open Modal for NEW Version
  const handleAddVersion = (taxCodeId) => {
    setModalConfig({ isOpen: true, schemaType: 'taxVersion', parentId: taxCodeId, data: null });
  };

  // 3. Open Modal to EDIT Existing Version
  const handleEditVersion = (taxCodeId, versionData) => {
    setModalConfig({ isOpen: true, schemaType: 'taxVersion', parentId: taxCodeId, data: versionData });
  };

  // 4. Handle Modal Submit (The Brain)
  const handleFormSubmit = (formData) => {
    if (modalConfig.schemaType === 'taxCode') {
      // Add new Tax Code
      const newCode = { ...formData, id: Date.now(), versions: [] };
      setTaxCodes([...taxCodes, newCode]);
    } 
    else if (modalConfig.schemaType === 'taxVersion') {
      // Add or Update Version
      setTaxCodes(prevCodes => prevCodes.map(code => {
        if (code.id !== modalConfig.parentId) return code;
        
        // Are we editing an existing version?
        const isEdit = !!modalConfig.data;
        
        let newVersions;
        if (isEdit) {
           newVersions = code.versions.map(v => v.id === modalConfig.data.id ? { ...formData, id: v.id } : v);
        } else {
           newVersions = [...code.versions, { ...formData, id: Date.now() }];
        }
        return { ...code, versions: newVersions };
      }));
    }
    setModalConfig({ isOpen: false, schemaType: null, parentId: null, data: null });
  };

  return (
    <PolicySectionLayout
      title="Tax & Statutory Policy"
      description="Manage tax codes and historical versioning."
      isEditing={isEditingSection}
      onEdit={() => setIsEditingSection(true)}
      onSave={() => { console.log("Saving to API:", taxCodes); setIsEditingSection(false); }}
      onCancel={() => { setIsEditingSection(false); /* Reset data here in real app */ }}
    >
      {/* ADD BUTTON (Only visible in Edit Mode) */}
      {isEditingSection && (
        <button 
          onClick={handleAddTaxCode}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100 transition text-sm font-medium"
        >
          + Add New Tax Code
        </button>
      )}

      {/* TAX CODE LIST */}
      <div className="space-y-6">
        {taxCodes.map((tax) => (
          <div key={tax.id} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            
            {/* Tax Code Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{tax.code}</h3>
                <p className="text-sm text-gray-500">{tax.description}</p>
              </div>
              {isEditingSection && (
                 <button onClick={() => handleAddVersion(tax.id)} className="text-xs bg-white border px-3 py-1 rounded shadow-sm hover:bg-gray-100">
                   + Add Version
                 </button>
              )}
            </div>

            {/* Versions Table */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="p-3">Version</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Valid Dates</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tax.versions.map((ver) => (
                    <tr key={ver.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{ver.versionName}</td>
                      <td className="p-3">{ver.percentage}%</td>
                      <td className="p-3 text-gray-500">{ver.validFrom} → {ver.validTo || "Active"}</td>
                      <td className="p-3 text-right">
                        <button 
                          disabled={!isEditingSection}
                          onClick={() => handleEditVersion(tax.id, ver)}
                          className={`text-blue-600 font-medium ${!isEditingSection ? 'opacity-30 cursor-not-allowed' : 'hover:underline'}`}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* REUSABLE MODAL */}
      <PolicyModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.data ? "Edit Item" : "Add New Item"}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
      >
        <DynamicFormRenderer
          // Selects the correct schema based on what button was clicked
          schema={modalConfig.schemaType ? formSchemas[modalConfig.schemaType] : []} 
          initialData={modalConfig.data}
          onSubmit={handleFormSubmit}
          onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        />
      </PolicyModal>

    </PolicySectionLayout>
  );
};

export default TaxPolicyView;