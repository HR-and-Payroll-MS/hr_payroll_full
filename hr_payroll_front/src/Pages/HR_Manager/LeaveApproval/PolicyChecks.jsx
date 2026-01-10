import React from 'react';

const POLICIES = { Annual: { maxDays: 30, minNoticeDays: 3, applyBalanceCheck: true }, Sick: { maxDays: 14, minNoticeDays: 0, applyBalanceCheck: false } };

export default function PolicyChecks({ req, emp }) {
  const rules = POLICIES[req.type] || {};
  const issues = [];
  if (rules.applyBalanceCheck && emp.leaveBalance < req.days) issues.push('Insufficient balance');
  const noticeDays = Math.ceil((new Date(req.startDate) - new Date(req.submittedAt || new Date())) / (1000*60*60*24));
  if (rules.minNoticeDays && noticeDays < rules.minNoticeDays) issues.push(`Less than minimum notice (${rules.minNoticeDays}d)`);
  return issues.length ? (<ul className="text-xs text-red-600 space-y-1">{issues.map((i,idx)=>(<li key={idx}>• {i}</li>))}</ul>) : (<div className="text-xs text-green-600">All policy checks passed</div>);
}
