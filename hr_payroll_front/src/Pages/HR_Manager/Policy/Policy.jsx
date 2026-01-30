import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../../../Context/AuthContext';
import ThreeDots from '../../../animations/ThreeDots';
import Header from '../../../Components/Header';
import StepHeader from '../../../Components/forms/StepHeader';
import RenderStepPolicy from './RenderStepPolicy';
import PolicyBook from '../../Help/PolicyBook';
import { initialPolicies } from './policiesSchema';
import { MoreVertical } from 'lucide-react';

// Map step index to policy key in policyData
// NOTE: 'general' is fetched from CompanyInfo API, not policies
// 'salaryStructurePolicy' is handled by TaxCode system
const stepMap = [
  'general',
  'attendancePolicy',
  'leavePolicy',
  'holidayPolicy',
  'shiftPolicy',
  'overtimePolicy',
  'disciplinaryPolicy',
  'jobStructurePolicy',
];

const prettyTitle = {
  general: 'Company Information',
  attendancePolicy: 'Attendance Policy',
  leavePolicy: 'Leave Policy',
  holidayPolicy: 'Holiday Policy',
  shiftPolicy: 'Shift Policy',
  overtimePolicy: 'Overtime Policy',
  disciplinaryPolicy: 'Disciplinary Policy',
  jobStructurePolicy: 'Job Structure Policy',
};

function Policy() {
  const { axiosPrivate, auth } = useAuth();

  const userRole = auth?.user?.role || 'Employee';
  const userGroups = auth?.user?.groups || [];

  // A user is HR if they have any of these roles OR if their primary role is one of them.
  // Note: exclude 'Payroll' so payroll officers cannot edit policies.
  const hrRoles = ['Manager', 'Admin', 'HR Manager'];
  const isHRManager =
    hrRoles.includes(userRole) || userGroups.some((g) => hrRoles.includes(g));

  const steps = [
    'Company Info',
    'Attendance Policy',
    'Leave Policy',
    'Holiday Policy',
    'Shift Policy',
    'Overtime Policy',
    'Disciplinary Policy',
    'Job Structure Policy',
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [policyData, setPolicyData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState({}); // dynamic per section
  const location = useLocation();
  const [allowEditor, setAllowEditor] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const organizationId = 1;

  // Fetch policies and CompanyInfo
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Policy] Fetching policies and company info from API...');

        // Fetch policies
        const policiesRes = await axiosPrivate.get(
          `/orgs/${organizationId}/policies`,
        );
        console.log('[Policy] Policies Response:', policiesRes.data);

        let transformedData = {};

        if (Array.isArray(policiesRes.data)) {
          policiesRes.data.forEach((policy) => {
            if (policy.section && policy.content) {
              transformedData[policy.section] = policy.content;
            }
          });
        } else if (
          typeof policiesRes.data === 'object' &&
          policiesRes.data !== null
        ) {
          transformedData = policiesRes.data;
        }

        // Merge with initial policies as fallback
        Object.keys(initialPolicies).forEach((key) => {
          if (!transformedData[key]) {
            transformedData[key] = initialPolicies[key];
          }
        });

        // Fetch CompanyInfo for 'general' section
        try {
          const companyRes = await axiosPrivate.get('/company-info/');
          console.log('[Policy] Company Info Response:', companyRes.data);

          transformedData.general = {
            companyName: companyRes.data.name || 'Company Name',
            website: companyRes.data.website || '',
            countryCode:
              companyRes.data.countryCode ||
              companyRes.data.country_code ||
              '+251',
            phone: companyRes.data.phone || '',
            email: companyRes.data.email || '',
            bio: companyRes.data.bio || companyRes.data.description || '',
            address: companyRes.data.address || '',
            taxId: companyRes.data.tax_id || companyRes.data.taxId || '',
          };
        } catch (companyErr) {
          console.warn('[Policy] Could not fetch company info:', companyErr);
          transformedData.general = {
            companyName: 'Company Name',
            website: '',
            countryCode: '+251',
            phone: '',
            email: '',
            bio: '',
            address: '',
            taxId: '',
          };
        }

        setPolicyData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      } catch (err) {
        console.error('[Policy] Fetch error:', err);
        setError('Failed to fetch policy data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [axiosPrivate, organizationId]);

  // Rest of the handlers (handleInputChange, handleAddItem, handleRemoveItem, handleEditToggle, handleSave, handleCancel) ...
  // [KEEPING THESE UNCHANGED BUT WRAPPING IN ROLE CHECK LATER]

  const handleInputChange = (section, fieldPath, value) => {
    setPolicyData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const setNested = (obj, path, val) => {
        const parts = path
          .replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`)
          .split('.')
          .filter(Boolean);
        let cur = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          if (cur[parts[i]] === undefined) cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = val;
      };

      if (!next[section]) next[section] = {};
      setNested(next[section], fieldPath, value);
      return next;
    });
  };

  const handleAddItem = (section, path, defaultValue = {}) => {
    setPolicyData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const getArr = (obj, pathStr) => {
        if (!pathStr) return obj;
        const parts = pathStr
          .replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`)
          .split('.')
          .filter(Boolean);
        let cur = obj;
        for (let p of parts) {
          cur = cur[p];
          if (cur === undefined) return undefined;
        }
        return cur;
      };

      if (!next[section]) next[section] = {};
      const arr = getArr(next[section], path);
      if (Array.isArray(arr)) {
        arr.push(defaultValue);
      } else {
        const parts = path
          .replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`)
          .split('.')
          .filter(Boolean);
        let cur = next[section];
        for (let i = 0; i < parts.length - 1; i++) {
          if (!cur[parts[i]]) cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = [defaultValue];
      }
      return next;
    });
  };

  const handleRemoveItem = (section, path, index) => {
    setPolicyData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path
        .replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`)
        .split('.')
        .filter(Boolean);
      let cur = next[section];
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) {
          if (Array.isArray(cur[parts[i]])) {
            cur[parts[i]].splice(index, 1);
          }
        } else {
          cur = cur[parts[i]];
          if (!cur) break;
        }
      }
      return next;
    });
  };

  const handleEditToggle = (section) => {
    setEditMode((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async (section) => {
    try {
      console.log('[Policy] handleSave called for section:', section);
      console.log(
        '[Policy] outgoing content:',
        policyData && policyData[section],
      );

      // Special-case: 'general' section is backed by CompanyInfo API
      if (section === 'general') {
        const general = policyData[section] || {};
        const companyPayload = {
          name: general.companyName || general.name || '',
          website: general.website || '',
          country_code: general.countryCode || general.country_code || '',
          phone: general.phone || '',
          email: general.email || '',
          description: general.bio || general.description || '',
          address: general.address || '',
          tax_id: general.taxId || general.tax_id || '',
        };

        // sanitize website: URLField requires a scheme; prepend http:// if missing
        if (
          companyPayload.website &&
          typeof companyPayload.website === 'string'
        ) {
          const w = companyPayload.website.trim();
          if (w && !/^https?:\/\//i.test(w)) {
            companyPayload.website = `http://${w}`;
          }
        }

        console.log(
          '[Policy] Sending CompanyInfo PUT payload:',
          companyPayload,
        );
        const res = await axiosPrivate.put(`/company-info/`, companyPayload);
        console.log('[Policy] CompanyInfo PUT response status:', res.status);
        console.log('[Policy] CompanyInfo PUT response data:', res.data);

        // update UI from authoritative response
        const serverData = res && res.data ? res.data : {};
        // Build a canonical savedGeneral object from server response (use this everywhere)
        let savedGeneral = {
          companyName: serverData.name || companyPayload.name,
          website: serverData.website || companyPayload.website,
          countryCode:
            serverData.countryCode ||
            serverData.country_code ||
            companyPayload.country_code,
          phone: serverData.phone || companyPayload.phone,
          email: serverData.email || companyPayload.email,
          bio:
            serverData.bio ||
            serverData.description ||
            companyPayload.description,
          address: serverData.address || companyPayload.address,
          taxId: serverData.tax_id || serverData.taxId || companyPayload.tax_id,
        };

        setPolicyData((prev) => {
          const next = JSON.parse(JSON.stringify(prev || {}));
          next.general = savedGeneral;
          return next;
        });

        setOriginalData((prev) => {
          const next = JSON.parse(JSON.stringify(prev || {}));
          next.general = JSON.parse(JSON.stringify(savedGeneral));
          return next;
        });

        setEditMode((prev) => ({ ...prev, [section]: false }));

        // Re-fetch CompanyInfo explicitly to ensure we show server-canonical data
        try {
          console.log('[Policy] Re-fetching /company-info/ after update');
          const companyRes2 = await axiosPrivate.get('/company-info/');
          console.log(
            '[Policy] /company-info/ GET after update:',
            companyRes2.data,
          );
          const cd = companyRes2.data || {};
          // update savedGeneral from the fresh GET
          savedGeneral = {
            companyName: cd.name || cd.companyName || companyPayload.name,
            website: cd.website || companyPayload.website,
            countryCode:
              cd.countryCode || cd.country_code || companyPayload.country_code,
            phone: cd.phone || companyPayload.phone,
            email: cd.email || companyPayload.email,
            bio: cd.bio || cd.description || companyPayload.description,
            address: cd.address || companyPayload.address,
            taxId: cd.tax_id || cd.taxId || companyPayload.tax_id,
          };

          setPolicyData((prev) => {
            const next = JSON.parse(JSON.stringify(prev || {}));
            next.general = savedGeneral;
            return next;
          });

          setOriginalData((prev) => {
            const next = JSON.parse(JSON.stringify(prev || {}));
            next.general = JSON.parse(JSON.stringify(savedGeneral));
            return next;
          });
        } catch (reErr) {
          console.warn(
            '[Policy] Failed to GET /company-info/ after update:',
            reErr,
          );
        }

        // Re-fetch policies list as well for completeness
        try {
          console.log('[Policy] Re-fetching policies after company update');
          const listRes = await axiosPrivate.get(
            `/orgs/${organizationId}/policies`,
          );
          console.log('[Policy] policies list after update:', listRes.data);
          let transformed = {};
          if (Array.isArray(listRes.data)) {
            listRes.data.forEach((p) => {
              if (p.section && p.content) transformed[p.section] = p.content;
            });
          } else if (listRes.data && typeof listRes.data === 'object') {
            transformed = listRes.data;
          }
          Object.keys(initialPolicies).forEach((key) => {
            if (!transformed[key]) transformed[key] = initialPolicies[key];
          });
          // merge company info we just saved; use savedGeneral (server-canonical) not stale policyData
          transformed.general = transformed.general
            ? transformed.general
            : savedGeneral || {};
          setPolicyData(transformed);
          setOriginalData(JSON.parse(JSON.stringify(transformed)));
        } catch (refetchErr) {
          console.warn(
            '[Policy] Re-fetch after company update failed:',
            refetchErr,
          );
        }

        // Final sanity-check: fetch CompanyInfo once more and apply as canonical general
        try {
          const finalCompany = await axiosPrivate.get('/company-info/');
          const fc = finalCompany.data || {};
          const finalGeneral = {
            companyName: fc.name || fc.companyName || companyPayload.name,
            website: fc.website || companyPayload.website,
            countryCode:
              fc.countryCode || fc.country_code || companyPayload.country_code,
            phone: fc.phone || companyPayload.phone,
            email: fc.email || companyPayload.email,
            bio: fc.bio || fc.description || companyPayload.description,
            address: fc.address || companyPayload.address,
            taxId: fc.tax_id || fc.taxId || companyPayload.tax_id,
          };
          setPolicyData((prev) => {
            const next = JSON.parse(JSON.stringify(prev || {}));
            next.general = finalGeneral;
            return next;
          });
          setOriginalData((prev) => {
            const next = JSON.parse(JSON.stringify(prev || {}));
            next.general = JSON.parse(JSON.stringify(finalGeneral));
            return next;
          });
        } catch (finalErr) {
          console.warn('[Policy] Final company-info refetch failed:', finalErr);
        }

        return;
      }

      // Default path: save policy via policies endpoint
      const payload = { content: policyData[section] };
      console.log('[Policy] PUT payload for policies endpoint:', payload);
      const res = await axiosPrivate.put(
        `/orgs/${organizationId}/policies/${section}/`,
        payload,
      );
      console.log('[Policy] policies PUT response status:', res.status);
      console.log('[Policy] policies PUT response data:', res.data);

      // Ensure we got the authoritative content back from server
      const serverContent =
        (res && res.data && res.data.content) || policyData[section];

      // Update UI with server content (ensures we reflect what was persisted)
      setPolicyData((prev) => {
        const next = JSON.parse(JSON.stringify(prev || {}));
        next[section] = serverContent;
        return next;
      });

      setOriginalData((prev) => {
        const next = JSON.parse(JSON.stringify(prev || {}));
        next[section] = JSON.parse(JSON.stringify(serverContent));
        return next;
      });

      setEditMode((prev) => ({ ...prev, [section]: false }));

      // Extra check: re-fetch policies to guarantee DB persisted the update
      try {
        const listRes = await axiosPrivate.get(
          `/orgs/${organizationId}/policies`,
        );
        console.log('[Policy] Re-fetched policies list:', listRes.data);
        let transformed = {};
        if (Array.isArray(listRes.data)) {
          listRes.data.forEach((p) => {
            if (p.section && p.content) transformed[p.section] = p.content;
          });
        } else if (listRes.data && typeof listRes.data === 'object') {
          transformed = listRes.data;
        }
        // merge fallbacks from initialPolicies
        Object.keys(initialPolicies).forEach((key) => {
          if (!transformed[key]) transformed[key] = initialPolicies[key];
        });
        setPolicyData(transformed);
        setOriginalData(JSON.parse(JSON.stringify(transformed)));
      } catch (refetchErr) {
        console.warn('Policy save succeeded but re-fetch failed', refetchErr);
      }
    } catch (err) {
      console.error('Policy save error:', err);
      console.error(
        'Policy save error details response:',
        err?.response || null,
      );

      // Flatten serializer errors to a readable string for the UI
      let msg = 'Failed to save. Try again.';
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (typeof data === 'object') {
          try {
            // if website key present, give specific guidance
            if (data.website) {
              const siteErr = Array.isArray(data.website)
                ? data.website.join(', ')
                : data.website;
              const advise =
                'Website looks invalid. Use a full URL like https://example.com or just example.com (we will add http://). Remove spaces.';
              // use custom modal instead of window.alert and keep editor open for correction
              setAlertMessage(`Website error: ${siteErr} — ${advise}`);
              setShowAlert(true);
              setEditMode((prev) => ({ ...prev, general: true }));
              msg = `website: ${siteErr} — ${advise}`;
            } else if (data.email) {
              const emailErr = Array.isArray(data.email)
                ? data.email.join(', ')
                : data.email;
              const advise =
                'Email looks invalid. Use a valid email like user@example.com and remove extra spaces.';
              setAlertMessage(`Email error: ${emailErr} — ${advise}`);
              setShowAlert(true);
              setEditMode((prev) => ({ ...prev, general: true }));
              msg = `email: ${emailErr} — ${advise}`;
            } else {
              msg = Object.entries(data)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join(' | ');
            }
          } catch (e) {
            msg = JSON.stringify(data);
          }
        } else {
          msg = String(data);
        }
      } else if (err?.message) {
        msg = err.message;
      }

      // If this was a website or email validation error we've shown the modal and kept edit mode open,
      // avoid setting the global `error` which would replace the whole view.
      const respData = err?.response?.data;
      const isFieldValidation =
        respData && (respData.website || respData.email);
      if (!isFieldValidation) {
        setError(msg);
      }
    }
  };

  const handleCancel = (section) => {
    if (!originalData) return;
    setPolicyData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[section] = JSON.parse(JSON.stringify(originalData[section] || {}));
      return next;
    });
    setEditMode((prev) => ({ ...prev, [section]: false }));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <ThreeDots />
      </div>
    );
  if (error)
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  // Determine whether to show the editor.
  // Editor is allowed only for HR managers AND when they either navigated with a sidebar flag
  // (location.state.fromSidebar === true), they explicitly enable editing in this view,
  // or the URL path indicates they came from a dashboard/sidebar route.
  const fromSidebarPath =
    /\/(hr_dashboard|Payroll|Employee|department_manager)\b/i.test(
      location?.pathname || '',
    );

  const showEditor =
    isHRManager &&
    (location?.state?.fromSidebar === true || allowEditor || fromSidebarPath);

  // If editor should not be shown, render the read-only PolicyBook. HR managers see
  // a small "Open Editor" control to enable editing if they intentionally want to.
  if (!showEditor) {
    return (
      <div className="flex flex-col h-full">
        {showAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-800 rounded-md p-6 w-11/12 max-w-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Validation error</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {alertMessage}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAlert(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  OK — I will fix it
                </button>
              </div>
            </div>
          </div>
        )}
        {isHRManager && (
          <div className="p-2 flex justify-end">
            <button
              onClick={() => setAllowEditor(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
              aria-label="Open Policy Editor"
            >
              Open Editor
            </button>
          </div>
        )}

        <PolicyBook
          policyData={policyData}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          steps={steps}
          prettyTitle={prettyTitle}
          sectionKey={stepMap[currentStep]}
        />
      </div>
    );
  }

  // RENDER EDITOR FOR HR MANAGERS
  return (
    <div className="flex flex-col gap-4 w-full p-2 h-full justify-start dark:bg-slate-900 bg-gray-50 overflow-hidden transition-colors">
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-md p-6 w-11/12 max-w-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Validation error</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {alertMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAlert(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                OK — I will fix it
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-evenly shrink-0">
        <Header
          Title={'Policy Management'}
          subTitle={'Control and update company policies'}
        />
      </div>

      <div className="flex flex-1 gap-5 rounded-md overflow-hidden">
        <div className="h-full w-1/5 shadow rounded-md dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-white dark:bg-slate-800 overflow-y-auto scrollbar-hidden transition-all">
          <StepHeader
            childclassname="flex dark:text-slate-300 rounded-md text-md w-full p-2 justify-between items-center"
            classname="flex bg-white dark:bg-slate-800 justify-start items-start text-start w-full flex-col h-full p-2 gap-2 transition-colors"
            steps={steps}
            iscurrentstyle="bg-slate-100 dark:bg-slate-700 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 shadow-sm"
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        <div className="flex flex-1 h-full bg-white dark:bg-slate-800 rounded-md shadow dark:shadow-slate-600 dark:inset-shadow-xs dark:inset-shadow-slate-600 overflow-hidden transition-all">
          <div className="h-full w-full overflow-y-auto scrollbar-hidden">
            <RenderStepPolicy
              currentStep={currentStep}
              editMode={editMode}
              policyData={policyData}
              userRole={userRole}
              handleInputChange={handleInputChange}
              handleSave={handleSave}
              handleCancel={handleCancel}
              handleEditToggle={handleEditToggle}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Policy;
