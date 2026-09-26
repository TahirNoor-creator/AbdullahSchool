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
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Student, FeeInvoice, FeePayment, AttendanceRecord } from '../types/erp';

interface QRScannerViewProps {
  students: Student[];
  invoices: FeeInvoice[];
  payments: FeePayment[];
  onMarkAttendancePresent: (student: Student) => void;
  onNavigateToStudent: (studentId: string) => void;
  onNavigateToInvoice: (invoiceNo: string) => void;
}

export interface ScanResult {
  rawText: string;
  type: 'student' | 'invoice' | 'receipt' | 'unknown';
  student?: Student;
  invoice?: FeeInvoice;
  payment?: FeePayment;
  timestamp: string;
  attendanceMarked?: boolean;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  students,
  invoices,
  payments,
  onMarkAttendancePresent,
  onNavigateToStudent,
  onNavigateToInvoice,
}) => {
  const [activeMode, setActiveMode] = useState<'scan' | 'generate'>('scan');
  const [scanType, setScanType] = useState<'attendance' | 'verify' | 'pos'>('attendance');

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Scan result state
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [beepFeedback, setBeepFeedback] = useState(false);

  // Generator state
  const [genTargetType, setGenTargetType] = useState<'student' | 'invoice' | 'receipt' | 'custom'>('student');
  const [genSelectedId, setGenSelectedId] = useState<string>(students[0]?.id || '');
  const [genCustomText, setGenCustomText] = useState('');
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');

  // Audio Beep generator for scan feedback
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  };

  // Process decoded string
  const handleDecodedText = (text: string) => {
    if (!text) return;
    const clean = text.trim();

    // Check if duplicate of last scan in last 2 seconds
    if (lastScan && lastScan.rawText === clean && Date.now() - new Date(lastScan.timestamp).getTime() < 2000) {
      return;
    }

    playBeep();
    setBeepFeedback(true);
    setTimeout(() => setBeepFeedback(false), 800);

    const nowStr = new Date().toLocaleTimeString();
    let result: ScanResult = {
      rawText: clean,
      type: 'unknown',
      timestamp: nowStr,
    };

    // Check if Student ID or Admission No (STU-XXXXX or stu-xxx)
    const matchedStudent = students.find(
      (s) =>
        s.admissionNo.toLowerCase() === clean.toLowerCase() ||
        s.id.toLowerCase() === clean.toLowerCase() ||
        clean.toLowerCase().includes(s.admissionNo.toLowerCase())
    );

    if (matchedStudent) {
      result.type = 'student';
      result.student = matchedStudent;

      if (scanType === 'attendance') {
        onMarkAttendancePresent(matchedStudent);
        result.attendanceMarked = true;
      }
    } else {
      // Check if Invoice (INV-XXXXX)
      const matchedInvoice = invoices.find(
        (inv) =>
          inv.invoiceNo.toLowerCase() === clean.toLowerCase() ||
          clean.toLowerCase().includes(inv.invoiceNo.toLowerCase())
      );
      if (matchedInvoice) {
        result.type = 'invoice';
        result.invoice = matchedInvoice;
      } else {
        // Check if Receipt (REC-XXXXX)
        const matchedPayment = payments.find(
          (p) =>
            p.receiptNo.toLowerCase() === clean.toLowerCase() ||
            clean.toLowerCase().includes(p.receiptNo.toLowerCase())
        );
        if (matchedPayment) {
          result.type = 'receipt';
          result.payment = matchedPayment;
        }
      }
    }

    setLastScan(result);
    setScanHistory((prev) => [result, ...prev.slice(0, 19)]);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Could not access device camera.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Continuous frame scanner via requestAnimationFrame & jsQR
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          handleDecodedText(code.data);
        }
      }
    }
    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // File Upload Scanner
  const handleUploadQRImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleDecodedText(code.data);
          } else {
            alert('No valid QR code recognized in the uploaded image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Generate QR Code
  useEffect(() => {
    let payload = '';
    if (genTargetType === 'student') {
      const s = students.find((item) => item.id === genSelectedId) || students[0];
      payload = s ? s.admissionNo : 'STU-2026-00001';
    } else if (genTargetType === 'invoice') {
      const inv = invoices.find((item) => item.id === genSelectedId) || invoices[0];
      payload = inv ? inv.invoiceNo : 'INV-2026-00001';
    } else if (genTargetType === 'receipt') {
      const rec = payments[0];
      payload = rec ? rec.receiptNo : 'REC-2026-00001';
    } else {
      payload = genCustomText || 'OAKRIDGE-ACADEMY-VISITOR-GATE-PASS';
    }

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setGeneratedQrUrl(url))
      .catch((err) => console.error('QR generate error:', err));
  }, [genTargetType, genSelectedId, genCustomText, students, invoices, payments]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-500" />
            Institutional QR Scanner &amp; Generator Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time optical scanner for student ID gate check-in, fee receipts, visitor badges, and high-res barcode generation.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveMode('scan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'scan'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Live Optical Scanner
          </button>
          <button
            onClick={() => {
              setActiveMode('generate');
              stopCamera();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'generate'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            QR Generator Studio
          </button>
        </div>
      </div>

      {activeMode === 'scan' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Viewport (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Scan Mode Selector */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Scanner Action Mode:
              </span>
              <button
                onClick={() => setScanType('attendance')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  scanType === 'attendance'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Morning Gate Attendance</span>
              </button>
              <button
                onClick={() => setScanType('verify')}
                className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  scanType === 'verify'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify ID / Receipt</span>
              </button>
            </div>

            {/* Video Viewport Box */}
            <div className="relative rounded-2xl bg-black overflow-hidden aspect-video flex items-center justify-center border-2 border-slate-200 dark:border-slate-800 shadow-xl">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Target Graphic */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-indigo-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner Reticles */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce mt-24"></div>
                  </div>
                </div>
              )}

              {/* Offline / Placeholder Overlay */}
              {!isCameraActive && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 text-white">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">Optical Camera Inactive</h2>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Activate your webcam or device camera to begin continuous real-time QR identification.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Launch Camera Scanner</span>
                  </button>
                  {cameraError && (
                    <div className="text-rose-400 text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Beep Feedback Glow */}
              {beepFeedback && (
                <div className="absolute inset-0 bg-emerald-500/30 pointer-events-none transition-opacity duration-200"></div>
              )}
            </div>

            {/* Quick Actions & Upload Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {isCameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold border border-rose-200 dark:border-rose-900 hover:bg-rose-100"
                  >
                    Stop Camera
                  </button>
                ) : (
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  >
                    Start Camera
                  </button>
                )}

                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Scan Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadQRImage}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Simulation shortcuts for rapid testing */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="font-semibold">Simulate:</span>
                <button
                  onClick={() => handleDecodedText('STU-2026-00001')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 font-mono"
                  title="Simulate Alexander Wright scan"
                >
                  STU-001
                </button>
                <button
                  onClick={() => handleDecodedText('STU-2026-00002')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 font-mono"
                  title="Simulate Sophia Martinez scan"
                >
                  STU-002
                </button>
                <button
                  onClick={() => handleDecodedText('REC-2026-00001')}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 font-mono"
                  title="Simulate Receipt scan"
                >
                  REC-001
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Scan Results & ID Card Verification Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {lastScan ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> QR Decoded ({lastScan.timestamp})
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {lastScan.rawText}
                  </span>
                </div>

                {/* Case 1: Student Record */}
                {lastScan.student && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 ring-2 ring-indigo-500/20">
                        {lastScan.student.avatarUrl ? (
                          <img
                            src={lastScan.student.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                            {lastScan.student.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {lastScan.student.fullName}
                        </h3>
                        <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {lastScan.student.admissionNo} · Roll: {lastScan.student.rollNo}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lastScan.student.className} ({lastScan.student.section}) · {lastScan.student.campusName}
                        </p>
                      </div>
                    </div>

                    {lastScan.attendanceMarked && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Daily Gate Attendance Marked: PRESENT (Logged to Firestore)</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Parent</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {lastScan.student.parentName}
                        </div>
                        <div className="text-[10px] text-slate-500">{lastScan.student.parentPhone}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Fee Status</span>
                        <div className="font-bold">
                          {lastScan.student.feesDue > 0 ? (
                            <span className="text-rose-500">${lastScan.student.feesDue} Outstanding</span>
                          ) : (
                            <span className="text-emerald-600">Account Clear</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToStudent(lastScan.student!.id)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    >
                      Open Full Student Academic Profile →
                    </button>
                  </div>
                )}

                {/* Case 2: Fee Invoice */}
                {lastScan.invoice && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                      <div className="font-bold text-sky-900 dark:text-sky-200 text-sm">
                        {lastScan.invoice.title}
                      </div>
                      <div className="text-slate-500">Student: {lastScan.invoice.studentName}</div>
                    </div>
                    <div className="flex justify-between font-mono font-bold text-sm">
                      <span>Total Billed:</span>
                      <span>${lastScan.invoice.totalAmount}</span>
                    </div>
                    <div className="flex justify-between font-mono text-emerald-600 font-bold">
                      <span>Amount Paid:</span>
                      <span>${lastScan.invoice.paidAmount}</span>
                    </div>
                    <div className="flex justify-between font-mono text-rose-500 font-bold">
                      <span>Balance Remaining:</span>
                      <span>${lastScan.invoice.balance}</span>
                    </div>
                  </div>
                )}

                {/* Case 3: Receipt */}
                {lastScan.payment && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                        Verified Fee Receipt #{lastScan.payment.receiptNo}
                      </div>
                      <div className="text-slate-500">Issued to: {lastScan.payment.studentName}</div>
                    </div>
                    <div className="flex justify-between font-mono font-bold text-base text-emerald-600">
                      <span>Settled:</span>
                      <span>${lastScan.payment.amount}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Method: {lastScan.payment.paymentMethod} · Date: {lastScan.payment.paymentDate}
                    </div>
                  </div>
                )}

                {lastScan.type === 'unknown' && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
                    <div className="font-bold">Unrecognized Barcode Format</div>
                    <div className="font-mono mt-1 text-[11px] break-all">{lastScan.rawText}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Awaiting Scan</h3>
                <p className="text-xs text-slate-400">
                  Point the camera at any Student ID card, Fee Invoice, or Receipt barcode to automatically parse credentials.
                </p>
              </div>
            )}

            {/* Scan History Log */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Recent Gate Scans</span>
                <span className="text-[10px] text-slate-400">{scanHistory.length} Recorded</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {scanHistory.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-[11px]">No scans recorded in this session.</div>
                ) : (
                  scanHistory.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.student?.fullName || item.invoice?.invoiceNo || item.payment?.receiptNo || item.rawText}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.type.toUpperCase()} · {item.timestamp}
                        </div>
                      </div>
                      {item.attendanceMarked && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Checked-In
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* GENERATOR STUDIO */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Barcode &amp; QR Generator
            </h2>
            <p className="text-xs text-slate-500">
              Generate scannable credentials for student ID badges, fee invoices, visitor permits, or library books.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Target Entity</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setGenTargetType('student')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      genTargetType === 'student'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Student ID
                  </button>
                  <button
                    onClick={() => setGenTargetType('invoice')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      genTargetType === 'invoice'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Fee Invoice
                  </button>
                  <button
                    onClick={() => setGenTargetType('receipt')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      genTargetType === 'receipt'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Fee Receipt
                  </button>
                  <button
                    onClick={() => setGenTargetType('custom')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      genTargetType === 'custom'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Custom Text
                  </button>
                </div>
              </div>

              {genTargetType === 'student' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Select Enrolled Student</label>
                  <select
                    value={genSelectedId}
                    onChange={(e) => setGenSelectedId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.admissionNo} · {s.fullName} ({s.className})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {genTargetType === 'invoice' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Select Invoice</label>
                  <select
                    value={genSelectedId}
                    onChange={(e) => setGenSelectedId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  >
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNo} · {inv.studentName} (${inv.totalAmount})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {genTargetType === 'custom' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Custom String Payload</label>
                  <input
                    type="text"
                    placeholder="e.g. VISITOR-GATE-PASS-NORTH-WING-2026"
                    value={genCustomText}
                    onChange={(e) => setGenCustomText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* QR Preview Card (5 Cols) */}
          <div className="md:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
              {generatedQrUrl ? (
                <img src={generatedQrUrl} alt="QR Code" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 bg-slate-100 flex items-center justify-center text-slate-400">
                  Generating...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Scannable Institutional QR
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Payload format: {genTargetType === 'student' ? 'STU-2026-XXXXX' : genTargetType}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={generatedQrUrl}
                download="oakridge_academy_qr.png"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
