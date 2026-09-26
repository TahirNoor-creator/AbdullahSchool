import React, { useState } from 'react';
import {
  Receipt,
  CircleDollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  Download,
  CreditCard,
  Building,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { FeeInvoice, FeePayment, ExpenseRecord, Student } from '../types/erp';

interface FinanceViewProps {
  invoices: FeeInvoice[];
  payments: FeePayment[];
  expenses: ExpenseRecord[];
  students: Student[];
  onCollectPayment: (payment: Omit<FeePayment, 'id'>) => void;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  onPrintReceipt: (payment: FeePayment) => void;
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  invoices,
  payments,
  expenses,
  students,
  onCollectPayment,
  onAddExpense,
  onPrintReceipt,
  onExportToSheet,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Collect Fee Modal State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoices[1]?.id || invoices[0]?.id || '');
  const [collectAmount, setCollectAmount] = useState<number>(450);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Online' | 'Cheque'>('Online');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Add Expense State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<any>('Supplies');
  const [expenseAmount, setExpenseAmount] = useState<number>(500);
  const [expenseMethod, setExpenseMethod] = useState('Corporate Card');

  // Stats
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balance, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netSurplus = totalCollected - totalExpenses;

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = invoices.find((inv) => inv.id === selectedInvoiceId);
    if (!invoice) return;

    const receiptCount = payments.length + 1;
    const receiptNo = `REC-2026-${String(receiptCount).padStart(5, '0')}`;

    onCollectPayment({
      receiptNo,
      invoiceNo: invoice.invoiceNo,
      studentName: invoice.studentName,
      amount: Number(collectAmount),
      paymentMethod,
      referenceNo: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      recordedBy: 'Current Accountant',
      notes: paymentNotes || 'Fee collection recorded in ERP',
    });

    setShowCollectModal(false);
    setPaymentNotes('');
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle) return;

    const expCount = expenses.length + 1;
    const expenseNo = `EXP-2026-${String(expCount).padStart(5, '0')}`;

    onAddExpense({
      expenseNo,
      title: expenseTitle,
      category: expenseCategory,
      amount: Number(expenseAmount),
      paymentMethod: expenseMethod,
      date: new Date().toISOString().split('T')[0],
      approvedBy: 'Bursar & Finance Office',
      status: 'Paid',
    });

    setExpenseTitle('');
    setShowExpenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-indigo-500" />
            Fees, Billing &amp; Institutional Finance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Student fee billing, partial payments, receipts, corporate expenses, and live treasury balance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onExportToSheet && (
            <button
              onClick={() => {
                if (activeTab === 'invoices') {
                  const headers = ['Invoice No', 'Student ID', 'Student Name', 'Class', 'Title', 'Total ($)', 'Paid ($)', 'Balance ($)', 'Due Date', 'Status'];
                  const rows = invoices.map((i) => [i.invoiceNo, i.studentId, i.studentName, i.className, i.title, i.totalAmount, i.paidAmount, i.balance, i.dueDate, i.status]);
                  onExportToSheet(`Oakridge Academy - Fee Invoices`, headers, rows);
                } else if (activeTab === 'payments') {
                  const headers = ['Receipt No', 'Student Name', 'Invoice No', 'Amount ($)', 'Method', 'Date', 'Ref No', 'Recorded By'];
                  const rows = payments.map((p) => [p.receiptNo, p.studentName, p.invoiceNo, p.amount, p.paymentMethod, p.paymentDate, p.referenceNo, p.recordedBy]);
                  onExportToSheet(`Oakridge Academy - Payment Receipts`, headers, rows);
                } else {
                  const headers = ['Expense No', 'Category', 'Title', 'Amount ($)', 'Date', 'Payment Method', 'Approved By'];
                  const rows = expenses.map((e) => [e.expenseNo, e.category, e.title, e.amount, e.date, e.paymentMethod, e.approvedBy]);
                  onExportToSheet(`Oakridge Academy - Expense Ledger`, headers, rows);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export {activeTab === 'invoices' ? 'Invoices' : activeTab === 'payments' ? 'Receipts' : 'Expenses'} to Sheets</span>
            </button>
          )}
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
          >
            + New Expense
          </button>
          <button
            onClick={() => setShowCollectModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Collect Fee Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Billed</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${totalInvoiced.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{invoices.length} Active Invoices</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Total Collected</span>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
            ${totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">{payments.length} Receipts Issued</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Outstanding Balance</span>
          <div className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">
            ${totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">Requires follow-up</div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60">
          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">Net Operating Surplus</span>
          <div className="text-2xl font-black text-sky-900 dark:text-sky-100 mt-1">
            ${netSurplus.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-600 mt-1 font-semibold">${totalExpenses.toLocaleString()} Total Expenses</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'invoices'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Fee Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'payments'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Payment Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Institutional Expenses ({expenses.length})
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {inv.studentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{inv.className}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {inv.title}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      ${inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      ${inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-500">
                      {inv.balance > 0 ? `$${inv.balance.toLocaleString()}` : '$0'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : inv.status === 'partial'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments / Receipts */}
      {activeTab === 'payments' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Cashier / Bursar</th>
                  <th className="py-3 px-4 text-right">Print Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {p.receiptNo}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.invoiceNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.studentName}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ${p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNo}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.paymentDate}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{p.recordedBy}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onPrintReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Expenses */}
      {activeTab === 'expenses' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Approved By</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-rose-500">{e.expenseNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{e.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                      ${e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.date}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{e.approvedBy}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collect Fee Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                Collect Fee Payment &amp; Issue Receipt
              </h2>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setCollectAmount(inv.balance > 0 ? inv.balance : 0);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} · {inv.studentName} (Bal: ${inv.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Amount Received ($) *</label>
                  <input
                    type="number"
                    required
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Online">Online / Portal</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer / ACH</option>
                    <option value="Cheque">Banker's Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Receipt Memo / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared fall semester balance via card"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm &amp; Generate REC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-rose-500" />
                Record School Operating Expense
              </h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Lab Reagent Kits"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Supplies">Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Transport">Transport</option>
                    <option value="Events">Events</option>
                    <option value="Salaries">Salaries</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Payment Mode</label>
                <input
                  type="text"
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Save Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
