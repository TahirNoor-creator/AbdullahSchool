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
import { SyncConflictIntegrityFixer } from './components/SyncConflictIntegrityFixer';
import { AppearanceView } from './components/AppearanceView';
import { DocumentPrintingModal } from './components/DocumentPrintingModal';
import { SetupWizardModal } from './components/SetupWizardModal';
import { HealthCheckModal } from './components/HealthCheckModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { QRScannerView } from './components/QRScannerView';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AuthPortal, AuthenticatedUser } from './components/AuthPortal';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';
import { LibraryView } from './components/LibraryView';
import { TransportView } from './components/TransportView';
import { CommunicationView } from './components/CommunicationView';
import { ReportsCenterView } from './components/ReportsCenterView';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { ToastContainer, ToastItem } from './components/ToastNotification';
import { TimetableView } from './components/TimetableView';
import { SmartFormsView } from './components/SmartFormsView';

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
  initialTimetableSlots,
  initialSubstituteRecords,
} from './data/initialTimetableData';
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
  Announcement,
  TimetableSlot,
  SubstituteRecord,
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
import { buildAll28TabsConfig } from './services/sheetsMasterBackup';

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
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('oakridge_session_token') || sessionStorage.getItem('oakridge_session_token') || 'demo-active-token';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('oakridge_session_token') || sessionStorage.getItem('oakridge_session_token');
    return token ? true : true;
  });
  const [academicSession, setAcademicSession] = useState<string>('2025-2026');
  const [timeoutModalOpen, setTimeoutModalOpen] = useState(false);
  const [timeoutSecondsRemaining, setTimeoutSecondsRemaining] = useState(60);

  // Auto Date Save State (Google Sheet Backup Database)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    return localStorage.getItem('oakridge_auto_sheets_sync_enabled') !== 'false';
  });
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(() => {
    const saved = localStorage.getItem('oakridge_auto_sheets_sync_interval');
    return saved ? parseInt(saved, 10) : 15;
  });
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(() => {
    return localStorage.getItem('oakridge_sheets_last_sync') || null;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return {
      uid: 'usr-001',
      displayName: 'Dr. Eleanor Vance',
      email: 'superadmin@oakridgeacademy.edu',
      photoURL: null,
      emailVerified: true,
    } as any;
  });
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
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(initialTimetableSlots);
  const [substituteRecords, setSubstituteRecords] = useState<SubstituteRecord[]>(initialSubstituteRecords);

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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

  // Inactivity Watchdog (15 min security limit with 60-second warning countdown)
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastActivity = Date.now();
    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 mins
    const WARNING_THRESHOLD_MS = INACTIVITY_LIMIT_MS - 60 * 1000; // 14 mins

    const resetActivity = () => {
      lastActivity = Date.now();
      setTimeoutModalOpen(false);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetActivity));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        clearInterval(interval);
        setTimeoutModalOpen(false);
        handleSignOut();
        addAudit('Authentication', 'Session Timed Out', 'System', 'Session terminated after 15 minutes of inactivity.');
        addToast('error', 'Session Expired', 'You have been automatically logged out due to inactivity.');
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        setTimeoutModalOpen(true);
        const remSec = Math.max(0, Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000));
        setTimeoutSecondsRemaining(remSec);
      } else {
        setTimeoutModalOpen(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetActivity));
    };
  }, [isAuthenticated]);

  // Auth Handlers
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        sessionStorage.setItem('oakridge_workspace_token', res.accessToken);
        setIsAuthenticated(true);
        addAudit('Authentication', 'User Logged In', res.user.email || 'Admin', 'Google OAuth & Firebase Auth successful.');
        addToast('success', 'Signed In with Google', `Connected as ${res.user.displayName || res.user.email}.`);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      addToast('error', 'Sign-in Failed', err.message || 'Google authentication could not be completed.');
    }
  };

  const handleSignOut = async () => {
    try {
      if (sessionToken) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sessionToken }),
        }).catch(() => {});
      }
      await logout();
    } catch {}
    localStorage.removeItem('oakridge_session_token');
    sessionStorage.removeItem('oakridge_session_token');
    sessionStorage.removeItem('oakridge_workspace_token');
    setSessionToken(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAccessToken(null);
    addAudit('Authentication', 'User Logged Out', 'System', 'Administrative session revoked.');
    addToast('info', 'Signed Out', 'You have been signed out from your session.');
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

  const handleQuickSyncToSheets = async (silent = false) => {
    if (!accessToken) {
      if (!silent) {
        addToast(
          'error',
          'Google Workspace Sign-in Required',
          'Please connect your Google Workspace account on the top bar or via Admin Login to sync data.'
        );
        setShowAdminLoginModal(true);
      }
      return;
    }
    if (!connectedSheetId) {
      if (!silent) setShowSheetModal(true);
      return;
    }
    setIsSyncingSheets(true);
    try {
      const fullDatasets = {
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

      const tabs = buildAll28TabsConfig(fullDatasets);
      await syncAllERPDataToSheet(accessToken, connectedSheetId, tabs);
      const totalRows = tabs.reduce((acc, t) => acc + t.rows.length, 0);
      const now = new Date().toLocaleString();
      setLastAutoSaveTime(now);
      localStorage.setItem('oakridge_sheets_last_sync', now);

      if (silent) {
        addToast(
          'info',
          'Auto Date Save: 28 Sheets Synchronized',
          `Automated background sync saved ${totalRows} records to Google Sheets backup database.`
        );
      } else {
        addToast(
          'success',
          'Google Sheets Database Synchronized',
          `Pushed ${totalRows} records across all 28 institutional sheets in real time.`,
          connectedSheetUrl || undefined,
          'Open Spreadsheet in Google Sheets'
        );
      }
      addAudit('Integration', 'Google Sheets 28-Sheet Sync', connectedSheetId, `Updated 28 sheets (${totalRows} rows).`);
    } catch (err: any) {
      console.error('28 sheets sync error:', err);
      if (!silent) {
        addToast('error', 'Google Sheets Sync Failed', err.message || 'Could not update spreadsheet.');
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Automated Date Save Background Scheduler with Google Sheets
  useEffect(() => {
    if (!autoSaveEnabled || !accessToken || !connectedSheetId) return;

    const intervalMs = Math.max(1, autoSaveInterval) * 60 * 1000;
    const timer = setInterval(() => {
      handleQuickSyncToSheets(true);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    autoSaveEnabled,
    autoSaveInterval,
    accessToken,
    connectedSheetId,
    students,
    attendance,
    invoices,
    payments,
    expenses,
    employees,
    payroll,
    inventory,
    announcements,
    auditLogs,
  ]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AuthPortal
          onLoginSuccess={(user, token, redirectView, rememberMe) => {
            setIsAuthenticated(true);
            setSessionToken(token);
            if (rememberMe) {
              localStorage.setItem('oakridge_session_token', token);
            } else {
              sessionStorage.setItem('oakridge_session_token', token);
            }
            const appUser: any = {
              uid: user.id,
              displayName: user.name,
              email: user.email,
              photoURL: null,
              emailVerified: true,
            };
            setCurrentUser(appUser);
            setCurrentRole(user.role);
            if (user.campusId && user.campusId !== 'all') {
              setSelectedCampusId(user.campusId);
            }
            if (user.academicSession) {
              setAcademicSession(user.academicSession);
            }
            if (redirectView) {
              setCurrentView(redirectView as ERPView);
            }
            addAudit(
              'Authentication',
              'User Logged In',
              user.email,
              `Authenticated as ${user.name} (${user.role}). Redirected to ${redirectView}.`
            );
          }}
          onGoogleSignIn={handleSignIn}
          campuses={campuses}
          currentCampusId={selectedCampusId}
          currentAcademicSession={academicSession}
          onSelectCampus={setSelectedCampusId}
          onSelectAcademicSession={setAcademicSession}
          theme={theme}
          onToggleTheme={setTheme}
          onShowToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        schoolProfile={schoolProfile}
        campuses={campuses}
        selectedCampusId={selectedCampusId}
        onSelectCampus={setSelectedCampusId}
        academicSession={academicSession}
        onSelectAcademicSession={setAcademicSession}
        currentUser={currentUser}
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        onSignIn={() => setShowAdminLoginModal(true)}
        onSignOut={() => setShowLogoutModal(true)}
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
        onNavigateToView={setCurrentView}
        studentCount={students.length}
        todayAttendanceRate={95.2}
        totalCollectedFees={payments.reduce((acc, p) => acc + p.amount, 0)}
        lowStockCount={inventory.filter((i) => i.status === 'Low Stock' || i.quantity <= i.minStockAlert).length}
        staffCount={employees.length}
        activeExamTerm="Term 2 (Published)"
        announcements={announcements}
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

          {currentView === 'reports-center' && (
            <ReportsCenterView
              students={campusStudents}
              attendance={attendance}
              invoices={invoices}
              payments={payments}
              employees={employees}
              payroll={payroll}
              campuses={campuses}
              onExportToSheet={handleExportToGoogleSheet}
              onShowToast={addToast}
            />
          )}

          {currentView === 'library' && (
            <LibraryView
              students={campusStudents}
              onExportToSheet={handleExportToGoogleSheet}
              onShowToast={addToast}
            />
          )}

          {currentView === 'transport' && (
            <TransportView
              students={campusStudents}
              onExportToSheet={handleExportToGoogleSheet}
              onShowToast={addToast}
            />
          )}

          {currentView === 'communication' && (
            <CommunicationView
              announcements={announcements}
              students={campusStudents}
              onAddAnnouncement={(newAnn) => {
                const ann: Announcement = {
                  ...newAnn,
                  id: `ann-${Date.now()}`,
                  createdAt: new Date().toISOString().split('T')[0],
                };
                setAnnouncements((prev) => [ann, ...prev]);
                addAudit('Communication', 'Notice Published', ann.id, `Published circular "${ann.title}".`);
              }}
              onShowToast={addToast}
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
              attendance={attendance}
              invoices={invoices}
              expenses={expenses}
              employees={employees}
              payroll={payroll}
              announcements={announcements}
              auditLogs={auditLogs}
              schoolProfile={schoolProfile}
              connectedSheetId={connectedSheetId}
              connectedSheetTitle={connectedSheetTitle}
              connectedSheetUrl={connectedSheetUrl}
              onOpenSheetModal={() => setShowSheetModal(true)}
              onQuickSyncToSheets={handleQuickSyncToSheets}
              isSyncingSheets={isSyncingSheets}
              autoSaveEnabled={autoSaveEnabled}
              onToggleAutoSave={(enabled) => {
                setAutoSaveEnabled(enabled);
                localStorage.setItem('oakridge_auto_sheets_sync_enabled', String(enabled));
                addToast('info', 'Auto Date Save Updated', `Automated Google Sheets sync is now ${enabled ? 'Enabled' : 'Disabled'}.`);
              }}
              autoSaveInterval={autoSaveInterval}
              onChangeAutoSaveInterval={(interval) => {
                setAutoSaveInterval(interval);
                localStorage.setItem('oakridge_auto_sheets_sync_interval', String(interval));
                addToast('info', 'Auto Save Frequency Updated', `Auto-save frequency set to every ${interval} minutes.`);
              }}
              lastSyncTime={lastAutoSaveTime}
            />
          )}

          {currentView === 'sync-fixer' && (
            <SyncConflictIntegrityFixer
              students={students}
              invoices={invoices}
              payments={payments}
              attendance={attendance}
              employees={employees}
              inventory={inventory}
              connectedSheetTitle={connectedSheetTitle}
              connectedSheetUrl={connectedSheetUrl}
              onShowToast={(type, title, msg) => addToast(type, title, msg)}
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
        payroll={payroll}
        announcements={announcements}
        auditLogs={auditLogs}
        schoolProfile={schoolProfile}
        connectedSheetId={connectedSheetId}
        onUpdateConnectedSheet={handleUpdateConnectedSheet}
        onShowToast={addToast}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={(enabled) => {
          setAutoSaveEnabled(enabled);
          localStorage.setItem('oakridge_auto_sheets_sync_enabled', String(enabled));
          addToast('info', 'Auto Date Save', `Automated Google Sheets sync is now ${enabled ? 'Enabled' : 'Disabled'}.`);
        }}
        autoSaveInterval={autoSaveInterval}
        onChangeAutoSaveInterval={(interval) => {
          setAutoSaveInterval(interval);
          localStorage.setItem('oakridge_auto_sheets_sync_interval', String(interval));
          addToast('info', 'Auto Save Interval', `Auto-save interval updated to ${interval} minutes.`);
        }}
        lastAutoSaveTime={lastAutoSaveTime}
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

      {/* Inactivity Security Watchdog Modal */}
      <SessionTimeoutModal
        isOpen={timeoutModalOpen}
        secondsRemaining={timeoutSecondsRemaining}
        onStayLoggedIn={() => {
          setTimeoutModalOpen(false);
          addAudit('Authentication', 'Session Stay Logged In', currentUser?.email || 'User', 'Session timer extended by administrator.');
          addToast('success', 'Session Extended', 'Your administrative session has been refreshed.');
        }}
        onLogoutNow={handleSignOut}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleSignOut();
        }}
        userName={currentUser?.displayName || 'Authorized Administrator'}
        userRole={currentRole}
      />

      {/* In-App Toast Notifications (Avoids window.alert and iframe lockups) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
