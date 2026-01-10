const ShiftPolicy = () => (
  <div className="space-y-6">
    <div className="p-6 border rounded-xl bg-white">
      <h4 className="font-bold mb-4">Standard Work Week</h4>
      <div className="flex gap-2">
        {['M','T','W','T','F','S','S'].map(d => (
          <div key={d} className={`w-10 h-10 flex items-center justify-center rounded-full ${d === 'S' ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white'}`}>{d}</div>
        ))}
      </div>
    </div>
  </div>
);