import PayslipTemplate from "../../../Components/PayslipTemplate";
import calcPayrollForEmployee from "./calcPayrollForEmployee";

// ViewerLoader: converts key back to payroll object and renders PayslipTemplate
export default function ViewerLoader({ Id,demoEmployees,month= new Date().toISOString().split("T")[0] }) {
  console.log("Employee ID:", Id);
  console.log("Employee data:", demoEmployees);
  console.log("Employee month:", month);
  if (!Id) return null;

  // key format: EMP001_2025-12
  // const [eid, monthFromKey] = keyId.split("_");

  // find employee
  // console.log("demoEmployees:", demoEmployees);
  const emp = demoEmployees.find((e) => e.id === Id);
  console.log("Employee found:", emp);

  if (!emp) return <div className="text-sm text-red-500">Employee not found</div>;

  // rebuild payroll using the existing calculator (pass month parsed from key)
  const payroll = calcPayrollForEmployee(emp, month);
  console.log("Payroll rebuilt in ViewerLoader:", payroll);

  return (
    <div className="p-4 border dark:border-slate-400 dark:bg-slate-700 overflow-y-auto h-full rounded hover-bar bg-white">
      <p className="text-2xl dark:text-slate-200 mb-7 font-bold">Preview for the Employee named {payroll?.employee?.name}</p>
      {/* {console.log(payroll)} */}
      <PayslipTemplate payroll={payroll} />
    </div>
  );
}