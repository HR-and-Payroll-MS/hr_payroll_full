import React from "react";
import RenderNestedPolicyFields from "./RenderNestedPolicyFields";
import Icon from "../../../Components/Icon";
import { policyFormSchemas } from "./PolicyFormSchemas";

// Map step index to policy key in policyData
const stepMap = [
  "general",
  "attendancePolicy",
  "leavePolicy",
  "holidayPolicy",
  "shiftPolicy",
  "overtimePolicy",
  "disciplinaryPolicy",
  "jobStructurePolicy",
  "salaryStructurePolicy",
];

const prettyTitle = {
  general: "General Information",
  attendancePolicy: "Attendance Policy",
  leavePolicy: "Leave Policy",
  holidayPolicy: "Holiday Policy",
  shiftPolicy: "Shift Policy",
  overtimePolicy: "OverTime Policy",
  disciplinaryPolicy: "Disciplinary Policy",
  jobStructurePolicy: "Job Structure Policy",
  salaryStructurePolicy: "Salary Structure Policy",
};

const RenderStepPolicy = ({
  currentStep,
  editMode,
  policyData,
  handleInputChange,
  handleSave,
  handleCancel,
  handleEditToggle,
  handleAddItem,
  handleRemoveItem,
  userRole,
  TitleOff=false
}) => {
  const sectionKey = stepMap[currentStep];

  const isManagement = userRole === 'Manager' || userRole === 'Payroll';

  if (!sectionKey) return null;

 return (
  <div className="flex-1 flex-col flex transition-colors">
    {/* STICKY HEADER - Updated to Slate/Dark Mode */}
    <div className="flex p-4 z-10 bg-white dark:bg-slate-800/90 dark:backdrop-blur-sm shadow-sm sticky top-0 justify-between items-center mb-2 border-b border-slate-100 dark:border-slate-700">
      {!TitleOff && (
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
          {prettyTitle[sectionKey]}
        </h2>
      )}

      {isManagement ? (
        editMode?.[sectionKey] ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(sectionKey)}
              className="px-4 py-1.5 shadow-sm bg-emerald-500 text-white font-bold text-xs rounded-md hover:bg-emerald-600 transition-all active:scale-95"
            >
              Save
            </button>
            <button
              onClick={() => handleCancel(sectionKey)}
              className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 font-bold text-xs rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleEditToggle(sectionKey)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-all"
          >
            <Icon className="w-4 h-4" name={"Pen"} />
          </button>
        )
      ) : null}
    </div>

    {/* CONTENT AREA */}
    <div className="flex flex-1 gap-5 p-6 justify-start items-start flex-wrap bg-white dark:bg-slate-800 transition-colors">
      <RenderNestedPolicyFields
        data={policyData?.[sectionKey]}
        sectionKey={sectionKey}
        handleInputChange={handleInputChange}
        editMode={editMode}
        handleAddItem={handleAddItem}
        handleRemoveItem={handleRemoveItem}
        formSchemas={policyFormSchemas}
        userRole={userRole}
      />
    </div>
  </div>
);
};

export default RenderStepPolicy;