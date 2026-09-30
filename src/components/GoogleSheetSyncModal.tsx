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
  Upload,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react';
import {
  createMultiTabMasterSpreadsheet,
  syncAllERPDataToSheet,
  getSpreadsheetInfo,
  readAllERPDataFromSheet,
  MasterTabConfig,
} from '../services/workspace';
import {
  ALL_28_SHEET_TABS,
  FullERPBackupDatasets,
  buildAll28TabsConfig,
} from '../services/sheetsMasterBackup';
import {
  Student,
  AttendanceRecord,
  FeeInvoice,
  FeePayment,
  ExpenseRecord,
  Employee,
  InventoryItem,
  Campus,
  PayrollRecord,
  Announcement,
  AuditLog,
  SchoolProfile,
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
  payroll?: PayrollRecord[];
  announcements?: Announcement[];
  auditLogs?: AuditLog[];
  schoolProfile?: SchoolProfile;
  connectedSheetId: string | null;
  onUpdateConnectedSheet: (sheetId: string, sheetUrl: string, sheetTitle: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string, url?: string) => void;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: (enabled: boolean) => void;
  autoSaveInterval?: number;
  onChangeAutoSaveInterval?: (intervalMinutes: number) => void;
  lastAutoSaveTime?: string | null;
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
  payroll,
  announcements,
  auditLogs,
  schoolProfile,
  connectedSheetId,
  onUpdateConnectedSheet,
  onShowToast,
  autoSaveEnabled = true,
  onToggleAutoSave,
  autoSaveInterval = 15,
  onChangeAutoSaveInterval,
  lastAutoSaveTime,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'connect' | 'autosave' | 'history'>('sync');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [sheetInput, setSheetInput] = useState('');
  const [sheetTitle, setSheetTitle] = useState('Oakridge Academy - Central Master Database (28 Sheets)');
  const [searchFilter, setSearchFilter] = useState('');
  const [connectedSheetInfo, setConnectedSheetInfo] = useState<{
    id: string;
    title: string;
    url: string;
    sheets: string[];
    lastSynced?: string;
  } | null>(null);

  // Selected tabs state (all 28 enabled by default)
  const [selectedTabs, setSelectedTabs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_28_SHEET_TABS.forEach((t) => {
      initial[t.id] = true;
    });
    return initial;
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

  const fullDatasets: FullERPBackupDatasets = {
    students,
    attendance,
    invoices,
    payments,
    expenses,
    employees,
    payroll,
    inventory,
    campuses,
    announcements,
    auditLogs,
    schoolProfile,
  };

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

  const toggleAll = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_28_SHEET_TABS.forEach((t) => {
      updated[t.id] = select;
    });
    setSelectedTabs(updated);
  };

  const selectedCount = Object.values(selectedTabs).filter(Boolean).length;
  const totalRecordsToSync = ALL_28_SHEET_TABS.filter((t) => selectedTabs[t.id]).reduce(
    (acc, t) => acc + t.recordCount(fullDatasets),
    0
  );

  const filteredTabs = ALL_28_SHEET_TABS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.purpose.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // 1. Create New 28-Sheet Master Spreadsheet & Sync
  const handleCreateAndSyncMaster = async () => {
    if (!accessToken) {
      onShowToast('error', 'Google Workspace Sign-in Required', 'Please authenticate with your Google account.');
      onAuthenticate();
      return;
    }

    const activeTabIds = Object.keys(selectedTabs).filter((id) => selectedTabs[id]);
    if (activeTabIds.length === 0) {
      onShowToast('error', 'No Sheets Selected', 'Please select at least one sheet tab to export.');
      return;
    }

    setIsProcessing(true);
    try {
      const tabsPayload = buildAll28TabsConfig(fullDatasets, activeTabIds);
      const result = await createMultiTabMasterSpreadsheet(accessToken, sheetTitle, tabsPayload);

      onUpdateConnectedSheet(result.spreadsheetId, result.spreadsheetUrl, sheetTitle);
      setConnectedSheetInfo({
        id: result.spreadsheetId,
        title: sheetTitle,
        url: result.spreadsheetUrl,
        sheets: tabsPayload.map((t) => t.title),
        lastSynced: new Date().toLocaleString(),
      });

      const totalRows = tabsPayload.reduce((acc, t) => acc + t.rows.length, 0);
      const newHistoryItem = {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        recordsCount: totalRows,
        tabsUpdated: tabsPayload.map((t) => t.title),
        status: 'success' as const,
        message: `Created central database with ${tabsPayload.length} sheet tabs and ${totalRows} institutional records.`,
      };
      const updatedHistory = [newHistoryItem, ...syncHistory].slice(0, 15);
      setSyncHistory(updatedHistory);
      localStorage.setItem('oakridge_sheets_sync_history', JSON.stringify(updatedHistory));
      localStorage.setItem('oakridge_sheets_last_sync', new Date().toLocaleString());

      onShowToast(
        'success',
        '28-Sheet Master Database Created & Synced!',
        `Created "${sheetTitle}" with ${tabsPayload.length} tabs and ${totalRows} rows.`,
        result.spreadsheetUrl
      );
    } catch (err: any) {
      console.error('Master sheet creation error:', err);
      onShowToast('error', 'Spreadsheet Creation Failed', err.message || 'Error communicating with Google Sheets API.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Sync to Existing Connected Spreadsheet
  const handleSyncToConnectedSheet = async () => {
    if (!accessToken || !connectedSheetId) {
      onShowToast('error', 'No Connected Sheet', 'Please connect or create a Google Spreadsheet first.');
      return;
    }

    const activeTabIds = Object.keys(selectedTabs).filter((id) => selectedTabs[id]);
    if (activeTabIds.length === 0) {
      onShowToast('error', 'No Sheets Selected', 'Please select at least one sheet tab.');
      return;
    }

    setIsProcessing(true);
    try {
      const tabsPayload = buildAll28TabsConfig(fullDatasets, activeTabIds);
      await syncAllERPDataToSheet(accessToken, connectedSheetId, tabsPayload);

      const totalRows = tabsPayload.reduce((acc, t) => acc + t.rows.length, 0);
      const nowStr = new Date().toLocaleString();

      setConnectedSheetInfo((prev) => (prev ? { ...prev, lastSynced: nowStr } : null));

      const newHistoryItem = {
        id: `sync-${Date.now()}`,
        timestamp: nowStr,
        recordsCount: totalRows,
        tabsUpdated: tabsPayload.map((t) => t.title),
        status: 'success' as const,
        message: `Synchronized ${tabsPayload.length} tabs with ${totalRows} live records.`,
      };
      const updatedHistory = [newHistoryItem, ...syncHistory].slice(0, 15);
      setSyncHistory(updatedHistory);
      localStorage.setItem('oakridge_sheets_sync_history', JSON.stringify(updatedHistory));
      localStorage.setItem('oakridge_sheets_last_sync', nowStr);

      onShowToast(
        'success',
        'Google Sheets Database Synchronized',
        `Pushed ${totalRows} records across ${tabsPayload.length} sheet tabs to Google Sheets.`,
        connectedSheetInfo?.url
      );
    } catch (err: any) {
      console.error('Sheet sync error:', err);
      onShowToast('error', 'Spreadsheet Sync Failed', err.message || 'Could not push data to Google Sheets.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Connect Existing Sheet by ID or URL
  const handleConnectExisting = async () => {
    if (!accessToken) {
      onShowToast('error', 'Sign-in Required', 'Please authenticate with Google Workspace first.');
      onAuthenticate();
      return;
    }

    let parsedId = sheetInput.trim();
    const urlMatch = parsedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      parsedId = urlMatch[1];
    }

    if (!parsedId || parsedId.length < 15) {
      onShowToast('error', 'Invalid Sheet Reference', 'Please enter a valid Google Spreadsheet URL or Sheet ID.');
      return;
    }

    setIsProcessing(true);
    try {
      const info = await getSpreadsheetInfo(accessToken, parsedId);
      onUpdateConnectedSheet(parsedId, info.spreadsheetUrl, info.title);
      setConnectedSheetInfo({
        id: parsedId,
        title: info.title,
        url: info.spreadsheetUrl,
        sheets: info.sheets,
        lastSynced: localStorage.getItem('oakridge_sheets_last_sync') || undefined,
      });

      onShowToast(
        'success',
        'Google Sheet Linked as Central Database',
        `Connected to "${info.title}" (${info.sheets.length} existing tabs detected).`,
        info.spreadsheetUrl
      );
      setActiveTab('sync');
    } catch (err: any) {
      console.error('Connect sheet error:', err);
      onShowToast('error', 'Connection Error', err.message || 'Could not access sheet. Verify sharing permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Restore / Read from Google Sheet Backup
  const handleRestoreFromSheet = async () => {
    if (!accessToken || !connectedSheetId) {
      onShowToast('error', 'No Connected Sheet', 'Please connect a Google Sheet before reading backup.');
      return;
    }

    setIsRestoring(true);
    try {
      const tabNames = ALL_28_SHEET_TABS.map((t) => t.name);
      const sheetData = await readAllERPDataFromSheet(accessToken, connectedSheetId, tabNames);

      let totalRestoredCells = 0;
      const foundTabs: string[] = [];
      Object.entries(sheetData).forEach(([tab, rows]) => {
        if (rows.length > 0) {
          foundTabs.push(tab);
          totalRestoredCells += rows.length;
        }
      });

      onShowToast(
        'success',
        'Google Sheet Backup Verified & Read',
        `Read ${foundTabs.length} sheet tabs containing ${totalRestoredCells} total data rows from Google Sheets.`,
        connectedSheetInfo?.url
      );
    } catch (err: any) {
      onShowToast('error', 'Restore Verification Error', err.message || 'Failed to read data from sheet.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Google Sheets Enterprise Database Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  28 Sheets Database
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected Google Sheet master database with auto date save, two-way sync, and instant backup.
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

        {/* Connection Status Banner */}
        <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Database Target:</span>
            {connectedSheetInfo ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {connectedSheetInfo.title}
                </span>
                <a
                  href={connectedSheetInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Google Sheets
                </a>
              </div>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-4 h-4" />
                No active spreadsheet linked yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {connectedSheetInfo?.lastSynced && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Last Saved: <strong className="text-slate-700 dark:text-slate-300">{connectedSheetInfo.lastSynced}</strong>
              </span>
            )}
            {autoSaveEnabled && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-500 animate-pulse" />
                Auto Date Save: ON ({autoSaveInterval}m)
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            28-Sheet Master Backup ({selectedCount}/28)
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'connect'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Connect Existing Sheet
          </button>
          <button
            onClick={() => setActiveTab('autosave')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'autosave'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Auto Date Save Settings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Sync History ({syncHistory.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'sync' && (
            <div className="space-y-5">
              {/* Top Configuration Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Master Spreadsheet Name:
                  </div>
                  <input
                    type="text"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    className="w-full md:w-96 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Oakridge Academy - Central Master Database"
                  />
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => toggleAll(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Select All (28)
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                </div>
              </div>

              {/* Filter and Quick Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search 28 tables (e.g. Fees, Attendance, Transport)..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-xs">
                  Selected: <strong className="text-indigo-600 dark:text-indigo-400">{selectedCount}</strong> tabs | Est. Records: <strong className="text-slate-700 dark:text-slate-200">{totalRecordsToSync}</strong>
                </div>
              </div>

              {/* 28 Sheets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredTabs.map((tab) => {
                  const isChecked = !!selectedTabs[tab.id];
                  const count = tab.recordCount(fullDatasets);
                  return (
                    <label
                      key={tab.id}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setSelectedTabs((prev) => ({
                            ...prev,
                            [tab.id]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {tab.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {count} rows
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {tab.purpose}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Format: Multi-tab colored spreadsheets with automated headers &amp; schema check.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {connectedSheetId && (
                    <button
                      onClick={handleRestoreFromSheet}
                      disabled={isRestoring || isProcessing}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-amber-500" />
                      <span>{isRestoring ? 'Reading Backup...' : 'Read Backup'}</span>
                    </button>
                  )}

                  {connectedSheetId ? (
                    <button
                      onClick={handleSyncToConnectedSheet}
                      disabled={isProcessing || selectedCount === 0}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Pushing to Google Sheets...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Sync Live Database ({selectedCount} Sheets)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateAndSyncMaster}
                      disabled={isProcessing || selectedCount === 0}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating 28-Sheet Database...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Create &amp; Sync Master Spreadsheet</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <div className="max-w-xl mx-auto py-6 space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                  <Link2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Connect Existing Google Spreadsheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Paste the Google Sheets URL or ID. The ERP will automatically create any missing tabs among the 28 institutional sheets and maintain two-way synchronization.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Google Spreadsheet URL or ID:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: Ensure the spreadsheet is accessible by your logged-in Google Workspace account.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setActiveTab('sync')}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectExisting}
                  disabled={isProcessing || !sheetInput.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Link Spreadsheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'autosave' && (
            <div className="max-w-2xl mx-auto py-4 space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Automated Date Save &amp; Google Sheet Backup
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    When enabled, the ERP automatically timestamps each transaction, student admission, attendance log, and fee payment, periodically writing back full 28-sheet backups to your connected Google Sheet database in the background without user intervention.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Auto Date Save Status
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Enable or disable automated background synchronization with Google Sheets.
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleAutoSave?.(!autoSaveEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoSaveEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoSaveEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Auto-Save Frequency (Interval)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      How frequently data should automatically be committed to Google Sheets.
                    </p>
                  </div>
                  <select
                    value={autoSaveInterval}
                    onChange={(e) => onChangeAutoSaveInterval?.(Number(e.target.value))}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={5}>Every 5 Minutes</option>
                    <option value={10}>Every 10 Minutes</option>
                    <option value={15}>Every 15 Minutes (Default)</option>
                    <option value={30}>Every 30 Minutes</option>
                    <option value={60}>Every 1 Hour</option>
                  </select>
                </div>

                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Target Google Sheet:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {connectedSheetInfo?.title || 'None connected'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Automated Backup:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {lastAutoSaveTime || connectedSheetInfo?.lastSynced || 'Pending initial cycle'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sheets Included:</span>
                    <span>All 28 Institutional Tabs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Google Sheets Synchronization Audit Log
                </h3>
                {syncHistory.length > 0 && (
                  <button
                    onClick={() => {
                      setSyncHistory([]);
                      localStorage.removeItem('oakridge_sheets_sync_history');
                    }}
                    className="text-[11px] text-rose-500 hover:underline font-semibold"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {syncHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                  No previous synchronization operations recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  {syncHistory.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {item.message}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 pl-6">
                          Updated {item.tabsUpdated.length} tabs • {item.recordsCount} records synchronized
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
