import React, { useState } from 'react';
import {
  Bus,
  MapPin,
  Users,
  Plus,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Calendar,
  DollarSign,
  Fuel,
  Navigation,
  X,
} from 'lucide-react';
import { Student } from '../types/erp';

export interface Vehicle {
  id: string;
  vehicleNo: string;
  model: string;
  capacity: number;
  assignedDriver: string;
  driverPhone: string;
  gpsStatus: 'Active' | 'Offline';
  fuelType: 'Diesel' | 'Electric' | 'CNG';
  insuranceExpiry: string;
  status: 'In Service' | 'Maintenance' | 'Standby';
}

export interface Route {
  id: string;
  name: string;
  vehicleNo: string;
  startPoint: string;
  endPoint: string;
  stopsCount: number;
  monthlyFee: number;
  allocatedStudents: number;
  status: 'Active' | 'Modified';
}

export interface TransportAllocation {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  routeId: string;
  routeName: string;
  vehicleNo: string;
  pickupStop: string;
  pickupTime: string;
  feeStatus: 'Paid' | 'Pending';
}

interface TransportViewProps {
  students: Student[];
  onExportToSheet?: (title: string, headers: string[], rows: (string | number)[][]) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const TransportView: React.FC<TransportViewProps> = ({
  students,
  onExportToSheet,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'routes' | 'allocations'>('vehicles');
  const [searchQuery, setSearchQuery] = useState('');

  // Fleet
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'veh-1',
      vehicleNo: 'BUS-01 (Oakridge Express)',
      model: 'Mercedes-Benz Sprinter 516',
      capacity: 32,
      assignedDriver: 'Michael Higgins',
      driverPhone: '+1 (555) 234-9811',
      gpsStatus: 'Active',
      fuelType: 'Diesel',
      insuranceExpiry: '2026-03-15',
      status: 'In Service',
    },
    {
      id: 'veh-2',
      vehicleNo: 'BUS-02 (North Hub Liner)',
      model: 'Blue Bird All American RE',
      capacity: 48,
      assignedDriver: 'Carlos Mendez',
      driverPhone: '+1 (555) 872-3341',
      gpsStatus: 'Active',
      fuelType: 'CNG',
      insuranceExpiry: '2026-06-30',
      status: 'In Service',
    },
    {
      id: 'veh-3',
      vehicleNo: 'VAN-03 (Highland Shuttle)',
      model: 'Ford Transit Passenger Van',
      capacity: 18,
      assignedDriver: 'David Kowalski',
      driverPhone: '+1 (555) 431-7782',
      gpsStatus: 'Offline',
      fuelType: 'Electric',
      insuranceExpiry: '2025-11-20',
      status: 'Maintenance',
    },
  ]);

  // Routes
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: 'rt-1',
      name: 'Route 1: Downtown Metro & Central Station',
      vehicleNo: 'BUS-01 (Oakridge Express)',
      startPoint: 'Union Metro Square',
      endPoint: 'Oakridge Main Campus',
      stopsCount: 8,
      monthlyFee: 120,
      allocatedStudents: 28,
      status: 'Active',
    },
    {
      id: 'rt-2',
      name: 'Route 2: North Ridge & Pine Hills',
      vehicleNo: 'BUS-02 (North Hub Liner)',
      startPoint: 'Pine Hills Terminal',
      endPoint: 'Oakridge North Branch',
      stopsCount: 12,
      monthlyFee: 140,
      allocatedStudents: 42,
      status: 'Active',
    },
    {
      id: 'rt-3',
      name: 'Route 3: West Suburban Estates',
      vehicleNo: 'VAN-03 (Highland Shuttle)',
      startPoint: 'Westgate Park Plaza',
      endPoint: 'Oakridge Main Campus',
      stopsCount: 5,
      monthlyFee: 110,
      allocatedStudents: 15,
      status: 'Active',
    },
  ]);

  // Student Allocations
  const [allocations, setAllocations] = useState<TransportAllocation[]>([
    {
      id: 'alc-1',
      studentId: 'STD-1001',
      studentName: 'Alexander Hayes',
      className: 'Grade 10-A',
      routeId: 'rt-1',
      routeName: 'Route 1: Downtown Metro',
      vehicleNo: 'BUS-01',
      pickupStop: 'Central Station Gate 3',
      pickupTime: '07:15 AM',
      feeStatus: 'Paid',
    },
    {
      id: 'alc-2',
      studentId: 'STD-1002',
      studentName: 'Sophia Miller',
      className: 'Grade 10-A',
      routeId: 'rt-1',
      routeName: 'Route 1: Downtown Metro',
      vehicleNo: 'BUS-01',
      pickupStop: '5th Avenue Crossing',
      pickupTime: '07:25 AM',
      feeStatus: 'Paid',
    },
    {
      id: 'alc-3',
      studentId: 'STD-1003',
      studentName: 'Liam Sterling',
      className: 'Grade 9-B',
      routeId: 'rt-2',
      routeName: 'Route 2: North Ridge',
      vehicleNo: 'BUS-02',
      pickupStop: 'Pine Hills Mall Stop',
      pickupTime: '07:05 AM',
      feeStatus: 'Pending',
    },
  ]);

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);

  // New Vehicle State
  const [vehNo, setVehNo] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehCapacity, setVehCapacity] = useState(30);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // New Route State
  const [rtName, setRtName] = useState('');
  const [rtStart, setRtStart] = useState('');
  const [rtEnd, setRtEnd] = useState('');
  const [rtFee, setRtFee] = useState(120);
  const [rtVeh, setRtVeh] = useState('');

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehNo.trim() || !driverName.trim()) return;

    const newV: Vehicle = {
      id: `veh-${Date.now()}`,
      vehicleNo: vehNo.trim(),
      model: vehModel.trim() || 'School Bus Standard',
      capacity: Number(vehCapacity),
      assignedDriver: driverName.trim(),
      driverPhone: driverPhone.trim() || '+1 (555) 000-0000',
      gpsStatus: 'Active',
      fuelType: 'Diesel',
      insuranceExpiry: '2026-12-31',
      status: 'In Service',
    };

    setVehicles([newV, ...vehicles]);
    setShowAddVehicleModal(false);
    onShowToast?.('success', 'Vehicle Enrolled', `Registered ${newV.vehicleNo} with driver ${newV.assignedDriver}.`);
    setVehNo('');
    setDriverName('');
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtName.trim()) return;

    const newR: Route = {
      id: `rt-${Date.now()}`,
      name: rtName.trim(),
      vehicleNo: rtVeh || vehicles[0]?.vehicleNo || 'BUS-01',
      startPoint: rtStart.trim() || 'Central Terminal',
      endPoint: rtEnd.trim() || 'Oakridge Campus',
      stopsCount: 6,
      monthlyFee: Number(rtFee),
      allocatedStudents: 0,
      status: 'Active',
    };

    setRoutes([newR, ...routes]);
    setShowAddRouteModal(false);
    onShowToast?.('success', 'Route Configured', `Added route: ${newR.name}`);
    setRtName('');
  };

  const handleExportManifest = () => {
    if (onExportToSheet) {
      onExportToSheet(
        'Transport Passenger Manifest',
        ['Student ID', 'Student Name', 'Class', 'Route', 'Vehicle', 'Pickup Stop', 'Pickup Time', 'Fee Status'],
        allocations.map((a) => [a.studentId, a.studentName, a.className, a.routeName, a.vehicleNo, a.pickupStop, a.pickupTime, a.feeStatus])
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-900/30 via-orange-900/20 to-indigo-900/20 border border-slate-200 dark:border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Bus className="w-4 h-4" />
            <span>Campus Transport &amp; Fleet Operations</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Transport Fleet, Routes &amp; Student Allocations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time GPS status, designated bus stops, morning/afternoon schedules, and transport fee billing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddRouteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Create Route</span>
          </button>
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
          {onExportToSheet && (
            <button
              onClick={handleExportManifest}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Export Manifest</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Total Fleet Vehicles</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{vehicles.length}</div>
          <div className="text-[10px] text-emerald-500 font-medium mt-1">
            {vehicles.filter((v) => v.status === 'In Service').length} currently in service
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Active Bus Routes</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{routes.length}</div>
          <div className="text-[10px] text-indigo-500 font-medium mt-1">Covering 25 pick-up stops</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">Transport Enrolled Students</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {routes.reduce((acc, r) => acc + r.allocatedStudents, 0)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">86% fleet seat utilization</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400">GPS Tracker Status</div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {vehicles.filter((v) => v.gpsStatus === 'Active').length} / {vehicles.length}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1">Real-time telematics linked</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'vehicles'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Vehicle Fleet ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'routes'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Routes &amp; Stops ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`py-3 px-1 border-b-2 transition-all ${
            activeTab === 'allocations'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Student Manifest ({allocations.length})
        </button>
      </div>

      {/* TAB 1: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Vehicle Code &amp; Model</th>
                <th className="p-3.5">Seating Capacity</th>
                <th className="p-3.5">Assigned Driver &amp; Contact</th>
                <th className="p-3.5">Fuel &amp; GPS</th>
                <th className="p-3.5">Insurance Expiry</th>
                <th className="p-3.5 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bus className="w-4 h-4 text-amber-500" />
                      <span>{v.vehicleNo}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{v.model}</div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{v.capacity} Seats</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{v.assignedDriver}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{v.driverPhone}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {v.fuelType}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.gpsStatus === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        GPS: {v.gpsStatus}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{v.insuranceExpiry}</td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === 'In Service'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ROUTES */}
      {activeTab === 'routes' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Route Name</th>
                <th className="p-3.5">Assigned Vehicle</th>
                <th className="p-3.5">Starting Point &amp; Destination</th>
                <th className="p-3.5">Stops</th>
                <th className="p-3.5">Monthly Fee</th>
                <th className="p-3.5 text-right">Allocated Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {routes.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{r.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">{r.vehicleNo}</td>
                  <td className="p-3.5">
                    <div className="text-slate-800 dark:text-slate-200 font-semibold">{r.startPoint}</div>
                    <div className="text-[10px] text-slate-400">To {r.endPoint}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{r.stopsCount} Designated Stops</td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">${r.monthlyFee}/month</td>
                  <td className="p-3.5 text-right font-bold text-slate-900 dark:text-white">
                    {r.allocatedStudents} Students
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Student Name &amp; ID</th>
                <th className="p-3.5">Class</th>
                <th className="p-3.5">Assigned Route</th>
                <th className="p-3.5">Pickup Stop</th>
                <th className="p-3.5">Pickup Time</th>
                <th className="p-3.5 text-right">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allocations.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{a.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{a.studentId}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{a.className}</td>
                  <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">{a.routeName}</td>
                  <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{a.pickupStop}</span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{a.pickupTime}</td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.feeStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {a.feeStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-4 h-4 text-amber-500" />
                <span>Register Transport Vehicle</span>
              </h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Vehicle Plate / Code</label>
                <input
                  type="text"
                  value={vehNo}
                  onChange={(e) => setVehNo(e.target.value)}
                  placeholder="e.g. BUS-04 (West Express)"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Make &amp; Model</label>
                <input
                  type="text"
                  value={vehModel}
                  onChange={(e) => setVehModel(e.target.value)}
                  placeholder="e.g. Ford Transit Bus"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    min={5}
                    value={vehCapacity}
                    onChange={(e) => setVehCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver Full Name"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Driver Contact Phone</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs mt-2"
              >
                Register Vehicle in Fleet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROUTE MODAL */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-500" />
                <span>Configure Transport Route</span>
              </h3>
              <button onClick={() => setShowAddRouteModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Route Name</label>
                <input
                  type="text"
                  value={rtName}
                  onChange={(e) => setRtName(e.target.value)}
                  placeholder="e.g. Route 4: Eastern Boulevard"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Starting Point</label>
                  <input
                    type="text"
                    value={rtStart}
                    onChange={(e) => setRtStart(e.target.value)}
                    placeholder="Terminal or Plaza"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Destination</label>
                  <input
                    type="text"
                    value={rtEnd}
                    onChange={(e) => setRtEnd(e.target.value)}
                    placeholder="School Campus"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Monthly Fee ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={rtFee}
                    onChange={(e) => setRtFee(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Assign Vehicle</label>
                  <select
                    value={rtVeh}
                    onChange={(e) => setRtVeh(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNo}>
                        {v.vehicleNo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-2"
              >
                Create Transport Route
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
