// HREfficiencyForm.jsx
import React, { useEffect, useState } from "react";
import FormBuilder from "./FormBuilder";
import Header from "../Components/Header";
import useAuth from "../Context/AuthContext";

export default function HREfficiencyForm() {
  const { axiosPrivate } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await axiosPrivate.get(`/efficiency/templates/schema/`);
        const data = response.data;

        // Ensure required arrays exist even if backend returns null/undefined
        setFormData({
          title: data.title || "Employee Efficiency Format",
          performanceMetrics: data.performanceMetrics || [],
          feedbackSections: data.feedbackSections || [],
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load policy data. Using default template.");
        // Fallback to empty structure
        setFormData({
          title: "Employee Efficiency Format",
          performanceMetrics: [],
          feedbackSections: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [axiosPrivate]);

  const handleSave = async () => {
    try {
      // Send to backend (assuming this endpoint saves the schema)
      
      await axiosPrivate.put(`/efficiency/templates/schema-set/`, formData);
      alert("Form configuration saved successfully!");
    } catch (err) {
      console.error("Save failed:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to save form configuration.";
      alert("Error: " + msg);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset to empty form? All changes will be lost.")) {
      setFormData({
        title: "Employee Efficiency Format",
        performanceMetrics: [],
        feedbackSections: [],
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 mx-auto h-full flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading form schema...</p>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="p-4 mx-auto h-full flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
return (
  <div className="flex flex-col gap-3 w-full p-2 h-full justify-start dark:bg-slate-900 bg-gray-50 overflow-hidden transition-colors">
    
    {/* HEADER SECTION - Reduced height/spacing */}
    <div className="flex justify-between items-center shrink-0 px-2"> 
      <Header 
        Title={"Efficiency Builder"} 
        Breadcrub={"Configure metrics"}
      />
    </div>

    {/* MAIN CONTENT AREA */}
    <div className="flex-1 rounded-lg shadow-sm dark:shadow-black border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden transition-all">
      <div className="h-full w-full flex flex-col">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-4">
          <FormBuilder formData={formData} setFormData={setFormData} />
        </div>

        {/* COMPACT STICKY FOOTER - Takes up very little vertical space */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-2 items-center">
          <button
            onClick={handleReset}
            className="px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Reset
          </button>
          
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-sm transition-all active:scale-95"
          >
            Save Config
          </button>
        </div>

      </div>
    </div>
  </div>
);
}