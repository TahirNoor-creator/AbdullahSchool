import React, { useState, useEffect } from 'react';
import {
  CloudCog,
  HardDrive,
  FileSpreadsheet,
  Mail,
  FormInput,
  Contact,
  Upload,
  Trash2,
  Send,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  FileText,
  X,
} from 'lucide-react';
import {
  listDriveFiles,
  uploadFileToDrive,
  deleteDriveFile,
  listSpreadsheets,
  createSpreadsheet,
  listGmailMessages,
  sendGmailMessage,
  listGoogleForms,
  createGoogleForm,
  listGoogleContacts,
  createGoogleContact,
  DriveFileItem,
  SpreadsheetSummary,
  GmailMessageSummary,
  FormItem,
  ContactPerson,
} from '../services/workspace';
import { Student } from '../types/erp';

interface WorkspaceHubViewProps {
  accessToken: string | null;
  onAuthenticate: () => void;
  students: Student[];
}

export const WorkspaceHubView: React.FC<WorkspaceHubViewProps> = ({
  accessToken,
  onAuthenticate,
  students,
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'sheets' | 'gmail' | 'forms' | 'contacts'>('drive');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileContent, setUploadFileContent] = useState('');

  // Confirmation Modal for Destructive/Mutating Operations
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    actionLabel: '',
    onConfirm: () => {},
  });

  // Sheets state
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetSummary[]>([]);
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('Oakridge Academy - Student Register 2026');

  // Gmail state
  const [emails, setEmails] = useState<GmailMessageSummary[]>([]);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [emailTo, setEmailTo] = useState('parent@example.com');
  const [emailSubject, setEmailSubject] = useState('Oakridge Academy: Term 1 Grade Report & Assessment');
  const [emailBody, setEmailBody] = useState(
    'Dear Parent/Guardian,\n\nWe are pleased to provide the Term 1 academic progress report for your student. Please log into the ERP Parent Portal to review detailed subject marks and teacher evaluations.\n\nWarm regards,\nDr. Eleanor Vance\nPrincipal, Oakridge International Academy'
  );

  // Forms state
  const [forms, setForms] = useState<FormItem[]>([]);
  const [showNewFormModal, setShowNewFormModal] = useState(false);
  const [formTitle, setFormTitle] = useState('2026-2027 Student Admission & Extracurricular Survey');

  // Contacts state
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('Parent Guardian');

  // Load Tab Data
  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'drive') {
        const files = await listDriveFiles(accessToken);
        setDriveFiles(files);
      } else if (activeTab === 'sheets') {
        const sheets = await listSpreadsheets(accessToken);
        setSpreadsheets(sheets);
      } else if (activeTab === 'gmail') {
        const msgs = await listGmailMessages(accessToken);
        setEmails(msgs);
      } else if (activeTab === 'forms') {
        const fList = await listGoogleForms(accessToken);
        setForms(fList);
      } else if (activeTab === 'contacts') {
        const cList = await listGoogleContacts(accessToken);
        setContacts(cList);
      }
    } catch (err: any) {
      console.error('Workspace load error:', err);
      setErrorMsg(err.message || 'Error communicating with Google Workspace API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken, activeTab]);

  // Drive Handlers
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !uploadFileName) return;
    setLoading(true);
    try {
      await uploadFileToDrive(
        accessToken,
        uploadFileName,
        'text/plain',
        uploadFileContent || 'Official Oakridge Academy Document'
      );
      setSuccessMsg(`File "${uploadFileName}" uploaded to Google Drive successfully!`);
      setShowUploadModal(false);
      setUploadFileName('');
      setUploadFileContent('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestDeleteFile = (file: DriveFileItem) => {
    setConfirmModal({
      open: true,
      title: 'Delete Google Drive File?',
      description: `Are you sure you want to permanently delete "${file.name}" from Google Drive? This action cannot be undone.`,
      actionLabel: 'Confirm Delete',
      onConfirm: async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
          await deleteDriveFile(accessToken, file.id);
          setSuccessMsg(`Deleted file "${file.name}" from Google Drive.`);
          loadData();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Sheets Handlers
  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !sheetTitle) return;
    setLoading(true);
    try {
      const headers = ['Admission No', 'Student Name', 'Class', 'Parent Contact', 'Fees Due'];
      const rows = students.map((s) => [s.admissionNo, s.fullName, s.className, s.parentPhone, s.feesDue]);
      const result = await createSpreadsheet(accessToken, sheetTitle, headers, rows);
      setSuccessMsg(`Created Google Sheet "${sheetTitle}"!`);
      setShowNewSheetModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gmail Handlers (With mandatory user confirmation dialog)
  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModal({
      open: true,
      title: 'Send Official Email via Gmail?',
      description: `Confirm sending this email to "${emailTo}" with subject "${emailSubject}" on behalf of your authorized school Google account?`,
      actionLabel: 'Confirm & Send',
      onConfirm: async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
          await sendGmailMessage(accessToken, emailTo, emailSubject, emailBody);
          setSuccessMsg(`Email successfully dispatched to ${emailTo} via Gmail!`);
          setShowComposeModal(false);
          loadData();
        } catch (err: any) {
          setErrorMsg(err.message);
        } finally {
          setLoading(false);
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }
      },
    });
  };

  // Forms Handlers
  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !formTitle) return;
    setLoading(true);
    try {
      const result = await createGoogleForm(accessToken, formTitle);
      setSuccessMsg(`Created Google Form "${formTitle}"! Responder Link: ${result.responderUri}`);
      setShowNewFormModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Contacts Handlers
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !contactFirstName) return;
    setLoading(true);
    try {
      await createGoogleContact(
        accessToken,
        contactFirstName,
        contactLastName,
        contactEmail,
        contactPhone,
        contactRole
      );
      setSuccessMsg(`Contact "${contactFirstName} ${contactLastName}" added to Google Contacts!`);
      setShowNewContactModal(false);
      setContactFirstName('');
      setContactLastName('');
      setContactEmail('');
      setContactPhone('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CloudCog className="w-5 h-5 text-indigo-500" />
            Google Workspace Command Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time live connections with Google Drive, Google Sheets, Gmail, Google Forms, and Google Contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!accessToken ? (
            <button
              onClick={onAuthenticate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-all shadow-sm"
            >
              <span>Connect Google Account</span>
            </button>
          ) : (
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh API Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveTab('drive')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'drive'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <HardDrive className="w-4 h-4 text-indigo-500" />
          <span>Google Drive</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'sheets'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>Google Sheets</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'gmail'
              ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <Mail className="w-4 h-4 text-rose-500" />
          <span>Gmail</span>
        </button>

        <button
          onClick={() => setActiveTab('forms')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'forms'
              ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <FormInput className="w-4 h-4 text-purple-500" />
          <span>Google Forms</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
            activeTab === 'contacts'
              ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <Contact className="w-4 h-4 text-sky-500" />
          <span>Contacts</span>
        </button>
      </div>

      {/* Main Tab Panels */}
      {!accessToken ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <CloudCog className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Google Workspace OAuth Authentication Required
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sign in with your Google account to grant permission for Google Drive, Sheets, Gmail, Forms, and Contacts to securely synchronize with your School ERP.
          </p>
          <button
            onClick={onAuthenticate}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            Authorize Google Workspace Access
          </button>
        </div>
      ) : (
        <div>
          {/* TAB 1: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-indigo-500" />
                    Google Drive School File Storage
                  </h2>
                  <p className="text-xs text-slate-500">Official certificates, student transcripts, and report cards in Drive.</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File to Drive</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading files from Google Drive...</div>
              ) : driveFiles.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No files found in Google Drive.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{file.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {file.mimeType} · {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Open in Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => requestDeleteFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete File (with confirmation)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Google Sheets Synchronizer
                  </h2>
                  <p className="text-xs text-slate-500">Live 2-way sync with institutional Google Spreadsheets.</p>
                </div>
                <button
                  onClick={() => setShowNewSheetModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Student Roster Sheet</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading spreadsheets from Google Drive...</div>
              ) : spreadsheets.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No Google Spreadsheets found. Click above to export one.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {spreadsheets.map((s) => (
                    <div key={s.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                      </div>
                      {s.webViewLink && (
                        <a
                          href={s.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Sheets</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-500" />
                    Gmail Official Dispatcher
                  </h2>
                  <p className="text-xs text-slate-500">Send verified fee receipts and report cards via Gmail with strict user confirmation.</p>
                </div>
                <button
                  onClick={() => setShowComposeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compose Official Email</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading recent messages from Gmail...</div>
              ) : emails.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No recent messages retrieved from Gmail.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {emails.map((m) => (
                    <div key={m.id} className="py-3 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900 dark:text-white">{m.subject || '(No Subject)'}</div>
                        <span className="text-[10px] text-slate-400">{m.date ? new Date(m.date).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{m.from}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{m.snippet}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE FORMS */}
          {activeTab === 'forms' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FormInput className="w-4 h-4 text-purple-500" />
                    Google Forms Admissions &amp; Surveys
                  </h2>
                  <p className="text-xs text-slate-500">Online student application questionnaires and parent feedback forms.</p>
                </div>
                <button
                  onClick={() => setShowNewFormModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Admission Form</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading forms from Google Drive...</div>
              ) : forms.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No Google Forms found. Click above to create one.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {forms.map((f) => (
                    <div key={f.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FormInput className="w-5 h-5 text-purple-500 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-white">{f.name}</span>
                      </div>
                      {f.webViewLink && (
                        <a
                          href={f.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Form</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Contact className="w-4 h-4 text-sky-500" />
                    Google Contacts (People API)
                  </h2>
                  <p className="text-xs text-slate-500">Sync guardian details and faculty directory with your Google account.</p>
                </div>
                <button
                  onClick={() => setShowNewContactModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add School Contact</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading contacts from Google People API...</div>
              ) : contacts.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No Google Contacts retrieved. Click above to add one.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {contacts.map((c, i) => (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.jobTitle || 'Guardian / Contact'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{c.email}</div>
                        <div className="text-[10px] text-slate-400">{c.phone}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE OPERATIONS */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{confirmModal.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload File to Drive Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                Upload Official File to Google Drive
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadFile} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fall-2026-Class-10-Honors-Report.txt"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">File Content / Document Memo</label>
                <textarea
                  rows={4}
                  placeholder="Official Academy document contents..."
                  value={uploadFileContent}
                  onChange={(e) => setUploadFileContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Upload Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Sheet Modal */}
      {showNewSheetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Export ERP Records to Google Sheets
              </h2>
              <button onClick={() => setShowNewSheetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSheet} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Spreadsheet Title *</label>
                <input
                  type="text"
                  required
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Will export {students.length} student records with columns: Admission No, Student Name, Class, Parent Contact, Fees Due.
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSheetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Create Spreadsheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Gmail Modal (Triggers Mandatory Confirmation) */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                Compose Official School Email via Gmail
              </h2>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={requestSendEmail} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Recipient Email (To) *</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Subject *</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Message Body *</label>
                <textarea
                  rows={6}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Review &amp; Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Form Modal */}
      {showNewFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FormInput className="w-4 h-4 text-purple-500" />
                Create Google Form Questionnaire
              </h2>
              <button onClick={() => setShowNewFormModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateForm} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Form Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Create Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Contact className="w-4 h-4 text-sky-500" />
                Add Guardian to Google Contacts
              </h2>
              <button onClick={() => setShowNewContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Wright"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  placeholder="+1 (650) 555-0192"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
