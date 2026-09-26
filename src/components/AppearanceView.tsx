import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Sliders,
  Eye,
  School,
} from 'lucide-react';
import { SchoolProfile } from '../types/erp';

interface AppearanceViewProps {
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  schoolProfile: SchoolProfile;
  onUpdateSchoolProfile: (profile: Partial<SchoolProfile>) => void;
}

export const AppearanceView: React.FC<AppearanceViewProps> = ({
  theme,
  onToggleTheme,
  schoolProfile,
  onUpdateSchoolProfile,
}) => {
  const [primaryColor, setPrimaryColor] = useState('indigo');
  const [compactMode, setCompactMode] = useState(false);
  const [schoolName, setSchoolName] = useState(schoolProfile.schoolName);
  const [schoolCode, setSchoolCode] = useState(schoolProfile.schoolCode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const colors = [
    { name: 'Indigo (Default)', value: 'indigo', class: 'bg-indigo-600' },
    { name: 'Blue (Corporate)', value: 'blue', class: 'bg-blue-600' },
    { name: 'Emerald (Academic)', value: 'emerald', class: 'bg-emerald-600' },
    { name: 'Purple (Modern)', value: 'purple', class: 'bg-purple-600' },
    { name: 'Slate (Monochrome)', value: 'slate', class: 'bg-slate-700' },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolProfile({
      schoolName,
      schoolCode,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-500" />
            Appearance Studio &amp; School Branding
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize themes, institutional color accents, compact viewport modes, and official school branding.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Branding and appearance settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme & Palette */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Theme Mode</h2>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onToggleTheme('light')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => onToggleTheme('dark')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-slate-800 text-indigo-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => onToggleTheme('system')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 ${
                  theme === 'system'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500'
                }`}
              >
                <Laptop className="w-5 h-5 text-slate-400" />
                <span>System</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Primary Accent Color</h2>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setPrimaryColor(c.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    primaryColor === c.value
                      ? 'border-indigo-600 bg-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${c.class}`}></span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* School Branding Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-500" />
              School Profile &amp; Identifiers
            </h2>
            <p className="text-xs text-slate-500">
              Displayed on generated documents, fee receipts, student report cards, and email headers.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Official Institution Name</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Institutional School Code</label>
              <input
                type="text"
                required
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Save Branding Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
