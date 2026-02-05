import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../Context/AuthContext';
import NotificationCard from './NotificationCard';
import { ROLE_RECEIVE_TYPES } from './utils';
import InputField from '../../Components/InputField';
import Dropdown from '../../Components/Dropdown';
import DetailNotification from './DetailNotification';
import { useNotifications } from '../../Context/NotificationProvider';
import Icon from '../../Components/Icon';
import { getLocalData } from '../../Hooks/useLocalStorage';

export default function NotificationCenterPage({ role = 'Employee' }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentRole = getLocalData("role") || auth?.user?.role || role || 'Employee';
  console.log('NotificationCenterPage currentRole:', currentRole);
  const {
    items,
    sentItems,
    markRead,
    remove,
    selected,
    setSelected,
    fetchSent,
  } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('received'); // 'received' or 'sent'

  const pageSize = 10;
  const visible = (n) => {
    if (tab === 'sent') return true; // Show all sent
    if (!n.receivers) return true;
    return (
      n.receivers.includes('ALL') ||
      n.receivers.includes(currentRole) ||
      ROLE_RECEIVE_TYPES[currentRole]?.includes(n.category)
    );
  };

  const normalizeLink = (link, n) => {
    if (!link || typeof link !== 'string') return null;
    let path = link.trim();
    // Strip query/hash
    path = path.split('?')[0].split('#')[0];
    // Remove trailing numeric/hex-like ID segments to avoid 404
    path = path.replace(/\/+$/, '');
    const segs = path.split('/').filter(Boolean);
    if (segs.length > 0) {
      const last = segs[segs.length - 1];
      if (/^\d+$/.test(last) || /^[0-9a-fA-F]{8,}$/.test(last)) {
        segs.pop();
        path = '/' + segs.join('/');
      }
    }
    path = path.replace(/^\/employee\b/i, '/Employee');
    path = path.replace(/^\/payroll\b/i, '/payroll');
    // Map current user role to the base route used in App routes
    const roleBaseMap = {
      employee: 'Employee',
      payroll: 'payroll',
      'line manager': 'department_manager',
      'department manager': 'department_manager',
      manager: 'hr_dashboard',
    };
    const getRoleBase = (r) => {
      const rl = String(r || '').toLowerCase();
      console.log('getRoleBase for role:', rl);
      if (!rl) return 'Employee';

      if (rl.includes('payroll')) return 'Payroll';
      if (rl.includes('department') || rl.includes('line manager') || rl.includes('department_manager'))
        return 'department_manager';
      if (rl === 'manager' || rl.includes('manager'))
        return 'hr_dashboard';
      if (rl.includes('employee')) return 'Employee';

      const key = Object.keys(roleBaseMap).find((k) => rl === k);
      return key ? roleBaseMap[key] : 'Employee';
    };

    const cat = (n?.category || n?.notification_type || '').toLowerCase();

    // If backend sent a generic /policies (or the notification category is policy),
    // route to the appropriate parent HelpCenter policies page using the user's role.
    if (
      path.replace(/\/+$/, '').toLowerCase() === '/policies' ||
      path.toLowerCase() === 'policies' ||
      cat.includes('policy')
    ) {
      const base = getRoleBase(currentRole);
      return `/${base}/HelpCenter/policies`;
    }

    // Handle payroll approval/rollback notifications: always go to Payroll generate page
    const text = (
      (n?.title || '') +
      ' ' +
      (n?.message || '') +
      ' ' +
      cat +
      ' ' +
      path
    ).toLowerCase();
    if (
      text.includes('payroll') &&
      (text.includes('approved') ||
        text.includes('approval') ||
        text.includes('rolled back') ||
        text.includes('rollback') ||
        text.includes('reverted'))
    ) {
      return '/Payroll/generate_payroll';
    }

    // Map generic my-payslips or payslip-related notifications to the appropriate
    // role-specific my-payslips route (e.g. /Payroll/my-payslips)
    if (
      path.replace(/\/+$/, '').toLowerCase() === '/my-payslips' ||
      path.toLowerCase() === 'my-payslips' ||
      cat.includes('payslip') ||
      cat.includes('payslips') ||
      (cat.includes('payroll') && path.replace(/\/+$/, '').toLowerCase().endsWith('payslips'))
    ) {
      const base = getRoleBase(currentRole);
      return `/${base}/my-payslips`;
    }

    if (cat.includes('tax')) return null; // stay in detail for tax code notifications
    if (/^\/leaves(\/|$)/i.test(path)) {
      const roleNorm = (currentRole || '').toLowerCase();
      if (roleNorm.includes('employee')) return '/Employee/Request';
      if (roleNorm.includes('line manager')) return '/department_manager/Approve_Reject';
      if (roleNorm.includes('manager')) return '/hr_dashboard/Approve_Reject';
      return '/Employee/Request';
    }

    if (!/^\//.test(path) || path === '/') {
      if (cat.includes('attendance')) return '/Employee/myovertime';
      if (cat.includes('leave')) return '/Employee/Request';
      if (cat.includes('payroll')) return '/Employee/my-payslips';
    }

    return path;
  };
  const types = [
    { content: 'all' },
    { content: 'system' },
    { content: 'attendance' },
    { content: 'payroll' },
  ];

  const filtered = useMemo(() => {
    const list = tab === 'received' ? items || [] : sentItems || [];
    return list
      .filter(visible)
      .filter((n) => (filter === 'all' ? true : n.category === filter))
      .filter((n) =>
        q ? (n.title + n.message).toLowerCase().includes(q.toLowerCase()) : true
      )
      .sort((a, b) => {
        if (tab === 'sent') return new Date(b.createdAt) - new Date(a.createdAt);
        return a.unread === b.unread ? 0 : a.unread ? -1 : 1;
      });
  }, [items, sentItems, filter, q, role, tab]);

  useEffect(() => {
    setPage(1);
  }, [filter, q, tab]);

  useEffect(() => {
    if (tab === 'sent') fetchSent();
  }, [tab]);

  const pages = Math.ceil(filtered.length / pageSize) || 1;
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (selected) {
    return (
      <DetailNotification
        n={selected}
        setSelected={setSelected}
        store={{ markRead, remove }}
      />
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-4 p-4 md:p-7 dark:bg-slate-800 bg-gray-50 overflow-hidden transition-colors">
      {/* HEADER SECTION - Matching Leave Requests Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {tab === 'received'
              ? 'Stay updated with system alerts and personal notifications'
              : "Review the notifications you've dispatched to others"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InputField
            maxWidth="min-w-128"
            searchMode="input"
            placeholder="Search..."
            onChangeValue={setQ}
          />
          <Dropdown
            onChange={setFilter}
            placeholder="Category"
            padding="p-2 min-w-[120px]"
            options={types}
          />
        </div>
      </div>

      {/* TABS SECTION */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 px-2 shrink-0">
        <button
          onClick={() => setTab('received')}
          className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${
            tab === 'received'
              ? 'text-green-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Inbox
          {tab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full animate-in fade-in duration-300" />
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${
            tab === 'sent'
              ? 'text-green-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Sent
          {tab === 'sent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full animate-in fade-in duration-300" />
          )}
        </button>
      </div>

      {/* MAIN CONTENT - Inset Shadow Container style from Leave Page */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 overflow-hidden transition-all">
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hidden">
          {view.length > 0 ? (
            <div className="space-y-1">
              {view.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={{ ...n, sender_view: tab === 'sent' }}
                  onView={() => {
                    const rawLink = n.related_link || n.link;
                    const target = normalizeLink(rawLink, n);
                    try {
                      console.log('notification raw link:', rawLink);
                      console.log('notification normalized target:', target);
                    } catch (e) {
                      /* ignore logging errors */
                    }
                    if (tab === 'received') markRead(n.id);
                    if (target) {
                      navigate(target);
                    } else {
                      setSelected({
                        ...n,
                        unread: tab === 'received' ? false : n.unread,
                      });
                    }
                  }}
                  onDelete={() => remove(n.id)}
                  onMarkRead={() => tab === 'received' && markRead(n.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Icon name="BellOff" className="w-12 h-12 mb-2 opacity-10" />
              <p className="text-sm italic">No notifications found</p>
            </div>
          )}
        </div>

        {/* PAGINATION - Professional Footer style */}
        {filtered.length > pageSize && (
          <div className="shrink-0 p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 border rounded bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
