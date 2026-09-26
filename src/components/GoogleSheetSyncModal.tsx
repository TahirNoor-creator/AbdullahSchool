import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Plus,
  Link2,
  Database,
  ArrowRight,
  Layers,
  Check,
  X,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  createMultiTabMasterSpreadsheet,
  syncAllERPDataToSheet,
  getSpreadsheetInfo,
  MasterTabConfig,
} from '../services/workspace';
import {
  Student,
  AttendanceRecord,
  FeeInvoice,
  FeePayment,
  ExpenseRecord,
  Employee,
  InventoryItem,
  Campus,
} from '../types/erp';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  onAuthenticate: () => void;
  students: Student[];
  attendance: AttendanceRecord[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  inventory: InventoryItem[];
  campuses: Campus[];
  connectedSheetId: string | null;
  onUpdateConnectedSheet: (sheetId: string, sheetUrl: string, sheetTitle: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string, url?: string) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  onAuthenticate,
  students,
  attendance,
  invoices,
  payments,
  expenses,
  employees,
  inventory,
  campuses,
  connectedSheetId,
  onUpdateConnectedSheet,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'connect' | 'history'>('sync');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [sheetTitle, setSheetTitle] = useState('Oakridge Academy - Central ERP Database (2026-2027)');
  const [connectedSheetInfo, setConnectedSheetInfo] = useState<{
    id: string;
    title: string;
    url: string;
    sheets: string[];
    lastSynced?: string;
  } | null>(null);

  // Dataset selection toggles
  const [syncSelections, setSyncSelections] = useState({
    students: true,
    attendance: true,
    payments: true,
    invoices: true,
    expenses: true,
    employees: true,
    inventory: true,
  });

  // Local sync history log
  const [syncHistory, setSyncHistory] = useState<
    Array<{
      id: string;
      timestamp: string;
      recordsCount: number;
      tabsUpdated: string[];
      status: 'success' | 'failed';
      message: string;
    }>
  >(() => {
    try {
      const saved = localStorage.getItem('oakridge_sheets_sync_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load connected sheet info if sheetId exists
  useEffect(() => {
    if (connectedSheetId && accessToken) {
      getSpreadsheetInfo(accessToken, connectedSheetId)
        .then((info) => {
          setConnectedSheetInfo({
            id: connectedSheetId,
            title: info.title,
            url: info.spreadsheetUrl,
            sheets: info.sheets,
            lastSynced: localStorage.getItem('oakridge_sheets_last_sync') || undefined,
          });
        })
        .catch((err) => {
          console.warn('Could not verify existing connected sheet:', err);
        });
    }
  }, [connectedSheetId, accessToken]);

  if (!isOpen) return null;

  // Helper to compile tabs data
  const buildTabsData = (): MasterTabConfig[] => {
    const tabs: MasterTabConfig[] = [];

    if (syncSelections.students) {
      tabs.push({
        title: 'Students',
        tabColor: { red: 0.26, green: 0.52, blue: 0.96 },
        headers: [
          'Admission No',
          'Full Name',
          'Roll No',
          'Class',
          'Section',
          'Campus ID',
          'Parent Name',
          'Phone',
          'Parent Email',
          'Status',
          'Fees Due ($)',
          'Admission Date',
        ],
        rows: students.map((s) => [
          s.admissionNo,
          s.fullName,
          s.rollNo,
          s.className,
          s.section,
          s.campusId,
          s.parentName,
          s.parentPhone,
          s.parentEmail,
          s.status,
          s.feesDue,
          s.admissionDate,
        ]),
      });
    }

    if (syncSelections.attendance) {
      tabs.push({
        title: 'Attendance',
        tabColor: { red: 0.2, green: 0.65, blue: 0.33 },
        headers: [
          'Record ID',
          'Date',
          'Class',
          'Section',
          'Campus ID',
          'Total Students',
          'Present Count',
          'Absent Count',
          'Late Count',
          'Marked By',
          'Timestamp',
        ],
        rows: attendance.map((a) => [
          a.id,
          a.date,
          a.className,
          a.section,
          a.campusId,
          a.totalStudents,
          a.presentCount,
          a.absentCount,
          a.lateCount,
          a.markedBy,
          a.timestamp,
        ]),
      });
    }

    if (syncSelections.payments) {
      tabs.push({
        title: 'Fee Payments',
        tabColor: { red: 0.13, green: 0.59, blue: 0.95 },
        headers: [
          'Receipt No',
          'Student Name',
          'Invoice No',
          'Amount Paid ($)',
          'Payment Method',
          'Payment Date',
          'Reference No',
          'Received By',
          'Notes',
        ],
        rows: payments.map((p) => [
          p.receiptNo,
          p.studentName,
          p.invoiceNo,
          p.amount,
          p.paymentMethod,
          p.paymentDate,
          p.referenceNo,
          p.recordedBy,
          p.notes || 'N/A',
        ]),
      });
    }

    if (syncSelections.invoices) {
      tabs.push({
        title: 'Fee Invoices',
        tabColor: { red: 0.95, green: 0.61, blue: 0.07 },
        headers: [
          'Invoice No',
          'Student ID',
          'Student Name',
          'Class',
          'Invoice Title',
          'Total Amount ($)',
          'Paid Amount ($)',
          'Balance ($)',
          'Due Date',
          'Status',
        ],
        rows: invoices.map((i) => [
          i.invoiceNo,
          i.studentId,
          i.studentName,
          i.className,
          i.title,
          i.totalAmount,
          i.paidAmount,
          i.balance,
          i.dueDate,
          i.status,
        ]),
      });
    }

    if (syncSelections.expenses) {
      tabs.push({
        title: 'Expenses',
        tabColor: { red: 0.92, green: 0.26, blue: 0.21 },
        headers: [
          'Expense No',
          'Category',
          'Title',
          'Amount ($)',
          'Date',
          'Payment Method',
          'Approved By',
          'Status',
        ],
        rows: expenses.map((e) => [
          e.expenseNo,
          e.category,
          e.title,
          e.amount,
          e.date,
          e.paymentMethod,
          e.approvedBy,
          e.status,
        ]),
      });
    }

    if (syncSelections.employees) {
      tabs.push({
        title: 'Staff Directory',
        tabColor: { red: 0.61, green: 0.35, blue: 0.71 },
        headers: [
          'Employee No',
          'Full Name',
          'Designation',
          'Department',
          'Email',
          'Phone',
          'Base Salary ($)',
          'Join Date',
          'Status',
        ],
        rows: employees.map((emp) => [
          emp.empNo,
          emp.fullName,
          emp.designation,
          emp.department,
          emp.email,
          emp.phone,
          emp.salary,
          emp.joinDate,
          emp.status,
        ]),
      });
    }

    if (syncSelections.inventory) {
      tabs.push({
        title: 'Inventory',
        tabColor: { red: 0.38, green: 0.49, blue: 0.55 },
        headers: [
          'SKU',
          'Item Name',
          'Category',
          'Quantity In Stock',
          'Unit Price ($)',
          'Min Alert Threshold',
          'Status',
        ],
        rows: inventory.map((inv) => [
          inv.sku,
          inv.name,
          inv.category,
          inv.quantity,
          inv.unitPrice,
          inv.minStockAlert,
          inv.status,
        ]),
      });
    }

    return tabs;
  };

  // Create new Master Spreadsheet with multi-tabs
  const handleCreateMasterSheet = async () => {
    if (!accessToken) {
      onShowToast('error', 'Authentication Required', 'Please connect your Google Workspace account first.');
      return;
    }

    setIsProcessing(true);
    try {
      const tabs = buildTabsData();
      const res = await createMultiTabMasterSpreadsheet(accessToken, sheetTitle, tabs);

      const now = new Date().toLocaleString();
      setConnectedSheetInfo({
        id: res.spreadsheetId,
        title: sheetTitle,
        url: res.spreadsheetUrl,
        sheets: tabs.map((t) => t.title),
        lastSynced: now,
      });

      localStorage.setItem('oakridge_sheets_last_sync', now);
      onUpdateConnectedSheet(res.spreadsheetId, res.spreadsheetUrl, sheetTitle);

      const totalRows = tabs.reduce((acc, t) => acc + t.rows.length, 0);
      const newEntry = {
        id: `sync-${Date.now()}`,
        timestamp: now,
        recordsCount: totalRows,
        tabsUpdated: tabs.map((t) => t.title),
        status: 'success' as const,
        message: `Created master Google Sheet with ${tabs.length} tabs and synced ${totalRows} institutional records.`,
      };
      const updatedHistory = [newEntry, ...syncHistory];
      setSyncHistory(updatedHistory);
      localStorage.setItem('oakridge_sheets_sync_history', JSON.stringify(updatedHistory));

      onShowToast(
        'success',
        'Google Sheet Database Created!',
        `Successfully initialized master spreadsheet with ${tabs.length} tabs (${totalRows} records stored).`,
        res.spreadsheetUrl
      );
    } catch (err: any) {
      console.error('Error creating Google Sheet:', err);
      onShowToast('error', 'Google Sheet Creation Failed', err.message || 'Error communicating with Google Sheets API');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync to existing connected sheet
  const handleSyncToCurrentSheet = async () => {
    if (!accessToken) {
      onShowToast('error', 'Authentication Required', 'Please connect your Google Workspace account.');
      return;
    }
    if (!connectedSheetInfo?.id) {
      onShowToast('error', 'No Connected Sheet', 'Please create or connect a Google Sheet first.');
      return;
    }

    setIsProcessing(true);
    try {
      const tabs = buildTabsData();
      await syncAllERPDataToSheet(accessToken, connectedSheetInfo.id, tabs);

      const now = new Date().toLocaleString();
      setConnectedSheetInfo((prev) => (prev ? { ...prev, lastSynced: now } : prev));
      localStorage.setItem('oakridge_sheets_last_sync', now);

      const totalRows = tabs.reduce((acc, t) => acc + t.rows.length, 0);
      const newEntry = {
        id: `sync-${Date.now()}`,
        timestamp: now,
        recordsCount: totalRows,
        tabsUpdated: tabs.map((t) => t.title),
        status: 'success' as const,
        message: `Updated ${tabs.length} tabs with ${totalRows} rows in Google Sheets.`,
      };
      const updatedHistory = [newEntry, ...syncHistory];
      setSyncHistory(updatedHistory);
      localStorage.setItem('oakridge_sheets_sync_history', JSON.stringify(updatedHistory));

      onShowToast(
        'success',
        'Google Sheet Synchronized!',
        `Successfully pushed ${totalRows} live records across ${tabs.length} tabs.`,
        connectedSheetInfo.url
      );
    } catch (err: any) {
      console.error('Error syncing to Google Sheet:', err);
      onShowToast('error', 'Google Sheet Sync Error', err.message || 'Failed to update Google Sheet values.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Connect via existing Sheet ID or URL
  const handleConnectExistingSheet = async () => {
    if (!accessToken) {
      onShowToast('error', 'Authentication Required', 'Please connect your Google Workspace account first.');
      return;
    }
    if (!sheetInput.trim()) {
      onShowToast('error', 'Invalid Input', 'Please paste a Google Spreadsheet ID or URL.');
      return;
    }

    // Extract sheet ID from standard google sheet URL if pasted
    let cleanId = sheetInput.trim();
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      cleanId = urlMatch[1];
    }

    setIsProcessing(true);
    try {
      const info = await getSpreadsheetInfo(accessToken, cleanId);
      const now = new Date().toLocaleString();
      setConnectedSheetInfo({
        id: cleanId,
        title: info.title,
        url: info.spreadsheetUrl,
        sheets: info.sheets,
        lastSynced: now,
      });

      onUpdateConnectedSheet(cleanId, info.spreadsheetUrl, info.title);
      onShowToast('success', 'Connected to Google Sheet!', `Successfully linked "${info.title}" (${info.sheets.length} sheets found).`);
      setActiveTab('sync');
    } catch (err: any) {
      console.error('Error connecting to sheet:', err);
      onShowToast('error', 'Connection Failed', `Could not access spreadsheet (${err.message}). Check permissions.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Google Sheets Enterprise Database Hub
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live 2-Way Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synchronize, store, and manage school records directly in your institutional Google Spreadsheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Notice if not signed in */}
        {!accessToken ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <Link2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Google Workspace OAuth Permission Required
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              To store and sync data with Google Sheets, authorize Google Workspace access with the spreadsheets scope.
            </p>
            <button
              onClick={onAuthenticate}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Connect Google Account</span>
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setActiveTab('sync')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'sync'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Store &amp; Sync Data</span>
              </button>
              <button
                onClick={() => setActiveTab('connect')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'connect'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Connect / Create Sheet</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'history'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync Activity Log</span>
                {syncHistory.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 font-semibold">
                    {syncHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Active Connection Banner */}
              {connectedSheetInfo ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{connectedSheetInfo.title}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>Tabs: {connectedSheetInfo.sheets.join(', ') || 'Multi-Tab'}</span>
                        {connectedSheetInfo.lastSynced && (
                          <span>· Last Synced: {connectedSheetInfo.lastSynced}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={connectedSheetInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Sheets</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>No master Google Sheet connected yet. Create one automatically or connect an existing one below.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold shadow-xs hover:bg-amber-700 shrink-0"
                  >
                    Set Up Sheet
                  </button>
                </div>
              )}

              {/* TAB 1: STORE & SYNC DATA */}
              {activeTab === 'sync' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Select School Datasets to Store in Google Sheet
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Students */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30">
                        <input
                          type="checkbox"
                          checked={syncSelections.students}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, students: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Student Roster ({students.length} records)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Admission numbers, contact details, parent info, balances.
                          </div>
                        </div>
                      </label>

                      {/* Attendance */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30">
                        <input
                          type="checkbox"
                          checked={syncSelections.attendance}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, attendance: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Daily Attendance ({attendance.length} logs)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Class sessions, present/absent/late counts, gate timestamps.
                          </div>
                        </div>
                      </label>

                      {/* Fee Payments */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30">
                        <input
                          type="checkbox"
                          checked={syncSelections.payments}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, payments: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Fee Payments Ledger ({payments.length} receipts)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Payment receipts, amounts, methods, cashiers, timestamps.
                          </div>
                        </div>
                      </label>

                      {/* Fee Invoices */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30">
                        <input
                          type="checkbox"
                          checked={syncSelections.invoices}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, invoices: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Fee Invoices ({invoices.length} invoices)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Terms, total fees, balances, overdue statuses.
                          </div>
                        </div>
                      </label>

                      {/* Expenses */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30">
                        <input
                          type="checkbox"
                          checked={syncSelections.expenses}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, expenses: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Expense Vouchers ({expenses.length} vouchers)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Operational disbursements, categories, approvals.
                          </div>
                        </div>
                      </label>

                      {/* Staff & HR */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30">
                        <input
                          type="checkbox"
                          checked={syncSelections.employees}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, employees: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Staff &amp; Faculty ({employees.length} members)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Designations, departments, contact, salaries.
                          </div>
                        </div>
                      </label>

                      {/* Inventory */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={syncSelections.inventory}
                          onChange={(e) =>
                            setSyncSelections((prev) => ({ ...prev, inventory: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Campus Inventory &amp; POS ({inventory.length} items)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Stock quantities, SKU codes, unit values, low stock alerts.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Sync Trigger Action */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Ready to Synchronize
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Writes formatted header rows and institutional records to the target Google Sheet.
                      </div>
                    </div>
                    {connectedSheetInfo ? (
                      <button
                        onClick={handleSyncToCurrentSheet}
                        disabled={isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>{isProcessing ? 'Synchronizing to Sheet...' : 'Sync to Connected Sheet'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleCreateMasterSheet}
                        disabled={isProcessing}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isProcessing ? 'Creating Sheet...' : 'Create & Sync Master Sheet'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CONNECT / CREATE SHEET */}
              {activeTab === 'connect' && (
                <div className="space-y-6">
                  {/* Option A: Create Brand New Multi-Tab Master Sheet */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Plus className="w-4 h-4" />
                      <span>Option A: Create New Master Database Spreadsheet</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Generates a professional multi-tab Google Spreadsheet with color-coded tabs for Students, Attendance, Fees, Expenses, Staff, and Inventory.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Spreadsheet Title
                      </label>
                      <input
                        type="text"
                        value={sheetTitle}
                        onChange={(e) => setSheetTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500"
                        placeholder="Enter spreadsheet title..."
                      />
                    </div>
                    <button
                      onClick={handleCreateMasterSheet}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isProcessing ? 'Creating in Google Drive...' : 'Create Multi-Tab Master Sheet'}</span>
                    </button>
                  </div>

                  {/* Option B: Connect to Existing Spreadsheet */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <Link2 className="w-4 h-4" />
                      <span>Option B: Connect Existing Google Spreadsheet</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Paste the URL or Spreadsheet ID of any existing Google Sheet you own or have edit access to.
                    </p>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Spreadsheet ID or Share URL
                      </label>
                      <input
                        type="text"
                        value={sheetInput}
                        onChange={(e) => setSheetInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 font-mono text-[11px]"
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      />
                    </div>
                    <button
                      onClick={handleConnectExistingSheet}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Connecting...' : 'Connect Spreadsheet'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SYNC ACTIVITY LOG */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Google Sheets Synchronization History
                    </h3>
                    {syncHistory.length > 0 && (
                      <button
                        onClick={() => {
                          setSyncHistory([]);
                          localStorage.removeItem('oakridge_sheets_sync_history');
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-500"
                      >
                        Clear Log
                      </button>
                    )}
                  </div>

                  {syncHistory.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No synchronization events recorded yet. Click "Store &amp; Sync Data" to push your first update.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {syncHistory.map((item) => (
                        <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 shrink-0 mt-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {item.message}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{item.timestamp}</span>
                                <span>· Updated: {item.tabsUpdated.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                            {item.recordsCount} rows
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Google Sheets API v4 Secure Proxy Active</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
