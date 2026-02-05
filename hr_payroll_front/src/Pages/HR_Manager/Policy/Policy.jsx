import React, { useState, useEffect } from "react";
import useAuth from "../../../Context/AuthContext";
import ThreeDots from "../../../animations/ThreeDots";
import Header from "../../../Components/Header";
import StepHeader from "../../../Components/forms/StepHeader";
import RenderStepPolicy from "./RenderStepPolicy";
import PolicyBook from "../../Help/PolicyBook";
import { initialPolicies } from "./policiesSchema";
import { MoreVertical } from "lucide-react";

// Map step index to policy key in policyData
// NOTE: 'general' is fetched from CompanyInfo API, not policies
// 'salaryStructurePolicy' is handled by TaxCode system
const stepMap = [
  "general",
  "attendancePolicy",
  "leavePolicy",
  "holidayPolicy",
  "shiftPolicy",
  "overtimePolicy",
  "disciplinaryPolicy",
  "jobStructurePolicy",
];

const prettyTitle = {
  general: "Company Information",
  attendancePolicy: "Attendance Policy",
  leavePolicy: "Leave Policy",
  holidayPolicy: "Holiday Policy",
  shiftPolicy: "Shift Policy",
  overtimePolicy: "Overtime Policy",
  disciplinaryPolicy: "Disciplinary Policy",
  jobStructurePolicy: "Job Structure Policy",
};

function Policy() {
  const { axiosPrivate, auth } = useAuth();
  
  const userRole = auth?.user?.role || 'Employee';
  const userGroups = auth?.user?.groups || [];
  
  // A user is management if they have any of these roles OR if their primary role is one of them.
  const managementRoles = ['Manager', 'Payroll'];
  const isManagement = managementRoles.includes(userRole) || userGroups.some(g => managementRoles.includes(g));

  const steps = [
    "Company Info",
    "Attendance Policy",
    "Leave Policy",
    "Holiday Policy",
    "Shift Policy",
    "Overtime Policy",
    "Disciplinary Policy",
    "Job Structure Policy",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [policyData, setPolicyData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState({}); // dynamic per section
  const organizationId = 1;

  // Fetch policies and CompanyInfo
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Policy] Fetching policies and company info from API...');
        
        // Fetch policies
        const policiesRes = await axiosPrivate.get(`/orgs/${organizationId}/policies`);
        console.log('[Policy] Policies Response:', policiesRes.data);
        
        let transformedData = {};
        
        if (Array.isArray(policiesRes.data)) {
          policiesRes.data.forEach(policy => {
            if (policy.section && policy.content) {
              transformedData[policy.section] = policy.content;
            }
          });
        } else if (typeof policiesRes.data === 'object' && policiesRes.data !== null) {
          transformedData = policiesRes.data;
        }
        
        // Merge with initial policies as fallback
        Object.keys(initialPolicies).forEach(key => {
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
            countryCode: companyRes.data.countryCode || companyRes.data.country_code || '+251',
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
        setError("Failed to fetch policy data.");
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
                          const parts = path.replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`).split(".").filter(Boolean);
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
        const parts = pathStr.replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`).split(".").filter(Boolean);
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
        const parts = path.replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`).split(".").filter(Boolean);
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
      const parts = path.replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`).split(".").filter(Boolean);
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
      const payload = { content: policyData[section] };
      await axiosPrivate.put(`/orgs/${organizationId}/policies/${section}/`, payload);
      setOriginalData((prev) => {
        const next = JSON.parse(JSON.stringify(prev || policyData));
        next[section] = JSON.parse(JSON.stringify(policyData[section]));
        return next;
      });
      setEditMode((prev) => ({ ...prev, [section]: false }));
    } catch (err) {
      setError("Failed to save. Try again.");
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

  if (loading) return <div className="flex justify-center items-center h-screen"><ThreeDots /></div>;
  if (error) return <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;

  // RENDER POLICY BOOK FOR NON-MANAGERS
  if (!isManagement) {
    return (
      <PolicyBook 
        policyData={policyData} 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
        steps={steps} 
        prettyTitle={prettyTitle}
        sectionKey={stepMap[currentStep]}
      />
    );
  }

  // RENDER EDITOR FOR MANAGERS
  return (
    <div className="flex flex-col gap-4 w-full p-2 h-full justify-start dark:bg-slate-900 bg-gray-50 overflow-hidden transition-colors">
      <div className="flex justify-evenly shrink-0"> 
        <Header Title={"Policy Management"} subTitle={"Control and update company policies"} />
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

