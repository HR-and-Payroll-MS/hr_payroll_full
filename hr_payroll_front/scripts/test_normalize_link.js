// Simple test harness to reproduce NotificationCenterPage.normalizeLink behavior for WorkSchedule links

function getRoleBase(role) {
  const rl = String(role || '').toLowerCase();
  if (rl.includes('line manager') || (rl.includes('line') && rl.includes('manager'))) return 'department_manager';
  if (rl.includes('manager') || rl.includes('hr') || rl.includes('hr manager') || rl === 'manager') return 'hr_dashboard';
  if (rl.includes('payroll')) return 'Payroll';
  if (rl.includes('admin')) return 'admin_dashboard';
  if (rl.includes('employee')) return 'Employee';
  return 'Employee';
}

function normalizeLink(link, n, currentRole) {
  if (!link || typeof link !== 'string') return null;
  let path = link.trim();
  path = path.split('?')[0].split('#')[0];
  path = path.replace(/\/+$/, '');

  const cat = (n?.category || n?.notification_type || '').toLowerCase();

  // policies
  if (path.replace(/\/+$/, '').toLowerCase() === '/policies' || path.toLowerCase() === 'policies' || cat.includes('policy')) {
    const base = getRoleBase(currentRole);
    return `/${base}/HelpCenter/policies`;
  }

  // payroll approvals
  const text = (n?.title || '') + ' ' + (n?.message || '') + ' ' + cat + ' ' + path;
  if (text.toLowerCase().includes('payroll') && (text.toLowerCase().includes('approved') || text.toLowerCase().includes('approval') || text.toLowerCase().includes('rolled back') || text.toLowerCase().includes('rollback') || text.toLowerCase().includes('reverted'))) {
    return '/Payroll/generate_payroll';
  }

  // Normalize WorkSchedule targets
  try {
    const lowPath = path.toLowerCase();
    if (lowPath.includes('/setting/workschedule') || lowPath.endsWith('/workschedule')) {
      const localRole = currentRole;
      const rl = String(localRole || '').toLowerCase();
      const roleBase = getRoleBase(localRole);
      return `/${roleBase}/setting/WorkSchedule`;
    }
  } catch (e) {
    // ignore
  }

  // fallback
  return path;
}

const sample = {
  id: 3189,
  recipient: 2,
  recipient_name: 'Lensa Bekele',
  sender: 14,
  sender_name: 'Abebe Desalegn',
  category: 'attendance',
  link: '/Employee/setting/WorkSchedule',
  message: "A new work schedule 'Policy Shift 09:00-17:00' has been assigned to you (09:00 - 17:00).",
  title: 'Work Schedule Assigned',
};

const roles = ['Employee', 'Manager', 'Line Manager', 'Payroll', 'Admin', 'HR'];

roles.forEach(r => {
  const out = normalizeLink(sample.link, sample, r);
  console.log('Role:', r, '->', out);
});
