const AttendancePolicy = ({ data }) => {
  const [rules, setRules] = useState([
    { id: 1, type: 'Late Entry', threshold: '15 mins', action: 'Warning' }
  ]);
  return (
    <section>
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Workflow & Thresholds</h3>
        <button className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm">+ Add Rule</button>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50">
          <tr><th className="p-3 border-b">Rule Type</th><th className="p-3 border-b">Threshold</th><th className="p-3 border-b">Action</th></tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{r.type}</td>
              <td className="p-3 border-b">{r.threshold}</td>
              <td className="p-3 border-b">{r.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};