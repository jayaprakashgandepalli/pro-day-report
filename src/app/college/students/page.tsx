'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Phone,
  MessageCircle,
  FileCheck,
  PlusCircle,
  RefreshCw,
  GraduationCap,
  Users,
  MapPin,
  School,
  CheckCircle,
  Clock,
  Eye,
  X,
  Filter,
  UserCheck,
  ShieldCheck,
  Building,
  RotateCcw
} from 'lucide-react';

type Student = {
  id: string;
  studentName: string;
  gender: string | null;
  fatherName: string | null;
  phone: string;
  whatsapp: string | null;
  group: string;
  schoolName: string | null;
  schoolArea: string | null;
  occupation: string | null;
  address: string | null;
  district: string | null;
  mandal: string | null;
  village: string | null;
  remarks: string | null;
  marks?: string | null;
  doorstepCompleted: boolean;
  studyInterestedAt: string | null;
  educationStage: string | null;
  ableToBearFee: string | null;
  nextFollowUpType: string | null;
  nextFollowUpDate: string | null;
  visits?: any[];
  leadStatus?: string | null;
  joinedCollegeId?: string | null;
  applicationNumber?: string | null;
  admissionDate?: Date | string | null;
  createdAt: string;
  employeeId: string;
  employee?: {
    employeeId: string;
    name: string;
    role: string;
    assignedAgms?: string[];
  };
};

type FilterMeta = {
  staffList: Array<{ employeeId: string; name: string; role: string; assignedAgms?: string[] }>;
  agmsList: Array<{ employeeId: string; name: string; role: string }>;
  schoolsList: string[];
  mandalsList: string[];
  stats: {
    totalStudents: number;
    admittedCount: number;
    doorstepCount: number;
    pendingDoorstepCount: number;
    todayCount: number;
    staffCount: number;
    agmsCount: number;
  };
};

export default function CollegeStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collegeName, setCollegeName] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedMandal, setSelectedMandal] = useState('');
  const [selectedAgm, setSelectedAgm] = useState('');
  const [selectedDoorstep, setSelectedDoorstep] = useState(''); // '' | 'completed' | 'pending'
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'admitted'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Metadata & Options
  const [filterMeta, setFilterMeta] = useState<FilterMeta | null>(null);
  const [configMap, setConfigMap] = useState<Record<string, string>>({});

  // Modals State
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [admitStudent, setAdmitStudent] = useState<Student | null>(null);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [savingAdmit, setSavingAdmit] = useState(false);

  const [visitStudent, setVisitStudent] = useState<Student | null>(null);
  const [visitRemarks, setVisitRemarks] = useState('');
  const [nextFollowUpType, setNextFollowUpType] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.name) setCollegeName(data.user.name);
      })
      .catch(console.error);

    fetchConfigs();
    fetchFiltersMeta();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch students whenever filters or page change
  useEffect(() => {
    fetchStudents();
  }, [
    page,
    debouncedSearch,
    selectedStaff,
    selectedSchool,
    selectedMandal,
    selectedAgm,
    selectedDoorstep,
    selectedStatus,
  ]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        (data.configs || []).forEach((c: any) => {
          map[c.id] = c.value;
        });
        setConfigMap(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFiltersMeta = async () => {
    try {
      const res = await fetch('/api/college/students/filters');
      if (res.ok) {
        const data = await res.json();
        setFilterMeta(data);
      }
    } catch (e) {
      console.error('Failed to load filter metadata:', e);
    }
  };

  const resolveName = (id: string | null) => {
    if (!id) return 'N/A';
    return configMap[id] || id;
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const query = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearch) query.set('search', debouncedSearch);
      if (selectedStaff) query.set('staffId', selectedStaff);
      if (selectedSchool) query.set('schoolName', selectedSchool);
      if (selectedMandal) query.set('mandal', selectedMandal);
      if (selectedAgm) query.set('agmId', selectedAgm);
      if (selectedDoorstep) query.set('doorstep', selectedDoorstep);
      if (selectedStatus !== 'all') query.set('admissionStatus', selectedStatus);

      const res = await fetch(`/api/students?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setTotalStudents(data.total || 0);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / itemsPerPage) || 1);
      } else {
        setError('Failed to load students');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedStaff('');
    setSelectedSchool('');
    setSelectedMandal('');
    setSelectedAgm('');
    setSelectedDoorstep('');
    setSelectedStatus('all');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
    selectedStaff ||
    selectedSchool ||
    selectedMandal ||
    selectedAgm ||
    selectedDoorstep ||
    selectedStatus !== 'all'
  );

  // Map AGM IDs to Names
  const agmsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (filterMeta?.agmsList) {
      filterMeta.agmsList.forEach(a => {
        map[a.employeeId] = a.name;
      });
    }
    return map;
  }, [filterMeta]);

  // Handle Admission Confirmation
  const handleConfirmAdmission = async () => {
    if (!admitStudent) return;
    if (!applicationNumber.trim()) return alert('Application Number is required');

    setSavingAdmit(true);
    try {
      const res = await fetch(`/api/students/${admitStudent.id}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationNumber })
      });
      if (res.ok) {
        alert(`Student "${admitStudent.studentName}" admitted successfully!`);
        setAdmitStudent(null);
        setApplicationNumber('');
        fetchStudents();
        fetchFiltersMeta();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to admit student');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setSavingAdmit(false);
    }
  };

  // Handle Add Visit
  const handleAddVisit = async () => {
    if (!visitStudent) return;
    if (!visitRemarks.trim()) return alert('Remarks are required');
    if (nextFollowUpType === 'Date' && !nextFollowUpDate) return alert('Next follow-up date is required');

    setSavingVisit(true);
    try {
      const payload = {
        remarks: visitRemarks,
        nextFollowUpType: nextFollowUpType || null,
        nextFollowUpDate: nextFollowUpType === 'Date' ? nextFollowUpDate : null
      };

      const res = await fetch(`/api/students/${visitStudent.id}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Visit note added successfully!');
        setVisitStudent(null);
        setVisitRemarks('');
        setNextFollowUpType('');
        setNextFollowUpDate('');
        fetchStudents();
      } else {
        alert('Failed to add visit note');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setSavingVisit(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Page Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.75rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0F2B47 0%, #1e3a8a 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 4px 10px rgba(15, 43, 71, 0.25)',
          }}>
            👥
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F2B47', letterSpacing: '-0.02em' }}>
                Students Directory
              </h1>
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                padding: '0.2rem 0.65rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                College Student Pool
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              All students entered by your Field Staff, Telecallers & AGMs for <strong>{collegeName || 'Navanidhi College'}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => { fetchStudents(); fetchFiltersMeta(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1rem',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.15rem 1.35rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Total Students
            </span>
            <Users size={18} style={{ color: '#0F2B47' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.35rem' }}>
            {filterMeta?.stats.totalStudents ?? totalStudents}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Leads in College Pool
          </div>
        </div>

        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '1.15rem 1.35rem',
          borderRadius: '14px',
          border: '1px solid #bbf7d0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              Admitted
            </span>
            <GraduationCap size={18} style={{ color: '#166534' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#166534', marginTop: '0.35rem' }}>
            {filterMeta?.stats.admittedCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.15rem' }}>
            Confirmed Admissions
          </div>
        </div>

        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '1.15rem 1.35rem',
          borderRadius: '14px',
          border: '1px solid #bae6fd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              Doorsteps Done
            </span>
            <CheckCircle size={18} style={{ color: '#0369a1' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0369a1', marginTop: '0.35rem' }}>
            {filterMeta?.stats.doorstepCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.15rem' }}>
            Homes Visited by Staff
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff7ed',
          padding: '1.15rem 1.35rem',
          borderRadius: '14px',
          border: '1px solid #fed7aa',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase' }}>
              Pending Visits
            </span>
            <Clock size={18} style={{ color: '#c2410c' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#c2410c', marginTop: '0.35rem' }}>
            {filterMeta?.stats.pendingDoorstepCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ea580c', marginTop: '0.15rem' }}>
            Waiting Doorstep Outreach
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          padding: '1.15rem 1.35rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Active Staff
            </span>
            <UserCheck size={18} style={{ color: '#0F2B47' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.35rem' }}>
            {filterMeta?.stats.staffCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Field Staff & Telecallers
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter Toolbar (Staff, School, Mandal, AGM, Status, Search) */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        {/* Top Filter Controls Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '0.85rem',
          alignItems: 'center',
        }}>
          {/* Staff Wise Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              🏃 STAFF WISE:
            </label>
            <select
              value={selectedStaff}
              onChange={e => { setSelectedStaff(e.target.value); setPage(1); }}
              className="form-control"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: selectedStaff ? '2px solid #0F2B47' : '1px solid #cbd5e1',
                backgroundColor: selectedStaff ? '#eff6ff' : '#ffffff',
                fontWeight: selectedStaff ? 700 : 500,
              }}
            >
              <option value="">All Staff Members</option>
              {(filterMeta?.staffList || []).map(s => (
                <option key={s.employeeId} value={s.employeeId}>
                  {s.name} ({s.role === 'EMPLOYEE' ? 'Field Staff' : s.role === 'TELECALLER' ? 'Telecaller' : s.role})
                </option>
              ))}
            </select>
          </div>

          {/* School Wise Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              🏫 SCHOOL WISE:
            </label>
            <select
              value={selectedSchool}
              onChange={e => { setSelectedSchool(e.target.value); setPage(1); }}
              className="form-control"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: selectedSchool ? '2px solid #0F2B47' : '1px solid #cbd5e1',
                backgroundColor: selectedSchool ? '#eff6ff' : '#ffffff',
                fontWeight: selectedSchool ? 700 : 500,
              }}
            >
              <option value="">All Catchment Schools</option>
              {(filterMeta?.schoolsList || []).map(sch => (
                <option key={sch} value={sch}>
                  {resolveName(sch)}
                </option>
              ))}
            </select>
          </div>

          {/* Mandal Wise Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              📍 MANDALAM WISE:
            </label>
            <select
              value={selectedMandal}
              onChange={e => { setSelectedMandal(e.target.value); setPage(1); }}
              className="form-control"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: selectedMandal ? '2px solid #0F2B47' : '1px solid #cbd5e1',
                backgroundColor: selectedMandal ? '#eff6ff' : '#ffffff',
                fontWeight: selectedMandal ? 700 : 500,
              }}
            >
              <option value="">All Mandals</option>
              {(filterMeta?.mandalsList || []).map(m => (
                <option key={m} value={m}>
                  {resolveName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* AGM Wise Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              👔 AGM WISE:
            </label>
            <select
              value={selectedAgm}
              onChange={e => { setSelectedAgm(e.target.value); setPage(1); }}
              className="form-control"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: selectedAgm ? '2px solid #0F2B47' : '1px solid #cbd5e1',
                backgroundColor: selectedAgm ? '#eff6ff' : '#ffffff',
                fontWeight: selectedAgm ? 700 : 500,
              }}
            >
              <option value="">All AGMs</option>
              {(filterMeta?.agmsList || []).map(a => (
                <option key={a.employeeId} value={a.employeeId}>
                  {a.name} (AGM)
                </option>
              ))}
            </select>
          </div>

          {/* Doorstep Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
              🚪 DOORSTEP STATUS:
            </label>
            <select
              value={selectedDoorstep}
              onChange={e => { setSelectedDoorstep(e.target.value); setPage(1); }}
              className="form-control"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                borderRadius: '8px',
                border: selectedDoorstep ? '2px solid #0F2B47' : '1px solid #cbd5e1',
                backgroundColor: selectedDoorstep ? '#eff6ff' : '#ffffff',
                fontWeight: selectedDoorstep ? 700 : 500,
              }}
            >
              <option value="">All Doorstep Status</option>
              <option value="completed">✅ Visited (Completed)</option>
              <option value="pending">⏳ Pending Visit</option>
            </select>
          </div>
        </div>

        {/* Bottom Search & Status Tabs Row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #f1f5f9',
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search student name, phone, village..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
              }}
            />
          </div>

          {/* Admission Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => { setSelectedStatus('all'); setPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedStatus === 'all' ? '#0F2B47' : 'transparent',
                color: selectedStatus === 'all' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              All Leads
            </button>
            <button
              type="button"
              onClick={() => { setSelectedStatus('pending'); setPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedStatus === 'pending' ? '#0F2B47' : 'transparent',
                color: selectedStatus === 'pending' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              Pending Leads
            </button>
            <button
              type="button"
              onClick={() => { setSelectedStatus('admitted'); setPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedStatus === 'admitted' ? '#166534' : 'transparent',
                color: selectedStatus === 'admitted' ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease',
              }}
            >
              🎓 Admitted
            </button>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.85rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} /> Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Students Data Table & Results */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}>
        {/* Table Header Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F2B47' }}>
              Student Records
            </span>
            <span style={{
              backgroundColor: '#e2e8f0',
              color: '#334155',
              padding: '0.15rem 0.55rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}>
              {totalStudents} Found
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem', color: '#0F2B47' }} />
            <div>Loading student records...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#dc2626' }}>
            {error}
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#475569', fontWeight: 700 }}>
              No students found
            </h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
              {hasActiveFilters ? 'Try adjusting your filters or search keywords.' : 'No students have been added by your staff yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '45px' }}>#</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STUDENT NAME</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CONTACT</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SCHOOL & MANDAL</th>
                  <th style={{ padding: '0.85rem 1rem' }}>ADDED BY (STAFF)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>REPORTING AGM</th>
                  <th style={{ padding: '0.85rem 1rem' }}>DOORSTEP</th>
                  <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => {
                  const displayIndex = (page - 1) * itemsPerPage + index + 1;
                  const staffName = s.employee?.name || s.employeeId;
                  const staffRole = s.employee?.role === 'EMPLOYEE' ? 'Field Staff' : s.employee?.role === 'TELECALLER' ? 'Telecaller' : s.employee?.role || 'Staff';
                  const agmId = s.employee?.assignedAgms?.[0];
                  const agmName = agmId ? (agmsMap[agmId] || agmId) : 'N/A';

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* # Index */}
                      <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>
                        {displayIndex}
                      </td>

                      {/* Student Name */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, color: '#0F2B47', fontSize: '0.92rem' }}>
                            {s.studentName}
                          </span>
                          {s.gender && (
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: s.gender === 'Female' ? '#fdf2f8' : '#eff6ff',
                              color: s.gender === 'Female' ? '#db2777' : '#2563eb',
                              fontWeight: 700,
                            }}>
                              {s.gender}
                            </span>
                          )}
                        </div>
                        {s.fatherName && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            S/O: {s.fatherName}
                          </div>
                        )}
                      </td>

                      {/* Contact Phone & WhatsApp */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                            {s.phone}
                          </span>
                          <a
                            href={`tel:${s.phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              textDecoration: 'none',
                            }}
                            title="Call Student"
                          >
                            <Phone size={12} />
                          </a>
                          {(s.whatsapp || s.phone) && (
                            <a
                              href={`https://wa.me/${(s.whatsapp || s.phone).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                textDecoration: 'none',
                              }}
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* School & Mandal */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.84rem' }}>
                          {resolveName(s.schoolName) || 'Unknown School'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}>
                            📍 {resolveName(s.mandal) || 'Mandal N/A'}
                          </span>
                          {s.village && (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              ({resolveName(s.village)})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Added By Staff */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F2B47' }}>
                          {staffName}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '0.15rem',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '10px',
                          backgroundColor: s.employee?.role === 'TELECALLER' ? '#ede9fe' : '#e0f2fe',
                          color: s.employee?.role === 'TELECALLER' ? '#6d28d9' : '#0369a1',
                        }}>
                          {staffRole}
                        </span>
                      </td>

                      {/* Reporting AGM */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: agmName !== 'N/A' ? '#1e293b' : '#94a3b8',
                        }}>
                          {agmName !== 'N/A' && '👔'} {agmName}
                        </span>
                      </td>

                      {/* Doorstep Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {s.doorstepCompleted ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                          }}>
                            <CheckCircle size={12} /> Visited
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#fff7ed',
                            color: '#c2410c',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                          }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>

                      {/* Admission Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {s.leadStatus === 'Admitted' ? (
                          <span style={{
                            backgroundColor: '#ede9fe',
                            color: '#6d28d9',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}>
                            🎓 Admitted
                          </span>
                        ) : (
                          <span style={{
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                          }}>
                            ⚡ Active Lead
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setViewStudent(s)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#0F2B47',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                            title="View Full Student Details"
                          >
                            <Eye size={13} /> View
                          </button>

                          {s.leadStatus !== 'Admitted' && (
                            <button
                              type="button"
                              onClick={() => { setAdmitStudent(s); setApplicationNumber(''); }}
                              style={{
                                padding: '0.35rem 0.65rem',
                                backgroundColor: '#166534',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="Confirm College Admission"
                            >
                              <GraduationCap size={13} /> Admit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '0.45rem 1rem',
                backgroundColor: page <= 1 ? '#f1f5f9' : '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: page <= 1 ? '#94a3b8' : '#334155',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              &larr; Previous Page
            </button>

            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '0.45rem 1rem',
                backgroundColor: page >= totalPages ? '#f1f5f9' : '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: page >= totalPages ? '#94a3b8' : '#334155',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next Page &rarr;
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: View Full Student Details */}
      {viewStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.82)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.25rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '95%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              background: 'linear-gradient(135deg, #0A192F 0%, #0F2B47 60%, #1e3a8a 100%)',
              borderBottom: '3px solid #3b82f6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                    {viewStudent.studentName}
                  </h3>
                  {viewStudent.leadStatus === 'Admitted' ? (
                    <span style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                      ADMITTED
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                      ACTIVE LEAD
                    </span>
                  )}
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#93c5fd' }}>
                  Added by: <strong>{viewStudent.employee?.name || viewStudent.employeeId}</strong> &bull; School: <strong>{resolveName(viewStudent.schoolName)}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewStudent(null)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Contact Information */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  📞 Contact & Family
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Phone Number:</span>
                    <div style={{ fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                      {viewStudent.phone}
                      <a href={`tel:${viewStudent.phone}`} style={{ color: '#0284c7' }}><Phone size={14} /></a>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Father Name:</span>
                    <div style={{ fontWeight: 700, color: '#0F2B47', marginTop: '0.15rem' }}>
                      {viewStudent.fatherName || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Occupation:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {viewStudent.occupation || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Gender:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {viewStudent.gender || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & School */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  📍 Location & School
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>School Name:</span>
                    <div style={{ fontWeight: 700, color: '#0F2B47', marginTop: '0.15rem' }}>
                      {resolveName(viewStudent.schoolName) || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Mandal:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {resolveName(viewStudent.mandal) || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Village:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {resolveName(viewStudent.village) || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>District:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {resolveName(viewStudent.district) || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic & Outreach */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  🎓 Academic & Admission Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Group Interest:</span>
                    <div style={{ fontWeight: 700, color: '#0F2B47', marginTop: '0.15rem' }}>
                      {resolveName(viewStudent.group) || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>10th Marks / Grade:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {viewStudent.marks || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Doorstep Completed:</span>
                    <div style={{ fontWeight: 700, color: viewStudent.doorstepCompleted ? '#166534' : '#c2410c', marginTop: '0.15rem' }}>
                      {viewStudent.doorstepCompleted ? '✅ Yes (Visited)' : '⏳ Pending'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b' }}>Registration Date:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: '0.15rem' }}>
                      {new Date(viewStudent.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>

                {viewStudent.remarks && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>Survey Remarks:</span>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: '#1e293b', fontStyle: 'italic' }}>
                      "{viewStudent.remarks}"
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                style={{
                  padding: '0.55rem 1.35rem',
                  backgroundColor: '#0F2B47',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Admit Student Modal */}
      {admitStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 25, 47, 0.82)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.25rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                🎓 Confirm Admission
              </h3>
              <button
                type="button"
                onClick={() => setAdmitStudent(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                  Student: <strong>{admitStudent.studentName}</strong> ({admitStudent.phone})
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  School: {resolveName(admitStudent.schoolName)} &bull; Mandal: {resolveName(admitStudent.mandal)}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Application Number / Roll Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADM-2026-0042"
                  value={applicationNumber}
                  onChange={e => setApplicationNumber(e.target.value)}
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAdmitStudent(null)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAdmission}
                  disabled={savingAdmit}
                  style={{
                    flex: 1,
                    padding: '0.6rem 1rem',
                    backgroundColor: '#166534',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    cursor: savingAdmit ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingAdmit ? 'Saving...' : 'Confirm Admission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
