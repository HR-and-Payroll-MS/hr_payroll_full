const LeavePolicy = () => (
  <div className="grid grid-cols-3 gap-4">
    {['Annual Paid', 'Sick Leave', 'Unpaid'].map(type => (
      <div key={type} className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex justify-between">
          <span className="font-bold text-blue-700">{type}</span>
          <button className="text-xs text-gray-400">Edit</button>
        </div>
        <p className="text-2xl font-semibold mt-2">22 Days</p>
        <p className="text-xs text-gray-500 mt-1">Accrual: Monthly</p>
      </div>
    ))}
    <button className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-gray-400 hover:border-blue-400 hover:text-blue-400">+ Add Type</button>
  </div>
);