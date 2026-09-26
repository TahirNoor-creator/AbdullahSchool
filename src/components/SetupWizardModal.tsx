import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  School,
  Building,
  ShieldCheck,
  HardDrive,
  FileSpreadsheet,
  Bell,
  Activity,
} from 'lucide-react';
import { SchoolProfile } from '../types/erp';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  onComplete: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  schoolProfile,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 12;

  if (!isOpen) return null;

  const steps = [
    { num: 1, title: 'School Information', desc: 'Institution profile, address, and registration number' },
    { num: 2, title: 'Academic Session', desc: 'Define active academic calendar and term dates' },
    { num: 3, title: 'Campus Configuration', desc: 'Add primary campus, STEM wing, or branch centers' },
    { num: 4, title: 'Administrator User', desc: 'Verify super admin credentials and authorization' },
    { num: 5, title: 'Google Sheets Connection', desc: 'Sync student directory and fee ledgers' },
    { num: 6, title: 'Google Drive Storage', desc: 'Configure document repository folder for reports' },
    { num: 7, title: 'Default Roles Hierarchy', desc: 'Super Admin, Principal, Accountant, Teacher, Parent' },
    { num: 8, title: 'Granular Permissions', desc: 'Configure server-enforced access controls' },
    { num: 9, title: 'Smart Numbering Sequences', desc: 'STU-2026-XXXXX, INV-2026-XXXXX, REC-2026-XXXXX' },
    { num: 10, title: 'Automated Backup Schedule', desc: 'Configure daily database safety snapshot retention' },
    { num: 11, title: 'Notification Channels', desc: 'In-App notices and verified Gmail delivery' },
    { num: 12, title: 'Final System Health Check', desc: 'Complete end-to-end operational verification' },
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const cur = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              ERP Initial Setup Wizard ({currentStep}/{totalSteps})
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>{cur.title}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              {currentStep}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{cur.title}</h3>
              <p className="text-xs text-slate-500">{cur.desc}</p>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Step pre-configured according to institutional profile.</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Configurations are automatically committed to Cloud Firestore and verified by backend validators.
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={nextStep}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <span>{currentStep === totalSteps ? 'Complete Setup' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
