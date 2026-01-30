import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAttendanceToday from './useAttendanceToday';
import ActionButton from './ActionButton';
import PunchStats from './PunchStats';
import PunchTimeline from './PunchTimeline';
import useAuth from '../../Context/AuthContext';
import Header from '../../Components/Header';
import { getLocalData } from '../../Hooks/useLocalStorage';
import ConfirmPopup from '../../Components/ConfirmPopup';

export default function ClockIn() {
  const { loading, punches, status, error, refresh } = useAttendanceToday();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { axiosPrivate } = useAuth();

  const [isLocalNetwork, setIsLocalNetwork] = useState(null);

  // Check Network
  React.useEffect(() => {
    const checkNetwork = async () => {
      try {
        console.log('ClockIn: Checking network status...');
        const res = await axiosPrivate.get('/company-info/check-network/');
        console.log('ClockIn: Network check response:', res.data);
        setIsLocalNetwork(res.data.is_local);
      } catch (err) {
        console.error('ClockIn: Network check failed:', err);
        setIsLocalNetwork(false); // Default to restrict on error
      }
    };
    checkNetwork();
  }, [axiosPrivate]);

  // determine punch state
  const checkInPunch = punches.find((p) => p.type === 'check_in');
  const checkOutPunch = punches.find((p) => p.type === 'check_out');

  const isClockedIn = !!checkInPunch && !checkOutPunch;
  const hasCheckedOut = !!checkOutPunch;

  // determine last punch for display
  const lastPunch = punches[punches.length - 1] || null;

  async function performAction() {
    setActionLoading(true);
    setActionError(null);
    setSuccessMessage(null);

    try {
      // timestamp in YYYY-MM-DD HH:mm format
      const now = new Date();

      // Optional location
      const location = 'Office Network';

      let payload = {};
      let endpoint = '';

      if (!checkInPunch) {
        // no punches → CHECK IN
        payload = {
          // clock_in: timestamp,
          clock_in_location: location,
        };
        endpoint = 'clock-in';
      } else if (checkInPunch && !checkOutPunch) {
        // CHECK OUT
        payload = {
          // clock_out: timestamp,
          clock_out_location: location,
        };
        endpoint = 'clock-out';
      } else {
        // already clocked out
        setActionError("You have already completed today's punches.");
        setActionLoading(false);
        return;
      }

      const empId = getLocalData('user_id');
      const res = await axiosPrivate.post(
        `employees/${empId}/attendances/${endpoint}/`,
        payload,
      );

      if (res.data.message) {
        setSuccessMessage(res.data.message);
      }

      await refresh();
    } catch (e) {
      setActionError(e?.response?.data?.message || e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // handle click — show confirmation for clock-out
  const handleActionClick = async () => {
    const checkInPunch = punches.find((p) => p.type === 'check_in');
    const checkOutPunch = punches.find((p) => p.type === 'check_out');
    const isClockOutAction = !!checkInPunch && !checkOutPunch;

    if (isClockOutAction) {
      setShowConfirm(true);
      return;
    }

    await performAction();
  };

  if (isLocalNetwork === null)
    return <div className="p-8 text-center">Checking network status...</div>;
  if (isLocalNetwork === false) {
    return (
      <div className="px-4 py-8 h-full flex flex-col items-center justify-center bg-slate-50 text-red-600">
        <Header
          Title={'Attendance Restricted'}
          subTitle={'External Access Detected'}
        />
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p>
            You must be connected to the company network (WiFi/LAN) to clock in
            or out.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 dark:bg-slate-800 h-full gap-4 flex flex-col bg-slate-50 mx-auto">
      <Header
        Title={'Attendance — Admin Panel'}
        subTitle={'Clock in/out for employees (office network only)'}
      />

      <div className="flex gap-4 flex-1">
        <section className="flex flex-1 dark:bg-slate-700 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-white flex-col rounded shadow items-center justify-center gap-4">
          <ActionButton
            isClockedIn={isClockedIn}
            hasCheckedOut={hasCheckedOut}
            actionLoading={actionLoading}
            onClick={handleActionClick}
          />

          <div className="mt-3 dark:text-slate-400 text-sm text-gray-600">
            {loading
              ? 'Loading...'
              : error
                ? `Error: ${error}`
                : isClockedIn
                  ? `Currently checked in — last at ${new Date(
                      lastPunch?.time,
                    ).toLocaleTimeString()}`
                  : hasCheckedOut
                    ? 'Day completed'
                    : status && status.toUpperCase() !== 'ABSENT'
                      ? status.toUpperCase()
                      : status && status.toUpperCase() === 'ABSENT'
                        ? 'Absent'
                        : 'Not checked in'}
          </div>

          {actionError && (
            <div className="text-sm text-red-600">
              Action failed: {actionError}
            </div>
          )}

          {successMessage && (
            <div className="text-sm text-green-600 font-medium px-4 text-center">
              {successMessage}
            </div>
          )}

          <PunchStats punches={punches} lastPunch={lastPunch} />
        </section>

        <section className="min-w-2/6 rounded dark:bg-slate-700 dark:shadow-slate-900 dark:shadow-md dark:inset-shadow-xs dark:inset-shadow-slate-600 bg-white shadow max-h-4/6 p-4 overflow-y-auto">
          <h2 className="text-lg dark:text-slate-200 font-semibold mb-3">
            Today's punches
          </h2>
          <PunchTimeline loading={loading} punches={punches} />
        </section>
      </div>
      <ConfirmPopup
        isOpen={showConfirm}
        message={'Confirm Clock Out'}
        subMessage={'Are you sure you want to clock out now?'}
        confirmText={'Clock Out'}
        cancelText={'Cancel'}
        onConfirm={async () => {
          setShowConfirm(false);
          await performAction();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}

// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import useAttendanceToday from "./useAttendanceToday";
// import ActionButton from "./ActionButton";
// import PunchStats from "./PunchStats";
// import PunchTimeline from "./PunchTimeline";
// import useAuth from "../../Context/AuthContext";
// import Header from "../../Components/Header";
// import { getLocalData } from "../../Hooks/useLocalStorage";

// export default function ClockIn() {
//   const { loading, punches, error, refresh } = useAttendanceToday();
//   const [actionLoading, setActionLoading] = useState(false);
//   const [actionError, setActionError] = useState(null);
//   const { axiosPrivate } = useAuth();
//   const [url,setUrl] = useState("clock-in");

//   // determine punch state
//   const checkInPunch = punches.find((p) => p.type === "check_in");
//   const checkOutPunch = punches.find((p) => p.type === "check_out");

//   const isClockedIn = !!checkInPunch && !checkOutPunch;
//   const hasCheckedOut = !!checkOutPunch;

//   // determine last punch for display
//   const lastPunch = punches[punches.length - 1] || null;

//   async function performAction() {
//     setActionLoading(true);
//     setActionError(null);

//     try {
//       // timestamp (YYYY-mm-dd HH:mm)
//       const now = new Date();
//       const timestamp =
//         now.getFullYear() +
//         "-" +
//         String(now.getMonth() + 1).padStart(2, "0") +
//         "-" +
//         String(now.getDate()).padStart(2, "0") +
//         " " +
//         String(now.getHours()).padStart(2, "0") +
//         ":" +
//         String(now.getMinutes()).padStart(2, "0");

//       // Optional location (you can update this later)
//       const location = "null";

//       let payload = {};

//       // ======= SEND CORRECT PAYLOAD =======
//       if (!checkInPunch) {
//         // no punches → CHECK IN
//         payload = {
//           clock_in: timestamp,
//           clock_in_location: location,
//         };
//         setUrl("clock-in")
//       } else if (checkInPunch && !checkOutPunch) {
//         // CHECK OUT
//         payload = {
//           clock_out: timestamp,
//           clock_out_location: location,
//         };
//         setUrl("clock-out")
//       }

//       await axiosPrivate.post(`employees/${getLocalData("user_id")}/attendances/${url}/`, payload);

//       await refresh();
//     } catch (e) {
//       setActionError(e?.response?.data?.message || e.message);
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   return (
//     <div className="px-4 py-2  h-full gap-4 flex flex-col bg-slate-50  mx-auto">
//       <Header Title={"Attendance — Admin Panel"} subTitle={"Clock in/out for employees (office network only)"}/>
//     <div className="flex gap-4 flex-1">
//       <section className="flex flex-1 bg-white flex-col rounded shadow  items-center justify-center gap-4">
//         <ActionButton
//           isClockedIn={isClockedIn}
//           hasCheckedOut={hasCheckedOut}
//           actionLoading={actionLoading}
//           onClick={performAction}
//         />

//         <div className="mt-3 text-sm text-gray-600">
//           {loading
//             ? "Loading..."
//             : error
//             ? `Error: ${error}`
//             : isClockedIn
//             ? `Currently checked in — last at ${new Date(
//                 lastPunch?.time
//               ).toLocaleTimeString()}`
//             : hasCheckedOut
//             ? "Day completed"
//             : "Not checked in"}
//         </div>

//         {actionError && (
//           <div className="text-sm text-red-600">Action failed: {actionError}</div>
//         )}

//         <PunchStats punches={punches} lastPunch={lastPunch} />
//       </section>

//       <section className="min-w-2/6 rounded bg-white shadow max-h-4/6 p-4 overflow-y-auto">
//         <h2 className="text-lg font-semibold mb-3">Today's punches</h2>
//         <PunchTimeline loading={loading} punches={punches} />
//       </section>
//       </div>
//     </div>
//   );
// }
