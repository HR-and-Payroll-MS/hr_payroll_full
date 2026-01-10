const TaxPolicy = () => {
  const [activeCode, setActiveCode] = useState('PENSION_01');
  const versions = [
    { v: 'v2', date: '2024-01', status: 'Active', rate: '8%' },
    { v: 'v1', date: '2023-01', status: 'Archived', rate: '7.5%' },
  ];

  return (
    <div className="flex gap-6">
      <div className="w-1/3 border-r pr-4">
        <h3 className="font-bold text-sm mb-4">Tax Codes</h3>
        <div className="bg-blue-50 p-3 rounded border border-blue-200">PENSION_01</div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">Version History</h3>
          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">New Version</button>
        </div>
        {versions.map(v => (
          <div key={v.v} className={`p-4 mb-2 border rounded-lg ${v.status === 'Active' ? 'border-green-200 bg-green-50' : 'opacity-60 bg-gray-50'}`}>
            <div className="flex justify-between">
              <span className="font-bold">{v.v} ({v.status})</span>
              <span className="text-sm">{v.date}</span>
            </div>
            <p className="mt-2 font-mono">Rate: {v.rate}</p>
          </div>
        ))}
      </div>
    </div>
  );
};