import { Link } from "react-router-dom";
import { useNetwork } from "../../Context/NetworkContext";

export default function AccessDenied() {
  const { refresh } = useNetwork();
  return (
    <div className="p-8 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
      <p className="text-gray-600 mb-4">This page is available only inside the company network.</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => refresh()} className="px-4 py-2 bg-indigo-600 text-white rounded">Recheck network</button>
        <Link to="/" className="px-4 py-2 border rounded">Home</Link>
      </div>
    </div>
  );
}