import React from "react";
import Dropdown from "../Components/Dropdown";

const FieldRenderer = ({ fieldKey, fieldDef, value, onChange }) => {
  // fieldDef: { type: 'text'|'number'|'time'|'date'|'dropdown'|'textarea'|'boolean', options?: [] , placeholder?: '' }
  const label = fieldDef.label ?? fieldKey.replace(/([A-Z])/g, " $1");

  switch (fieldDef.type) {
    case "number":
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
            placeholder={fieldDef.placeholder}
          />
        </div>
      );
    case "time":
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <input
            type="time"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      );
    case "date":
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      );
    case "dropdown":
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <Dropdown padding="p-1"
            options={fieldDef.options || []}
            placeholder={fieldDef.placeholder || `Select ${label}`}
            value={value}
            onChange={(v) => onChange(v)}
          />
        </div>
      );
    case "boolean":
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <select
            value={typeof value === "boolean" ? (value ? "true" : "false") : value ?? ""}
            onChange={(e) => onChange(e.target.value === "true")}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">Select</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      );
      case "textarea":
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded px-2 py-1"
            rows={4}
          />
        </div>
      );
    default:
      // text
      return (
        <div>
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder={fieldDef.placeholder}
          />
        </div>
      );
  }
};

export default FieldRenderer;