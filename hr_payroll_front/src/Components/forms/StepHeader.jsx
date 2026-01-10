const StepHeader = ({ 
  steps, 
  currentStep, 
  onStepClick, 
  style = "", 
  // Parent container: Sunken look matching your charts/table
  classname = "flex justify-start items-center  py-0 m-0 min-h-fit max-h-fit gap-2 bg-gray-50 dark:bg-slate-700 shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 rounded-lg border border-transparent transition-all",
  // Child buttons: Refined typography and emerald accents
  childclassname = "flex hover:cursor-pointer dark:text-slate-100 gap-2 px-4 h-10 items-center transition-all text-xs font-bold uppercase tracking-widest rounded-md",
  // Inactive Style: Subtle
  notcurrentsytle = "text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800/50",
  // Active Style: Emerald highlight with sunken-to-flat toggle effect
  iscurrentstyle = "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-600"
}) => {
  return (
    <div className={`${classname} ${style}`}>
      {steps.map((step, index) => (
        <button
          key={index}
          onClick={() => onStepClick(index)}
          className={`${childclassname} ${
            currentStep === index
              ? iscurrentstyle
              : notcurrentsytle
          }`}
        >
          {/* Added a small dot for the active state to make it feel more "dashboard-like" */}
          {currentStep === index && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {step}
        </button>
      ))}
    </div>
  );
};

export default StepHeader;












// const StepHeader = ({ allowedSteps,steps,childclassname="flex hover:cursor-pointer dark:text-slate-100 gap-2 px-2.5  border-b-3 items-center transition",notcurrentsytle="border-white dark:border-slate-800 hover:text-green-800",iscurrentstyle="border-green-700 text-green-800", currentStep, onStepClick,style="",classname="flex justify-start items-start  px-4 py-0 m-0 *:h-12 min-h-fit max-h-fit  gap-5 border-b dark:border-slate-600 border-gray-200 " }) => {
//   return (
//     <div className={`${classname} ${style}`}>
//       {steps.map((step, index) => (
//         <button
//           key={index}
//           onClick={() => onStepClick(index)}
//           className={`${childclassname} ${
//             currentStep === index
//               ? iscurrentstyle
//               : notcurrentsytle
//           }`}
//         >
//           {step}
//         </button>
//       ))}
//     </div>
//   );
// };
// export default StepHeader