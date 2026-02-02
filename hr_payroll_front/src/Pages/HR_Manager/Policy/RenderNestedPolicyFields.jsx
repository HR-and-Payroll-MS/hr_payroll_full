import React, { useState, useMemo, useCallback } from 'react';
import Dropdown from '../../../Components/Dropdown';
import DocumentList from '../../../Components/DocumentList';
import AddNewItemModal from '../../../utils/AddNewItemModal';
import { policyFormSchemas } from './PolicyFormSchemas';
import InputField from '../../../Components/InputField';
import { Trash2 } from 'lucide-react';

// Convert camelCase/snake_case → Human label
const humanLabel = (key) =>
  String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());

const RenderNestedPolicyFields = ({
  data,
  sectionKey,
  path = '',
  handleInputChange,
  editMode = {},
  handleAddItem,
  handleRemoveItem,
  formSchemas = {},
  userRole,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  // Payroll should not be allowed to edit policies; only HR/Manager/Admin can.
  const isManagement =
    userRole === 'HR Manager' || userRole === 'Manager' || userRole === 'Admin';
  const isEditing = !!editMode?.[sectionKey] && isManagement;

  // useMemo MUST be called before any early return to maintain hook order
  const entries = useMemo(() => (data ? Object.entries(data) : []), [data]);

  /** ---------------------------------------------
   * Modal opening for arrays (supports deeply nested schemas)
   * ----------------------------------------------*/
  const openAddModalFor = useCallback(
    (arrayKey, arrayPath) => {
      // retrieve schema from formSchemas dynamically using the path
      const pathSegments = arrayPath.split('.');
      let schema = formSchemas?.[sectionKey];
      pathSegments.forEach((seg) => {
        if (schema?.[seg]) schema = schema[seg];
      });

      // fallback: if schema is not found, just use an empty object
      const stableFields =
        schema && typeof schema === 'object' && !Array.isArray(schema)
          ? { ...schema }
          : {};

      setModalConfig({
        title: `Add to ${humanLabel(arrayKey)}`,
        fields: stableFields,
        arrayPath,
      });
      setModalOpen(true);
    },
    [formSchemas, sectionKey],
  );

  const onModalSave = useCallback(
    (newItem) => {
      if (!modalConfig) return;
      handleAddItem(sectionKey, modalConfig.arrayPath, newItem);
      setModalOpen(false);
      setModalConfig(null);
    },
    [modalConfig, handleAddItem, sectionKey],
  );

  // Early return AFTER all hooks
  if (!data) return <div className="text-sm text-gray-500">No data</div>;

  return (
    <div className="w-full flex flex-col gap-6">
      {entries.map(([key, value]) => {
        const fullPath = path ? `${path}.${key}` : key;

        // helper: derive schema for this fullPath (remove array indices)
        const getFieldSchema = (fullPath) => {
          try {
            const cleaned = fullPath.replace(/\[\d+\]/g, '');
            const segments = cleaned.split('.');
            let schema = formSchemas?.[sectionKey];
            for (let seg of segments) {
              if (!schema) return null;
              schema = schema[seg];
            }
            return schema || null;
          } catch (err) {
            return null;
          }
        };

        // --- NESTED OBJECT CONTAINER ---
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !value.__type
        ) {
          return (
            <div
              key={fullPath}
              className="w-full shadow-sm dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors"
            >
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500 rounded-full" />{' '}
                {humanLabel(key)}
              </h3>
              <MemoizedRenderFields
                data={value}
                sectionKey={sectionKey}
                path={fullPath}
                handleInputChange={handleInputChange}
                editMode={editMode}
                formSchemas={formSchemas}
                handleAddItem={handleAddItem}
                handleRemoveItem={handleRemoveItem}
                userRole={userRole}
              />
            </div>
          );
        }

        // --- ARRAY FIELD CONTAINER ---
        if (Array.isArray(value)) {
          return (
            <div
              key={fullPath}
              className="w-full rounded-xl p-5 shadow-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 dark:border-slate-800 transition-colors"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full" />{' '}
                  {humanLabel(key)}
                </h3>
                {isEditing && (
                  <button
                    onClick={() => openAddModalFor(key, fullPath)}
                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-tighter rounded-md shadow-sm hover:text-blue-600 transition-all active:scale-95"
                  >
                    + Add {humanLabel(key).replace(/s$/, '')}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {value.length === 0 && (
                  <div className="text-xs text-slate-400 italic p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    No {humanLabel(key).toLowerCase()} recorded
                  </div>
                )}

                {value.map((item, idx) => {
                  const itemPath = `${fullPath}[${idx}]`;

                  return (
                    <div
                      key={itemPath}
                      className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative group"
                    >
                      {isEditing && (
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() =>
                              handleRemoveItem(sectionKey, fullPath, idx)
                            }
                            className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                      {typeof item === 'object' ? (
                        <MemoizedRenderFields
                          data={item}
                          sectionKey={sectionKey}
                          path={itemPath}
                          handleInputChange={handleInputChange}
                          editMode={editMode}
                          formSchemas={formSchemas}
                          handleAddItem={handleAddItem}
                          handleRemoveItem={handleRemoveItem}
                          userRole={userRole}
                        />
                      ) : (
                        <div className="text-sm font-semibold dark:text-slate-200">
                          {String(item)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // --- FIELD ROW (Primitive, Dropdown, Docs) ---
        return (
          <div
            key={fullPath}
            className="w-full flex flex-col md:flex-row gap-2 md:items-center py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
          >
            <div className="min-w-[220px] text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
              {humanLabel(key)}
            </div>

            <div className="flex-1">
              {isEditing ? (
                value?.__type === 'dropdown' ? (
                  <Dropdown
                    options={value.options}
                    value={value.value}
                    placeholder={humanLabel(key)}
                    onChange={(v) =>
                      handleInputChange(sectionKey, `${fullPath}.value`, v)
                    }
                  />
                ) : value?.__type === 'documents' ? (
                  <DocumentList
                    files={value.value || []}
                    isEditing={isEditing}
                    onChange={(files) =>
                      handleInputChange(sectionKey, `${fullPath}.value`, files)
                    }
                  />
                ) : (
                  (() => {
                    const fieldSchema = getFieldSchema(fullPath);
                    const ftype = fieldSchema?.type || 'text';

                    if (ftype === 'boolean') {
                      return (
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) =>
                            handleInputChange(sectionKey, fullPath, e.target.checked)
                          }
                        />
                      );
                    }

                    // Use appropriate input types for time/date/number
                    const inputType = ftype === 'time' || ftype === 'date' || ftype === 'number' ? ftype : 'text';

                    return (
                      <input
                        type={inputType}
                        value={value ?? ''}
                        onChange={(e) =>
                          handleInputChange(
                            sectionKey,
                            fullPath,
                            // keep numbers as-is (string) — backend will validate
                            inputType === 'number' ? e.target.value : e.target.value,
                          )
                        }
                        className="w-full md:w-2/3 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      />
                    );
                  })()
                )
              ) : (
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {value?.__type === 'documents' ? (
                    <DocumentList files={value.value || []} isEditing={false} />
                  ) : value?.__type === 'dropdown' ? (
                    String(value.value)
                  ) : value ? (
                    String(value)
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600 italic font-normal text-xs uppercase tracking-tighter">
                      Empty
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* MODAL stays functional */}
      {modalConfig && (
        <AddNewItemModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setModalConfig(null);
          }}
          onSave={onModalSave}
          title={modalConfig.title}
          fields={modalConfig.fields}
        />
      )}
    </div>
  );
};

const MemoizedRenderFields = React.memo(RenderNestedPolicyFields);
export default MemoizedRenderFields;
