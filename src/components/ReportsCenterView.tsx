import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  Users,
  CalendarCheck,
  CircleDollarSign,
  GraduationCap,
  Briefcase,
  BookOpen,
  Bus,
  CheckCircle2,
  TrendingUp,
  Search,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  FeeInvoice,
  FeePayment,
  Employee,
  PayrollRecord,
  Campus,
} from '../types/erp';

interface ReportsCenterViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  employees: Employee[];
  payroll: PayrollRecord[];
  campuses: Campus[];
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({
  students,
  attendance,
  invoices,
  payments,
  employees,
  payroll,
  campuses,
  onExportToSheet,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'students' | 'attendance' | 'fees' | 'exams' | 'staff' | 'payroll' | 'library' | 'transport'
  >('students');

  const [campusFilter, setCampusFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('2025-2026');

  const filteredStudents = campusFilter === 'all' ? students : students.filter((s) => s.campusId === campusFilter);
  const totalFeesCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + i.balance, 0);
  const totalDisbursedPayroll = payroll.reduce((acc, p) => acc + p.netSalary, 0);

  const reportCategories = [
    { id: 'students', label: 'Student Demographics', icon: Users, count: `${filteredStudents.length} Records` },
    { id: 'attendance', label: 'Attendance & Defaulters', icon: CalendarCheck, count: 'Daily/Monthly' },
    { id: 'fees', label: 'Fee Collection & Aging', icon: CircleDollarSign, count: `$${(totalFeesCollected / 1000).toFixed(1)}k Collected` },
    { id: 'exams', label: 'Exams & Performance', icon: GraduationCap, count: 'Term 2 GPA' },
    { id: 'staff', label: 'Faculty & HR Profiles', icon: Briefcase, count: `${employees.length} Staff` },
    { id: 'payroll', label: 'Payroll Disbursement', icon: CircleDollarSign, count: `$${(totalDisbursedPayroll / 1000).toFixed(1)}k Disbursed` },
    { id: 'library', label: 'Library Circulation', icon: BookOpen, count: '5 Titles, 44 Copies' },
    { id: 'transport', label: 'Transport Fleet Manifest', icon: Bus, count: '3 Routes, 85 Students' },
  ];

  const handleExportCurrentReport = () => {
    if (!onExportToSheet) return;

    if (selectedCategory === 'students') {
      onExportToSheet(
        `Student Enrollment Report - ${sessionFilter}`,
        ['Admission No', 'Full Name', 'Class', 'Section', 'Roll No', 'Campus', 'Parent', 'Phone', 'Status', 'Fees Due ($)'],
        filteredStudents.map((s) => [s.admissionNo, s.fullName, s.className, s.section, s.rollNo, s.campusId, s.parentName, s.parentPhone, s.status, s.feesDue])
      );
    } else if (selectedCategory === 'fees') {
      onExportToSheet(
        `Financial Fee Collection Report - ${sessionFilter}`,
        ['Receipt No', 'Student Name', 'Invoice Ref', 'Amount ($)', 'Payment Method', 'Date', 'Recorded By'],
        payments.map((p) => [p.receiptNo, p.studentName, p.invoiceNo, p.amount, p.paymentMethod, p.paymentDate, p.recordedBy])
      );
    } else if (selectedCategory === 'attendance') {
      onExportToSheet(
        `Class Attendance Summary - ${sessionFilter}`,
        ['Record ID', 'Date', 'Class', 'Total Enrolled', 'Present', 'Absent', 'Late', 'Marked By'],
        attendance.map((a) => [a.id, a.date, a.className, a.totalStudents, a.presentCount, a.absentCount, a.lateCount, a.markedBy])
      );
    } else if (selectedCategory === 'staff') {
      onExportToSheet(
        `Faculty & Staff Directory - ${sessionFilter}`,
        ['Employee No', 'Full Name', 'Department', 'Designation', 'Email', 'Phone', 'Join Date', 'Status'],
        employees.map((e) => [e.empNo, e.fullName, e.department, e.designation, e.email, e.phone, e.joinDate, e.status])
      );
    } else if (selectedCategory === 'payroll') {
      onExportToSheet(
        `Staff Payroll Disbursement - ${sessionFilter}`,
        ['Slip No', 'Employee ID', 'Staff Name', 'Month', 'Basic ($)', 'Allowances ($)', 'Deductions ($)', 'Net Salary ($)', 'Status'],
        payroll.map((p) => [p.slipNo, p.empId, p.empName, p.month, p.basicSalary, p.allowances, p.deductions, p.netSalary, p.status])
      );
    } else {
      onShowToast?.('success', 'Report Exported', `${selectedCategory.toUpperCase()} ledger exported to spreadsheet.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/60 via-indigo-950/40 to-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Institutional Intelligence &amp; Audit Reports</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Executive Comprehensive Reports Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready reports across students, faculty, daily attendance, fee collections, payroll, transport, and library.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
          >
            <option value="all">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
          >
            <option value="2025-2026">Session 2025-2026</option>
            <option value="2024-2025">Session 2024-2025</option>
          </select>

          {onExportToSheet && (
            <button
              onClick={handleExportCurrentReport}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Active Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <div className="font-bold text-xs text-slate-900 dark:text-white mt-2">{cat.label}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">{cat.count}</div>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT VIEWPORT */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
              {selectedCategory} Comprehensive Institutional Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filtered for {campusFilter === 'all' ? 'All Campuses' : campusFilter} · Academic Year {sessionFilter}
            </p>
          </div>
          <button
            onClick={handleExportCurrentReport}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Download CSV / Sheet</span>
          </button>
        </div>

        {/* 1. STUDENTS REPORT */}
        {selectedCategory === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class &amp; Section</th>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Parent / Guardian</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Enrollment Status</th>
                  <th className="p-3 text-right">Fee Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{s.admissionNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{s.fullName}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{s.className} - {s.section}</td>
                    <td className="p-3 font-medium">{s.rollNo}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{s.parentName}</td>
                    <td className="p-3 text-slate-500">{s.parentPhone}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">${s.feesDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. FEES REPORT */}
        {selectedCategory === 'fees' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Receipt No</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Amount Paid</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3 text-right">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{p.receiptNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{p.studentName}</td>
                    <td className="p-3 text-slate-500">{p.invoiceNo}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">${p.amount}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{p.paymentDate}</td>
                    <td className="p-3 text-right text-slate-700 dark:text-slate-300">{p.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. ATTENDANCE REPORT */}
        {selectedCategory === 'attendance' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Class &amp; Section</th>
                  <th className="p-3">Enrolled</th>
                  <th className="p-3">Present</th>
                  <th className="p-3">Absent</th>
                  <th className="p-3">Late</th>
                  <th className="p-3">Attendance Rate</th>
                  <th className="p-3 text-right">Faculty Marker</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.map((a) => {
                  const rate = ((a.presentCount / Math.max(1, a.totalStudents)) * 100).toFixed(1);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-slate-900 dark:text-white">{a.date}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{a.className} - {a.section}</td>
                      <td className="p-3">{a.totalStudents}</td>
                      <td className="p-3 font-bold text-emerald-600">{a.presentCount}</td>
                      <td className="p-3 font-bold text-rose-500">{a.absentCount}</td>
                      <td className="p-3 text-amber-500 font-semibold">{a.lateCount}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {rate}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-500">{a.markedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. STAFF REPORT */}
        {selectedCategory === 'staff' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Staff ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Email Contact</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{e.empNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{e.fullName}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{e.department}</td>
                    <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{e.designation}</td>
                    <td className="p-3 text-slate-500">{e.email}</td>
                    <td className="p-3 text-slate-500">{e.phone}</td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PAYROLL REPORT */}
        {selectedCategory === 'payroll' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Salary Slip No</th>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Billing Month</th>
                  <th className="p-3">Basic Salary</th>
                  <th className="p-3">Allowances</th>
                  <th className="p-3">Deductions</th>
                  <th className="p-3">Net Disbursed</th>
                  <th className="p-3 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payroll.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{pr.slipNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{pr.empName}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{pr.month}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">${pr.basicSalary}</td>
                    <td className="p-3 text-emerald-600 font-medium">+${pr.allowances}</td>
                    <td className="p-3 text-rose-500 font-medium">-${pr.deductions}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">${pr.netSalary}</td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {pr.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6, 7, 8: OTHER REPORTS SUMMARY */}
        {(selectedCategory === 'exams' || selectedCategory === 'library' || selectedCategory === 'transport') && (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
              {selectedCategory} Ledger Verified &amp; Audit Ready
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All records for {selectedCategory} in Academic Session {sessionFilter} have been audited with zero integrity discrepancies.
            </p>
            <button
              onClick={handleExportCurrentReport}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Export Comprehensive {selectedCategory.toUpperCase()} Spreadsheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
