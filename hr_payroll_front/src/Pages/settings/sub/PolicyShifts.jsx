import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../../Context/AuthContext';
import useData from '../../../Context/DataContextProvider';
import ThreeDots from '../../../animations/ThreeDots';

export default function PolicyShifts() {
  const { axiosPrivate, auth, isAuthLoading } = useAuth();
  const { departments, employees } = useData();
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleToApply, setScheduleToApply] = useState(null);
  const [assignType, setAssignType] = useState('all'); // all, department, employee
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const organizationId = 1;

  useEffect(() => {
    if (departments.get) departments.get();
    if (employees.get) employees.get();
  }, []);

  // Authorization: only allow Manager group to access this page
  const role = auth?.user?.role ? String(auth.user.role).toUpperCase() : null;
  const allowed = role === 'MANAGER';

  if (!isAuthLoading && !allowed) {
    return <Navigate to="/setting" replace />;
  }

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosPrivate.get(`/orgs/${organizationId}/policies`);
        let data = {};
        if (Array.isArray(res.data)) {
          res.data.forEach((p) => {
            if (p.section && p.content) data[p.section] = p.content;
          });
        } else {
          data = res.data || {};
        }

        const attendance = data.attendancePolicy || {};
        const s = (attendance && attendance.shiftTimes) || [];
        setShifts(
          s.length ? s : [{ title: 'Day Shift', start: '09:00', end: '17:00' }],
        );
      } catch (err) {
        console.error('Failed to fetch policy shifts', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [axiosPrivate]);

  const toggleSelection = (id, list, setList) => {
    if (list.includes(id)) setList(list.filter((i) => i !== id));
    else setList([...list, id]);
  };

  const ensureScheduleAndAssign = async (shift) => {
    // Prepare schedule and show preview before executing
    setApplyLoading(true);
    try {
      const listRes = await axiosPrivate.get('/attendances/schedules/');
      const raw = listRes.data.results || listRes.data || [];
      const match = raw.find(
        (r) => r.start_time === shift.start && r.end_time === shift.end,
      );

      let scheduleId = null;
      if (match) scheduleId = match.id;
      else {
        const payload = {
          title: shift.title || `Policy Shift ${shift.start}-${shift.end}`,
          start_time: shift.start || '09:00',
          end_time: shift.end || '17:00',
          days_of_week: [0, 1, 2, 3, 4],
          schedule_type: 'Fixed Time',
          hours_per_day: '08:00',
          hours_per_week: '40:00',
        };
        const createRes = await axiosPrivate.post(
          '/attendances/schedules/',
          payload,
        );
        scheduleId = createRes.data.id || createRes.data;
      }

      if (!scheduleId) throw new Error('Failed to get or create schedule');

      // Build list of affected employees locally for preview
      let affected = [];
      if (assignType === 'all') {
        affected = employees.data || [];
      } else if (assignType === 'department') {
        affected = (employees.data || []).filter((e) =>
          selectedDepartments.includes(
            e.department_id || e.departmentId || e.department?.id,
          ),
        );
      } else if (assignType === 'employee') {
        affected = (employees.data || []).filter((e) =>
          selectedEmployees.includes(e.id),
        );
      }

      setScheduleToApply({ shift, scheduleId, affected });
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to prepare shift assignment.');
    } finally {
      setApplyLoading(false);
    }
  };

  const executeAssign = async (scheduleId) => {
    setApplyLoading(true);
    try {
      const payload = {};
      if (assignType === 'all') payload.all_employees = true;
      if (assignType === 'department')
        payload.department_ids = selectedDepartments;
      if (assignType === 'employee') payload.employee_ids = selectedEmployees;

      await axiosPrivate.post(
        `/attendances/schedules/${scheduleId}/assign-bulk/`,
        payload,
      );
      alert('Schedule assigned successfully.');
      setPreviewOpen(false);
      setScheduleToApply(null);
    } catch (err) {
      console.error(err);
      alert('Failed to apply schedule.');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6">
        <ThreeDots />
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Policy Shifts</h2>
      <p className="text-sm text-slate-500 mb-6">
        Shifts defined in the organization's attendance policy. You can create
        matching Work Schedules and assign them to employees.
      </p>

      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Assign Mode</label>
        <div className="flex gap-2">
          <button
            className={`px-3 py-2 rounded ${assignType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
            onClick={() => setAssignType('all')}
          >
            All Employees
          </button>
          <button
            className={`px-3 py-2 rounded ${assignType === 'department' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
            onClick={() => setAssignType('department')}
          >
            By Department
          </button>
          <button
            className={`px-3 py-2 rounded ${assignType === 'employee' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
            onClick={() => setAssignType('employee')}
          >
            By Employee
          </button>
        </div>
      </div>

      {assignType === 'department' && (
        <div className="mb-4 border rounded p-3 max-h-40 overflow-auto">
          {departments.data?.map((d) => (
            <label key={d.id} className="flex items-center gap-2 p-1">
              <input
                type="checkbox"
                checked={selectedDepartments.includes(d.id)}
                onChange={() =>
                  toggleSelection(
                    d.id,
                    selectedDepartments,
                    setSelectedDepartments,
                  )
                }
              />
              <span className="text-sm">{d.name}</span>
            </label>
          ))}
        </div>
      )}

      {assignType === 'employee' && (
        <div className="mb-4 border rounded p-3 max-h-40 overflow-auto">
          {employees.data?.map((e) => (
            <label key={e.id} className="flex items-center gap-2 p-1">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(e.id)}
                onChange={() =>
                  toggleSelection(e.id, selectedEmployees, setSelectedEmployees)
                }
              />
              <span className="text-sm">
                {e.fullname} ({e.department})
              </span>
            </label>
          ))}
        </div>
      )}

      {shifts.map((s, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-4 mb-3 border rounded-md"
        >
          <div>
            <p className="font-bold">{s.title || `Shift ${idx + 1}`}</p>
            <p className="text-sm text-slate-500">
              {s.start || '09:00'} - {s.end || '17:00'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => ensureScheduleAndAssign(s)}
              className="px-4 py-2 bg-green-600 text-white rounded"
              disabled={applyLoading}
            >
              {applyLoading ? <ThreeDots /> : 'Apply Selected'}
            </button>
            <a
              href="/setting/WorkSchedule"
              className="px-4 py-2 bg-slate-200 rounded text-sm"
            >
              Open Schedules
            </a>
          </div>
        </div>
      ))}

      {/* Preview Modal */}
      {previewOpen && scheduleToApply && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[700px] max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-bold mb-3">Confirm Assignment</h3>
            <p className="text-sm text-slate-500 mb-4">
              Schedule:{' '}
              <strong>
                {scheduleToApply.shift.title ||
                  `${scheduleToApply.shift.start}-${scheduleToApply.shift.end}`}
              </strong>
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Affected employees:{' '}
              <strong>{scheduleToApply.affected.length}</strong>
            </p>
            <div className="mb-4 border p-2 rounded max-h-44 overflow-auto">
              {scheduleToApply.affected.slice(0, 200).map((emp) => (
                <div key={emp.id} className="py-1 text-sm">
                  {emp.fullname} {emp.department ? `(${emp.department})` : ''}
                </div>
              ))}
              {scheduleToApply.affected.length > 200 && (
                <div className="text-xs text-slate-400">
                  Showing first 200 employees
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setPreviewOpen(false);
                  setScheduleToApply(null);
                }}
                className="px-4 py-2 rounded bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAssign(scheduleToApply.scheduleId)}
                className="px-4 py-2 rounded bg-green-600 text-white"
                disabled={applyLoading}
              >
                {applyLoading ? <ThreeDots /> : 'Confirm and Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
