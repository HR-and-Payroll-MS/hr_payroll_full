const HolidayPolicy = () => (
  <div className="bg-white rounded-lg border">
    <div className="p-4 border-b flex justify-between items-center">
      <h3 className="font-semibold">Company Holidays 2024</h3>
      <button className="bg-black text-white px-4 py-2 rounded-md text-sm">Add Holiday</button>
    </div>
    <div className="divide-y">
      <div className="p-4 flex justify-between">
        <span>New Year's Day</span>
        <span className="text-gray-500 italic">01 Jan (Fixed)</span>
      </div>
      {/* List items... */}
    </div>
  </div>
);