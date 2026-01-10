import React, { createContext, useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';

export default function AttendNow() {
  return (<>
    <Home/>
    <AttendancePage/>
    </>
  )
}










// ---------------------just simple Sidebar ---------------------
function Sidebar() {
  const  isLocal=true
   const  checking  = false


  return (
    <aside className="w-64 bg-white border-r p-4 min-h-screen">
      

      <nav className="flex flex-col gap-2">
        <Link className="px-3 py-2 rounded hover:bg-slate-100" to="/">Home</Link>

        {/* Only show admin menu item if we know the user is local. If still checking, show a placeholder */}
        {checking ? (
          <div className="px-3 py-2 rounded bg-yellow-50 text-sm text-yellow-800">Checking network...</div>
        ) : isLocal ? (
          <Link className="px-3 py-2 rounded hover:bg-slate-100 font-medium text-indigo-700" to="/admin/attendance">
            Attendance Admin
          </Link>
        ) : (
          // If not local, don't render the link at all; optionally render a tooltip/disabled item
          <div className="px-3 py-2 rounded text-sm text-gray-400">Attendance Admin (local only)</div>
        )}

        <Link className="px-3 py-2 rounded hover:bg-slate-100" to="/profile">Profile</Link>
      </nav>

      <div className="mt-6 text-xs text-gray-500">Status: {checking ? 'checking...' : isLocal ? 'office network' : 'external network'}</div>
    </aside>
  );
}

// --------------------- Protected Route ---------------------
function ProtectedRoute({ children }) {
  const { isLocal, checking } = useNetwork();

  if (checking) {
    // Show a lightweight loader while we wait for the network check
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Verifying network...</div>
      </div>
    );
  }

  if (!isLocal) {
    // Not allowed
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
// ask what punches are and what this code is doing overall
// --------------------- Attendance Hook ---------------------
function useAttendanceToday() {
  const [loading, setLoading] = useState(true);
  const [punches, setPunches] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const json = {punches:[{ type: 'check_in'|'check_out'|'break_start'|'break_end', time: '2025-11-18T08:59:00Z', location: 'Office' }]}
      console.log(json.punches)
      // Expecting array of { type: 'check_in'|'check_out'|'break_start'|'break_end', time: '2025-11-18T08:59:00Z', location: 'Office' }
      setPunches(json.punches || []);
    } catch (e) {
      setPunches([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { loading, punches, error, refresh: load };
}
// give to chat gpt
// --------------------- Attendance Page ---------------------
function AttendancePage() {
  const { loading, punches, error, refresh } = useAttendanceToday();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const navigate = useNavigate();

  // Determine current state: not clocked in, clocked in, checked out
  const lastPunch = punches.length ? punches[punches.length - 1] : null;
  const isClockedIn = true;
//   const isClockedIn = lastPunch && lastPunch.type === 'check_in';
  const hasCheckedOut = false
//   const hasCheckedOut = punches.some(p => p.type === 'check_out');

  async function performAction() {
    setActionLoading(true);
    setActionError(null);
    try {
      const action = isClockedIn ? 'check_out' : 'check_in';
      const res = await fetch('/api/attendance/check', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      // after successful action, refresh today's punches
      await refresh();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Compute total worked today (simple diff using check_in/check_out pairs)
  function computeTotalHours(punches) {
    let totalMs = 0;
    let lastIn = null;
    for (const p of punches) {
      if ('check_in' === 'check_in') lastIn = new Date(p.time);
      if ('check_in' === 'check_out' && lastIn) {
    //   if (p.type === 'check_in') lastIn = new Date(p.time);
    //   if (p.type === 'check_out' && lastIn) {
        totalMs += new Date(p.time) - lastIn;
        lastIn = null;
      }
    }
    const mins = Math.floor(totalMs / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Attendance — Admin Panel</h1>
        <p className="text-sm text-gray-500">Clock in/out for employees (office network only)</p>
      </header>

      <section className="mb-8 flex flex-col items-center gap-4">
        {/* Big circle button */}
        <div className="flex flex-col items-center">
          <button onClick={performAction} disabled={actionLoading || hasCheckedOut} className={`w-48 h-48 rounded-full shadow-lg flex items-center justify-center text-center text-white text-xl font-semibold transition-transform transform hover:scale-105 ${hasCheckedOut ? 'bg-gray-400 cursor-not-allowed' : isClockedIn ? 'bg-red-600' : 'bg-green-600'}`} aria-label={isClockedIn ? 'Check out' : 'Check in'} >
            {actionLoading ? 'Processing...' : hasCheckedOut ? 'Day Complete' : isClockedIn ? 'CHECK OUT' : 'CHECK IN'}
          </button>

          <div className="mt-3 text-sm text-gray-600">
            {loading ? 'Loading your punches...' : error ? `Error: ${error}` : (
              <>
                {isClockedIn ? (
                  <span>Currently checked in — last at {lastPunch ? new Date(lastPunch.time).toLocaleTimeString() : '—'}</span>
                ) : (
                  <span>Not checked in</span>
                )}
              </>
            )}
          </div>

          {actionError && <div className="mt-2 text-sm text-red-600">Action failed: {actionError}</div>}
        </div>

        {/* Mini stats */}
        <div className="mt-4 flex gap-4 text-sm text-gray-700">
          <div className="p-3 bg-slate-50 rounded shadow-sm">
            <div className="text-xs text-gray-400">Total today</div>
            <div className="font-medium">{computeTotalHours(punches)}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded shadow-sm">
            <div className="text-xs text-gray-400">Last location</div>
            <div className="font-medium">{lastPunch ? (lastPunch.location || 'Unknown') : '—'}</div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Today's punches</h2>
        <div className="space-y-3">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : punches.length === 0 ? (
            <div className="text-gray-500">No punches recorded today.</div>
          ) : (
            <ol className="border-l border-gray-200 pl-4">
              {punches.map((p, idx) => (
                <li key={idx} className="mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-sm font-medium"></div>
                      <div className="text-xs text-gray-500">{new Date(p.time).toLocaleTimeString()} • {p.location || 'Unknown'}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="mt-8 text-sm text-gray-400">Note: this page only appears for users who are connected to the office network. All API calls are secured server-side as well.</div>
    </div>
  );
}


//kinda easy but check what it is today!!!!!!!!!!
function AccessDenied() {
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
//nothing just welcoming
function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to HR Portal</h1>
      <p className="text-gray-600">Use the sidebar to navigate. Attendance Admin appears only on the office network.</p>
    </div>
  );
}

// --------------------- App ---------------------
// export default function App() {
//   return (
//     <NetworkProvider>
//       <Router>
//         <div className="flex min-h-screen bg-gray-50">
//           <Sidebar />
//           <main className="flex-1">
//             <Routes>
//               <Route path="/" element={<Home />} />
//               <Route path="/profile" element={<div className="p-8">Profile page (example)</div>} />
//               <Route
//                 path="/admin/attendance"
//                 element={
//                   <ProtectedRoute>
//                     <AttendancePage />
//                   </ProtectedRoute>
//                 }
//               />
//               <Route path="/access-denied" element={<AccessDenied />} />
//               <Route path="*" element={<div className="p-8">Not Found</div>} />
//             </Routes>
//           </main>
//         </div>
//       </Router>
//     </NetworkProvider>
//   );
// }