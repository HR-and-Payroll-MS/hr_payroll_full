import React, { useState, useMemo, useEffect } from 'react';
import RequestList from './RequestList';
import RequestDetails from './RequestDetails';
import ActionPanel from './ActionPanel';
import ToastContainer from './ToastContainer';
import FileDrawer from '../../../Components/FileDrawer';
import Header from '../../../Components/Header';
import useAuth from '../../../Context/AuthContext';

export default function LeaveApprovalPage() {
  const { axiosPrivate, auth } = useAuth();
  const currentEmployeeId =
    auth?.user?.employee_id || localStorage.getItem('user_id');
  const localGroups = (() => {
    try {
      return JSON.parse(localStorage.getItem('groups') || '[]');
    } catch {
      return [];
    }
  })();
  const roleTokens = [
    auth?.user?.role,
    ...(auth?.user?.groups || []),
    ...(localGroups || []),
  ]
    .filter(Boolean)
    .map((r) => String(r).toLowerCase());
  const isHR = roleTokens.some(
    (r) => r.includes('hr') || r.includes('payroll') || r.includes('admin')
  );
  const isManager = roleTokens.some((r) => r.includes('manager'));
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState({ q: '', status: 'all' });
  const [toasts, setToasts] = useState([]);

  // Fetch leave requests and employees on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [requestsRes, employeesRes] = await Promise.all([
          axiosPrivate.get('/leaves/requests/?page_size=1000'),
          axiosPrivate.get('/employees/?page_size=1000'),
        ]);

        // Transform backend data to match frontend expected format
        const transformedRequests = (
          requestsRes.data.results ||
          requestsRes.data ||
          []
        ).map((req) => ({
          id: req.id,
          employeeId: req.employee,
          type: req.leave_type,
          startDate: req.start_date,
          endDate: req.end_date,
          days: req.days,
          reason: req.reason,
          status: req.status,
          submittedAt: req.submitted_at,
          approvalChain: (req.approval_chain || []).map((ac) => ({
            step: ac.step,
            role: ac.role,
            approver: ac.approver_name,
            status: ac.status,
          })),
          requesterIsManager: (req.approval_chain || []).some(
            (ac) =>
              ac.step === 1 && ac.role === 'Manager' && ac.status === 'approved'
          ),
          attachments: req.attachments || [],
          notes: [],
        }));

        const transformedEmployees = (
          employeesRes.data.results ||
          employeesRes.data ||
          []
        ).map((emp) => ({
          id: emp.id,
          name:
            emp.fullname ||
            `${emp.general?.firstname || ''} ${
              emp.general?.lastname || ''
            }`.trim() ||
            'Unknown',
          dept:
            emp.department?.name ||
            emp.department ||
            emp.job?.department?.name ||
            emp.job?.department ||
            'N/A',
          role: emp.position || emp.job?.jobtitle || 'Employee',
          // FIXED: Map photo from general or top-level, handle missing data
          photo: emp.general?.photo || emp.photo || null,
          avatarColor: 'bg-indigo-500',
          leaveBalance: 10, // Default placeholder
        }));

        setRequests(transformedRequests);
        setEmployees(transformedEmployees);
      } catch (error) {
        console.error('Failed to fetch leave data:', error);
        pushToast('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [axiosPrivate]);

  // Filtering and Sorting logic
  const filtered = useMemo(() => {
    const statusPriority = {
      pending: 1,
      manager_approved: 1,
      approved: 2,
      denied: 3,
      cancelled: 4,
    };

    return requests
      .filter((r) => {
        const emp = employees.find((e) => e.id === r.employeeId);
        const matchesQ =
          !filter.q ||
          (emp && emp.name.toLowerCase().includes(filter.q.toLowerCase())) ||
          r.status.toLowerCase().includes(filter.q.toLowerCase()) ||
          r.type.toLowerCase().includes(filter.q.toLowerCase());
        if (!matchesQ) return false;
        // For 'pending' filter, also show 'manager_approved' (both need HR action)
        if (filter.status === 'pending') {
          return r.status === 'pending' || r.status === 'manager_approved';
        }
        if (filter.status !== 'all' && r.status !== filter.status) return false;
        return true;
      })
      .sort((a, b) => {
        const pA = statusPriority[a.status] || 99;
        const pB = statusPriority[b.status] || 99;

        if (pA !== pB) return pA - pB;

        // If same priority, sort by date descending
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      });
  }, [requests, filter, employees]);

  function openModal() {
    setDrawerOpen(true);
  }

  function openDetails(req) {
    setSelectedRequest(req);
    openModal();
  }

  function pushToast(msg) {
    const id = Math.random().toString(36);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }

  async function handleDecision(reqId, decision, comment) {
    try {
      const endpoint =
        decision === 'approved'
          ? `/leaves/requests/${reqId}/approve/`
          : `/leaves/requests/${reqId}/deny/`;

      await axiosPrivate.post(endpoint, { comment });

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: decision,
                notes: [
                  ...r.notes,
                  { by: 'You', at: new Date().toISOString(), text: comment },
                ],
                approvalChain: r.approvalChain.map((step, index) =>
                  step.status === 'pending'
                    ? { ...step, status: decision, approver: 'You' }
                    : step
                ),
              }
            : r
        )
      );

      setDrawerOpen(false);
      pushToast(
        decision === 'approved'
          ? 'Leave Request Approved'
          : 'Leave Request Denied'
      );
      // Notify sidebar badges to refresh
      try {
        window.dispatchEvent(new Event('leave_updated'));
      } catch {}
    } catch (error) {
      console.error('Decision failed:', error);
      pushToast('Failed to process decision. Please try again.');
    }
  }

  const selectedStatus = selectedRequest?.status;
  const isOwnRequest =
    String(selectedRequest?.employeeId) === String(currentEmployeeId);
  const isFinalized =
    selectedStatus === 'approved' || selectedStatus === 'denied';
  const requesterIsManager = !!selectedRequest?.requesterIsManager;

  // Block finalized and self-requests; let backend enforce role/state for others
  const canApproveOrDeny = !isFinalized && !isOwnRequest;

  const actionDisabledReason = (() => {
    if (isFinalized) return 'Already finalized';
    if (isOwnRequest) return 'You cannot approve your own request';
    return '';
  })();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white dark:bg-slate-800">
        <div className="text-slate-500 dark:text-slate-400">
          Loading leave requests...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white w-full flex flex-col gap-4 p-4 md:p-7 dark:bg-slate-800 overflow-hidden transition-colors">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between shrink-0">
        <Header
          Title={'Leave Requests'}
          subTitle={
            'Approve or deny leave requests — opens details in your Drawer'
          }
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 overflow-hidden transition-all">
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <RequestList
            requests={filtered}
            employees={employees}
            filter={filter}
            setFilter={setFilter}
            onOpen={openDetails}
          />
        </div>
      </div>

      {/* DRAWER CONTENT */}
      {drawerOpen && (
        <FileDrawer isModalOpen={drawerOpen} closeModal={setDrawerOpen}>
          {selectedRequest && (
            <div className="h-full flex flex-col bg-white dark:bg-slate-800 transition-colors">
              {/* Scrollable Details Area */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hidden">
                <RequestDetails req={selectedRequest} employees={employees} />
              </div>

              {/* Fixed Action Panel at Bottom */}
              <div className="shrink-0 p-4 border-t border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                <ActionPanel
                  request={selectedRequest}
                  onApprove={(c) =>
                    handleDecision(selectedRequest.id, 'approved', c)
                  }
                  onDeny={(c) =>
                    handleDecision(selectedRequest.id, 'denied', c)
                  }
                  disabled={!canApproveOrDeny}
                  disabledReason={actionDisabledReason}
                />
              </div>
            </div>
          )}
        </FileDrawer>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
