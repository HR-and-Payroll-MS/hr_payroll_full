import React, { useState } from "react";
import Icon from "../../../../Components/Icon";

// Reusable InfoSection component
const InfoSection = ({ title, fields, editing, onEdit, onCancel, onSave }) => {
  const [localFields, setLocalFields] = useState(fields);

  const handleChange = (key, value) => {
    setLocalFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localFields);
  };

  return (
    <div className="border p-2 rounded-lg border-gray-200">
      {/* Header */}
      <div className="flex mx-4 py-4 border-b border-gray-200 items-center">
        <p className="flex-1 text-xl font-semibold text-gray-700">{title}</p>
        {editing ? null : (
          <button onClick={onEdit}>
            <Icon name="Edit" className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 p-4">
        {Object.keys(localFields).map((key) => (
          <div key={key} className="flex gap-2 flex-wrap">
            <p className="min-w-[140px] text-gray-400 capitalize">{key.replace(/_/g, " ")}</p>
            {editing ? (
              <input
                type="text"
                value={localFields[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-gray-700 w-64"
              />
            ) : (
              <p className="text-gray-700 font-semibold">{localFields[key]}</p>
            )}
          </div>
        ))}

        {/* Save / Cancel Buttons */}
        {editing && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-1 rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const General= ()=> {
  const [editSection, setEditSection] = useState(null);

  // Initial data
  const [personalInfo, setPersonalInfo] = useState({
    full_name: "Pristia Candra Nelson",
    gender: "Female",
    date_of_birth: "23 May 1997",
    marital_status: "-",
    nationality: "Ethiopian",
    personal_taxid: "-",
    email_address: "someEmail@gmail.com",
    social_insurance: "-",
    health_insurance: "ABC Insurance",
    phone_number: "0972334145",
  });

  const [addressInfo, setAddressInfo] = useState({
    primary_address: "Addis Ababa, Ethiopia, Adisu Gebeya",
    country: "Ethiopia",
    state_province: "Central Ethiopia",
    city: "Addis Ababa",
    post_code: "1000",
  });

  const [emergencyContact, setEmergencyContact] = useState({
    full_name: "Eyoooob Taaaye Abeeeebe",
    phone_number: "023564665",
    state_province: "Central Ethiopia",
    city: "Addis Ababa",
    post_code: "1000",
  });

  return (
    <div className="flex flex-col gap-8 scrollbar-hidden overflow-y-scroll p-4 bg-gray-50 dark:bg-slate-900">
      {/* Personal Info Section */}
      <InfoSection
        title="Personal Info"
        fields={personalInfo}
        editing={editSection === "personal"}
        onEdit={() => setEditSection("personal")}
        onCancel={() => setEditSection(null)}
        onSave={(updated) => {
          setPersonalInfo(updated);
          setEditSection(null);
        }}
      />

      {/* Address Section */}
      <InfoSection
        title="Address"
        fields={addressInfo}
        editing={editSection === "address"}
        onEdit={() => setEditSection("address")}
        onCancel={() => setEditSection(null)}
        onSave={(updated) => {
          setAddressInfo(updated);
          setEditSection(null);
        }}
      />

      {/* Emergency Contact Section */}
      <InfoSection
        title="Emergency Contact"
        fields={emergencyContact}
        editing={editSection === "emergency"}
        onEdit={() => setEditSection("emergency")}
        onCancel={() => setEditSection(null)}
        onSave={(updated) => {
          setEmergencyContact(updated);
          setEditSection(null);
        }}
      />
    </div>
  );
};
