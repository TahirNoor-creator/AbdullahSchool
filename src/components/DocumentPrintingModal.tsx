import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  School,
  CheckCircle2,
  Download,
  QrCode,
} from 'lucide-react';
import QRCode from 'qrcode';
import { SchoolProfile, FeePayment, Student, PayrollRecord } from '../types/erp';

interface DocumentPrintingModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'receipt' | 'id-card' | 'report-card' | 'salary-slip' | 'certificate';
  data: any;
  schoolProfile: SchoolProfile;
}

export const DocumentPrintingModal: React.FC<DocumentPrintingModalProps> = ({
  isOpen,
  onClose,
  documentType,
  data,
  schoolProfile,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A5' | 'Thermal'>('A4');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let payload = '';
    if (documentType === 'receipt') {
      payload = data?.receiptNo || 'REC-2026-00001';
    } else if (documentType === 'id-card' || documentType === 'report-card' || documentType === 'certificate') {
      payload = data?.admissionNo || 'STU-2026-00001';
    } else if (documentType === 'salary-slip') {
      payload = data?.slipNo || 'PAY-2026-00001';
    }

    if (payload) {
      QRCode.toDataURL(payload, { width: 140, margin: 1 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating document QR:', err));
    }
  }, [documentType, data]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Controls Toolbar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Document &amp; Printing Studio — {documentType.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold outline-none"
            >
              <option value="A4">Standard A4</option>
              <option value="A5">Compact A5</option>
              <option value="Thermal">Thermal Receipt (80mm)</option>
            </select>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-6 rounded-xl flex justify-center">
          <div
            id="printable-area"
            className={`bg-white text-slate-900 shadow-md p-8 rounded-lg space-y-6 ${
              paperSize === 'Thermal' ? 'w-[320px] text-[11px]' : paperSize === 'A5' ? 'w-[440px] text-xs' : 'w-[580px] text-xs'
            }`}
          >
            {/* School Header */}
            <div className="text-center border-b-2 border-indigo-900 pb-4 space-y-1">
              <div className="flex items-center justify-center gap-2 text-indigo-900">
                <School className="w-6 h-6" />
                <h1 className="text-base font-black tracking-tight">{schoolProfile.schoolName}</h1>
              </div>
              <p className="text-[10px] text-slate-500">
                {schoolProfile.address} · Tel: {schoolProfile.phone}
              </p>
              <div className="text-[9px] font-mono text-slate-400">
                School Code: {schoolProfile.schoolCode} · Registration: {schoolProfile.registrationNo}
              </div>
            </div>

            {/* Document Body depending on Type */}
            {documentType === 'receipt' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 rounded-md">
                    Official Fee Receipt
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y py-3">
                  <div>
                    <span className="text-slate-500 text-[10px]">Receipt Number:</span>
                    <div className="font-mono font-bold">{data?.receiptNo || 'REC-2026-00001'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Date of Issue:</span>
                    <div className="font-mono font-bold">{data?.paymentDate || '2026-09-24'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Received From:</span>
                    <div className="font-bold">{data?.studentName || 'Alexander Liam Wright'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Payment Method:</span>
                    <div className="font-bold">{data?.paymentMethod || 'Online Transfer'}</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700">Total Amount Settled:</span>
                    <div className="text-lg font-black text-indigo-900 font-mono">
                      ${data?.amount?.toLocaleString() || '3,500.00'}
                    </div>
                  </div>
                  {qrCodeUrl && (
                    <div className="text-center">
                      <img src={qrCodeUrl} alt="Receipt QR" className="w-16 h-16 object-contain mx-auto" />
                      <span className="text-[9px] font-mono text-slate-400">Scan to Verify</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {documentType === 'id-card' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-indigo-50 text-indigo-900 rounded-md">
                    Student Official Identification Pass
                  </span>
                </div>

                <div className="p-4 rounded-xl border-2 border-indigo-900/20 bg-gradient-to-br from-indigo-50/40 to-slate-50 flex items-center gap-4">
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-slate-200 border-2 border-white shadow-sm shrink-0">
                    {data?.avatarUrl ? (
                      <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        Photo
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 text-xs">
                    <h2 className="font-black text-sm text-slate-900">{data?.fullName || 'Alexander Liam Wright'}</h2>
                    <div className="font-mono text-indigo-700 font-bold">{data?.admissionNo || 'STU-2026-00001'}</div>
                    <div className="text-[11px] text-slate-600">Class: {data?.className || 'Grade 10'} ({data?.section || 'A'})</div>
                    <div className="text-[11px] text-slate-600">Roll No: {data?.rollNo || '10-A-01'}</div>
                    <div className="text-[10px] text-slate-400">Valid: 2026-2027 Academic Session</div>
                  </div>

                  {qrCodeUrl && (
                    <div className="text-center shrink-0">
                      <img src={qrCodeUrl} alt="Student QR" className="w-20 h-20 object-contain mx-auto border rounded bg-white p-1" />
                      <span className="text-[8px] font-mono font-bold text-indigo-900 block mt-0.5">Gate Scanner</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {documentType === 'report-card' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 rounded-md">
                    Academic Performance &amp; Term Report Card
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y py-2">
                  <div>Student: <span className="font-bold">{data?.fullName || 'Alexander Liam Wright'}</span></div>
                  <div>Admission No: <span className="font-mono font-bold">{data?.admissionNo || 'STU-2026-00001'}</span></div>
                  <div>Grade / Section: <span className="font-bold">{data?.className || 'Grade 10'} ({data?.section || 'A'})</span></div>
                  <div>Campus: <span className="font-bold">{data?.campusName || 'Main Heritage Campus'}</span></div>
                </div>

                <table className="w-full text-left text-xs border">
                  <thead className="bg-slate-100 border-b font-bold text-[10px]">
                    <tr>
                      <th className="p-2">Subject</th>
                      <th className="p-2">Max Marks</th>
                      <th className="p-2">Obtained</th>
                      <th className="p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr><td className="p-2">Mathematics &amp; Calculus</td><td className="p-2">100</td><td className="p-2 font-mono">96</td><td className="p-2 font-bold">A+</td></tr>
                    <tr><td className="p-2">Physics &amp; Chemistry</td><td className="p-2">100</td><td className="p-2 font-mono">94</td><td className="p-2 font-bold">A+</td></tr>
                    <tr><td className="p-2">English Literature</td><td className="p-2">100</td><td className="p-2 font-mono">91</td><td className="p-2 font-bold">A</td></tr>
                    <tr><td className="p-2">World History</td><td className="p-2">100</td><td className="p-2 font-mono">88</td><td className="p-2 font-bold">A</td></tr>
                    <tr><td className="p-2">Computer Science &amp; AI</td><td className="p-2">100</td><td className="p-2 font-mono">98</td><td className="p-2 font-bold">A+</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {documentType === 'salary-slip' && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-slate-100 rounded-md">
                    Confidential Faculty Salary Slip
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y py-2">
                  <div>Employee: <span className="font-bold">{data?.empName || 'David Higgins'}</span></div>
                  <div>Salary Slip No: <span className="font-mono font-bold">{data?.slipNo || 'PAY-2026-00003'}</span></div>
                  <div>Designation: <span className="font-bold">{data?.designation || 'Senior Faculty'}</span></div>
                  <div>Month: <span className="font-bold">{data?.month || 'August 2026'}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-slate-50 border rounded space-y-1">
                    <span className="font-bold text-[10px] text-emerald-700">Earnings</span>
                    <div className="flex justify-between"><span>Basic Pay</span><span className="font-mono">${data?.basicSalary || '6,200'}</span></div>
                    <div className="flex justify-between"><span>Allowances</span><span className="font-mono">${data?.allowances || '450'}</span></div>
                  </div>
                  <div className="p-2 bg-slate-50 border rounded space-y-1">
                    <span className="font-bold text-[10px] text-rose-700">Deductions</span>
                    <div className="flex justify-between"><span>Tax &amp; Insurance</span><span className="font-mono">${data?.deductions || '420'}</span></div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded flex justify-between font-bold text-xs text-indigo-950">
                  <span>Net Disbursed:</span>
                  <span className="font-mono text-sm">${data?.netSalary?.toLocaleString() || '6,230'}</span>
                </div>
              </div>
            )}

            {/* Official Signature and Academy Seal */}
            <div className="pt-6 border-t flex items-end justify-between text-center">
              <div className="space-y-2">
                <div className="w-20 h-10 mx-auto flex items-center justify-center italic text-slate-400 font-serif border-b">
                  Eleanor Vance
                </div>
                <div className="text-[10px] font-bold text-slate-700">{schoolProfile.principalName}</div>
                <div className="text-[9px] text-slate-400">Principal &amp; Superintendent</div>
              </div>

              <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-900/40 flex flex-col items-center justify-center text-[8px] font-bold text-indigo-950 uppercase tracking-tighter">
                <span>OFFICIAL SEAL</span>
                <span>OAKRIDGE</span>
                <span>ACADEMY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
