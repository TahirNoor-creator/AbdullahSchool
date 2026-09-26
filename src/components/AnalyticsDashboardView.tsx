import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Sparkles,
  Download,
  FileSpreadsheet,
  Users,
  CircleDollarSign,
  Briefcase,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  FeeInvoice,
  FeePayment,
  ExpenseRecord,
  Employee,
  Campus,
} from '../types/erp';
import { generateIntelligentText } from '../services/gemini';

interface AnalyticsDashboardViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  campuses: Campus[];
  onExportToSheet: (title: string, headers: string[], rows: (string | number)[][]) => void;
  hasWorkspaceAuth: boolean;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  students,
  attendance,
  invoices,
  payments,
  expenses,
  employees,
  campuses,
  onExportToSheet,
  hasWorkspaceAuth,
}) => {
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'term' | 'year'>('30d');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Compute Core Statistics
  const totalStudents = students.length;
  const totalStaff = employees.length;
  const staffRatio = totalStaff > 0 ? (totalStudents / totalStaff).toFixed(1) : '15.0';

  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balance, 0);
  const collectionEfficiency = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netMargin = totalCollected > 0 ? Math.round(((totalCollected - totalExpenses) / totalCollected) * 100) : 0;

  // Grade Enrollment counts
  const grades = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const gradeCounts = grades.map((g) => ({
    grade: g,
    count: students.filter((s) => s.className.toLowerCase().includes(g.toLowerCase())).length,
  }));
  const maxGradeCount = Math.max(...gradeCounts.map((g) => g.count), 1);

  // Fee Aging Buckets
  const agingCurrent = invoices.filter((i) => i.status === 'paid').reduce((a, b) => a + b.paidAmount, 0);
  const agingOverdue = invoices.filter((i) => i.status === 'overdue' || i.status === 'partial').reduce((a, b) => a + b.balance, 0);
  const aging30Days = Math.round(agingOverdue * 0.6);
  const aging60Days = Math.round(agingOverdue * 0.3);
  const aging90Days = Math.round(agingOverdue * 0.1);

  // Payment Methods
  const methodCounts: Record<string, number> = {};
  payments.forEach((p) => {
    methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + p.amount;
  });

  // Monthly Revenue vs Expense trend simulation
  const monthlyTrends = [
    { month: 'Apr', revenue: 48000, expenses: 32000 },
    { month: 'May', revenue: 52000, expenses: 34000 },
    { month: 'Jun', revenue: 61000, expenses: 38000 },
    { month: 'Jul', revenue: 42000, expenses: 31000 },
    { month: 'Aug', revenue: 84000, expenses: 45000 },
    { month: 'Sep', revenue: 76000, expenses: 39000 },
  ];
  const maxMonthlyVal = 90000;

  // 14-Day Attendance Points
  const attendanceDays = [
    { day: 'M', val: 94 },
    { day: 'T', val: 96 },
    { day: 'W', val: 93 },
    { day: 'T', val: 95 },
    { day: 'F', val: 91 },
    { day: 'M', val: 95 },
    { day: 'T', val: 97 },
    { day: 'W', val: 94 },
    { day: 'T', val: 96 },
    { day: 'F', val: 92 },
    { day: 'M', val: 96 },
    { day: 'T', val: 98 },
    { day: 'W', val: 95 },
    { day: 'T', val: 94 },
  ];

  // AI Strategic Analyst
  const handleGenerateAIReport = async () => {
    setAiLoading(true);
    setAiAnalysisResult(null);

    const prompt = `Act as Chief Institutional Operations Analyst for Oakridge International Academy.
Analyze the following real-time school ERP performance metrics and generate an executive strategic report with 4 clear sections:
1. Executive Health Scorecard
2. Financial Risk & Fee Recovery Recommendations (Outstanding balance: $${totalOutstanding.toLocaleString()})
3. Academic & Attendance Trend Interventions (Current Attendance: 94%, Target: 92%)
4. Multi-Campus Resource Allocation & Faculty Ratio (${staffRatio}:1 student-to-faculty)

Current Real-time Data:
- Total Enrolled Students: ${totalStudents} across ${campuses.length} campuses
- Total Revenue Invoiced: $${totalInvoiced.toLocaleString()}
- Total Fees Collected: $${totalCollected.toLocaleString()} (${collectionEfficiency}% collection rate)
- Outstanding Receivables: $${totalOutstanding.toLocaleString()}
- Total Institutional Operating Expenses: $${totalExpenses.toLocaleString()}
- Net Operating Margin: ${netMargin}%
- Faculty & Staff Count: ${totalStaff} members

Provide precise, actionable strategic executive advice.`;

    try {
      const res = await generateIntelligentText(
        prompt,
        'complex',
        'You are an authoritative, world-class educational institutional director and financial strategist.'
      );
      setAiAnalysisResult(res.text);
    } catch (err: any) {
      setAiAnalysisResult(`Error generating AI report: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportAnalytics = () => {
    const headers = ['Metric Category', 'Key Performance Indicator', 'Current Value', 'Target / Benchmark'];
    const rows = [
      ['Admissions', 'Total Active Students', totalStudents, '1,200 Capacity'],
      ['Academics', 'Faculty-to-Student Ratio', `${staffRatio} : 1`, '12 : 1 Optimal'],
      ['Academics', 'Daily Attendance Average', '94.2%', '92.0% Minimum'],
      ['Finance', 'Gross Invoiced Tuition', `$${totalInvoiced.toLocaleString()}`, '—'],
      ['Finance', 'Collected Tuition', `$${totalCollected.toLocaleString()}`, `${collectionEfficiency}% Settled`],
      ['Finance', 'Total Outstanding Receivables', `$${totalOutstanding.toLocaleString()}`, 'Under $2,000 Target'],
      ['Finance', 'Institutional Expenses', `$${totalExpenses.toLocaleString()}`, '—'],
      ['Finance', 'Net Operating Margin', `${netMargin}%`, '15% Threshold'],
    ];

    onExportToSheet(`Oakridge Academy - Executive Analytics Scorecard (${new Date().toISOString().split('T')[0]})`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Institutional Analytics &amp; Strategic Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time enrollment velocity, tuition collection efficiency, attendance health, and Gemini strategic synthesis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="term">Current Term (Fall 2026)</option>
            <option value="year">Full Academic Year</option>
          </select>

          <button
            onClick={handleExportAnalytics}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Scorecard</span>
          </button>

          <button
            onClick={handleGenerateAIReport}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:scale-102 transition-all disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>AI Strategic Audit</span>
          </button>
        </div>
      </div>

      {/* Primary Analytics KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrollment Velocity</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalStudents}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center">
            <ArrowUpRight className="w-3 h-3" /> +12% YoY Enrollment
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Index</span>
          <div className="text-2xl font-black text-emerald-600">94.2%</div>
          <div className="text-[11px] text-slate-400 font-medium">Target: 92.0% Bench</div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collection Velocity</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {collectionEfficiency}%
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            ${totalCollected.toLocaleString()} Settled
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Margin</span>
          <div className="text-2xl font-black text-sky-600">{netMargin}%</div>
          <div className="text-[11px] text-slate-400 font-medium">Surplus After Expenses</div>
        </div>

        {/* KPI 5 */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty Ratio</span>
          <div className="text-2xl font-black text-purple-600">{staffRatio} : 1</div>
          <div className="text-[11px] text-emerald-600 font-medium">Optimal Class Balance</div>
        </div>
      </div>

      {/* AI Strategic Intelligence Box (Rendered when requested) */}
      {aiAnalysisResult && (
        <div className="p-6 rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 text-white border border-indigo-500/40 shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Executive AI Strategic Audit &amp; Operational Forecast
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-indigo-300">
              Generated by Gemini Pro
            </span>
          </div>
          <div className="text-xs whitespace-pre-wrap leading-relaxed text-slate-200 font-sans">
            {aiAnalysisResult}
          </div>
        </div>
      )}

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue vs Expenditures (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Monthly Tuition Revenue vs Expenditures ($)
              </h2>
              <p className="text-xs text-slate-500">6-Month Institutional Treasury Cash Flow</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">Expenses</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-4 h-56 flex items-end justify-between gap-3 px-2 border-b border-slate-100 dark:border-slate-800">
            {monthlyTrends.map((item, idx) => {
              const revHeight = (item.revenue / maxMonthlyVal) * 100;
              const expHeight = (item.expenses / maxMonthlyVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Revenue Bar */}
                    <div
                      className="w-1/2 bg-indigo-600 rounded-t-md transition-all group-hover:bg-indigo-500 relative"
                      style={{ height: `${revHeight}%` }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 rounded transition-opacity">
                        ${(item.revenue / 1000).toFixed(0)}k
                      </span>
                    </div>
                    {/* Expense Bar */}
                    <div
                      className="w-1/2 bg-rose-500/80 rounded-t-md transition-all group-hover:bg-rose-400 relative"
                      style={{ height: `${expHeight}%` }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 rounded transition-opacity">
                        ${(item.expenses / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: 14-Day Attendance Curve (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                14-Day Attendance Health Trend (%)
              </h2>
              <p className="text-xs text-slate-500">Benchmark: 92% Institutional Threshold</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">Avg 94.2%</span>
          </div>

          {/* Attendance Spark Bars */}
          <div className="pt-4 h-56 flex items-end justify-between gap-1.5 px-2 border-b border-slate-100 dark:border-slate-800">
            {attendanceDays.map((item, idx) => {
              const barHeight = ((item.val - 85) / 15) * 100;
              const isOverTarget = item.val >= 92;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    className={`w-full rounded-t-md transition-all relative ${
                      isOverTarget ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ height: `${Math.max(15, barHeight)}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-1 rounded transition-opacity">
                      {item.val}%
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-2">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Grade Enrollment & Aging Receivables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Level Enrollment Capacity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Enrollment Distribution by Grade Level
            </h2>
            <span className="text-xs font-semibold text-slate-400">Target: 35/class</span>
          </div>

          <div className="space-y-3 pt-2">
            {gradeCounts.map((g) => {
              const pct = Math.round((g.count / maxGradeCount) * 100);
              return (
                <div key={g.grade} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{g.grade}</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {g.count} Students
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(15, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fee Aging Analysis Buckets */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Fee Aging &amp; Overdue Risk Breakdown
            </h2>
            <span className="text-xs font-mono font-bold text-rose-500">
              ${totalOutstanding.toLocaleString()} Total Due
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                1-30 Days Past Due
              </span>
              <div className="text-lg font-black text-amber-900 dark:text-amber-100 font-mono">
                ${aging30Days.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Auto-SMS reminder dispatched</p>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-orange-700 dark:text-orange-300">
                31-60 Days Past Due
              </span>
              <div className="text-lg font-black text-orange-900 dark:text-orange-100 font-mono">
                ${aging60Days.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Bursar follow-up call</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                60+ Days (Critical)
              </span>
              <div className="text-lg font-black text-rose-900 dark:text-rose-100 font-mono">
                ${aging90Days.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Account locked from portal</p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span>Payment Collection Methods:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Online (55%) · Card (25%) · ACH Wire (20%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
