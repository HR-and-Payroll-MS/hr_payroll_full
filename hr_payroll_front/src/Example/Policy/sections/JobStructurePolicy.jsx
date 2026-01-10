const JobStructurePolicy = () => (
  <div className="space-y-4">
    {['L1 - Executive', 'L2 - Senior', 'L3 - Manager'].map(level => (
      <div key={level} className="p-3 bg-gray-50 border rounded flex justify-between">
        <span>{level}</span>
        <span className="text-xs text-blue-600 font-medium">Min Tenure: 2 Years</span>
      </div>
    ))}
  </div>
);