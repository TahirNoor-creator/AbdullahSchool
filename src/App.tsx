import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { Sidebar, ERPView } from './components/Sidebar';
import { CommandCenterView } from './components/CommandCenterView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { FinanceView } from './components/FinanceView';
import { HRView } from './components/HRView';
import { InventoryPOSView } from './components/InventoryPOSView';
import { MultiCampusView } from './components/MultiCampusView';
import { ExamsView } from './components/ExamsView';
import { ApprovalsView } from './components/ApprovalsView';
import { WorkspaceHubView } from './components/WorkspaceHubView';
import { GeminiSuiteView } from './components/GeminiSuiteView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { BackupIntegrityView } from './components/BackupIntegrityView';
import { AppearanceView } from './components/AppearanceView';
import { DocumentPrintingModal } from './components/DocumentPrintingModal';
import { SetupWizardModal } from './components/SetupWizardModal';
import { HealthCheckModal } from './components/HealthCheckModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QRScannerView } from './components/QRScannerView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ToastContainer, ToastItem } from './components/ToastNotification';

import {
  initialSchoolProfile,
  initialCampuses,
  initialStudents,
  initialAttendance,
  initialFeeInvoices,
  initialFeePayments,
  initialExpenses,
  initialEmployees,
  initialPayroll,
  initialInventory,
  initialAnnouncements,
  initialAuditLogs,
  initialApprovals,
} from './data/initialData';
import {
  Student,
  AttendanceRecord,
  FeePayment,
  ExpenseRecord,
  Campus,
  UserRole,
  SchoolProfile,
  POSTransaction,
  AuditLog,
} from './types/erp';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  testConnection,
} from './services/firebase';
import {
  createSpreadsheet,
  syncAllERPDataToSheet,
  MasterTabConfig,
} from './services/workspace';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Auth & Workspace state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return sessionStorage.getItem('oakridge_workspace_token') || null;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');

  // Google Sheets Enterprise Database & Admin Modals
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [connectedSheetId, setConnectedSheetId] = useState<string | null>(() => {
    return localStorage.getItem('oakridge_connected_sheet_id') || null;
  });
  const [connectedSheetUrl, setConnectedSheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('oakridge_connected_sheet_url') || null;
  });
  const [connectedSheetTitle, setConnectedSheetTitle] = useState<string | null>(() => {
    return localStorage.getItem('oakridge_connected_sheet_title') || null;
  });
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // In-App Toast state (no window.alert / window.open)
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    url?: string,
    urlLabel?: string
  ) => {
    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message,
      url,
      urlLabel,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ERP Domain State
  const [currentView, setCurrentView] = useState<ERPView>('command-center');
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(initialSchoolProfile);
  const [campuses, setCampuses] = useState<Campus[]>(initialCampuses);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [invoices, setInvoices] = useState(initialFeeInvoices);
  const [payments, setPayments] = useState<FeePayment[]>(initialFeePayments);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [employees, setEmployees] = useState(initialEmployees);
  const [payroll, setPayroll] = useState(initialPayroll);
  const [inventory, setInventory] = useState(initialInventory);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [approvals, setApprovals] = useState(initialApprovals);

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [printModal, setPrintModal] = useState<{
    open: boolean;
    type: 'receipt' | 'id-card' | 'report-card' | 'salary-slip' | 'certificate';
    data: any;
  }>({
    open: false,
    type: 'receipt',
    data: null,
  });

  // Hotkey for Global Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Firebase Auth & test connection on boot
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) {
        console.log('Cloud Firestore connection validated successfully.');
      }
    });

    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auth Handlers
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        sessionStorage.setItem('oakridge_workspace_token', res.accessToken);
        addAudit('Authentication', 'User Logged In', res.user.email || 'Admin', 'Google OAuth & Firebase Auth successful.');
        addToast('success', 'Signed In with Google', `Connected as ${res.user.displayName || res.user.email}.`);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      addToast('error', 'Sign-in Failed', err.message || 'Google authentication could not be completed.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('oakridge_workspace_token');
    addAudit('Authentication', 'User Logged Out', 'System', 'Signed out from session.');
    addToast('info', 'Signed Out', 'You have been logged out of the session.');
  };

  const handleCustomLogin = (profile: { name: string; email: string; role: UserRole }) => {
    const mockUser: any = {
      uid: `admin-${Date.now()}`,
      displayName: profile.name,
      email: profile.email,
      photoURL: null,
      emailVerified: true,
    };
    setCurrentUser(mockUser);
    setCurrentRole(profile.role);
    addAudit('Authentication', 'Admin Profile Switched', profile.email, `Switched session to ${profile.name} (${profile.role}).`);
  };

  const handleUpdateConnectedSheet = (sheetId: string, sheetUrl: string, sheetTitle: string) => {
    setConnectedSheetId(sheetId);
    setConnectedSheetUrl(sheetUrl);
    setConnectedSheetTitle(sheetTitle);
    localStorage.setItem('oakridge_connected_sheet_id', sheetId);
    localStorage.setItem('oakridge_connected_sheet_url', sheetUrl);
    localStorage.setItem('oakridge_connected_sheet_title', sheetTitle);
  };

  const handleQuickSyncToSheets = async () => {
    if (!accessToken) {
      addToast(
        'error',
        'Google Workspace Sign-in Required',
        'Please connect your Google Workspace account on the top bar or via Admin Login to sync data.'
      );
      setShowAdminLoginModal(true);
      return;
    }
    if (!connectedSheetId) {
      setShowSheetModal(true);
      return;
    }
    setIsSyncingSheets(true);
    try {
      const tabs: MasterTabConfig[] = [
        {
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
        },
        {
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
        },
        {
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
          ]),
        },
        {
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
        },
        {
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
        },
        {
          title: 'Staff & HR',
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
        },
        {
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
        },
      ];

      await syncAllERPDataToSheet(accessToken, connectedSheetId, tabs);
      const totalRows = tabs.reduce((acc, t) => acc + t.rows.length, 0);
      const now = new Date().toLocaleString();
      localStorage.setItem('oakridge_sheets_last_sync', now);

      addToast(
        'success',
        'Google Sheets Database Synchronized',
        `Pushed ${totalRows} records across all 7 institutional tabs in real time.`,
        connectedSheetUrl || undefined,
        'Open Spreadsheet in Google Sheets'
      );
      addAudit('Integration', 'Google Sheets Full Sync', connectedSheetId, `Updated 7 tabs (${totalRows} rows).`);
    } catch (err: any) {
      console.error('Full sheets sync error:', err);
      addToast('error', 'Google Sheets Sync Failed', err.message || 'Could not update spreadsheet.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Export to Google Sheets (Safe In-App Notifications, No alert/window.open)
  const handleExportToGoogleSheet = async (title: string, headers: string[], rows: (string | number)[][]) => {
    if (!accessToken) {
      addToast(
        'error',
        'Google Workspace Sign-in Required',
        'Please connect your Google Workspace account on the top bar or via Admin Login to export to Google Sheets.'
      );
      setShowAdminLoginModal(true);
      return;
    }
    try {
      const res = await createSpreadsheet(accessToken, title, headers, rows);
      addToast(
        'success',
        'Exported to Google Sheets Successfully',
        `Spreadsheet created with ${rows.length} records. Click below to open in Google Sheets.`,
        res.spreadsheetUrl,
        'Open Spreadsheet in New Tab'
      );
      addAudit('Integration', 'Google Sheets Export', res.spreadsheetId, `Exported ${title} (${rows.length} rows).`);
    } catch (err: any) {
      addToast('error', 'Google Sheets Export Error', err.message || 'Failed to export to Google Sheets.');
    }
  };

  // Audit Helper
  const addAudit = (module: string, action: string, recordId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userEmail: currentUser?.email || 'admin@oakridgeacademy.edu',
      role: currentRole,
      module,
      action,
      recordId,
      details,
      result: 'success',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Student Handlers
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}`,
    };
    setStudents((prev) => [newStudent, ...prev]);
    addAudit('Admissions', 'Student Enrolled', newStudent.admissionNo, `Enrolled ${newStudent.fullName} in ${newStudent.className}.`);
  };

  // Attendance Handlers
  const handleSaveAttendance = (record: AttendanceRecord) => {
    setAttendance((prev) => [record, ...prev]);
    addAudit('Attendance', 'Attendance Saved', record.id, `Recorded attendance for ${record.className} (${record.section}).`);
  };

  // Fee Payment Handlers
  const handleCollectPayment = (paymentData: Omit<FeePayment, 'id'>) => {
    const newPayment: FeePayment = {
      ...paymentData,
      id: `rec-${Date.now()}`,
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Update student invoice balance
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.invoiceNo === paymentData.invoiceNo) {
          const newPaid = inv.paidAmount + paymentData.amount;
          const newBal = Math.max(0, inv.totalAmount - newPaid);
          return {
            ...inv,
            paidAmount: newPaid,
            balance: newBal,
            status: newBal === 0 ? 'paid' : 'partial',
          };
        }
        return inv;
      })
    );

    addAudit('Fees', 'Payment Collected', newPayment.receiptNo, `Collected $${newPayment.amount} for ${newPayment.studentName}.`);

    // Prompt receipt printing
    setPrintModal({
      open: true,
      type: 'receipt',
      data: newPayment,
    });
  };

  // Expense Handlers
  const handleAddExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    addAudit('Finance', 'Expense Voucher Saved', newExpense.expenseNo, `Recorded expense $${newExpense.amount} (${newExpense.title}).`);
  };

  // POS Sale Handlers
  const handleRecordPOSSale = (saleData: Omit<POSTransaction, 'id'>) => {
    addAudit('POS', 'Store Sale Completed', saleData.orderNo, `Completed sale of $${saleData.totalAmount} for ${saleData.customerName}.`);
  };

  // Campus Handlers
  const handleAddCampus = (campusData: Omit<Campus, 'id'>) => {
    const newCampus: Campus = {
      ...campusData,
      id: `camp-${Date.now()}`,
    };
    setCampuses((prev) => [...prev, newCampus]);
    addAudit('Multi-Campus', 'Campus Created', newCampus.code, `Registered branch campus ${newCampus.name}.`);
  };

  // Approval Handlers
  const handleApproveWorkflow = (id: string, approver: string) => {
    setApprovals((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'Approved', approver } : app))
    );
    addAudit('Workflow', 'Request Approved', id, `Approved by ${approver}.`);
  };

  const handleRejectWorkflow = (id: string, approver: string) => {
    setApprovals((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: 'Rejected', approver } : app))
    );
    addAudit('Workflow', 'Request Rejected', id, `Rejected by ${approver}.`);
  };

  // Filter students based on campus selection
  const campusStudents =
    selectedCampusId === 'all'
      ? students
      : students.filter((s) => s.campusId === selectedCampusId);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'Pending Approval').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        schoolProfile={schoolProfile}
        campuses={campuses}
        selectedCampusId={selectedCampusId}
        onSelectCampus={setSelectedCampusId}
        currentUser={currentUser}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        onSignIn={() => setShowAdminLoginModal(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={setTheme}
        onOpenSearch={() => setShowSearchModal(true)}
        onOpenHealthCheck={() => setShowHealthModal(true)}
        onOpenQuickAdmission={() => setCurrentView('students')}
        onOpenQuickFee={() => setCurrentView('fees-invoicing')}
        hasWorkspaceAuth={!!accessToken}
        announcementsCount={announcements.length}
        connectedSheetTitle={connectedSheetTitle}
        onOpenSheetModal={() => setShowSheetModal(true)}
        onOpenAdminLoginModal={() => setShowAdminLoginModal(true)}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {currentView === 'command-center' && (
            <CommandCenterView
              students={campusStudents}
              attendance={attendance}
              invoices={invoices}
              payments={payments}
              employees={employees}
              inventory={inventory}
              campuses={campuses}
              announcements={announcements}
              approvals={approvals}
              hasWorkspaceAuth={!!accessToken}
              currentUser={currentUser}
              currentRole={currentRole}
              connectedSheetId={connectedSheetId}
              connectedSheetTitle={connectedSheetTitle}
              connectedSheetUrl={connectedSheetUrl}
              onOpenSheetModal={() => setShowSheetModal(true)}
              onOpenAdminLoginModal={() => setShowAdminLoginModal(true)}
              onOpenHealthCheck={() => setShowHealthModal(true)}
              onNavigateView={setCurrentView}
              onRefreshData={() => {
                testConnection();
                addToast('info', 'Database Status Refreshed', 'Cloud Firestore ping confirmed active.');
              }}
              onQuickSyncToSheets={handleQuickSyncToSheets}
              isSyncingSheets={isSyncingSheets}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsDashboardView
              students={campusStudents}
              attendance={attendance}
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              employees={employees}
              campuses={campuses}
              onExportToSheet={handleExportToGoogleSheet}
              hasWorkspaceAuth={!!accessToken}
            />
          )}

          {currentView === 'qr-scanner' && (
            <QRScannerView
              students={campusStudents}
              invoices={invoices}
              payments={payments}
              onMarkAttendancePresent={(student) => {
                const today = new Date().toISOString().split('T')[0];
                const newRec: AttendanceRecord = {
                  id: `att-qr-${Date.now()}`,
                  date: today,
                  className: student.className,
                  section: student.section,
                  campusId: student.campusId,
                  totalStudents: students.filter((s) => s.className === student.className).length,
                  presentCount: 1,
                  absentCount: 0,
                  lateCount: 0,
                  markedBy: 'Campus Gate Optical QR Scanner',
                  timestamp: new Date().toLocaleTimeString(),
                  details: { [student.id]: 'present' },
                };
                setAttendance((prev) => [newRec, ...prev]);
                addAudit('Attendance', 'Gate QR Scan Check-In', student.admissionNo, `${student.fullName} checked in at campus gate.`);
              }}
              onNavigateToStudent={() => setCurrentView('students')}
              onNavigateToInvoice={() => setCurrentView('fees-invoicing')}
            />
          )}

          {currentView === 'students' && (
            <StudentsView
              students={campusStudents}
              campuses={campuses}
              onAddStudent={handleAddStudent}
              onExportToSheet={handleExportToGoogleSheet}
              hasWorkspaceAuth={!!accessToken}
            />
          )}

          {currentView === 'attendance' && (
            <AttendanceView
              students={campusStudents}
              attendanceRecords={attendance}
              onSaveAttendance={handleSaveAttendance}
              onExportToSheet={handleExportToGoogleSheet}
            />
          )}

          {currentView === 'fees-invoicing' && (
            <FinanceView
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              students={campusStudents}
              onCollectPayment={handleCollectPayment}
              onAddExpense={handleAddExpense}
              onExportToSheet={handleExportToGoogleSheet}
              onPrintReceipt={(payment) => {
                setPrintModal({
                  open: true,
                  type: 'receipt',
                  data: payment,
                });
              }}
            />
          )}

          {currentView === 'expenses' && (
            <FinanceView
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              students={campusStudents}
              onCollectPayment={handleCollectPayment}
              onAddExpense={handleAddExpense}
              onExportToSheet={handleExportToGoogleSheet}
              onPrintReceipt={(payment) => {
                setPrintModal({
                  open: true,
                  type: 'receipt',
                  data: payment,
                });
              }}
            />
          )}

          {currentView === 'exams' && (
            <ExamsView
              students={campusStudents}
              onPrintReportCard={(student) => {
                setPrintModal({
                  open: true,
                  type: 'report-card',
                  data: student,
                });
              }}
            />
          )}

          {currentView === 'hr-payroll' && (
            <HRView
              employees={employees}
              payroll={payroll}
              onPrintSalarySlip={(slip) => {
                setPrintModal({
                  open: true,
                  type: 'salary-slip',
                  data: slip,
                });
              }}
              onExportToSheet={handleExportToGoogleSheet}
            />
          )}

          {currentView === 'inventory-pos' && (
            <InventoryPOSView
              inventory={inventory}
              onAddStock={(item) => setInventory((prev) => [{ ...item, id: `item-${Date.now()}` }, ...prev])}
              onRecordPOSSale={handleRecordPOSSale}
              onExportToSheet={handleExportToGoogleSheet}
            />
          )}

          {currentView === 'multi-campus' && (
            <MultiCampusView
              campuses={campuses}
              students={students}
              onAddCampus={handleAddCampus}
            />
          )}

          {currentView === 'approvals' && (
            <ApprovalsView
              approvals={approvals}
              onApprove={handleApproveWorkflow}
              onReject={handleRejectWorkflow}
            />
          )}

          {currentView === 'documents' && (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-center max-w-xl mx-auto">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Official Document &amp; Printing Center
              </h2>
              <p className="text-xs text-slate-500">
                Choose an official document template below to open the Document &amp; Printing Studio with preview and paper sizing.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  onClick={() => setPrintModal({ open: true, type: 'receipt', data: payments[0] })}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 font-bold text-slate-800 dark:text-slate-200"
                >
                  Fee Payment Receipt
                </button>
                <button
                  onClick={() => setPrintModal({ open: true, type: 'report-card', data: students[0] })}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 font-bold text-slate-800 dark:text-slate-200"
                >
                  Term Report Card
                </button>
                <button
                  onClick={() => setPrintModal({ open: true, type: 'salary-slip', data: payroll[0] })}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 font-bold text-slate-800 dark:text-slate-200"
                >
                  Faculty Salary Slip
                </button>
                <button
                  onClick={() => setPrintModal({ open: true, type: 'certificate', data: students[0] })}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 font-bold text-slate-800 dark:text-slate-200"
                >
                  Transfer Certificate
                </button>
              </div>
            </div>
          )}

          {currentView === 'workspace-hub' && (
            <WorkspaceHubView
              accessToken={accessToken}
              onAuthenticate={handleSignIn}
              students={students}
            />
          )}

          {currentView === 'gemini-voice' && (
            <GeminiSuiteView initialSubTab="voice" />
          )}

          {currentView === 'gemini-chat' && (
            <GeminiSuiteView initialSubTab="chat" />
          )}

          {currentView === 'gemini-multimodal' && (
            <GeminiSuiteView initialSubTab="multimodal" />
          )}

          {currentView === 'gemini-thinking' && (
            <GeminiSuiteView initialSubTab="thinking" />
          )}

          {currentView === 'security-roles' && (
            <SecurityAuditView auditLogs={auditLogs} />
          )}

          {currentView === 'backup-integrity' && (
            <BackupIntegrityView
              students={students}
              payments={payments}
              inventory={inventory}
            />
          )}

          {currentView === 'appearance' && (
            <AppearanceView
              theme={theme}
              onToggleTheme={setTheme}
              schoolProfile={schoolProfile}
              onUpdateSchoolProfile={(upd) => setSchoolProfile((prev) => ({ ...prev, ...upd }))}
            />
          )}

          {currentView === 'setup-wizard' && (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-4 max-w-lg mx-auto">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Launch ERP Initial Setup Wizard
              </h2>
              <p className="text-xs text-slate-500">
                Configure your school in 12 guided steps: School Profile, Academic Sessions, Campuses, Admins, Google Workspace, Default Roles, Numbering Sequences, and Backups.
              </p>
              <button
                onClick={() => setShowSetupModal(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                Open 12-Step Wizard
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        students={students}
        invoices={invoices}
        employees={employees}
        onNavigate={setCurrentView}
      />

      <HealthCheckModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        hasWorkspaceAuth={!!accessToken}
      />

      <DocumentPrintingModal
        isOpen={printModal.open}
        onClose={() => setPrintModal((prev) => ({ ...prev, open: false }))}
        documentType={printModal.type}
        data={printModal.data}
        schoolProfile={schoolProfile}
      />

      <SetupWizardModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        schoolProfile={schoolProfile}
        onComplete={() => {
          addAudit('Setup', 'Initial Wizard Completed', 'WIZARD-12', 'School initial setup wizard finished successfully.');
        }}
      />

      {/* Google Sheets Enterprise Database Hub Modal */}
      <GoogleSheetSyncModal
        isOpen={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        accessToken={accessToken}
        onAuthenticate={() => {
          setShowSheetModal(false);
          setShowAdminLoginModal(true);
        }}
        students={students}
        attendance={attendance}
        invoices={invoices}
        payments={payments}
        expenses={expenses}
        employees={employees}
        inventory={inventory}
        campuses={campuses}
        connectedSheetId={connectedSheetId}
        onUpdateConnectedSheet={handleUpdateConnectedSheet}
        onShowToast={addToast}
      />

      {/* Administrative Access & Role Authentication Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        currentUser={currentUser}
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        onGoogleSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onCustomLogin={handleCustomLogin}
        hasWorkspaceAuth={!!accessToken}
        onShowToast={addToast}
      />

      {/* In-App Toast Notifications (Avoids window.alert and iframe lockups) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
