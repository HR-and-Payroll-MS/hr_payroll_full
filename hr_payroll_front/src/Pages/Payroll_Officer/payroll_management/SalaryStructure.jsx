import React, { useEffect, useState } from 'react'
import Header from '../../../Components/Header'
import ThreeDots from '../../../animations/ThreeDots';
import StepHeader from '../../../Components/forms/StepHeader';
import RenderStepPolicy from '../../HR_Manager/Policy/RenderStepPolicy';
import useAuth from '../../../Context/AuthContext';
import { initialPolicies } from '../../HR_Manager/Policy/policiesSchema';

function SalaryStructure() {
  const { axiosPrivate } = useAuth();
  const steps = [
    "Salary Structure Policy",
  ];
  const [currentStep, setCurrentStep] = useState(8);
  const [policyData, setPolicyData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState({}); // dynamic per section
  const organizationId = 1;

  // Simulate initial fetch
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        // replace with axiosPrivate.get(...) when integrating
        // const res = await axiosPrivate.get(`/orgs/${organizationId}/policies`);
        // setPolicyData(res.data);
        // setOriginalData(res.data);
        const res = initialPolicies;
        setPolicyData(res);
        setOriginalData(JSON.parse(JSON.stringify(res)));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch policy data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [axiosPrivate, organizationId]);

  // HANDLE CHANGE (deep)
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
//replace(/\[(\d+)\]/g...) → turns [2] into .2
// split(".") → splits into array pieces
// filter(Boolean) → removes empty values

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
          .split(".")
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
        // If path points to undefined, create it as an array
        // e.g., add item to "leaveTypes" that didn't exist before
        const parts = path
          .replace(/\[(\d+)\]/g, (m, p1) => `.${p1}`)
          .split(".")
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
        .split(".")
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
      // simulate saving only the section payload
      const payload = { [section]: policyData[section] };
      console.log("Saving payload to backend:", payload);

      // integrate real save:
      // await axiosPrivate.put(`/orgs/${organizationId}/policies/${section}`, payload);

      setOriginalData((prev) => {
        const next = JSON.parse(JSON.stringify(prev || policyData));
        next[section] = JSON.parse(JSON.stringify(policyData[section]));
        return next;
      });

      setEditMode((prev) => ({ ...prev, [section]: false }));
      console.log("Saved (simulated).");
    } catch (err) {
      console.error("Save failed:", err);
      setError("Failed to save. Try again.");
    }
  };

  const handleCancel = (section) => {
    console.log(section,"")
    if (!originalData) return;
    console.log("section")
    setPolicyData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[section] = JSON.parse(JSON.stringify(originalData[section] || {}));
      return next;
    });
    setEditMode((prev) => ({ ...prev, [section]: false }));
  };
if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <ThreeDots />
      </div>
    );

  if (error)
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  if (!policyData)
    return (
      <div className="p-4 text-center text-gray-500">No policy data available.</div>
    );

  return (
    <div className="flex flex-col px-4 w-full h-full justify-start bg-gray-50 dark:bg-slate-900">
      <div className="flex flex-1 gap-5 overflow-y-scroll scrollbar-hidden w-full rounded-md h-full">
        <div className="flex-1  relative bg-white rounded-md shadow overflow-y-auto scrollbar-hidden">
          <RenderStepPolicy
            currentStep={currentStep}
            editMode={editMode}
            policyData={policyData}
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
  );
}

export default SalaryStructure