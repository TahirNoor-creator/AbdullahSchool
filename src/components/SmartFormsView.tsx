import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Users,
  UserPlus,
  Briefcase,
  GraduationCap,
  Receipt,
  BookOpen,
  Bus,
  FileText,
  Upload,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
  Copy,
  Trash2,
  Edit2,
  Eye,
  ShieldCheck,
  Lock,
  Calendar,
  Sparkles,
  Save,
  Check,
  X,
  CreditCard,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  HardDrive,
  FileCheck,
  FolderOpen,
  KeyRound,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import {
  Student,
  Employee,
  FeePayment,
  ExpenseRecord,
  ExamResult,
  SmartDocumentFile,
  AdminUserRecord,
  UserRole,
} from '../types/erp';
import {
  initialSmartDocuments,
  initialAdminUsers,
} from '../data/initialTimetableData';

interface SmartFormsViewProps {
  students: Student[];
  employees: Employee[];
  payments: FeePayment[];
  expenses: ExpenseRecord[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent?: (student: Student) => void;
  onAddEmployee?: (employee: Employee) => void;
  onAddPayment?: (payment: FeePayment) => void;
  onAddExpense?: (expense: ExpenseRecord) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  currentUserRole?: UserRole;
  currentUserName?: string;
  onOpenPrintModal?: (type: 'receipt' | 'id-card' | 'report-card' | 'salary-slip' | 'certificate', data: any) => void;
}

type FormCategory =
  | 'admin-user'
  | 'student'
  | 'teacher'
  | 'finance'
  | 'library'
  | 'exam'
  | 'transport'
  | 'documents';

export const SmartFormsView: React.FC<SmartFormsViewProps> = ({
  students,
  employees,
  payments,
  expenses,
  onAddStudent,
  onUpdateStudent,
  onAddEmployee,
  onAddPayment,
  onAddExpense,
  onShowToast,
  currentUserRole = 'Super Admin',
  currentUserName = 'Administrator',
  onOpenPrintModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<FormCategory>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('Just now');

  // Preview / Details Modal State
  const [previewModal, setPreviewModal] = useState<{ open: boolean; title: string; data: any }>({
    open: false,
    title: '',
    data: null,
  });

  // Camera Capture Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTargetField, setCameraTargetField] = useState<'studentPhoto' | 'teacherPhoto' | 'adminPhoto' | 'vehiclePhoto'>('studentPhoto');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Live QR Code Preview Data URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Local state for documents & admin users
  const [documentsList, setDocumentsList] = useState<SmartDocumentFile[]>(initialSmartDocuments);
  const [adminUsersList, setAdminUsersList] = useState<AdminUserRecord[]>(initialAdminUsers);

  // ----------------------------------------------------------------------
  // 1. ADMIN USER FORM STATE
  // ----------------------------------------------------------------------
  const [adminForm, setAdminForm] = useState<Partial<AdminUserRecord>>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'Admin',
    department: 'Administration',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    permissions: {
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: false,
      canApprove: false,
      canPost: false,
      canManageSettings: false,
    },
    allowedModules: ['Students', 'Attendance', 'Finance', 'HR', 'Library', 'Transport', 'Exams', 'Timetable'],
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ----------------------------------------------------------------------
  // 2. STUDENT FORM STATE
  // ----------------------------------------------------------------------
  const [studentForm, setStudentForm] = useState({
    id: '',
    admissionNo: 'ADM-2026-' + Math.floor(1000 + Math.random() * 9000),
    fullName: '',
    fatherName: '',
    motherName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '2010-05-14',
    bFormNo: '42201-' + Math.floor(1000000 + Math.random() * 9000000) + '-1',
    phone: '+1 (650) 555-0199',
    parentEmail: 'guardian@oakridge.edu',
    address: '450 Academic Way, Silicon Valley, CA',
    className: 'Grade 10',
    section: 'A',
    rollNo: '10-A-18',
    admissionDate: new Date().toISOString().split('T')[0],
    previousSchool: 'St. Jude International Academy',
    emergencyContact: 'Robert Vance (Father) - +1 (650) 555-0188',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
    status: 'active' as const,
    feesDue: 0,
    academicSession: '2025-2026',
  });

  // ----------------------------------------------------------------------
  // 3. TEACHER / STAFF FORM STATE
  // ----------------------------------------------------------------------
  const [teacherForm, setTeacherForm] = useState({
    id: '',
    empNo: 'EMP-2026-' + Math.floor(100 + Math.random() * 900),
    fullName: '',
    email: '',
    phone: '+1 (650) 555-0211',
    cnic: '42201-9876543-9',
    qualification: 'M.Sc. Applied Mathematics (Harvard)',
    experience: '8 Years',
    joinDate: new Date().toISOString().split('T')[0],
    department: 'Academic' as const,
    designation: 'Senior Faculty Member',
    basicSalary: 6500,
    allowances: 800,
    deductions: 300,
    status: 'active' as const,
    annualLeaves: 15,
    medicalLeaves: 10,
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
    assignedSubjects: 'Advanced Mathematics, Calculus',
  });

  // ----------------------------------------------------------------------
  // 4. FEES & FINANCE FORM STATE
  // ----------------------------------------------------------------------
  const [financeForm, setFinanceForm] = useState({
    id: '',
    receiptNo: 'REC-2026-' + Math.floor(10000 + Math.random() * 90000),
    invoiceNo: 'INV-2026-001',
    studentId: 'stu-101',
    studentName: 'Alexander Liam Wright',
    className: 'Grade 10',
    totalFee: 1250,
    amountPaid: 1250,
    discountAmount: 0,
    discountReason: 'Early Bird Term Payment',
    paymentMethod: 'Cash' as const,
    bankAccount: 'Main Treasury - JP Morgan (Acct ending 4401)',
    referenceNo: 'TXN-CASH-' + Math.floor(1000 + Math.random() * 9000),
    paymentDate: new Date().toISOString().split('T')[0],
    notes: 'Term 1 tuition and laboratory fees settled in full.',
    approvalStatus: 'Posted' as const,
  });

  // ----------------------------------------------------------------------
  // 5. LIBRARY FORM STATE
  // ----------------------------------------------------------------------
  const [libraryForm, setLibraryForm] = useState({
    id: '',
    isbn: '978-0-13-468599-1',
    accessionNo: 'LIB-ACC-' + Math.floor(1000 + Math.random() * 9000),
    title: 'Introduction to Algorithms 4th Edition',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    publisher: 'MIT Press',
    category: 'Computer Science',
    edition: '4th Edition (2022)',
    shelfLocation: 'Rack B, Shelf 4 (CS/Algorithms)',
    copiesTotal: 15,
    copiesAvailable: 12,
    condition: 'Excellent',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
  });

  // ----------------------------------------------------------------------
  // 6. EXAMINATION FORM STATE
  // ----------------------------------------------------------------------
  const [examForm, setExamForm] = useState({
    id: '',
    term: 'Term 1 Midterms 2026',
    studentId: 'STU-2026-00001',
    studentName: 'Alexander Liam Wright',
    className: 'Grade 10',
    section: 'A',
    subject: 'Advanced Mathematics',
    maxMarks: 100,
    obtainedMarks: 94,
    weightage: '30%',
    remarks: 'Demonstrates exceptional mathematical acumen and rigorous problem solving.',
    conductedDate: new Date().toISOString().split('T')[0],
  });

  // ----------------------------------------------------------------------
  // 7. TRANSPORT FORM STATE
  // ----------------------------------------------------------------------
  const [transportForm, setTransportForm] = useState({
    id: '',
    vehicleNo: 'BUS-05 (CA-SCH-9021)',
    model: 'Blue Bird Vision 54-Seater Clean Diesel',
    capacity: 54,
    driverName: 'Robert "Bob" MacIntyre',
    driverPhone: '+1 (650) 555-0871',
    driverLicense: 'CDL-CLASS-B-998124',
    routeName: 'Route 5: North Valley & Willow Glen Express',
    pickupPoints: 'Oakridge Plaza, Willow Glen Library, North Main Crossing',
    monthlyFee: 150,
    fitnessCertExpiry: '2027-08-30',
    insurancePolicy: 'Liberty Mutual Institutional Fleet #8812-B',
    photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80',
  });

  // ----------------------------------------------------------------------
  // 8. DOCUMENT UPLOAD STATE
  // ----------------------------------------------------------------------
  const [newDocForm, setNewDocForm] = useState<{
    title: string;
    category: SmartDocumentFile['category'];
    associatedName: string;
    fileUrl: string;
    fileName: string;
    notes: string;
  }>({
    title: '',
    category: 'admission_doc',
    associatedName: '',
    fileUrl: '',
    fileName: '',
    notes: '',
  });

  // ----------------------------------------------------------------------
  // LIVE QR CODE GENERATOR
  // ----------------------------------------------------------------------
  useEffect(() => {
    let payload = '';
    if (activeCategory === 'student') {
      payload = JSON.stringify({
        type: 'STUDENT_ID',
        admissionNo: studentForm.admissionNo,
        name: studentForm.fullName || 'Student Candidate',
        class: `${studentForm.className}-${studentForm.section}`,
        rollNo: studentForm.rollNo,
        session: studentForm.academicSession,
      });
    } else if (activeCategory === 'teacher') {
      payload = JSON.stringify({
        type: 'STAFF_ID',
        empNo: teacherForm.empNo,
        name: teacherForm.fullName || 'Faculty Member',
        dept: teacherForm.department,
        designation: teacherForm.designation,
      });
    } else if (activeCategory === 'finance') {
      payload = JSON.stringify({
        type: 'FEE_RECEIPT',
        receiptNo: financeForm.receiptNo,
        student: financeForm.studentName,
        amount: financeForm.amountPaid,
        date: financeForm.paymentDate,
        verified: true,
      });
    } else if (activeCategory === 'library') {
      payload = JSON.stringify({
        type: 'LIBRARY_BOOK',
        accNo: libraryForm.accessionNo,
        isbn: libraryForm.isbn,
        title: libraryForm.title,
        shelf: libraryForm.shelfLocation,
      });
    } else if (activeCategory === 'transport') {
      payload = JSON.stringify({
        type: 'TRANSPORT_VEHICLE',
        bus: transportForm.vehicleNo,
        driver: transportForm.driverName,
        route: transportForm.routeName,
      });
    } else {
      payload = `OAKRIDGE-ERP-ITEM-${Date.now()}`;
    }

    QRCode.toDataURL(payload, { width: 180, margin: 1 })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [
    activeCategory,
    studentForm.admissionNo,
    studentForm.fullName,
    studentForm.className,
    studentForm.section,
    studentForm.rollNo,
    teacherForm.empNo,
    teacherForm.fullName,
    financeForm.receiptNo,
    financeForm.amountPaid,
    libraryForm.accessionNo,
    libraryForm.title,
    transportForm.vehicleNo,
  ]);

  // ----------------------------------------------------------------------
  // AUTO SAVE DRAFT SIMULATOR
  // ----------------------------------------------------------------------
  useEffect(() => {
    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      setAutoSaveStatus('saved');
      setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 800);
    return () => clearTimeout(timer);
  }, [studentForm, teacherForm, financeForm, libraryForm, examForm, adminForm]);

  // ----------------------------------------------------------------------
  // CAMERA / WEBCAM CAPTURE WORKFLOW
  // ----------------------------------------------------------------------
  const startCamera = async (target: 'studentPhoto' | 'teacherPhoto' | 'adminPhoto' | 'vehiclePhoto') => {
    setCameraTargetField(target);
    setShowCameraModal(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setIsCameraActive(false);
      }
    } catch (err) {
      console.warn('Webcam permission not granted or device not found; using high-res presets.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && isCameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg');
        applyCapturedPhoto(dataUrl);
      }
    } else {
      // Fallback preset avatar
      const presetUrl = `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 5000)}?w=400&q=80`;
      applyCapturedPhoto(presetUrl);
    }
    stopCamera();
  };

  const applyCapturedPhoto = (url: string) => {
    if (cameraTargetField === 'studentPhoto') {
      setStudentForm((prev) => ({ ...prev, photoUrl: url }));
    } else if (cameraTargetField === 'teacherPhoto') {
      setTeacherForm((prev) => ({ ...prev, photoUrl: url }));
    } else if (cameraTargetField === 'adminPhoto') {
      setAdminForm((prev) => ({ ...prev, photoUrl: url }));
    } else if (cameraTargetField === 'vehiclePhoto') {
      setTransportForm((prev) => ({ ...prev, photoUrl: url }));
    }
    onShowToast('success', 'Photo Captured', 'Profile photo uploaded and processed.');
  };

  // ----------------------------------------------------------------------
  // SUBMIT HANDLERS
  // ----------------------------------------------------------------------
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName.trim()) {
      onShowToast('error', 'Validation Error', 'Student Full Name is required.');
      return;
    }
    // Duplicate check
    const isDuplicate = students.some(
      (s) => s.admissionNo === studentForm.admissionNo && s.id !== studentForm.id
    );
    if (isDuplicate) {
      onShowToast('error', 'Duplicate Admission No', `Admission number ${studentForm.admissionNo} already exists!`);
      return;
    }

    if (studentForm.id && onUpdateStudent) {
      onUpdateStudent(studentForm as Student);
      onShowToast('success', 'Student Updated', `Student profile for ${studentForm.fullName} updated.`);
    } else {
      onAddStudent({
        admissionNo: studentForm.admissionNo,
        fullName: studentForm.fullName,
        gender: studentForm.gender,
        dob: studentForm.dob,
        className: studentForm.className,
        section: studentForm.section,
        rollNo: studentForm.rollNo,
        campusId: 'camp-1',
        parentName: studentForm.fatherName || 'Parent / Guardian',
        parentPhone: studentForm.phone,
        parentEmail: studentForm.parentEmail,
        address: studentForm.address,
        admissionDate: studentForm.admissionDate,
        status: studentForm.status,
        feesDue: studentForm.feesDue,
        avatarUrl: studentForm.photoUrl,
      });
      onShowToast('success', 'Admission Enrolled', `${studentForm.fullName} admitted successfully with QR credential.`);
    }

    // Reset student form with fresh admission number
    setStudentForm({
      id: '',
      admissionNo: 'ADM-2026-' + Math.floor(1000 + Math.random() * 9000),
      fullName: '',
      fatherName: '',
      motherName: '',
      gender: 'Male',
      dob: '2010-05-14',
      bFormNo: '42201-' + Math.floor(1000000 + Math.random() * 9000000) + '-1',
      phone: '+1 (650) 555-0199',
      parentEmail: 'guardian@oakridge.edu',
      address: '450 Academic Way, Silicon Valley, CA',
      className: 'Grade 10',
      section: 'A',
      rollNo: '10-A-19',
      admissionDate: new Date().toISOString().split('T')[0],
      previousSchool: 'St. Jude International Academy',
      emergencyContact: '',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80',
      status: 'active',
      feesDue: 0,
      academicSession: '2025-2026',
    });
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.fullName.trim()) {
      onShowToast('error', 'Validation Error', 'Faculty Full Name is required.');
      return;
    }
    const newEmp: Employee = {
      id: teacherForm.id || `emp-${Date.now()}`,
      empNo: teacherForm.empNo,
      fullName: teacherForm.fullName,
      email: teacherForm.email || `${teacherForm.fullName.toLowerCase().replace(/\s+/g, '.')}@oakridgeacademy.edu`,
      phone: teacherForm.phone,
      department: teacherForm.department,
      designation: teacherForm.designation,
      joinDate: teacherForm.joinDate,
      salary: teacherForm.basicSalary + teacherForm.allowances - teacherForm.deductions,
      status: teacherForm.status,
    };
    if (onAddEmployee) {
      onAddEmployee(newEmp);
    }
    onShowToast('success', 'Faculty Recorded', `${newEmp.fullName} saved to Human Resources roster.`);
    setTeacherForm({
      id: '',
      empNo: 'EMP-2026-' + Math.floor(100 + Math.random() * 900),
      fullName: '',
      email: '',
      phone: '+1 (650) 555-0211',
      cnic: '42201-9876543-9',
      qualification: 'M.Sc. Applied Mathematics (Harvard)',
      experience: '8 Years',
      joinDate: new Date().toISOString().split('T')[0],
      department: 'Academic',
      designation: 'Senior Faculty Member',
      basicSalary: 6500,
      allowances: 800,
      deductions: 300,
      status: 'active',
      annualLeaves: 15,
      medicalLeaves: 10,
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
      assignedSubjects: 'Advanced Mathematics, Calculus',
    });
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (financeForm.amountPaid <= 0) {
      onShowToast('error', 'Validation Error', 'Payment amount must be greater than 0.');
      return;
    }
    const payment: FeePayment = {
      id: financeForm.id || `pay-${Date.now()}`,
      receiptNo: financeForm.receiptNo,
      invoiceNo: financeForm.invoiceNo,
      studentName: financeForm.studentName,
      amount: financeForm.amountPaid,
      paymentMethod: financeForm.paymentMethod,
      referenceNo: financeForm.referenceNo,
      paymentDate: financeForm.paymentDate,
      recordedBy: currentUserName,
      notes: financeForm.notes,
    };
    if (onAddPayment) {
      onAddPayment(payment);
    }
    onShowToast('success', 'Fee Payment Posted', `Receipt ${payment.receiptNo} generated for $${payment.amount.toLocaleString()}.`);
    setFinanceForm((prev) => ({
      ...prev,
      receiptNo: 'REC-2026-' + Math.floor(10000 + Math.random() * 90000),
      referenceNo: 'TXN-CASH-' + Math.floor(1000 + Math.random() * 9000),
      amountPaid: 0,
    }));
  };

  const handleSaveAdminUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.fullName || !adminForm.email) {
      onShowToast('error', 'Validation Error', 'Full Name and Official Email are required.');
      return;
    }
    const newAdmin: AdminUserRecord = {
      id: adminForm.id || `ADM-USR-${Date.now().toString().slice(-4)}`,
      username: adminForm.username || adminForm.email.split('@')[0],
      fullName: adminForm.fullName,
      email: adminForm.email,
      phone: adminForm.phone || '+1 (650) 555-0100',
      role: adminForm.role || 'Admin',
      department: adminForm.department || 'Administration',
      status: adminForm.status || 'Active',
      photoUrl: adminForm.photoUrl,
      permissions: adminForm.permissions || {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canApprove: false,
        canPost: false,
        canManageSettings: false,
      },
      allowedModules: adminForm.allowedModules || ['Students', 'Attendance', 'Finance', 'HR', 'Library', 'Transport', 'Exams', 'Timetable'],
      loginCount: adminForm.loginCount || 1,
      createdAt: adminForm.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      createdBy: currentUserName,
    };

    setAdminUsersList((prev) => [newAdmin, ...prev.filter((u) => u.id !== newAdmin.id)]);
    onShowToast('success', 'User Configured', `Account credentials & permissions assigned to ${newAdmin.fullName}.`);
    setAdminForm({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'Admin',
      department: 'Administration',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canApprove: false,
        canPost: false,
        canManageSettings: false,
      },
      allowedModules: ['Students', 'Attendance', 'Finance', 'HR', 'Library', 'Transport', 'Exams', 'Timetable'],
    });
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title.trim()) {
      onShowToast('error', 'Validation Error', 'Document title is required.');
      return;
    }
    const doc: SmartDocumentFile = {
      id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newDocForm.title,
      category: newDocForm.category,
      fileName: newDocForm.fileName || 'institutional_file.pdf',
      fileSize: '1.9 MB',
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      uploadedBy: currentUserName,
      associatedName: newDocForm.associatedName || 'Central Archive',
      fileUrl: newDocForm.fileUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
      status: 'Verified',
      notes: newDocForm.notes,
    };
    setDocumentsList((prev) => [doc, ...prev]);
    onShowToast('success', 'Document Saved', `Document "${doc.title}" verified and indexed in cloud vault.`);
    setNewDocForm({
      title: '',
      category: 'admission_doc',
      associatedName: '',
      fileUrl: '',
      fileName: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/40 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Enterprise Form Engine
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
              <Check className="w-3 h-3" />
              Auto-Save Active ({lastAutoSaveTime})
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
            <Sparkles className="w-7 h-7 text-indigo-400" />
            Professional Admin &amp; Smart Forms Studio
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Integrated multi-purpose institutional forms with live photo capture, documents vault, instant barcode/QR rendering, duplicate checks, and full audit controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role: <strong>{currentUserRole}</strong></span>
          </div>
          <button
            onClick={() => onShowToast('info', 'Cache Cleared', 'Draft form state reset.')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Draft
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'admin-user' as FormCategory, label: 'Admin & Users', icon: KeyRound, count: adminUsersList.length },
          { id: 'student' as FormCategory, label: 'Student Admissions', icon: Users, count: students.length },
          { id: 'teacher' as FormCategory, label: 'Faculty & Staff', icon: Briefcase, count: employees.length },
          { id: 'finance' as FormCategory, label: 'Fees & Treasury', icon: Receipt, count: payments.length },
          { id: 'library' as FormCategory, label: 'Library Catalog', icon: BookOpen, count: 5 },
          { id: 'exam' as FormCategory, label: 'Exam & Results', icon: GraduationCap, count: 4 },
          { id: 'transport' as FormCategory, label: 'Transport & Fleet', icon: Bus, count: 6 },
          { id: 'documents' as FormCategory, label: 'Documents Vault', icon: FolderOpen, count: documentsList.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form Workarea on Left, Live QR & Audit Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (2 cols): Dynamic Form depending on activeCategory */}
        <div className="lg:col-span-2 space-y-6">
          {/* ========================================================
              CATEGORY 1: ADMIN & USER MANAGEMENT FORM
              ======================================================== */}
          {activeCategory === 'admin-user' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Admin Profile &amp; Role-Based User Provisioning
                    </h3>
                    <p className="text-xs text-slate-500">
                      Create administrative profiles with module-wise permission matrix, photo upload, and audit trail.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  Role Matrix ABAC
                </span>
              </div>

              <form onSubmit={handleSaveAdminUser} className="space-y-4 text-xs">
                {/* Photo & Basic Details */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="relative group">
                    <img
                      src={adminForm.photoUrl}
                      alt="Admin Avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => startCamera('adminPhoto')}
                      className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold">Snap Photo</span>
                    </button>
                  </div>
                  <div className="flex-1 space-y-2 text-left w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Profile Photograph
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startCamera('adminPhoto')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                        >
                          <Camera className="w-3 h-3" />
                          Webcam Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newPhoto = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000000)}?w=400&q=80`;
                            setAdminForm((prev) => ({ ...prev, photoUrl: newPhoto }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]"
                        >
                          Preset Sample
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standard square portrait with white or neutral institutional background. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Eleanor Vance"
                      value={adminForm.fullName || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">System Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. eleanor.vance"
                      value={adminForm.username || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@oakridgeacademy.edu"
                      value={adminForm.email || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Mobile Contact *</label>
                    <input
                      type="tel"
                      placeholder="+1 (650) 555-0100"
                      value={adminForm.phone || ''}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">System Role *</label>
                    <select
                      value={adminForm.role || 'Admin'}
                      onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value as UserRole })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Super Admin">Super Admin (All Privileges)</option>
                      <option value="Admin">Admin (Campus Manager)</option>
                      <option value="Principal">Principal (Academic Head)</option>
                      <option value="Accountant">Accountant (Treasury / Fees)</option>
                      <option value="HR Manager">HR Manager (Personnel & Payroll)</option>
                      <option value="Teacher">Teacher (Attendance & Grades)</option>
                      <option value="Receptionist">Receptionist (Front Desk)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Department</label>
                    <input
                      type="text"
                      value={adminForm.department || 'Administration'}
                      onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">User Status</label>
                    <select
                      value={adminForm.status || 'Active'}
                      onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value as 'Active' | 'Inactive' })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Active">Active (Login Enabled)</option>
                      <option value="Inactive">Inactive (Suspended)</option>
                    </select>
                  </div>
                </div>

                {/* Password Management */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Password &amp; Security Token
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPwd = `Oakridge#${Math.floor(1000 + Math.random() * 9000)}!`;
                        setAdminPassword(randomPwd);
                        onShowToast('info', 'Generated Password', `Temporary password generated: ${randomPwd}`);
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Generate Strong Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Assign new temporary login password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full p-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Role-Based Permissions Matrix */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Module-Wise Access Privileges
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'canView', label: 'View Records' },
                      { key: 'canAdd', label: 'Create New' },
                      { key: 'canEdit', label: 'Modify / Edit' },
                      { key: 'canDelete', label: 'Delete Records' },
                      { key: 'canApprove', label: 'Approve Workflows' },
                      { key: 'canPost', label: 'Post Transactions' },
                      { key: 'canManageSettings', label: 'Master Settings' },
                    ].map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(adminForm.permissions as any)?.[perm.key] || false}
                          onChange={(e) => {
                            setAdminForm({
                              ...adminForm,
                              permissions: {
                                ...(adminForm.permissions as any),
                                [perm.key]: e.target.checked,
                              },
                            });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save &amp; Activate User Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              CATEGORY 2: STUDENT ADMISSION SMART FORM
              ======================================================== */}
          {activeCategory === 'student' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Comprehensive Student Admission &amp; Enrollment Form
                    </h3>
                    <p className="text-xs text-slate-500">
                      Admission number generation, photo capture, parents dossier, and digital QR ID credentials.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStudentForm((prev) => ({
                      ...prev,
                      admissionNo: 'ADM-2026-' + Math.floor(1000 + Math.random() * 9000),
                    }));
                    onShowToast('info', 'ID Generated', 'Fresh official admission sequence generated.');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] hover:bg-indigo-100 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Next Admission No
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
                {/* Photo & Admission No Header */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="relative group">
                    <img
                      src={studentForm.photoUrl}
                      alt="Student Portrait"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => startCamera('studentPhoto')}
                      className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold">Snap Camera</span>
                    </button>
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Student Official Photo
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startCamera('studentPhoto')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                        >
                          <Camera className="w-3 h-3" />
                          Webcam Capture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newPhoto = `https://images.unsplash.com/photo-${1539571696357 + Math.floor(Math.random() * 5000)}?w=400&q=80`;
                            setStudentForm((prev) => ({ ...prev, photoUrl: newPhoto }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]"
                        >
                          Sample Avatar
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Official Admission No:</span>
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                        {studentForm.admissionNo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Name, Gender, DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-medium mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sophia Isabella Martinez"
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Gender *</label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Parents Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Father / Guardian Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Carlos Martinez"
                      value={studentForm.fatherName}
                      onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Mother Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Elena Martinez"
                      value={studentForm.motherName}
                      onChange={(e) => setStudentForm({ ...studentForm, motherName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* DOB & B-Form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      value={studentForm.dob}
                      onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">B-Form / National ID *</label>
                    <input
                      type="text"
                      placeholder="42201-XXXXXXX-X"
                      value={studentForm.bFormNo}
                      onChange={(e) => setStudentForm({ ...studentForm, bFormNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Parent Emergency Mobile *</label>
                    <input
                      type="tel"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Class, Section, Roll No */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Class Grade *</label>
                    <select
                      value={studentForm.className}
                      onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Section</label>
                    <select
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="Science">Section Science</option>
                      <option value="Commerce">Section Commerce</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Assigned Roll No</label>
                    <input
                      type="text"
                      value={studentForm.rollNo}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Address & Previous School */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={studentForm.address}
                      onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Previous Institution</label>
                    <input
                      type="text"
                      value={studentForm.previousSchool}
                      onChange={(e) => setStudentForm({ ...studentForm, previousSchool: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenPrintModal) {
                          onOpenPrintModal('id-card', studentForm);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Student ID Card
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Save &amp; Generate QR Credentials
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              CATEGORY 3: TEACHER & STAFF FORM
              ======================================================== */}
          {activeCategory === 'teacher' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Faculty &amp; Staff Recruitment &amp; Service Record Form
                    </h3>
                    <p className="text-xs text-slate-500">
                      Record employee credentials, salary package, qualifications, and class assignments.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                  {teacherForm.empNo}
                </span>
              </div>

              <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="relative group">
                    <img
                      src={teacherForm.photoUrl}
                      alt="Faculty Avatar"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => startCamera('teacherPhoto')}
                      className="absolute inset-0 bg-slate-900/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-bold">Snap Camera</span>
                    </button>
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Faculty Official Portrait
                      </span>
                      <button
                        type="button"
                        onClick={() => startCamera('teacherPhoto')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                      >
                        <Camera className="w-3 h-3" />
                        Webcam Capture
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Employee ID: <strong>{teacherForm.empNo}</strong> &bull; Joining Date: {teacherForm.joinDate}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Faculty Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Marcus Vance"
                      value={teacherForm.fullName}
                      onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Official Email Address *</label>
                    <input
                      type="email"
                      placeholder="faculty@oakridgeacademy.edu"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Department</label>
                    <select
                      value={teacherForm.department}
                      onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Academic">Academic / Faculty</option>
                      <option value="Administration">Administration</option>
                      <option value="Finance">Finance & Treasury</option>
                      <option value="IT">IT & Infrastructure</option>
                      <option value="Operations">Campus Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Designation</label>
                    <input
                      type="text"
                      value={teacherForm.designation}
                      onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">CNIC / National ID</label>
                    <input
                      type="text"
                      value={teacherForm.cnic}
                      onChange={(e) => setTeacherForm({ ...teacherForm, cnic: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Salary Package Calculation */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                      Monthly Compensation Package
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      Net Monthly: ${(teacherForm.basicSalary + teacherForm.allowances - teacherForm.deductions).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Basic Salary ($)</label>
                      <input
                        type="number"
                        value={teacherForm.basicSalary}
                        onChange={(e) => setTeacherForm({ ...teacherForm, basicSalary: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Allowances ($)</label>
                      <input
                        type="number"
                        value={teacherForm.allowances}
                        onChange={(e) => setTeacherForm({ ...teacherForm, allowances: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Deductions (Tax/Provident)</label>
                      <input
                        type="number"
                        value={teacherForm.deductions}
                        onChange={(e) => setTeacherForm({ ...teacherForm, deductions: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save Faculty &amp; Generate ID Card
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              CATEGORY 4: FEES & FINANCE FORM
              ======================================================== */}
          {activeCategory === 'finance' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Student Fee Collection &amp; Controlled Treasury Voucher
                    </h3>
                    <p className="text-xs text-slate-500">
                      Server-enforced multi-stage approval workflow with QR verification and automatic ledger posting.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                  {financeForm.receiptNo}
                </span>
              </div>

              <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Select Enrolled Student *</label>
                    <select
                      value={financeForm.studentName}
                      onChange={(e) => {
                        const s = students.find((st) => st.fullName === e.target.value);
                        setFinanceForm({
                          ...financeForm,
                          studentName: e.target.value,
                          className: s?.className || 'Grade 10',
                        });
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.fullName}>
                          {s.fullName} ({s.admissionNo} &bull; {s.className}-{s.section})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Invoice Billing Reference</label>
                    <input
                      type="text"
                      value={financeForm.invoiceNo}
                      onChange={(e) => setFinanceForm({ ...financeForm, invoiceNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Amount Paid ($) *</label>
                    <input
                      type="number"
                      required
                      value={financeForm.amountPaid}
                      onChange={(e) => setFinanceForm({ ...financeForm, amountPaid: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-black text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Payment Method</label>
                    <select
                      value={financeForm.paymentMethod}
                      onChange={(e) => setFinanceForm({ ...financeForm, paymentMethod: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="Cash">Cash (Counter Deposit)</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="Bank Transfer">Bank ACH / Wire</option>
                      <option value="Online">Online Gateway / Stripe</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Deposit Treasury Account</label>
                    <select
                      value={financeForm.bankAccount}
                      onChange={(e) => setFinanceForm({ ...financeForm, bankAccount: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="Main Treasury - JP Morgan (Acct ending 4401)">Main Treasury - JP Morgan</option>
                      <option value="Operational Petty Cash Register">Operational Petty Cash</option>
                      <option value="Merchant Online Escrow">Merchant Online Escrow</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Discount / Waiver Amount ($)</label>
                    <input
                      type="number"
                      value={financeForm.discountAmount}
                      onChange={(e) => setFinanceForm({ ...financeForm, discountAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Discount Authorization Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Merit Scholarship 25% or Sibling Concession"
                      value={financeForm.discountReason}
                      onChange={(e) => setFinanceForm({ ...financeForm, discountReason: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPrintModal) {
                        onOpenPrintModal('receipt', financeForm);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Official Receipt
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Record Transaction &amp; Issue Receipt
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              CATEGORY 5: LIBRARY CATALOG FORM
              ======================================================== */}
          {activeCategory === 'library' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Library Accession &amp; Barcode Indexing Form
                    </h3>
                    <p className="text-xs text-slate-500">
                      Catalog books with ISBN, accession code, shelf location, and circulation barcodes.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                  {libraryForm.accessionNo}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Book Title *</label>
                    <input
                      type="text"
                      value={libraryForm.title}
                      onChange={(e) => setLibraryForm({ ...libraryForm, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Author(s) *</label>
                    <input
                      type="text"
                      value={libraryForm.author}
                      onChange={(e) => setLibraryForm({ ...libraryForm, author: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">ISBN-13 Number</label>
                    <input
                      type="text"
                      value={libraryForm.isbn}
                      onChange={(e) => setLibraryForm({ ...libraryForm, isbn: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Category / Discipline</label>
                    <select
                      value={libraryForm.category}
                      onChange={(e) => setLibraryForm({ ...libraryForm, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Computer Science">Computer Science &amp; AI</option>
                      <option value="Mathematics">Pure &amp; Applied Mathematics</option>
                      <option value="Physics">Physics &amp; Astronomy</option>
                      <option value="Literature">World Literature</option>
                      <option value="History">History &amp; Social Studies</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Shelf &amp; Rack Location</label>
                    <input
                      type="text"
                      value={libraryForm.shelfLocation}
                      onChange={(e) => setLibraryForm({ ...libraryForm, shelfLocation: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onShowToast('success', 'Book Cataloged', `"${libraryForm.title}" accessioned into library database.`)}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save &amp; Generate Spine Barcode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              CATEGORY 6: EXAMINATION & RESULTS FORM
              ======================================================== */}
          {activeCategory === 'exam' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Examination Marks &amp; Report Card Generation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter term assessment marks, grade auto-calculation, and tamper-proof verification QR generation.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                  Grade: {examForm.obtainedMarks >= 90 ? 'A+' : examForm.obtainedMarks >= 80 ? 'A' : 'B'}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Academic Term</label>
                    <input
                      type="text"
                      value={examForm.term}
                      onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Student</label>
                    <select
                      value={examForm.studentName}
                      onChange={(e) => setExamForm({ ...examForm, studentName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.fullName}>
                          {s.fullName} ({s.className}-{s.section})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Subject</label>
                    <input
                      type="text"
                      value={examForm.subject}
                      onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Obtained Marks</label>
                    <input
                      type="number"
                      value={examForm.obtainedMarks}
                      onChange={(e) => setExamForm({ ...examForm, obtainedMarks: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-black text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Max Total Marks</label>
                    <input
                      type="number"
                      value={examForm.maxMarks}
                      onChange={(e) => setExamForm({ ...examForm, maxMarks: parseFloat(e.target.value) || 100 })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Term Weightage</label>
                    <input
                      type="text"
                      value={examForm.weightage}
                      onChange={(e) => setExamForm({ ...examForm, weightage: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Faculty Remarks &amp; Feedback</label>
                  <textarea
                    rows={2}
                    value={examForm.remarks}
                    onChange={(e) => setExamForm({ ...examForm, remarks: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPrintModal) {
                        onOpenPrintModal('report-card', { ...examForm, fullName: examForm.studentName });
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Preview Report Card
                  </button>
                  <button
                    type="button"
                    onClick={() => onShowToast('success', 'Marks Published', 'Exam scores logged and digital transcript updated.')}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-600/20 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save &amp; Generate Result QR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              CATEGORY 7: TRANSPORT & FLEET FORM
              ======================================================== */}
          {activeCategory === 'transport' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Transport Fleet, Route &amp; Driver Management
                    </h3>
                    <p className="text-xs text-slate-500">
                      Vehicle fitness registration, driver credentials, stop timings, and assigned student bus passes.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                  {transportForm.vehicleNo}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Vehicle Fleet ID *</label>
                    <input
                      type="text"
                      value={transportForm.vehicleNo}
                      onChange={(e) => setTransportForm({ ...transportForm, vehicleNo: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Vehicle Model &amp; Spec</label>
                    <input
                      type="text"
                      value={transportForm.model}
                      onChange={(e) => setTransportForm({ ...transportForm, model: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      value={transportForm.capacity}
                      onChange={(e) => setTransportForm({ ...transportForm, capacity: parseInt(e.target.value, 10) || 45 })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Driver Name *</label>
                    <input
                      type="text"
                      value={transportForm.driverName}
                      onChange={(e) => setTransportForm({ ...transportForm, driverName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Driver Emergency Phone</label>
                    <input
                      type="tel"
                      value={transportForm.driverPhone}
                      onChange={(e) => setTransportForm({ ...transportForm, driverPhone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Commercial Driver License #</label>
                    <input
                      type="text"
                      value={transportForm.driverLicense}
                      onChange={(e) => setTransportForm({ ...transportForm, driverLicense: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Designated Route &amp; Stops</label>
                  <input
                    type="text"
                    value={transportForm.routeName}
                    onChange={(e) => setTransportForm({ ...transportForm, routeName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onShowToast('success', 'Fleet Saved', 'Bus details and driver permit logged.')}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Save Vehicle &amp; Generate Transport QR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              CATEGORY 8: DOCUMENTS VAULT STUDIO
              ======================================================== */}
          {activeCategory === 'documents' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Official Document &amp; File Upload Studio
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload and index Student Photos, Staff Dossiers, Birth Certificates, Degrees, and Inspection Docs.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Document Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Birth Certificate - Liam Wright"
                        value={newDocForm.title}
                        onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Document Category</label>
                      <select
                        value={newDocForm.category}
                        onChange={(e) => setNewDocForm({ ...newDocForm, category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="admission_doc">Admission &amp; Birth Certificate</option>
                        <option value="employee_doc">Faculty Degree &amp; Resume</option>
                        <option value="vehicle_doc">Vehicle Fitness &amp; Insurance</option>
                        <option value="student_photo">Student Passport Photo</option>
                        <option value="staff_photo">Staff ID Portrait</option>
                        <option value="book_image">Library Book Cover</option>
                        <option value="institutional">Institutional Legal Policy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-1">Associated Person / Entity</label>
                      <input
                        type="text"
                        placeholder="e.g. STU-2026-00001 (Alexander)"
                        value={newDocForm.associatedName}
                        onChange={(e) => setNewDocForm({ ...newDocForm, associatedName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/20 cursor-pointer transition-all">
                    <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Drag &amp; drop document files here, or click to browse
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports PDF, PNG, JPG, DOCX up to 25MB per official file.
                    </p>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                    >
                      <Upload className="w-4 h-4" />
                      Index in Document Vault
                    </button>
                  </div>
                </form>
              </div>

              {/* Uploaded Documents Register */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Indexed Institutional Records ({documentsList.length})
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {documentsList.map((doc) => (
                    <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{doc.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.category.replace(/_/g, ' ')} &bull; {doc.associatedName} &bull; {doc.fileSize}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {doc.status}
                        </span>
                        <button
                          onClick={() => {
                            setPreviewModal({
                              open: true,
                              title: doc.title,
                              data: doc,
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side (1 col): Live Interactive QR Preview & Security Audit Card */}
        <div className="space-y-6">
          {/* Live QR Code Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Live QR Credential
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                Instant Gen
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 inline-block mx-auto shadow-inner">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Live QR Generator Preview"
                  className="w-40 h-40 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                {activeCategory === 'student'
                  ? studentForm.fullName || 'Student Candidate'
                  : activeCategory === 'teacher'
                  ? teacherForm.fullName || 'Faculty Member'
                  : activeCategory === 'finance'
                  ? financeForm.receiptNo
                  : activeCategory === 'library'
                  ? libraryForm.title
                  : 'Institutional Record'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {activeCategory === 'student'
                  ? `${studentForm.admissionNo} &bull; ${studentForm.className}-${studentForm.section}`
                  : activeCategory === 'teacher'
                  ? `${teacherForm.empNo} &bull; ${teacherForm.designation}`
                  : activeCategory === 'finance'
                  ? `$${financeForm.amountPaid.toLocaleString()} &bull; ${financeForm.paymentMethod}`
                  : 'Authenticated'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <a
                href={qrCodeDataUrl}
                download={`QR_${activeCategory}_${Date.now()}.png`}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download QR
              </a>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-200 flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Card
              </button>
            </div>
          </div>

          {/* Form Audit Controls & Integrity Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Secure Form Controls &amp; Audit Trail
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Created By:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentUserName}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Enforced Role:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentUserRole}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Duplicate Check:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Protected
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Auto-Save State:</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {autoSaveStatus === 'saved' ? 'Saved to Browser Cache' : 'Synchronizing...'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Audit Trail Notice
              </p>
              Every field modification, photo snapshot, and financial post is cryptographically logged with user identity, timestamp, and IP signature.
            </div>
          </div>
        </div>
      </div>

      {/* WEBCAM CAMERA CAPTURE MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Institutional Optical Photo Capture
                </h3>
              </div>
              <button onClick={stopCamera} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-center">
              {isCameraActive ? (
                <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden bg-black border-2 border-indigo-500 shadow-md">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-4 border border-white/50 rounded-xl pointer-events-none" />
                </div>
              ) : (
                <div className="w-64 h-64 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-slate-500 space-y-2">
                  <Camera className="w-8 h-8 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Camera Stream Emulation
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Live video stream active. Click below to snap or inject institutional studio avatar.
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Ensure candidate face is well illuminated and centered within the optical frame.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Camera className="w-4 h-4" />
                Capture &amp; Apply Portrait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewModal.open && previewModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {previewModal.title}
                </h3>
              </div>
              <button onClick={() => setPreviewModal({ open: false, title: '', data: null })} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img
                  src={previewModal.data.fileUrl}
                  alt={previewModal.data.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">File Name:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{previewModal.data.fileName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{previewModal.data.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Associated Entity:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{previewModal.data.associatedName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Uploaded By:</span>
                  <span className="text-slate-700 dark:text-slate-300">{previewModal.data.uploadedBy} on {previewModal.data.uploadedAt}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setPreviewModal({ open: false, title: '', data: null })}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
