import React, { useEffect, useState } from 'react';
import useAuth from '../../Context/AuthContext';
import useData from '../../Context/DataContextProvider';
import Header from '../../Components/Header';
import Icon from '../../Components/Icon';
import Skeleton from '../../animations/Skeleton/EmployeeDirectorySkeleton';

export default function MyDepartment() {
  const { axiosPrivate, auth } = useAuth();
  const { employees } = useData();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDept = async () => {
      try {
        // The backend get_queryset will filter this to only their own department
        const res = await axiosPrivate.get('/departments/');
        const data = res.data.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          let dept = data[0];

          // If user has an employee record, prefer their department when multiple departments are returned
          const empId = auth?.user?.employee_id;
          if (empId && data.length > 1) {
            // Try to get department from cached employees first
            const cached = employees.getById ? employees.getById(empId) : null;
            let emp = null;
            if (cached) {
              emp = cached;
            } else {
              try {
                const empRes = await axiosPrivate.get(`/employees/${empId}/`);
                emp = empRes.data;
              } catch (err) {
                // ignore and fallback to first dept
              }
            }

            if (emp) {
              const empDeptId =
                emp.department ||
                emp.job?.department ||
                emp.department_id ||
                emp.departmentId;
              if (empDeptId) {
                const found = data.find(
                  (d) =>
                    Number(d.id) === Number(empDeptId) ||
                    d.name === empDeptId ||
                    d.name === emp.job?.department,
                );
                if (found) dept = found;
              }
            }
          }

          // If department has no manager_name, try to infer from employees endpoint
          if (!dept.manager_name) {
            try {
              const empRes = await axiosPrivate.get(
                '/employees/?department=' + encodeURIComponent(dept.name),
              );
              const emps = empRes.data.results || empRes.data;
              // Try to find a Department/Line Manager among employees
              let candidate = emps.find((e) => {
                const title = (
                  e.job?.jobtitle ||
                  e.jobtitle ||
                  e.position ||
                  ''
                ).toLowerCase();
                return (
                  title.includes('department manager') ||
                  title.includes('line manager') ||
                  title.includes('manager')
                );
              });
              if (!candidate) {
                // Aggregate most referenced linemanager id
                const lmCount = {};
                emps.forEach((e) => {
                  const lm = e.job?.linemanager || e.linemanager || null;
                  const lmId = lm && (lm.id || lm);
                  if (lmId) lmCount[lmId] = (lmCount[lmId] || 0) + 1;
                });
                const lmIds = Object.keys(lmCount).sort(
                  (a, b) => lmCount[b] - lmCount[a],
                );
                if (lmIds.length) {
                  const lmId = lmIds[0];
                  candidate = emps.find((e) => Number(e.id) === Number(lmId));
                }
              }

              if (candidate) {
                dept.manager_name =
                  candidate.general?.fullname ||
                  candidate.fullname ||
                  `${candidate.general?.firstname || ''} ${candidate.general?.lastname || ''}`.trim();
                dept.manager_email =
                  candidate.general?.emailaddress || candidate.email;
              }
            } catch (err) {
              // ignore errors and proceed with original dept
            }
          }

          setDepartment(dept);
        }
      } catch (err) {
        console.error('Failed to fetch department info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDept();
  }, [axiosPrivate]);

  if (loading) return <Skeleton />;

  if (!department) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <Icon name="Info" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold dark:text-white">
          No Department Assigned
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mt-2">
          You are not currently assigned to any department.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <Header
        Title="My Department"
        subTitle="View information about your assigned department"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Icon
                name="Briefcase"
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                Department Name
              </p>
              <h2 className="text-2xl font-bold dark:text-white">
                {department.name}
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                Description
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-300">
                {department.description ||
                  'No description provided for this department.'}
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                  Total Employees
                </p>
                <p className="text-xl font-semibold dark:text-white">
                  {department.total_employees || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">
                  Status
                </p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${department.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {department.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
            <Icon name="Users" className="text-purple-600" />
            Management
          </h3>

          {department.manager_name ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">
                Department Manager
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-slate-500">
                  {department.manager_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold dark:text-white">
                    {department.manager_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {department.manager_email || 'No email available'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              No manager assigned to this department yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
