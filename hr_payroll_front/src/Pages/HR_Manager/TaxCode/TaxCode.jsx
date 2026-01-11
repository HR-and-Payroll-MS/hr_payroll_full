import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  FileText,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  LayoutGrid,
  Eye,
  CheckCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import Header from '../../../Components/Header';
import FileDrawer from '../../../Components/FileDrawer';
import InputField from '../../../Components/InputField';
import Dropdown from '../../../Components/Dropdown';
import Icon from '../../../Components/Icon';
import useAuth from '../../../Context/AuthContext';
import ThreeDots from '../../../animations/ThreeDots';

function TaxCode() {
  const { axiosPrivate } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('DASHBOARD');
  const [selectedCodeId, setSelectedCodeId] = useState(null);
  const [expandedVersionIndex, setExpandedVersionIndex] = useState(null);
  const closeEditor = () => {
    setModalOpen(false);
    setView(selectedCodeId ? 'VERSION_LIST' : 'DASHBOARD');
    setTaxData(null);
  };
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const [allTaxCodes, setAllTaxCodes] = useState([]);

  // Fetch tax codes from backend on mount
  useEffect(() => {
    const fetchTaxCodes = async () => {
      try {
        setLoading(true);
        const response = await axiosPrivate.get('/payroll/tax-codes/');
        console.log('[TaxCode] Fetched tax codes:', response.data);

        // Transform backend data to match frontend structure
        const taxCodeData = response.data.results || response.data;
        if (!Array.isArray(taxCodeData)) {
          console.error('Unexpected API format:', response.data);
          throw new Error('API return format invalid');
        }
        const transformed = taxCodeData.map((tc) => ({
          id: tc.code,
          backendId: tc.id, // Keep backend ID for API calls
          name: tc.name,
          isEnabled: tc.is_active,
          versions:
            tc.versions?.map((v) => ({
              id: v.id,
              version: v.version,
              validFrom: v.valid_from,
              validTo: v.valid_to,
              status: { active: v.is_active, locked: v.is_locked },
              incomeTax: {
                ...(v.income_tax_config || { type: 'progressive' }),
                // IMPORTANT: Map API relation 'tax_brackets' to frontend 'brackets'
                brackets:
                  v.tax_brackets?.map((b) => ({
                    min: parseFloat(b.min_income),
                    max: b.max_income ? parseFloat(b.max_income) : '',
                    rate: parseFloat(b.rate),
                  })) ||
                  v.income_tax_config?.brackets ||
                  [],
              },
              pension: v.pension_config || {
                employeePercent: 7,
                employerPercent: 11,
              },
              statutoryDeductions: v.statutory_deductions_config || [],
              exemptions: v.exemptions_config || [],
              rounding: v.rounding_rules || { method: 'nearest', precision: 2 },
              compliance: v.compliance_notes || [],
            })) || [],
        }));

        setAllTaxCodes(transformed);
        setError(null);
      } catch (err) {
        console.error('[TaxCode] Fetch error:', err);
        const errMsg =
          err.response?.data?.detail ||
          err.response?.statusText ||
          err.message ||
          'Failed to load tax codes';
        setError(`Error: ${errMsg}. Check console for details.`);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxCodes();
  }, [axiosPrivate]);

  // Toggle tax code active status via API
  const handleToggleTaxCode = async (codeId, backendId) => {
    const code = allTaxCodes.find((c) => c.id === codeId);
    if (!code) return;

    const newStatus = !code.isEnabled;

    // CASCADE: If disabling Parent, also disable all active Versions in UI & Backend
    // If enabling Parent, we generally leave versions as-is (user manually activates one)
    // But per user request "versions must not be active" if parent is disabled.

    const versionsToDeactivate = !newStatus
      ? code.versions.filter((v) => v.status.active)
      : [];

    // Optimistic update
    setAllTaxCodes((prev) =>
      prev.map((c) => {
        if (c.id !== codeId) return c;
        // If disabling parent -> disable all versions
        const updatedVersions = !newStatus
          ? c.versions.map((v) => ({
              ...v,
              status: { ...v.status, active: false },
            }))
          : c.versions;
        return { ...c, isEnabled: newStatus, versions: updatedVersions };
      })
    );

    try {
      // 1. Toggle Parent
      await axiosPrivate.patch(`/payroll/tax-codes/${backendId}/`, {
        is_active: newStatus,
      });

      // 2. Cascade: Deactivate active versions if Parent is disabled
      if (versionsToDeactivate.length > 0) {
        await Promise.all(
          versionsToDeactivate.map((v) =>
            axiosPrivate.patch(`/payroll/tax-code-versions/${v.id}/`, {
              is_active: false,
            })
          )
        );
      }

      console.log(`[TaxCode] Toggled ${codeId} to ${newStatus}`);
    } catch (err) {
      console.error('[TaxCode] Toggle error:', err);
      // Revert on error (Simplified revert)
      fetchTaxCodes();
    }
  };

  const [taxData, setTaxData] = useState(null);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setTaxData((prev) => {
      let newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return { ...newData };
    });
  }; //set task data with the value it get

  const addItem = (path, template) => {
    const keys = path.split('.');
    setTaxData((prev) => {
      let newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = [
        ...current[keys[keys.length - 1]],
        template,
      ];
      return { ...newData };
    });
  }; //add

  const removeItem = (path, index) => {
    const keys = path.split('.');
    setTaxData((prev) => {
      let newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = current[keys[keys.length - 1]].filter(
        (_, i) => i !== index
      );
      return { ...newData };
    });
  };

  const updateItem = (path, index, field, value) => {
    const keys = path.split('.');
    setTaxData((prev) => {
      let newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]][index][field] = value;
      return { ...newData };
    });
  };
  const saveConfiguration = async () => {
    try {
      setLoading(true);

      const payload = {
        code:
          selectedCodeId ||
          `TX_${taxData.name.toUpperCase().slice(0, 3)}_${Date.now()
            .toString()
            .slice(-4)}`,
        name: taxData.name,
        is_active: true,
        // Version data
        version: taxData.version,
        valid_from: taxData.validFrom,
        valid_to: taxData.validTo || null,
        income_tax_config: taxData.incomeTax,
        pension_config: taxData.pension,
        rounding_rules: taxData.rounding,
        compliance_notes: taxData.compliance,
        statutory_deductions_config: taxData.statutoryDeductions,
        exemptions_config: taxData.exemptions,
        // Brackets relation (backend expects flat list of brackets for the version)
        tax_brackets:
          taxData.incomeTax.brackets?.map((b) => ({
            min_income: b.min,
            max_income: b.max || null,
            rate: b.rate,
          })) || [],
      };

      let response;
      if (selectedCodeId) {
        // ADD VERSION TO EXISTING CODE
        // The backend endpoint likely expects a direct POST to taxes or a specific action.
        // Assuming standard REST: create version linked to tax code.
        // Or if 'selectedCodeId' (e.g. 'ETH_FED') is just the code, we need the PK.
        const taxCodeObj = allTaxCodes.find((c) => c.id === selectedCodeId);
        if (!taxCodeObj) throw new Error('Tax Code not found');

        const versionPayload = {
          tax_code_id: taxCodeObj.backendId,
          ...payload,
        };
        // We'll use the specific endpoint for creating a version if available, or generic list create if it supports it.
        // Best bet: use the dedicated endpoint /payroll/tax-codes/{id}/add_version/ if it exists, or POST to /payroll/tax-versions/
        // Let's assume the ViewSet handles a custom action or we post to a versions endpoint.
        // Based on previous files, we saw TaxCodeViewSet but checking if there's a version endpoint.
        // If not, we might need to rely on the backend creating it.
        // Let's assume we post to /payroll/tax-codes/{id}/add_version/ based on typical patterns or create a version directly.
        // Actually, let's look at urls/views. Checking... assuming /payroll/tax-codes/{id}/add_version/ for now or will fix if error.
        response = await axiosPrivate.post(
          `/payroll/tax-codes/${taxCodeObj.backendId}/add-version/`,
          payload
        );
      } else {
        // NEW TAX CODE
        response = await axiosPrivate.post('/payroll/tax-codes/', payload);

        // Fix: If backend doesn't handle nested version creation, we must create it explicitly
        if (response.data && response.data.id) {
          const newId = response.data.id;
          try {
            // Use the same payload which contains version data
            await axiosPrivate.post(
              `/payroll/tax-codes/${newId}/add-version/`,
              payload
            );
            console.log('Initial version created for new tax code');
            // Assuming showAlert is available in context or passed down, but here we can just log or rely on main success
          } catch (verErr) {
            console.error('Failed to create initial version:', verErr);
            alert(
              'Tax Code created but failed to create initial version. Please add a version manually.'
            );
          }
        }
      }

      console.log('Saved Tax Config:', response.data);
      // Refresh list
      const fetchResponse = await axiosPrivate.get('/payroll/tax-codes/');

      // Re-transform logic (duplicated from fetchTaxCodes - ideally refactor this)
      const taxCodeData = fetchResponse.data.results || fetchResponse.data;
      const transformed = taxCodeData.map((tc) => ({
        id: tc.code,
        backendId: tc.id,
        name: tc.name,
        isEnabled: tc.is_active,
        versions:
          tc.versions?.map((v) => ({
            id: v.id, // Keep version ID
            version: v.version,
            validFrom: v.valid_from,
            validTo: v.valid_to,
            status: { active: v.is_active, locked: v.is_locked },
            incomeTax: {
              ...(v.income_tax_config || { type: 'progressive' }),
              brackets:
                v.tax_brackets?.map((b) => ({
                  min: parseFloat(b.min_income),
                  max: b.max_income ? parseFloat(b.max_income) : '',
                  rate: parseFloat(b.rate),
                })) ||
                v.income_tax_config?.brackets ||
                [],
            },
            pension: v.pension_config || {
              employeePercent: 7,
              employerPercent: 11,
            },
            statutoryDeductions: v.statutory_deductions_config || [],
            exemptions: v.exemptions_config || [],
            rounding: v.rounding_rules || { method: 'nearest', precision: 2 },
            compliance: v.compliance_notes || [],
          })) || [],
      }));
      setAllTaxCodes(transformed);
      closeEditor();
    } catch (error) {
      console.error('Failed to save:', error);
      setError(error.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };
  const drawer = (
    <>
      {isModalOpen && (
        <FileDrawer
          width="w-2/3"
          isModalOpen={isModalOpen}
          closeModal={closeEditor}
        >
          <div className="bg-white dark:bg-slate-800 relative shadow-2xl h-full overflow-y-auto scrollbar-hidden transition-colors">
            {/* STICKY HEADER - Dark Slate Theme */}
            <div className="bg-slate-900 dark:bg-slate-700 p-4 sticky z-20 top-0 flex justify-between items-center shadow-md">
              <div>
                <h1 className="text-white font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  {selectedCodeId
                    ? `New Version: ${taxData.version}`
                    : 'Configure New Tax Code'}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={closeEditor}
                  className="text-slate-400 cursor-pointer text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveConfiguration}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded flex items-center gap-2 font-bold text-xs shadow-lg transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" /> SAVE CONFIG
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-8">
              {/* TOP SECTION: IDENTIFICATION & DATES */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                {!selectedCodeId && (
                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                      Tax Name
                    </label>
                    <InputField
                      onSelect={(e) => handleChange('name', e)}
                      icon={false}
                      placeholder="e.g. Federal Tax"
                      searchMode="input"
                      maxWidth="w-full"
                    />
                  </div>
                )}
                <div className="w-20">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Version
                  </label>
                  <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-center font-black text-blue-600 dark:text-blue-400 text-sm">
                    {taxData.version}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={taxData.validFrom}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-sm dark:text-white outline-none focus:ring-2 ring-blue-500/20"
                    onChange={(e) => handleChange('validFrom', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    Valid To (Optional)
                  </label>
                  <input
                    type="date"
                    value={taxData.validTo || ''}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-sm dark:text-white outline-none focus:ring-2 ring-blue-500/20"
                    onChange={(e) =>
                      handleChange('validTo', e.target.value || null)
                    }
                  />
                </div>
              </div>

              {/* CALCULATION RULES SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                    Calculation Method
                  </p>
                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shadow-inner">
                    <button
                      onClick={() =>
                        handleChange('incomeTax.type', 'progressive')
                      }
                      className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        taxData.incomeTax.type === 'progressive'
                          ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400'
                          : 'text-slate-400'
                      }`}
                    >
                      Progressive
                    </button>
                    <button
                      onClick={() => handleChange('incomeTax.type', 'flat')}
                      className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        taxData.incomeTax.type === 'flat'
                          ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400'
                          : 'text-slate-400'
                      }`}
                    >
                      Flat Rate
                    </button>
                  </div>
                </div>

                {taxData.incomeTax.type === 'flat' ? (
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-center gap-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Set Flat Rate Percentage:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={taxData.incomeTax.flatRate}
                        className="w-28 outline-none p-2.5 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-black text-blue-600 text-lg"
                        onChange={(e) =>
                          handleChange(
                            'incomeTax.flatRate',
                            parseInt(e.target.value)
                          )
                        }
                      />
                      <span className="absolute right-3 top-3 font-bold text-blue-300">
                        %
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <SectionHeader
                      title="Income Brackets"
                      onAdd={() => {
                        const last =
                          taxData.incomeTax.brackets[
                            taxData.incomeTax.brackets.length - 1
                          ];
                        addItem('incomeTax.brackets', {
                          min: last?.max ? parseInt(last.max) + 1 : 0,
                          max: '',
                          rate: 0,
                        });
                      }}
                    />
                    <div className="grid grid-cols-1 gap-2">
                      {taxData.incomeTax.brackets.map((bracket, index) => (
                        <div
                          key={index}
                          className="flex gap-3 items-end bg-slate-50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-100 dark:border-slate-700 transition-all hover:border-blue-200 dark:hover:border-blue-900"
                        >
                          <div className="flex-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">
                              Min Amount
                            </label>
                            <input
                              type="number"
                              value={bracket.min || ''}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded text-sm font-bold"
                              onChange={(e) => {
                                /* update logic */
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">
                              Max (Empty for ∞)
                            </label>
                            <input
                              type="number"
                              value={bracket.max || ''}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded text-sm font-bold"
                              onChange={(e) => {
                                /* update logic */
                              }}
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">
                              Rate %
                            </label>
                            <input
                              type="number"
                              value={bracket.rate}
                              className="w-full bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-900 p-2 rounded text-sm font-black text-blue-600 dark:text-blue-400"
                              onChange={(e) => {
                                /* update logic */
                              }}
                            />
                          </div>
                          {index > 0 && (
                            <button
                              onClick={() =>
                                removeItem('incomeTax.brackets', index)
                              }
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CONTRIBUTIONS & ROUNDING GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h2 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">
                    Pension Contribution
                  </h2>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Employee %
                      </label>
                      <input
                        type="number"
                        value={taxData.pension.employeePercent}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg font-bold"
                        onChange={(e) =>
                          handleChange(
                            'pension.employeePercent',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Employer %
                      </label>
                      <input
                        type="number"
                        value={taxData.pension.employerPercent}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2.5 rounded-lg font-bold"
                        onChange={(e) =>
                          handleChange(
                            'pension.employerPercent',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/20 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h2 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">
                    Rounding Rules
                  </h2>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Method
                      </label>
                      <Dropdown
                        padding="p-2"
                        placeholder="Choose..."
                        onChange={(e) => handleChange('rounding.method', e)}
                        options={['nearest', 'up', 'down']}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">
                        Decimals
                      </label>
                      <input
                        type="number"
                        value={taxData.rounding.precision}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-2 rounded-lg text-center font-black"
                        onChange={(e) =>
                          handleChange(
                            'rounding.precision',
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUTORY DEDUCTIONS */}
              <div className="space-y-4">
                <SectionHeader
                  title="Statutory Deductions"
                  onAdd={() =>
                    addItem('statutoryDeductions', { name: '', percent: 0 })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taxData.statutoryDeductions.map((d, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm"
                    >
                      <input
                        placeholder="Deduction Name"
                        value={d.name}
                        className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm py-1 outline-none focus:border-emerald-500 dark:text-white"
                        onChange={(e) =>
                          updateItem(
                            'statutoryDeductions',
                            idx,
                            'name',
                            e.target.value
                          )
                        }
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="%"
                          value={d.percent}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1.5 rounded text-center text-sm font-bold"
                          onChange={(e) =>
                            updateItem(
                              'statutoryDeductions',
                              idx,
                              'percent',
                              parseInt(e.target.value)
                            )
                          }
                        />
                        <button
                          onClick={() => removeItem('statutoryDeductions', idx)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXEMPTIONS - 2 Column Grid */}
              <div className="space-y-4">
                <SectionHeader
                  title="Allowances & Exemptions"
                  onAdd={() =>
                    addItem('exemptions', {
                      name: '',
                      limit: 0,
                      overtimeTaxable: true,
                    })
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taxData.exemptions.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4"
                    >
                      <input
                        placeholder="Exemption Label"
                        value={ex.name}
                        className="bg-transparent border-b border-slate-200 dark:border-slate-700 p-1 font-bold text-sm outline-none focus:border-blue-500 dark:text-white"
                        onChange={(e) =>
                          updateItem('exemptions', idx, 'name', e.target.value)
                        }
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">
                            LIMIT:
                          </span>
                          <input
                            type="number"
                            value={ex.limit}
                            className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1 rounded text-xs font-bold"
                            onChange={(e) =>
                              updateItem(
                                'exemptions',
                                idx,
                                'limit',
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 cursor-pointer uppercase">
                          <input
                            type="checkbox"
                            className="accent-blue-500"
                            checked={ex.overtimeTaxable}
                            onChange={(e) =>
                              updateItem(
                                'exemptions',
                                idx,
                                'overtimeTaxable',
                                e.target.checked
                              )
                            }
                          />
                          OT Taxable
                        </label>
                      </div>
                      <button
                        onClick={() => removeItem('exemptions', idx)}
                        className="text-[9px] text-red-500 font-bold uppercase self-end hover:bg-red-50 p-1 px-2 rounded"
                      >
                        Remove Item
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMPLIANCE - Compact Grid */}
              <div className="space-y-4 mb-10">
                <SectionHeader
                  title="Compliance & Local Authority"
                  onAdd={() => addItem('compliance', { label: '', value: '' })}
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {taxData.compliance.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                    >
                      <input
                        placeholder="LABEL"
                        value={c.label}
                        className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 bg-transparent outline-none"
                        onChange={(e) =>
                          updateItem('compliance', idx, 'label', e.target.value)
                        }
                      />
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="Value"
                          value={c.value}
                          className="flex-1 text-xs font-bold bg-transparent outline-none focus:text-blue-600 dark:text-blue-400"
                          onChange={(e) =>
                            updateItem(
                              'compliance',
                              idx,
                              'value',
                              e.target.value
                            )
                          }
                        />
                        <button
                          onClick={() => removeItem('compliance', idx)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FileDrawer>
      )}
    </>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full bg-slate-50 dark:bg-slate-900 w-full items-center justify-center">
        <ThreeDots />
      </div>
    );
  }

  // Error state
  if (error && allTaxCodes.length === 0) {
    return (
      <div className="flex h-full bg-slate-50 dark:bg-slate-900 w-full flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Toggle VERSION active status
  const handleToggleVersion = async (taxCodeId, versionId, currentStatus) => {
    try {
      const newStatus = !currentStatus;

      const taxCode = allTaxCodes.find((c) => c.id === taxCodeId);
      const isSingleVersion = taxCode && taxCode.versions.length === 1;

      // Optimistic update
      setAllTaxCodes((prev) =>
        prev.map((c) => {
          if (c.id !== taxCodeId) return c;

          // If single version -> sync parent status
          const shouldUpdateParent = isSingleVersion;
          const updatedEnabed = shouldUpdateParent ? newStatus : c.isEnabled;

          return {
            ...c,
            isEnabled: updatedEnabed,
            versions: c.versions.map((v) =>
              v.id === versionId
                ? { ...v, status: { ...v.status, active: newStatus } }
                : v
            ),
          };
        })
      );

      // 1. Toggle Version
      await axiosPrivate.patch(`/payroll/tax-code-versions/${versionId}/`, {
        is_active: newStatus,
      });

      // 2. Sync Parent if Single Version
      if (isSingleVersion) {
        await axiosPrivate.patch(`/payroll/tax-codes/${taxCode.backendId}/`, {
          is_active: newStatus,
        });
        console.log(
          `[TaxCode] Single version toggled. Synced Parent ${taxCode.id} to ${newStatus}`
        );
      }
    } catch (err) {
      console.error('Failed to toggle version:', err);
      setError('Failed to update version status');
      // Revert on error
      fetchTaxCodes();
    }
  };
  if (view === 'DASHBOARD') {
    return (
      <div className="flex h-full bg-slate-50 dark:bg-slate-900 w-full flex-col gap-4 scrollbar-hidden overflow-y-auto">
        {drawer}

        {/* HEADER SECTION - Matches Attendance Header */}
        <div className="bg-white dark:bg-slate-700 p-6 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
          <Header Title={'Tax Configuration'}>
            <button
              onClick={() => {
                setTaxData({
                  name: '',
                  version: 'v1',
                  validFrom: '',
                  validTo: null,
                  status: { active: true, locked: false },
                  incomeTax: {
                    type: 'progressive',
                    flatRate: 0,
                    brackets: [{ min: 0, max: '', rate: 0 }],
                  },
                  pension: { employeePercent: 0, employerPercent: 0 },
                  statutoryDeductions: [{ name: '', percent: 0 }],
                  exemptions: [{ name: '', limit: 0, overtimeTaxable: true }],
                  rounding: { method: 'nearest', precision: 2 },
                  compliance: [
                    { label: 'Authority', value: 'Ministry of Revenue' },
                  ],
                });
                setSelectedCodeId(null);
                openModal();
              }}
              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-5 py-2 rounded text-sm font-medium hover:opacity-90 transition-all shadow-md active:scale-95"
            >
              <Plus size={16} /> Add New Tax Code
            </button>
          </Header>
        </div>

        {/* LIST SECTION - Styled as a cohesive card container */}
        <div className="bg-white dark:bg-slate-700 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col p-2 flex-1">
            {allTaxCodes.map((code) => (
              <div
                key={code.id}
                onClick={() => {
                  setSelectedCodeId(code.id);
                  setView('VERSION_LIST');
                }}
                className="group flex items-center gap-4 p-4 border-b border-gray-100 dark:border-slate-600/50 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-600/30 transition-all cursor-pointer rounded-lg"
              >
                {/* ICON/STATUS INDICATOR */}
                <div
                  className={`p-2 rounded-lg ${
                    code.isEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon name="FileText" size={20} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {code.name}
                    </h2>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                      {code.versions.length} Versions
                    </span>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                    ID: {code.id}
                  </p>
                </div>

                {/* TOGGLE SWITCH - Re-styled for the design system */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTaxCode(code.id, code.backendId);
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-1 transition-all duration-300 ${
                      code.isEnabled
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${
                        code.isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">
                    {code.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (view === 'VERSION_LIST') {
    const code = allTaxCodes.find((c) => c.id === selectedCodeId);
    return (
      <div className="flex h-full w-full flex-col gap-4 scrollbar-hidden overflow-y-auto">
        {drawer}

        {/* SUB-HEADER / NAVIGATION SECTION */}
        <div className="bg-gray-50 dark:bg-slate-700 p-6 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('DASHBOARD')}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {code.name}
              </h1>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                Configuration History
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              const last = code.versions[code.versions.length - 1];
              const baseData = last
                ? JSON.parse(JSON.stringify(last))
                : {
                    status: { active: true, locked: false },
                    incomeTax: {
                      type: 'progressive',
                      flatRate: 0,
                      brackets: [{ min: 0, max: '', rate: 0 }],
                    },
                    pension: { employeePercent: 0, employerPercent: 0 },
                    statutoryDeductions: [],
                    exemptions: [],
                    rounding: { method: 'nearest', precision: 2 },
                    compliance: [],
                  };
              setTaxData({
                ...baseData,
                version: `v${code.versions.length + 1}`,
                validFrom: '',
                validTo: null,
              });
              openModal();
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} /> New Version
          </button>
        </div>

        {/* VERSIONS LIST */}
        <div className="flex flex-col gap-3 px-1">
          {code.versions.map((v, i) => (
            <div
              key={i}
              className={`rounded transition-all ${
                expandedVersionIndex === i
                  ? 'bg-white dark:bg-slate-700 shadow-lg ring-1 ring-slate-200 dark:ring-slate-600'
                  : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 shadow-sm'
              }`}
            >
              {/* VERSION ROW HEADER */}
              <div
                className="p-5 flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedVersionIndex(expandedVersionIndex === i ? null : i)
                }
              >
                <div className="flex items-center gap-6">
                  <div className="text-lg font-black text-slate-300 dark:text-slate-600 tracking-tighter w-12">
                    {v.version}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {v.validFrom}{' '}
                      {v.validTo ? `to ${v.validTo}` : '(Current)'}
                    </span>
                    <div
                      className={`mt-1 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        v.status.active && code.isEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800'
                      }`}
                    >
                      {v.status.active && code.isEnabled ? (
                        <CheckCircle size={10} />
                      ) : (
                        <AlertCircle size={10} />
                      )}
                      {v.status.active && code.isEnabled
                        ? 'Active'
                        : 'Inactive'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    disabled={!code.isEnabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVersion(code.id, v.id, v.status.active);
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-1 transition-all ${
                      !code.isEnabled
                        ? 'opacity-20 bg-slate-400'
                        : v.status.active
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`bg-white w-3 h-3 rounded-full shadow transition-transform ${
                        v.status.active && code.isEnabled ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transform transition-transform ${
                      expandedVersionIndex === i ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* EXPANDED DETAILS - Refactored Grid */}
              {expandedVersionIndex === i && (
                <div className="bg-white dark:bg-slate-700 p-8 border border-slate-100 dark:border-slate-600 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-colors">
                  {/* COL 1: INCOME TAX BRACKETS */}
                  <div className="space-y-3">
                    <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                      Tax Rule: {v.incomeTax.type}
                    </p>
                    {/* Light: Amber-50 | Dark: Slate-800 */}
                    <div className="bg-amber-50 dark:bg-slate-800 overflow-hidden shadow-sm dark:shadow-black dark:border dark:border-slate-600 rounded-sm">
                      {v.incomeTax.type === 'flat' ? (
                        <div className="p-3 text-center font-bold text-blue-600">
                          {v.incomeTax.flatRate}% Flat Rate
                        </div>
                      ) : (
                        v.incomeTax.brackets.map((b, bi) => (
                          <div
                            key={bi}
                            className="flex shadow justify-between p-2 text-xs border-b-2 last:border-0 border-white dark:border-slate-700"
                          >
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {b.min.toLocaleString()} -{' '}
                              {b.max ? b.max.toLocaleString() : '∞'}
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {b.rate}%
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* COL 2: CONTRIBUTIONS & ROUNDING */}
                  <div className="space-y-6">
                    <div>
                      <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">
                        Social Contribution
                      </p>
                      {/* Light: Blue-200 | Dark: Slate-900 */}
                      <div className="bg-blue-200 dark:bg-slate-900 text-white p-4 rounded shadow shadow-slate-400 dark:shadow-black">
                        <div className="flex justify-between border-b border-blue-400 dark:border-slate-700 pb-2 mb-2">
                          <span className="text-xs opacity-80">Employee</span>
                          <span className="font-black">
                            {v.pension.employeePercent}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs opacity-80">Employer</span>
                          <span className="font-black">
                            {v.pension.employerPercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">
                        Rounding
                      </p>
                      <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-600 text-xs flex justify-between shadow-sm">
                        <span className="capitalize text-slate-700 dark:text-slate-300">
                          {v.rounding.method}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {v.rounding.precision} Decimals
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COL 3: EXEMPTIONS & COMPLIANCE */}
                  <div className="space-y-6">
                    <div>
                      <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">
                        Exemptions
                      </p>
                      <div className="space-y-2">
                        {v.exemptions.map((ex, exi) => (
                          <div
                            key={exi}
                            className="bg-white dark:bg-slate-800 p-3 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-[11px] shadow-sm"
                          >
                            <p className="font-bold text-slate-700 dark:text-slate-200">
                              {ex.name}
                            </p>
                            <p className="text-slate-400 dark:text-slate-500 mt-0.5 uppercase font-bold tracking-tighter">
                              Limit: {ex.limit} |{' '}
                              {ex.overtimeTaxable ? 'OT Taxable' : 'OT Exempt'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border border-transparent dark:border-slate-800 rounded-lg">
                      <p className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">
                        Deductions & Compliance
                      </p>
                      <div className="space-y-1">
                        {v.statutoryDeductions.map((d, di) => (
                          <div
                            key={di}
                            className="text-xs flex justify-between font-bold text-slate-600 dark:text-slate-400"
                          >
                            <span>{d.name}</span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {d.percent}%
                            </span>
                          </div>
                        ))}
                        {v.compliance.map((c, ci) => (
                          <div
                            key={ci}
                            className="text-[11px] flex justify-between text-slate-400 pt-1 border-t border-white dark:border-slate-800 mt-1"
                          >
                            <span>{c.label}</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {c.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  //   return (<div className=" mx-auto p-6 bg-gray-50 min-h-screen">

  //     </div>
  //   )
}

const SectionHeader = ({ title, onAdd }) => (
  <div className="flex justify-between items-center border-b-2 border-slate-50 pb-4">
    <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-widest">
      {title}
    </h2>
    <button
      onClick={onAdd}
      className="bg-slate-100 text-slate-600 px-3 py-1 shadow cursor-pointer rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-slate-200 transition-all"
    >
      <Plus size={14} /> Add New
    </button>
  </div>
);

export default TaxCode;
