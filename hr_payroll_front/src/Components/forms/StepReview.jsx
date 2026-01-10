import React from "react";
import Icon from "../Icon";
import { CheckCircle2, FileText, User, Briefcase, CreditCard, Files } from "lucide-react";

const StepReview = ({ data }) => {
  const { general, job, payroll, documents } = data;

  // Internal Section Component - Logic untouched, Style updated
  const Section = ({ title, icon, children }) => (
    <div className="bg-gray-50 dark:bg-slate-700/50 p-5 rounded shadow dark:shadow-black dark:inset-shadow-xs dark:inset-shadow-slate-600 transition-colors">
      <div className="flex items-center gap-2 mb-4 border-b dark:border-slate-600 pb-2">
        <span className="text-blue-500 dark:text-blue-400">{icon}</span>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-xs">
        {children}
      </div>
    </div>
  );

  const renderItem = (label, value) => (
    <div className="flex flex-col gap-0.5">
      <span className="font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-tight">
        {label}
      </span>
      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
        {value || <span className="text-slate-400 italic font-normal">Not provided</span>}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
            <CheckCircle2 size={20} />
        </div>
        <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Final Review</h2>
            <p className="text-xs text-slate-500">Please verify all employee details before submitting to the system.</p>
        </div>
      </div>

      {/* General Info */}
      <Section title="General Information" icon={<User size={16}/>}>
        {renderItem("Full Name", `${general.firstname || ''} ${general.lastname || ''}`)}
        {renderItem("Email Address", general.emailaddress)}
        {renderItem("Phone Number", general.phonenumber)}
        {renderItem("Gender", general.gender)}
        {renderItem("Date of Birth", general.dateofbirth)}
        {renderItem("Nationality", general.nationality)}
        {renderItem("Marital Status", general.maritalstatus)}
        {renderItem("Personal Tax ID", general.personaltaxid)}
        {renderItem("Primary Address", `${general.primaryaddress || ''}, ${general.city || ''}`)}
        
        <div className="col-span-full mt-4 pt-4 border-t dark:border-slate-600">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3">Emergency Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {renderItem("Contact Name", general.emefullname)}
            {renderItem("Relationship", general.emestate)}
            {renderItem("Contact Phone", general.emephonenumber)}
          </div>
        </div>
      </Section>

      {/* Job Info */}
      <Section title="Job Information" icon={<Briefcase size={16}/>}>
        {renderItem("Employee ID", job.employeeid)}
        {renderItem("Job Title", job.jobtitle)}
        {renderItem("Line Manager", job.linemanager)}
        {renderItem("Position Type", job.positiontype)}
        {renderItem("Employment Type", job.employmenttype)}
        {renderItem("Join Date", job.joindate)}
        {renderItem("Contract Number", job.contractnumber)}
        {renderItem("Contract Name", job.contractname)}
        {renderItem("Start Date", job.startdate)}
      </Section>

      {/* Payroll Info */}
      <Section title="Payroll Information" icon={<CreditCard size={16}/>}>
        {renderItem("Status", payroll.employeestatus)}
        {renderItem("Salary Rate", payroll.salary)}
        {renderItem("Onset Date", payroll.onset)}
        {renderItem("Offset Date", payroll.offset)}
      </Section>

      {/* Documents */}
      <Section title="Attachments" icon={<Files size={16}/>}>
        <div className="col-span-full">
            {documents.files ? (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-600 w-fit min-w-[240px]">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded">
                    <FileText size={20} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {documents.files.name || `Employee_Document.pdf`}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Ready for upload</span>
                </div>
            </div>
            ) : (
            <p className="text-slate-400 italic text-xs">No documents uploaded</p>
            )}
        </div>
      </Section>
    </div>
  );
};

export default StepReview;