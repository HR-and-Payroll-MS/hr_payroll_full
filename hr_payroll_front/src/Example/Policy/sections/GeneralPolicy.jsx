const GeneralPolicy = ({ data, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(data);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">General Policy</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline">✏️ Edit</button>
        ) : (
          <div className="space-x-4">
            <button onClick={() => setIsEditing(false)} className="text-gray-500">Cancel</button>
            <button onClick={() => { onSave(formData); setIsEditing(false); }} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500">Company Name</label>
          {isEditing ? <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="mt-1 block w-full border rounded p-2" /> : <p className="text-lg">{data.companyName}</p>}
        </div>
        {/* Render Version and Date similarly */}
      </div>
    </div>
  );
};