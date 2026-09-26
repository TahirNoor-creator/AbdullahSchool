import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Plus,
  Printer,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { Employee, PayrollRecord } from '../types/erp';

interface HRViewProps {
  employees: Employee[];
  payroll: PayrollRecord[];
  onPrintSalarySlip: (slip: PayrollRecord) => void;
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
}

export const HRView: React.FC<HRViewProps> = ({
  employees,
  payroll,
  onPrintSalarySlip,
  onExportToSheet,
}) => {
  const [tab, setTab] = useState<'employees' | 'payroll'>('employees');

  const handleExport = () => {
    if (!onExportToSheet) return;
    if (tab === 'employees') {
      const headers = ['Staff ID', 'Full Name', 'Department', 'Designation', 'Work Email', 'Phone', 'Base Salary', 'Status'];
      const rows = employees.map((e) => [
        e.empNo,
        e.fullName,
        e.department,
        e.designation,
        e.email,
        e.phone,
        e.salary,
        e.status,
      ]);
      onExportToSheet('Faculty & Staff Directory', headers, rows);
    } else {
      const headers = ['Slip No', 'Employee Name', 'Designation', 'Month', 'Basic Salary', 'Allowances', 'Deductions', 'Net Disbursed', 'Status'];
      const rows = payroll.map((p) => [
        p.slipNo,
        p.empName,
        p.designation,
        p.month,
        p.basicSalary,
        p.allowances,
        p.deductions,
        p.netSalary,
        p.status,
      ]);
      onExportToSheet('Faculty Payroll Ledgers', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            Human Resources &amp; Payroll Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Faculty rosters, designations, departmental structures, and monthly automated payroll disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onExportToSheet && (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs"
              title="Export displayed faculty or payroll table directly into Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export to Sheets</span>
            </button>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTab('employees')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'employees'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Faculty Directory ({employees.length})
            </button>
            <button
              onClick={() => setTab('payroll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'payroll'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Payroll Slips ({payroll.length})
            </button>
          </div>
        </div>
      </div>

      {tab === 'employees' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Work Email</th>
                  <th className="py-3 px-4">Base Monthly</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {emp.empNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {emp.fullName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{emp.department}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {emp.designation}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{emp.email}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      ${emp.salary.toLocaleString()}/mo
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Salary Slip No</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Disbursed</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {payroll.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {pay.slipNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {pay.empName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pay.designation}</td>
                    <td className="py-3 px-4 font-medium">{pay.month}</td>
                    <td className="py-3 px-4 font-mono">${pay.basicSalary.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600">+${pay.allowances}</td>
                    <td className="py-3 px-4 font-mono text-rose-500">-${pay.deductions}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ${pay.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onPrintSalarySlip(pay)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Salary Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
