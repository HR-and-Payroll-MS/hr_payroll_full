import React from "react";

export const RenderNestedPolicyFields = ({
  data,
  sectionKey,
  path = "",
  handleInputChange,
  editMode,
}) => {
  if (!data) return null;

  const isEditing = !!editMode?.[sectionKey];

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(data).map(([key, value]) => {
        const fullPath = path ? `${path}.${key}` : key; // e.g. gracePeriod.minutesAllowed

        // -------------------------
        // 1. Value is an object → recurse
        // -------------------------
        if (typeof value === "object" && !Array.isArray(value)) {
          return (
            <div key={fullPath} className="p-3 border rounded bg-slate-50">
              <h3 className="font-semibold mb-2">{key.replace(/([A-Z])/g, " $1")}</h3>
              <RenderNestedPolicyFields
                data={value}
                sectionKey={sectionKey}
                path={fullPath}
                handleInputChange={handleInputChange}
                editMode={editMode}
              />
            </div>
          );
        }

        // -------------------------
        // 2. Value is an array → render list or nested array items
        // -------------------------
        if (Array.isArray(value)) {
          return (
            <div key={fullPath} className="p-3 border rounded bg-slate-50">
              <h3 className="font-semibold mb-2">{key}</h3>

              {value.map((item, index) =>
                typeof item === "object" ? (
                  <div
                    key={index}
                    className="border p-2 mb-2 rounded bg-white"
                  >
                    <RenderNestedPolicyFields
                      data={item}
                      sectionKey={sectionKey}
                      path={`${fullPath}[${index}]`}
                      handleInputChange={handleInputChange}
                      editMode={editMode}
                    />
                  </div>
                ) : (
                  <div key={index}>
                    <p>{item}</p>
                  </div>
                )
              )}
            </div>
          );
        }
// -------------------------
        // 3. Primitive value → input or text
        // -------------------------
        const label = key.replace(/([A-Z])/g, " $1");

        return (
          <div key={fullPath} className="flex gap-3 items-center">
            <span className="text-gray-400 min-w-40">{label}</span>
            {isEditing ? (
              <input
                className="border rounded px-2"
                value={value}
                onChange={(e) =>
                  handleInputChange(sectionKey, fullPath, e.target.value)
                }
              />
            ) : (
              <span className="font-semibold">{value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};