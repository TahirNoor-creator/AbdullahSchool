import React, { useState } from 'react';
import {
  Building,
  Plus,
  Users,
  MapPin,
  Phone,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Campus, Student } from '../types/erp';

interface MultiCampusViewProps {
  campuses: Campus[];
  students: Student[];
  onAddCampus: (campus: Omit<Campus, 'id'>) => void;
}

export const MultiCampusView: React.FC<MultiCampusViewProps> = ({
  campuses,
  students,
  onAddCampus,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [principal, setPrincipal] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    onAddCampus({
      name,
      code,
      address,
      principal: principal || 'Campus Dean',
      phone: phone || '+1 (650) 890-4400',
      status: 'active',
      studentCount: 0,
    });

    setName('');
    setCode('');
    setAddress('');
    setPrincipal('');
    setPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-500" />
            Multi-Campus Infrastructure Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Centrally manage branch campuses, specialized STEM wings, and downtown satellite academies.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Campus</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campuses.map((campus) => {
          const count = students.filter((s) => s.campusId === campus.id).length;
          return (
            <div
              key={campus.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {campus.code}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active Branch
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{campus.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-1">{campus.address}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Principal</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{campus.principal}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled</span>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{count} Students</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Register Branch Campus</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Campus Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Coast Innovation Wing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Campus Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAMP-WEST"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Campus Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (650) 890-4490"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Branch Principal / Dean</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Street Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
