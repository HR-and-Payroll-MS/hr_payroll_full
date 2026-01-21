import React from 'react';
import Icon from '../../Components/Icon';

const PolicyBook = ({ policyData, currentStep, setCurrentStep, steps, prettyTitle, sectionKey }) => {
  const data = policyData?.[sectionKey];

  const humanLabel = (key) =>
    String(key)
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase());

  const renderValue = (value) => {
    if (value?.__type === 'documents') {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.value?.map((file, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <Icon name="FileText" size={14} />
              <span>{file.name}</span>
            </div>
          ))}
          {(!value.value || value.value.length === 0) && <span className="text-slate-400 italic">No documents</span>}
        </div>
      );
    }
    if (value?.__type === 'dropdown') return String(value.value || 'N/A');
    if (Array.isArray(value)) {
      return (
        <div className="space-y-3 mt-2">
          {value.map((item, i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-4 border-green-200 shadow-sm transition-all hover:shadow-md">
              {typeof item === 'object' ? (
                Object.entries(item).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <span className="text-slate-500 font-medium">{humanLabel(k)}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{String(v)}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm font-medium">{String(item)}</span>
              )}
            </div>
          ))}
          {value.length === 0 && <p className="text-slate-400 italic text-sm">No items recorded</p>}
        </div>
      );
    }
    return String(value ?? 'N/A');
  };

  return (
    <div className="flex h-full bg-slate-50 gap-4 dark:bg-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Index */}
      <div className="w-1/4 h-full relative border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-y-auto hover-bar">
        <div className="flex items-center p-3 bg-white dark:bg-slate-800 sticky top-0 gap-3 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Icon name="Book" />
          </div>
          <div>
            <h2 className="text-lg font-bold dark:text-white">Company Policy</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Employee Handbook</p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${
                currentStep === index
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span>{step}</span>
              {currentStep === index && <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="mt-12 m-2 p-3 bg-slate-100 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Notice</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
            "Every employee is responsible for conforming to these policies as they reflect our commitment to excellence."
          </p>
        </div>
      </div>

      {/* Main Content - Page View */}
      <div className="w-3/4 h-full  relative border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-y-auto hover-bar">
        {/* <div className="w-full relative bg-white dark:bg-slate-800 shadow-2xl shadow-slate-200 dark:shadow-black/50 rounded-2xl min-h-[800px] border border-slate-100 dark:border-slate-700 flex flex-col   overflow-hidden"> */}
          

          <header className=" p-4 border-b bg-slate-100 dark:bg-slate-800 sticky top-0 border-slate-100 dark:border-slate-700 pb-2 flex justify-between items-end">
             <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                  {prettyTitle[sectionKey] || steps[currentStep]}
                </h1>
                <p className="text-slate-400 font-small">Policy Section / {steps[currentStep]}</p>
             </div>
          </header>

          <main className="flex-1 p-6 ">
            {data ? (
              Object.entries(data).map(([key, value]) => {
                if (value && typeof value === 'object' && !Array.isArray(value) && !value.__type) {
                  return (
                    <section key={key} className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-green-600 dark:text-green-400 flex items-center gap-2">
                        {/* <span className="w-4 h-0.5 bg-green-600 dark:bg-blue-400" /> */}
                        {humanLabel(key)}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                        {Object.entries(value).map(([k, v]) => (
                          <div key={k} className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{humanLabel(k)}</p>
                            <div className="text-sm font-semibold dark:text-slate-200">
                              {renderValue(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                return (
                  <section key={key} className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       {humanLabel(key)}
                    </h3>
                    <div className="pl-6 text-sm font-semibold text-slate-800 dark:text-slate-200 border-l-2 border-slate-100 dark:border-slate-700 py-1">
                      {renderValue(value)}
                    </div>
                  </section>
                );
              })
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300 dark:text-slate-600">
                   <Icon name="Search" size={48} className="mb-4" />
                   <p className="text-lg font-bold">Information not available yet</p>
                   <p className="text-sm">Please check back later or contact HR.</p>
                </div>
            )}
          </main>

          <footer className="mt-2 p-4    border-slate-100 dark:border-slate-700 text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
               &copy; 2026 SeniorX HR Management System • Confidential Note
            </p>
          </footer>
        {/* </div> */}
      </div>
    </div>
  );
};

export default PolicyBook;
