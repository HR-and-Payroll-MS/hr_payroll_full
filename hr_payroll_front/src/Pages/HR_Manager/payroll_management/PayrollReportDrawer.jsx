import React from "react";
import FileDrawer from "../../../Components/FileDrawer"
function PayrollReportDrawer({ data}) {
  return (
      <div className="p-5">
        <h2 className="text-xl font-semibold mb-3">
          Payroll Report - {data?.month}
        </h2>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Total Employees:</strong> {data?.totalEmployees}
          </p>
          <p>
            <strong>Total Payout:</strong> $
            {data?.totalPayout?.toLocaleString()}
          </p>
          <p>
            <strong>Status:</strong> {data?.status}
          </p>
        </div>

      </div>
  );
}

export default PayrollReportDrawer;
