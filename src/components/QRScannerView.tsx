import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  Volume2,
  UserCheck,
  Receipt,
  Download,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  CreditCard,
  Printer,
  BookOpen,
  Bus,
  GraduationCap,
  Bell,
  Briefcase,
  Users,
  Layers,
  ArrowRight,
  School,
  Clock,
  Check,
  Award,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  Student,
  FeeInvoice,
  FeePayment,
  Employee,
  Announcement,
} from '../types/erp';

export type InstitutionalQRType =
  | 'student'
  | 'teacher'
  | 'staff'
  | 'fee'
  | 'library'
  | 'transport'
  | 'exam'
  | 'notice';

interface QRScannerViewProps {
  students: Student[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  employees?: Employee[];
  announcements?: Announcement[];
  onMarkAttendancePresent: (student: Student) => void;
  onMarkTeacherAttendance?: (employee: Employee, status: 'Present' | 'Late' | 'Leave') => void;
  onNavigateToStudent: (studentId: string) => void;
  onNavigateToInvoice: (invoiceNo: string) => void;
  onNavigateView?: (view: any) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export interface ScanResult {
  rawText: string;
  type: InstitutionalQRType | 'unknown';
  student?: Student;
  teacher?: Employee;
  staff?: Employee;
  invoice?: FeeInvoice;
  payment?: FeePayment;
  bookTitle?: string;
  routeCode?: string;
  examTerm?: string;
  noticeTitle?: string;
  timestamp: string;
  attendanceMarked?: boolean;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  students,
  invoices,
  payments,
  employees = [],
  announcements = [],
  onMarkAttendancePresent,
  onMarkTeacherAttendance,
  onNavigateToStudent,
  onNavigateToInvoice,
  onNavigateView,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'generator' | 'id-cards' | 'bulk' | 'history'>('scan');
  const [selectedQRType, setSelectedQRType] = useState<InstitutionalQRType>('student');

  // Scanner States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [selectedScanStatus, setSelectedScanStatus] = useState<'Present' | 'Late' | 'Leave'>('Present');

  // Generator States
  const [genTargetId, setGenTargetId] = useState<string>(students[0]?.id || '');
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');
  const [genCustomData, setGenCustomData] = useState<string>('');

  // Bulk Generator
  const [bulkCategory, setBulkCategory] = useState<'students' | 'teachers' | 'books'>('students');
  const [bulkGeneratedList, setBulkGeneratedList] = useState<Array<{ name: string; id: string; qrUrl: string }>>([]);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);

  // Audio Beep
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  };

  // Decode QR String
  const processDecodedQR = (text: string) => {
    if (!text) return;
    const clean = text.trim();

    if (lastScan && lastScan.rawText === clean && Date.now() - new Date(lastScan.timestamp).getTime() < 2500) {
      return;
    }

    playBeep();
    const timestamp = new Date().toLocaleTimeString();

    // Check student QR format: OAKRIDGE:STUDENT:id or ID
    if (clean.includes('STUDENT') || clean.startsWith('STU-') || clean.startsWith('stu-')) {
      const stu = students.find((s) => s.id === clean || s.admissionNo === clean || clean.includes(s.admissionNo) || clean.includes(s.id));
      if (stu) {
        onMarkAttendancePresent(stu);
        const result: ScanResult = {
          rawText: clean,
          type: 'student',
          student: stu,
          timestamp,
          attendanceMarked: true,
        };
        setLastScan(result);
        setScanHistory((prev) => [result, ...prev].slice(0, 30));
        onShowToast?.('success', 'Student QR Verified', `${stu.fullName} marked Present automatically.`);
        return;
      }
    }

    // Check Teacher/Faculty format
    if (clean.includes('TEACHER') || clean.includes('FACULTY') || clean.startsWith('EMP-ACAD')) {
      const teacher = employees.find((e) => e.department === 'Academic' && (clean.includes(e.empNo) || clean.includes(e.id)));
      if (teacher) {
        onMarkTeacherAttendance?.(teacher, selectedScanStatus);
        const result: ScanResult = {
          rawText: clean,
          type: 'teacher',
          teacher,
          timestamp,
          attendanceMarked: true,
        };
        setLastScan(result);
        setScanHistory((prev) => [result, ...prev].slice(0, 30));
        onShowToast?.('success', 'Teacher QR Verified', `${teacher.fullName} checked in on duty.`);
        return;
      }
    }

    // Check Staff format
    if (clean.includes('STAFF') || clean.startsWith('EMP-')) {
      const staffEmp = employees.find((e) => clean.includes(e.empNo) || clean.includes(e.id));
      if (staffEmp) {
        const result: ScanResult = {
          rawText: clean,
          type: 'staff',
          staff: staffEmp,
          timestamp,
          attendanceMarked: true,
        };
        setLastScan(result);
        setScanHistory((prev) => [result, ...prev].slice(0, 30));
        onShowToast?.('success', 'Staff Badge Verified', `${staffEmp.fullName} (${staffEmp.designation}) scanned.`);
        return;
      }
    }

    // Check Fee Invoice / Receipt format
    if (clean.includes('INV-') || clean.includes('REC-') || clean.includes('FEE')) {
      const inv = invoices.find((i) => clean.includes(i.invoiceNo) || clean.includes(i.id));
      const pay = payments.find((p) => clean.includes(p.receiptNo));
      const result: ScanResult = {
        rawText: clean,
        type: 'fee',
        invoice: inv,
        payment: pay,
        timestamp,
      };
      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 30));
      onShowToast?.('info', 'Fee Receipt Verified', inv ? `Invoice ${inv.invoiceNo}: $${inv.totalAmount}` : 'Receipt verified.');
      return;
    }

    // Check Library format
    if (clean.includes('BOOK') || clean.includes('BK-') || clean.includes('LIB')) {
      const result: ScanResult = {
        rawText: clean,
        type: 'library',
        bookTitle: clean.replace('OAKRIDGE:LIBRARY:', ''),
        timestamp,
      };
      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 30));
      onShowToast?.('success', 'Library Book Scanned', clean);
      return;
    }

    // Check Transport format
    if (clean.includes('BUS') || clean.includes('ROUTE') || clean.includes('TRN')) {
      const result: ScanResult = {
        rawText: clean,
        type: 'transport',
        routeCode: 'RT-NORTH-01 (Bus #01)',
        timestamp,
      };
      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 30));
      onShowToast?.('success', 'Transport Bus Pass Verified', 'Route North Hills Express');
      return;
    }

    // Fallback unknown scan
    const fallback: ScanResult = {
      rawText: clean,
      type: 'unknown',
      timestamp,
    };
    setLastScan(fallback);
    setScanHistory((prev) => [fallback, ...prev].slice(0, 30));
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setIsCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable. You can upload a QR image or generate codes.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    setIsCameraActive(false);
  };

  // Video Scan Loop
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code && code.data) {
        processDecodedQR(code.data);
      }
    }
    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Generate QR on change
  useEffect(() => {
    let payload = '';
    if (selectedQRType === 'student') {
      const stu = students.find((s) => s.id === genTargetId) || students[0];
      payload = `OAKRIDGE:STUDENT:${stu?.admissionNo || 'STU-2026-00001'}:${stu?.fullName || 'Student'}:${stu?.className || 'Grade 10'}`;
    } else if (selectedQRType === 'teacher') {
      const emp = employees.find((e) => e.id === genTargetId) || employees[0];
      payload = `OAKRIDGE:TEACHER:${emp?.empNo || 'EMP-ACAD-001'}:${emp?.fullName || 'Teacher'}:${emp?.department || 'Academic'}`;
    } else if (selectedQRType === 'staff') {
      const emp = employees.find((e) => e.id === genTargetId) || employees[0];
      payload = `OAKRIDGE:STAFF:${emp?.empNo || 'EMP-OPS-001'}:${emp?.fullName || 'Staff'}:${emp?.designation || 'Staff'}`;
    } else if (selectedQRType === 'fee') {
      const inv = invoices[0];
      payload = `OAKRIDGE:FEE:${inv?.invoiceNo || 'INV-2026-001'}:AMT_${inv?.totalAmount || 1250}`;
    } else if (selectedQRType === 'library') {
      payload = `OAKRIDGE:LIBRARY:BK-1001:The C Programming Language:ISBN-9780131103627`;
    } else if (selectedQRType === 'transport') {
      payload = `OAKRIDGE:TRANSPORT:BUS-01:RT-NORTH-01:STU-2026-00001:Seat3`;
    } else if (selectedQRType === 'exam') {
      payload = `OAKRIDGE:EXAM_REPORT:STU-2026-00001:TERM-2:GPA_3.92:VERIFIED_STAMP`;
    } else if (selectedQRType === 'notice') {
      payload = `OAKRIDGE:NOTICE:ANN-2026-01:Annual STEM Olympiad & Term Finals Circular`;
    }

    if (genCustomData.trim()) {
      payload = genCustomData.trim();
    }

    if (payload) {
      QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setGeneratedQrDataUrl(url))
        .catch(() => {});
    }
  }, [selectedQRType, genTargetId, genCustomData, students, employees, invoices]);

  // Bulk Generator Execution
  const handleGenerateBulk = async () => {
    setIsGeneratingBulk(true);
    const list: Array<{ name: string; id: string; qrUrl: string }> = [];

    if (bulkCategory === 'students') {
      for (const stu of students) {
        const payload = `OAKRIDGE:STUDENT:${stu.admissionNo}:${stu.fullName}:${stu.className}-${stu.section}`;
        const qrUrl = await QRCode.toDataURL(payload, { width: 180, margin: 1 });
        list.push({ name: stu.fullName, id: stu.admissionNo, qrUrl });
      }
    } else if (bulkCategory === 'teachers') {
      for (const emp of employees) {
        const payload = `OAKRIDGE:STAFF:${emp.empNo}:${emp.fullName}:${emp.department}`;
        const qrUrl = await QRCode.toDataURL(payload, { width: 180, margin: 1 });
        list.push({ name: emp.fullName, id: emp.empNo, qrUrl });
      }
    } else {
      const books = ['The C Programming Language', 'Pride and Prejudice', 'Sapiens', 'Leonardo da Vinci'];
      for (let i = 0; i < books.length; i++) {
        const payload = `OAKRIDGE:LIBRARY:BK-${1001 + i}:${books[i]}`;
        const qrUrl = await QRCode.toDataURL(payload, { width: 180, margin: 1 });
        list.push({ name: books[i], id: `BK-${1001 + i}`, qrUrl });
      }
    }

    setBulkGeneratedList(list);
    setIsGeneratingBulk(false);
    onShowToast?.('success', 'Bulk QRs Generated', `Created ${list.length} QR codes ready for printing and export.`);
  };

  const selectedStudentForCard = students.find((s) => s.id === genTargetId) || students[0];
  const selectedTeacherForCard = employees.find((e) => e.department === 'Academic') || employees[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-500" />
              Institutional QR Scanner &amp; Generator Studio
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              One QR System for School
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Unified QR identification across Students, Teachers, Staff, Attendance, Fees, Library, Transport, Exams, and Circulars.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('scan');
              startCamera();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Scanner
          </button>
          <button
            onClick={() => {
              setActiveTab('generator');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Studio
          </button>
          <button
            onClick={() => {
              setActiveTab('id-cards');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'id-cards'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            Print ID Cards
          </button>
          <button
            onClick={() => {
              setActiveTab('bulk');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Bulk Generator
          </button>
        </div>
      </div>

      {/* 8-in-1 Institutional QR Type Filter Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 px-2 shrink-0">
          Module QR:
        </span>
        {[
          { type: 'student' as const, label: 'Student QR', icon: Users, color: 'text-indigo-600' },
          { type: 'teacher' as const, label: 'Teacher QR', icon: GraduationCap, color: 'text-purple-600' },
          { type: 'staff' as const, label: 'Staff QR', icon: Briefcase, color: 'text-blue-600' },
          { type: 'fee' as const, label: 'Fee QR', icon: Receipt, color: 'text-emerald-600' },
          { type: 'library' as const, label: 'Library QR', icon: BookOpen, color: 'text-teal-600' },
          { type: 'transport' as const, label: 'Transport QR', icon: Bus, color: 'text-amber-600' },
          { type: 'exam' as const, label: 'Exam Result QR', icon: Award, color: 'text-rose-600' },
          { type: 'notice' as const, label: 'Notice QR', icon: Bell, color: 'text-sky-600' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = selectedQRType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => setSelectedQRType(item.type)}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Live Camera Scanner */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Viewport */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-500" />
                  Optical QR Gate &amp; Verification Scanner
                </h2>
                <p className="text-xs text-slate-500">
                  Point camera at Student ID cards, Teacher badges, Fee receipts, or Book tags for instant verification.
                </p>
              </div>

              {/* Attendance Quick Tag Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                {(['Present', 'Late', 'Leave'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedScanStatus(st)}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      selectedScanStatus === st
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 font-bold shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Viewport Container */}
            <div className="relative aspect-video max-h-96 w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Target Aim Reticle */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-indigo-400/80 rounded-2xl relative shadow-2xl">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br" />
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500/50 animate-pulse" />
                  </div>
                </div>
              )}

              {!isCameraActive && (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Camera Offline</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                      Click below to activate live optical scanning or test by pasting QR payload text.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
                  >
                    Activate Optical Camera
                  </button>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Quick Test Bar for Demo / Environments without Webcams */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">Quick One-Click Test Scans:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => processDecodedQR(`OAKRIDGE:STUDENT:${students[0]?.admissionNo}:Alexander Hayes:Grade 10`)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800"
                >
                  Scan Student
                </button>
                <button
                  onClick={() => processDecodedQR('OAKRIDGE:TEACHER:EMP-ACAD-001:Clara Oswald:Academic')}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800"
                >
                  Scan Teacher
                </button>
                <button
                  onClick={() => processDecodedQR('OAKRIDGE:FEE:INV-2026-00001:AMT_3500')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800"
                >
                  Scan Fee Receipt
                </button>
                <button
                  onClick={() => processDecodedQR('OAKRIDGE:LIBRARY:BK-1001:The C Programming Language')}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800"
                >
                  Scan Library Book
                </button>
              </div>
            </div>
          </div>

          {/* Last Verified Scan Action Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Last Scanned Identification
                </h3>
                <Volume2 className="w-4 h-4 text-emerald-500" />
              </div>

              {lastScan ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {lastScan.type} Verified
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {lastScan.timestamp}
                      </span>
                    </div>

                    {lastScan.student && (
                      <div className="space-y-1">
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {lastScan.student.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lastScan.student.className} · Section {lastScan.student.section} · Roll #{lastScan.student.rollNo}
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Attendance Checked In ({selectedScanStatus})</span>
                        </div>
                      </div>
                    )}

                    {lastScan.teacher && (
                      <div className="space-y-1">
                        <div className="text-base font-bold text-slate-900 dark:text-white">
                          {lastScan.teacher.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          Faculty · {lastScan.teacher.department} · {lastScan.teacher.designation}
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Faculty On-Duty Logged</span>
                        </div>
                      </div>
                    )}

                    {lastScan.type === 'library' && (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {lastScan.bookTitle}
                        </div>
                        <div className="text-xs text-teal-600 font-semibold">
                          Book Barcode Verified · Ready to Issue/Return
                        </div>
                      </div>
                    )}

                    {lastScan.type === 'fee' && (
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Official Fee Voucher
                        </div>
                        <div className="text-xs text-emerald-600 font-semibold">
                          Receipt Reconciled in Central General Ledger
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {lastScan.student && (
                      <button
                        onClick={() => onNavigateToStudent(lastScan.student!.id)}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Open Complete Student File</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {lastScan.invoice && (
                      <button
                        onClick={() => onNavigateToInvoice(lastScan.invoice!.invoiceNo)}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <span>Open Invoice Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400 space-y-2">
                  <QrCode className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>Scan a QR code to view live verification profile and actions.</p>
                </div>
              )}
            </div>

            {/* Live Scan Log Stream */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Recent Gate &amp; Studio Scans ({scanHistory.length})
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto text-xs">
                {scanHistory.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No scans logged during this session.
                  </div>
                ) : (
                  scanHistory.map((s, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {s.student?.fullName || s.teacher?.fullName || s.bookTitle || s.rawText}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {s.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Institutional QR Generator Studio */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Configure Institutional QR Code
            </h2>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Target Entity:
                </label>
                {selectedQRType === 'student' ? (
                  <select
                    value={genTargetId}
                    onChange={(e) => setGenTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.admissionNo} · {s.className})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={genTargetId}
                    onChange={(e) => setGenTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.empNo} · {e.department})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Custom Payload Text / URL Override (Optional):
                </label>
                <textarea
                  rows={3}
                  value={genCustomData}
                  onChange={(e) => setGenCustomData(e.target.value)}
                  placeholder="Leave blank to use official standard institutional schema payload..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Active Schema Specification:
                </div>
                <p className="text-[11px] text-slate-500 font-mono break-all">
                  OAKRIDGE:{selectedQRType.toUpperCase()}:...
                </p>
              </div>
            </div>
          </div>

          {/* Generated Preview & Download */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-2xl bg-white shadow-md border border-slate-200">
              {generatedQrDataUrl ? (
                <img src={generatedQrDataUrl} alt="Institutional QR" className="w-56 h-56" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {selectedQRType} Identification QR
              </h3>
              <p className="text-xs text-slate-500">
                High error correction (Level M) · Ready for optical scanning &amp; printing
              </p>
            </div>

            <div className="flex gap-2">
              {generatedQrDataUrl && (
                <a
                  href={generatedQrDataUrl}
                  download={`oakridge_${selectedQRType}_qr.png`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </a>
              )}
              <button
                onClick={() => setActiveTab('id-cards')}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Generate ID Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Printable ID Card Studio */}
      {activeTab === 'id-cards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-500" />
              Institutional Smart ID Card &amp; Badge Studio
            </h2>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student ID Card Front */}
            <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white text-slate-900 relative">
              {/* Header with School Branding */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 p-4 text-white text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <School className="w-5 h-5 text-indigo-300" />
                  <span className="font-extrabold text-xs tracking-wider uppercase">
                    Oakridge Academy
                  </span>
                </div>
                <div className="text-[9px] text-indigo-200 uppercase tracking-widest font-bold">
                  Official Student Identity Pass
                </div>
              </div>

              {/* Student Photo & Details */}
              <div className="p-6 text-center space-y-3">
                <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden ring-4 ring-indigo-500/20 bg-slate-100 shadow-md">
                  <img
                    src={selectedStudentForCard?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedStudentForCard?.fullName}
                  </h3>
                  <div className="text-xs font-mono font-bold text-indigo-600">
                    {selectedStudentForCard?.admissionNo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                  <div>
                    <span className="text-slate-400">Class:</span>{' '}
                    <strong>{selectedStudentForCard?.className}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Section:</span>{' '}
                    <strong>{selectedStudentForCard?.section}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Emergency:</span>{' '}
                    <strong>{selectedStudentForCard?.parentPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Session:</span>{' '}
                    <strong>2025-2026</strong>
                  </div>
                </div>

                {/* QR Code */}
                {generatedQrDataUrl && (
                  <div className="pt-2 flex flex-col items-center">
                    <img src={generatedQrDataUrl} alt="QR" className="w-24 h-24" />
                    <span className="text-[9px] font-mono text-slate-400 mt-1">
                      SCAN FOR GATE PASS &amp; ATTENDANCE
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-100 p-2 text-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                Property of Oakridge International Academy &amp; College
              </div>
            </div>

            {/* Teacher / Staff ID Card */}
            <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white text-slate-900 relative">
              <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-4 text-white text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-300" />
                  <span className="font-extrabold text-xs tracking-wider uppercase">
                    Oakridge Academy
                  </span>
                </div>
                <div className="text-[9px] text-purple-200 uppercase tracking-widest font-bold">
                  Faculty &amp; Staff Access Pass
                </div>
              </div>

              <div className="p-6 text-center space-y-3">
                <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden ring-4 ring-purple-500/20 bg-slate-100 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
                    alt="Teacher"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedTeacherForCard?.fullName}
                  </h3>
                  <div className="text-xs font-mono font-bold text-purple-600">
                    {selectedTeacherForCard?.empNo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                  <div>
                    <span className="text-slate-400">Department:</span>{' '}
                    <strong>{selectedTeacherForCard?.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Position:</span>{' '}
                    <strong>{selectedTeacherForCard?.designation}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Duty:</span>{' '}
                    <strong>Senior High STEM</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Access:</span>{' '}
                    <strong>All Wings &amp; Labs</strong>
                  </div>
                </div>

                {generatedQrDataUrl && (
                  <div className="pt-2 flex flex-col items-center">
                    <img src={generatedQrDataUrl} alt="QR" className="w-24 h-24" />
                    <span className="text-[9px] font-mono text-slate-400 mt-1">
                      FACULTY ROSTER CHECK-IN QR
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-100 p-2 text-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                Authorized Executive Staff Credential
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Bulk QR Generation */}
      {activeTab === 'bulk' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Bulk QR Code Generator
              </h2>
              <p className="text-xs text-slate-500">
                Generate and export batch QR cards for an entire class roster, faculty department, or library book collection.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
              >
                <option value="students">All Enrolled Students ({students.length})</option>
                <option value="teachers">All Faculty &amp; Staff ({employees.length})</option>
                <option value="books">Library Catalog Books</option>
              </select>

              <button
                onClick={handleGenerateBulk}
                disabled={isGeneratingBulk}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingBulk ? 'Generating Batch...' : 'Generate Batch'}</span>
              </button>
            </div>
          </div>

          {bulkGeneratedList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Generated <strong>{bulkGeneratedList.length}</strong> printable badges:</span>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Complete Sheet
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {bulkGeneratedList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2"
                  >
                    <img src={item.qrUrl} alt={item.name} className="w-24 h-24 mx-auto bg-white p-1 rounded" />
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {item.id}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
