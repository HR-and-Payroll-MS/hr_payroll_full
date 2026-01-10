import React, { useState } from 'react';
import { POLICY_SCHEMAS } from './schemas';
import PolicySidebar from './components/PolicySidebar';
import PolicySectionLayout from './components/PolicySectionLayout';
import PolicyModal from './components/PolicyModal';

const PolicyPage = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStates, setEditStates] = useState({}); // Tracks { [tabName]: boolean }

  // ERP Master Data Store
  const [policyData, setPolicyData] = useState({
    General: { companyName: "Nexus Corp", version: "2.1.0", effectiveDate: "2025-01-01" },
    Attendance: { shiftStart: "08:30", gracePeriod: 10, lateThreshold: 15 },
    // ... initialize other 8 policies
  });

  const toggleEdit = (tab) => {
    setEditStates(prev => ({ ...prev, [tab]: !prev[tab] }));
  };

  const handleSaveSection = (tab, newData) => {
    setPolicyData(prev => ({ ...prev, [tab]: newData }));
    setEditStates(prev => ({ ...prev, [tab]: false }));
  };

  const activeSchemaKey = activeTab.toUpperCase().replace(/ & /g, '_').replace(/ /g, '_');

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased">
      <PolicySidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <PolicySectionLayout
            title={`${activeTab} Policy`}
            description={`Configure global ${activeTab.toLowerCase()} rules and compliance parameters.`}
            isEditing={editStates[activeTab]}
            onEdit={() => toggleEdit(activeTab)}
            onSave={() => toggleEdit(activeTab)} // In a real app, this sends to API
            onCancel={() => toggleEdit(activeTab)}
            onAddNew={() => setIsModalOpen(true)}
          >
            {/* Read-Only Summary View */}
            <div className="grid grid-cols-2 gap-8">
              {Object.entries(policyData[activeTab] || {}).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs font-bold text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-lg font-medium text-gray-800">
                    {Array.isArray(val) ? `${val.length} Items Configured` : String(val)}
                  </p>
                </div>
              ))}
            </div>
          </PolicySectionLayout>

          {/* Additional info footer for HR */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm italic">
            Note: Changes to {activeTab} policy will trigger an audit log and notify all department heads.
          </div>
        </div>
      </main>

      {/* Dynamic Modal for Adding/Deep Editing */}
      <PolicyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Configure ${activeTab}`}
        schema={POLICY_SCHEMAS[activeSchemaKey] || []}
        initialData={policyData[activeTab]}
        onSave={(data) => {
          handleSaveSection(activeTab, data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default PolicyPage;