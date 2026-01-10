const OvertimePolicy = () => (
  <div className="bg-white p-6 border rounded-lg">
    <div className="grid grid-cols-3 gap-8">
      <div>
        <label className="text-sm text-gray-500">Regular OT Rate</label>
        <input type="number" defaultValue={1.5} className="w-full border p-2 rounded mt-1" />
      </div>
      <div>
        <label className="text-sm text-gray-500">Holiday Multiplier</label>
        <input type="number" defaultValue={2.0} className="w-full border p-2 rounded mt-1" />
      </div>
    </div>
  </div>
);