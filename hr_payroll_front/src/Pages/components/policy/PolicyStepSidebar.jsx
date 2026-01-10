// src/components/policy/PolicyStepSidebar.jsx
import React from 'react';

const STEPS = [
  { id: 'general', label: 'General Info', icon: '🏢' },
  { id: 'attendance', label: 'Attendance Rules', icon: '⏰' },
  { id: 'leave', label: 'Leave Policy', icon: '✈️' },
  { id: 'tax', label: 'Tax & Statutory', icon: '💰' },
  { id: 'shift', label: 'Shift Management', icon: '🔄' },
];

const PolicyStepSidebar = ({ activeStep, onStepChange }) => {
  return (
    <nav className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sticky top-6">
        <h3 className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
          Policy Sections
        </h3>
        <ul className="space-y-1">
          {STEPS.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <li key={step.id}>
                <button
                  onClick={() => onStepChange(step.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  {step.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default PolicyStepSidebar;