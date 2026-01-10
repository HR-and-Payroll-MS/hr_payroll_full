import React, { useState } from 'react';
import PayrollReportsTable from './PayrollReportsTable';
import PayrollReportDrawer from './PayrollReportDrawer';
import Table from '../../../Components/Table';
import GeneratePayroll from '../../Payroll_Officer/payroll_management/GeneratePayroll';

function PayrollReportsPage() {
  // static data placeholder
  const mockReports = [
    {
      id: 1,
      month: 'January 2025',
      totalEmployees: 42,
      totalPayout: 280000,
      status: 'Completed',
    },
    {
      id: 2,
      month: 'February 2025',
      totalEmployees: 41,
      totalPayout: 276500,
      status: 'Completed',
    },
  ];
  const structure = [1, 1, 1, 1, 63];
  const key = [['month'], ['totalEmployees'], ['totalPayout'], ['status']];
  const title = ['Month', 'Employees', 'Total Payout', 'Status', 'Action'];

  const [selectedReport, setSelectedReport] = useState(null);

  return (<GeneratePayroll/>);
    {/* <div className="p-5">
      <h1 className="text-2xl font-semibold mb-4">Payroll Reports</h1>
      <Table
        Data={mockReports}
        Structure={structure}
        ke={key}
        title={title}
        components={PayrollReportDrawer}
      /> 
    </div>*/}
  
}

export default PayrollReportsPage;
