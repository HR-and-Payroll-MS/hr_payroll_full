import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import SuggestionBox from "./SuggestionBox";
import useAuth from "../Context/AuthContext";
import useData from "../Context/DataContextProvider";

function InputField({
  placeholder = "Search...",
  apiEndpoint,
  displayKey = "name",

  onSelect,
  onChangeValue,

  maxWidth = "max-w-3/5",
  suggestion = true,
  icon = true,
  border = "border",

  searchMode = "api",
  globalData = [],
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const containerRef = useRef(null);
  const { employees } = useData();
  
//  useEffect(() => {
//   employees.get();
// }, []); 


  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    // ✅ SIMPLE INPUT MODE (FIXED)
    if (searchMode === "input") {
      if (onChangeValue) onChangeValue(val);
      else if (onSelect) onSelect(val); // 👈 fallback (THIS FIXES YOUR BUG)
      return;
    }

    setShowSuggestions(true);
  };

  useEffect(() => {
    if (searchMode === "input") return;

    const delay = setTimeout(() => {
      if (searchMode === "global") {
        if (!query.trim()) {
          setSuggestions([]);
          return;
        }

        const filtered = globalData.filter(item =>
          (item[displayKey] || "")
            .toLowerCase()
            .includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        return;
      }

       if (apiEndpoint && query.trim().length > 1) {
      employees.get().then((data) => {
        if (!data) return; // safety
        const filtered = data.filter(emp => {
          const text = `${emp.employeeid || ""} ${emp.emailaddress || ""} ${emp.department || ""} ${emp.fullname || ""}`.toLowerCase();
          return text.includes(query.toLowerCase());
        });
        setSuggestions(filtered);
      });
    }

      // if (apiEndpoint && query.trim().length > 1) {
      //   const filtered = (employees?.data || []).filter(emp => {
      //     const text = `${emp.employeeid || ""} ${emp.emailaddress || ""} ${emp.department || ""} ${emp.fullname || ""}`.toLowerCase();
      //     return text.includes(query.toLowerCase());
      //   });
      //   setSuggestions(filtered);
      // }
    }, 400);

    return () => clearTimeout(delay);
  }, [query, searchMode, globalData, apiEndpoint, employees, displayKey]);
  const handleSelect = (item) => {
    setQuery(item[displayKey] || "");
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect?.(item);
  };
  useEffect(() => {
    if (!showSuggestions) return;
    const t = setTimeout(() => setShowSuggestions(false), 20000);
    return () => clearTimeout(t);
  }, [showSuggestions]);
  useEffect(() => {
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-3/12 ${maxWidth}`}>
      <div
        className={`flex items-center px-2.5 py-1.5 rounded
        text-slate-700 dark:text-slate-200
        ${border} dark:border-slate-500 border-slate-300`}
      >
        <input
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none"
          type="text"
        />
        {icon && <Icon name="Search" className="w-4 h-4 text-slate-400" />}
      </div>

      {showSuggestions && searchMode !== "input" && (
        <SuggestionBox
          suggestions={suggestions}
          onSelect={handleSelect}
          query={query}
          displayKey={displayKey}
          suggestion={suggestion}
        />
      )}
    </div>
  );
}

export default InputField;