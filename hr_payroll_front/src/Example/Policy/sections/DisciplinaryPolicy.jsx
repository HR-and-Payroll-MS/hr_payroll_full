const DisciplinaryPolicy = () => (
  <div className="relative pl-8 border-l-2 border-blue-100 space-y-8">
    {[
      { level: 'Level 1', title: 'Verbal Warning', count: '1st Instance' },
      { level: 'Level 2', title: 'Written Warning', count: '2nd Instance' },
      { level: 'Level 3', title: 'Termination', count: 'Final Instance' },
    ].map((step) => (
      <div key={step.level} className="relative">
        <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
        <h4 className="font-bold">{step.level}: {step.title}</h4>
        <p className="text-sm text-gray-500">{step.count}</p>
      </div>
    ))}
  </div>
);