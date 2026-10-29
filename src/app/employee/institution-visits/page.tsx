'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Phone, MessageCircle, 
  MapPin, School, BookOpen, Trash2, Edit2, 
  X, Calendar, Users, Building, Check, Loader2, Share2,
  Briefcase, ClipboardList
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface InstitutionVisit {
  id: string;
  type: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  village: string | null;
  mandal: string | null;
  district: string | null;
  address: string | null;
  studentsMetCount: number;
  visitDate: string;
  remarks: string | null;
  createdAt: string;
}

export default function InstitutionVisitsPage() {
  const [visits, setVisits] = useState<InstitutionVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SCHOOL' | 'TUITION' | 'OTHER'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Dropdown Auto-fill data
  const [configs, setConfigs] = useState<any[]>([]);
  const [keyPersons, setKeyPersons] = useState<any[]>([]);
  const [selectedMandalId, setSelectedMandalId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [contactOptions, setContactOptions] = useState<Array<{ role: string; name: string; phone: string }>>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<InstitutionVisit | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    type: 'SCHOOL',
    name: '',
    contactPerson: '',
    phone: '',
    village: '',
    mandal: '',
    district: '',
    address: '',
    studentsMetCount: '',
    visitDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    fetchVisits();
    fetchConfigsAndKeyPersons();
  }, [dateFilter, typeFilter]);

  const fetchConfigsAndKeyPersons = async () => {
    try {
      const [confRes, kpRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/key-persons?limit=1000')
      ]);
      if (confRes.ok) {
        const cData = await confRes.json();
        setConfigs(cData.configs || []);
      }
      if (kpRes.ok) {
        const kData = await kpRes.json();
        setKeyPersons(kData.keyPersons || []);
      }
    } catch (e) {
      console.error('Error fetching configs/key-persons:', e);
    }
  };

  // Extract Mandals & Schools from Config
  const mandalsList = useMemo(() => {
    return configs
      .filter((c: any) => c.type === 'MANDAL')
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [configs]);

  const mandalMap = useMemo(() => {
    const map: Record<string, string> = {};
    configs.forEach((c: any) => {
      map[c.id] = c.value;
    });
    return map;
  }, [configs]);

  // Filtered villages by selected mandal
  const availableVillages = useMemo(() => {
    return configs
      .filter((c: any) => c.type === 'VILLAGE' && (!selectedMandalId || c.parentId === selectedMandalId))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [configs, selectedMandalId]);

  // Filtered schools by selected village (or mandal)
  // Filtered institutions by type (SCHOOL vs TUITION) and selected village/mandal
  const availableSchools = useMemo(() => {
    const isTuition = formData.type === 'TUITION';
    const result: any[] = [];
    const seenNames = new Set<string>();

    if (isTuition) {
      // 1. Collect Tuition Centers from KeyPersons
      keyPersons.forEach((kp: any) => {
        const schName = (kp.schoolName || '').trim();
        if (!schName) return;
        const desig = (kp.designation || '').toLowerCase();
        const nameLower = schName.toLowerCase();

        const isExplicitTuition = desig.includes('tuition') ||
          desig.includes('tutor') ||
          desig.includes('coaching') ||
          nameLower.includes('tuition') ||
          nameLower.includes('tution') ||
          nameLower.includes('coach') ||
          nameLower.includes('center') ||
          nameLower.includes('centre') ||
          nameLower.includes('academy') ||
          nameLower.includes('classes') ||
          nameLower.includes('study') ||
          nameLower.includes('tutorial');

        const isKnownSchool = configs.some((c: any) => c.type === 'SCHOOL' && c.value.toLowerCase() === nameLower);
        if (isKnownSchool && !isExplicitTuition) return;

        const vStr = (kp.village || '').toLowerCase().trim();
        const cStr = (kp.name || '').toLowerCase().trim();
        const dedupKey = `${nameLower}_${vStr}_${cStr}`;

        if (!seenNames.has(dedupKey)) {
          seenNames.add(dedupKey);
          result.push({
            id: `kp_${kp.id || `${nameLower}_${vStr}`}`,
            value: schName,
            type: 'TUITION',
            mandal: kp.mandal,
            village: kp.village,
            district: kp.district,
            contactPerson: kp.name,
            phone: kp.phone,
            designation: kp.designation || 'Tuition Tutor / Owner',
          });
        }
      });

      // 2. From configs if any type == 'TUITION' or contains tuition
      configs.forEach((c: any) => {
        const valLower = (c.value || '').toLowerCase();
        if (c.type === 'TUITION' || valLower.includes('tuition') || valLower.includes('tution') || valLower.includes('coaching')) {
          const pId = c.parentId || '';
          const dedupKey = `${valLower}_${pId}`;
          if (!seenNames.has(dedupKey)) {
            seenNames.add(dedupKey);
            result.push({ ...c, type: 'TUITION' });
          }
        }
      });

      // 3. From visits
      visits.forEach((v: any) => {
        if ((v.type || '').toUpperCase() === 'TUITION') {
          const vName = (v.name || '').trim();
          const vLower = vName.toLowerCase();
          const vVill = (v.village || '').toLowerCase().trim();
          const vCont = (v.contactPerson || '').toLowerCase().trim();
          const dedupKey = `${vLower}_${vVill}_${vCont}`;
          if (vName && !seenNames.has(dedupKey)) {
            seenNames.add(dedupKey);
            result.push({
              id: `visit_${v.id || vName}`,
              value: vName,
              type: 'TUITION',
              mandal: v.mandal,
              village: v.village,
              district: v.district,
              contactPerson: v.contactPerson,
              phone: v.phone,
              designation: 'Tuition Tutor / Owner',
            });
          }
        }
      });
    } else {
      // SCHOOL
      configs.forEach((c: any) => {
        if (c.type !== 'SCHOOL') return;
        const valLower = (c.value || '').toLowerCase();
        if (valLower.includes('tution center') || valLower.includes('tuition center')) return;
        const pId = c.parentId || '';
        const dedupKey = `${valLower}_${pId}`;
        if (!seenNames.has(dedupKey)) {
          seenNames.add(dedupKey);
          result.push({ ...c, type: 'SCHOOL' });
        }
      });

      keyPersons.forEach((kp: any) => {
        const schName = (kp.schoolName || '').trim();
        const nameLower = schName.toLowerCase();
        if (nameLower.includes('tution center') || nameLower.includes('tuition center')) return;
        if (schName) {
          const vStr = (kp.village || '').toLowerCase().trim();
          const cStr = (kp.name || '').toLowerCase().trim();
          const dedupKey = `${nameLower}_${vStr}_${cStr}`;
          if (!seenNames.has(dedupKey)) {
            if (nameLower.includes('school') || nameLower.includes('high') || nameLower.includes('zphs') || nameLower.includes('convent')) {
              seenNames.add(dedupKey);
              result.push({
                id: `kp_${kp.id || `${nameLower}_${vStr}`}`,
                value: schName,
                type: 'SCHOOL',
                mandal: kp.mandal,
                village: kp.village,
                district: kp.district,
                contactPerson: kp.name,
                phone: kp.phone,
                designation: kp.designation || 'HM / Principal',
              });
            }
          }
        }
      });
    }

    // Filter by selected village or mandal
    return result.filter((item: any) => {
      const parentId = item.parentId;
      const itemMandal = (item.mandal || '').trim().toLowerCase();
      const itemVillage = (item.village || '').trim().toLowerCase();

      const selectedMandalObj = configs.find((c: any) => c.id === selectedMandalId);
      const selectedMandalName = selectedMandalObj ? selectedMandalObj.value.toLowerCase() : '';
      const selectedVillageObj = configs.find((c: any) => c.id === selectedVillageId);
      const selectedVillageName = selectedVillageObj ? selectedVillageObj.value.toLowerCase() : '';

      if (selectedVillageId) {
        if (parentId && parentId === selectedVillageId) return true;
        if (itemVillage && (itemVillage === selectedVillageName || itemVillage === selectedVillageId.toLowerCase())) return true;
        return false;
      }

      if (selectedMandalId) {
        if (parentId) {
          const parentConfig = configs.find((v: any) => v.id === parentId);
          if (parentConfig && parentConfig.parentId === selectedMandalId) return true;
          if (parentId === selectedMandalId) return true;
        }
        if (itemMandal && (itemMandal === selectedMandalName || itemMandal === selectedMandalId.toLowerCase())) return true;
        if (itemVillage) {
          const vConfig = configs.find((c: any) => c.type === 'VILLAGE' && c.value.toLowerCase() === itemVillage);
          if (vConfig && vConfig.parentId === selectedMandalId) return true;
        }
        return false;
      }

      return true;
    }).sort((a, b) => a.value.localeCompare(b.value));
  }, [configs, keyPersons, visits, formData.type, selectedMandalId, selectedVillageId]);

  const handleVillageSelect = (villageId: string) => {
    setSelectedVillageId(villageId);
    setSelectedSchoolId('');
    if (villageId) {
      const village = configs.find((c: any) => c.id === villageId);
      if (village) {
        const mandalName = mandalMap[village.parentId] || '';
        setFormData(prev => ({
          ...prev,
          village: village.value,
          mandal: mandalName || prev.mandal,
        }));
        if (village.parentId && village.parentId !== selectedMandalId) {
          setSelectedMandalId(village.parentId);
        }
      }
    }
  };

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    if (!schoolId || schoolId === 'CUSTOM') {
      setContactOptions([]);
      return;
    }

    const school = availableSchools.find((c: any) => c.id === schoolId);
    if (!school) return;

    // Gather contact options (HM, Key Person, direct contacts, any keyPersons in table)
    const options: Array<{ role: string; name: string; phone: string }> = [];
    if (school.headmasterName) {
      options.push({
        role: formData.type === 'SCHOOL' ? 'HM / Principal' : 'Owner / In-charge',
        name: school.headmasterName,
        phone: school.headmasterPhone || '',
      });
    }
    if (school.keyPersonName && school.keyPersonName !== school.headmasterName) {
      options.push({
        role: 'Key Person / Staff',
        name: school.keyPersonName,
        phone: school.keyPersonPhone || '',
      });
    }

    if (school.contactPerson && !options.some(o => o.name.toLowerCase() === school.contactPerson.toLowerCase())) {
      options.push({
        role: school.designation || (formData.type === 'SCHOOL' ? 'Staff' : 'Tutor / Owner'),
        name: school.contactPerson,
        phone: school.phone || '',
      });
    }

    // Also look for matching key persons in KeyPersons table
    keyPersons.forEach((kp: any) => {
      const matchByName = kp.schoolName && kp.schoolName.toLowerCase() === school.value.toLowerCase();
      const matchById = kp.schoolId && kp.schoolId === school.id;
      if ((matchByName || matchById) && kp.name) {
        const already = options.some(o => o.name.toLowerCase() === kp.name.toLowerCase());
        if (!already) {
          options.push({
            role: kp.designation || (formData.type === 'SCHOOL' ? 'Key Person' : 'Tutor'),
            name: kp.name,
            phone: kp.phone || '',
          });
        }
      }
    });

    setContactOptions(options);

    const primaryContact = options.length > 0 ? options[0] : null;

    // Resolve Village & Mandal
    let villageName = school.village || '';
    let mandalName = school.mandal || '';

    if (school.parentId) {
      const parentVillage = configs.find((c: any) => c.id === school.parentId && c.type === 'VILLAGE');
      if (parentVillage) {
        villageName = parentVillage.value;
        mandalName = mandalMap[parentVillage.parentId] || mandalName;
        setSelectedVillageId(parentVillage.id);
        if (parentVillage.parentId) {
          setSelectedMandalId(parentVillage.parentId);
        }
      } else if (mandalMap[school.parentId]) {
        mandalName = mandalMap[school.parentId];
        setSelectedMandalId(school.parentId);
      }
    } else if (villageName) {
      const vObj = configs.find((c: any) => c.type === 'VILLAGE' && c.value.toLowerCase() === villageName.toLowerCase());
      if (vObj) {
        setSelectedVillageId(vObj.id);
        if (vObj.parentId) {
          setSelectedMandalId(vObj.parentId);
          mandalName = mandalMap[vObj.parentId] || mandalName;
        }
      }
    }

    if (mandalName && !selectedMandalId) {
      const mObj = configs.find((c: any) => c.type === 'MANDAL' && c.value.toLowerCase() === mandalName.toLowerCase());
      if (mObj) {
        setSelectedMandalId(mObj.id);
      }
    }

    setFormData(prev => ({
      ...prev,
      name: school.value,
      contactPerson: primaryContact ? primaryContact.name : (prev.contactPerson || ''),
      phone: primaryContact ? primaryContact.phone : (prev.phone || ''),
      village: villageName || prev.village || '',
      mandal: mandalName || prev.mandal || '',
      studentsMetCount: (school.strength && school.strength > 0) ? school.strength.toString() : prev.studentsMetCount,
    }));
  };

  const handleSelectContactOption = (opt: { role: string; name: string; phone: string }) => {
    setFormData(prev => ({
      ...prev,
      contactPerson: opt.name,
      phone: opt.phone,
    }));
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      let url = '/api/institution-visits';
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVisits(data.visits || []);
      }
    } catch (e) {
      console.error('Error fetching visits:', e);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingVisit(null);
    setFormData({
      type: 'SCHOOL',
      name: '',
      contactPerson: '',
      phone: '',
      village: '',
      mandal: '',
      district: '',
      address: '',
      studentsMetCount: '',
      visitDate: dateFilter || new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (v: InstitutionVisit) => {
    setEditingVisit(v);
    setFormData({
      type: v.type || 'SCHOOL',
      name: v.name || '',
      contactPerson: v.contactPerson || '',
      phone: v.phone || '',
      village: v.village || '',
      mandal: v.mandal || '',
      district: v.district || '',
      address: v.address || '',
      studentsMetCount: v.studentsMetCount ? v.studentsMetCount.toString() : '',
      visitDate: v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : '',
      remarks: v.remarks || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter Institution Name');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingVisit ? `/api/institution-visits/${editingVisit.id}` : '/api/institution-visits';
      const method = editingVisit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentsMetCount: formData.studentsMetCount ? parseInt(formData.studentsMetCount, 10) : 0,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchVisits();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save visit');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the visit for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/institution-visits/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVisits(prev => prev.filter(v => v.id !== id));
      } else {
        alert('Failed to delete visit');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (v: InstitutionVisit) => {
    const isOther = v.type === 'OTHER';
    const isSchool = v.type === 'SCHOOL';
    const lines = [
      isOther
        ? '💼 *Official Duty / Work Report*'
        : isSchool
          ? '🏛️ *School Visit Report*'
          : '📖 *Tuition Center Visit Report*',
      `*${isOther ? 'Duty / Task' : 'Name'}:* ${v.name}`,
      v.contactPerson ? `*${isOther ? 'Category / Lead' : 'Incharge/HM'}:* ${v.contactPerson}` : '',
      v.phone ? `*Phone:* ${v.phone}` : '',
      v.village ? `*Location:* ${v.village}` : '',
      v.studentsMetCount > 0 ? `*${isOther ? 'Persons Reached' : 'Students Addressed'}:* ${v.studentsMetCount}` : '',
      `*Date:* ${new Date(v.visitDate).toLocaleDateString('en-IN')}`,
      v.remarks ? `*${isOther ? 'Work Details / Remarks' : 'Remarks'}:* ${v.remarks}` : '',
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, '_blank');
  };

  // Filtered list by search text
  const filteredVisits = useMemo(() => {
    if (!search.trim()) return visits;
    const q = search.toLowerCase();
    return visits.filter(v => 
      v.name?.toLowerCase().includes(q) ||
      v.contactPerson?.toLowerCase().includes(q) ||
      v.phone?.includes(q) ||
      v.village?.toLowerCase().includes(q) ||
      v.remarks?.toLowerCase().includes(q)
    );
  }, [visits, search]);

  // Stats
  const stats = useMemo(() => {
    let schools = 0;
    let tuitions = 0;
    let otherDuties = 0;
    let studentsMet = 0;

    visits.forEach(v => {
      if (v.type === 'SCHOOL') schools++;
      else if (v.type === 'TUITION') tuitions++;
      else otherDuties++;
      studentsMet += (v.studentsMetCount || 0);
    });

    return { total: visits.length, schools, tuitions, otherDuties, studentsMet };
  }, [visits]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', paddingBottom: '90px' }}>
      {/* Top Header */}
      <header style={{
        padding: '1rem 1.25rem',
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link href="/employee" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              School & Tuition Visits
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#38bdf8' }}>
              Institutions & Coaching Centers Field Log
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.55rem 0.9rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Plus size={16} />
          <span>Record Visit</span>
        </button>
      </header>

      {/* Stats Cards */}
      <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '0.65rem 0.4rem', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{stats.total}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '0.65rem 0.4rem', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>SCHOOLS</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{stats.schools}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '0.65rem 0.4rem', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>TUITIONS</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{stats.tuitions}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '0.65rem 0.4rem', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>DUTIES</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>{stats.otherDuties}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '0.65rem 0.4rem', border: '1px solid #334155', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>STUDENTS</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2dd4bf', marginTop: '2px' }}>{stats.studentsMet}</div>
        </div>
      </div>

      {/* Date Filter & Search & Tabs */}
      <div style={{ padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Date Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1e293b', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid #334155' }}>
          <Calendar size={18} color="#38bdf8" />
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Filter Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              color: '#f8fafc',
              borderRadius: '6px',
              padding: '0.3rem 0.5rem',
              fontSize: '0.8rem',
              flex: 1,
            }}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
              title="Show all dates"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search school, tuition, duty, HM, phone, village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#f8fafc',
              borderRadius: '10px',
              padding: '0.65rem 0.75rem 0.65rem 2.5rem',
              fontSize: '0.85rem',
            }}
          />
        </div>

        {/* Type Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
          {(['ALL', 'SCHOOL', 'TUITION', 'OTHER'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              style={{
                flex: 1,
                padding: '0.5rem 0',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: typeFilter === tab ? '#2563eb' : '#1e293b',
                color: typeFilter === tab ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'ALL' ? 'All Visits' : tab === 'SCHOOL' ? 'Schools' : tab === 'TUITION' ? 'Tuitions' : 'Other Duty'}
            </button>
          ))}
        </div>
      </div>

      {/* Visits List */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading visits...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '14px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            border: '1px dashed #334155'
          }}>
            <School size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', color: '#f8fafc' }}>No visits recorded yet</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Record past or present school & tuition center meetings to include them in your Day Sheet.
            </p>
            <button
              onClick={openCreateModal}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Record First Visit
            </button>
          </div>
        ) : (
          filteredVisits.map(v => {
            const isSchool = v.type === 'SCHOOL';
            const isOther = v.type === 'OTHER';
            return (
              <div
                key={v.id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '14px',
                  padding: '1rem',
                  border: isOther ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                {/* Header row: Badge, Name, Date */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: isOther
                        ? 'rgba(168, 85, 247, 0.15)'
                        : isSchool
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOther ? '#c084fc' : isSchool ? '#f59e0b' : '#10b981',
                    }}>
                      {isOther ? <ClipboardList size={20} /> : isSchool ? <School size={20} /> : <BookOpen size={20} />}
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: isOther
                          ? 'rgba(168, 85, 247, 0.2)'
                          : isSchool
                            ? 'rgba(245, 158, 11, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color: isOther ? '#c084fc' : isSchool ? '#f59e0b' : '#10b981',
                        marginBottom: '2px',
                      }}>
                        {isOther ? 'OTHER DUTY' : v.type}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                        {v.name}
                      </h3>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(v.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Details Row: Contact & Village */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {v.contactPerson && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {isOther ? <Briefcase size={14} color="#94a3b8" /> : <Users size={14} color="#94a3b8" />}
                      <span>{v.contactPerson}</span>
                    </div>
                  )}
                  {v.village && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={14} color="#94a3b8" />
                      <span>{v.village}</span>
                    </div>
                  )}
                  {v.studentsMetCount > 0 && (
                    <div style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      🎯 {v.studentsMetCount} {isOther ? 'Persons Reached' : 'Students Addressed'}
                    </div>
                  )}
                </div>

                {/* Remarks */}
                {v.remarks && (
                  <div style={{
                    backgroundColor: '#0f172a',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: '#94a3b8',
                    fontStyle: 'italic',
                  }}>
                    "{v.remarks}"
                  </div>
                )}

                {/* Actions Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #334155',
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {v.phone && (
                      <>
                        <a
                          href={`tel:${v.phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: '#0f172a',
                            color: '#38bdf8',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={13} />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/91${v.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: '#0f172a',
                            color: '#10b981',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => handleShare(v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: '#0f172a',
                        color: '#a855f7',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Share2 size={13} />
                      <span>Share</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => openEditModal(v)}
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#f59e0b',
                        border: 'none',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, v.name)}
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#ef4444',
                        border: 'none',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Add / Edit */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                {editingVisit ? 'Edit Visit Log' : 'Record School / Tuition Visit'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Type Switch */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  INSTITUTION TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.type !== 'SCHOOL') {
                        setFormData({ ...formData, type: 'SCHOOL' });
                        setSelectedSchoolId('');
                        setContactOptions([]);
                      }
                    }}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: formData.type === 'SCHOOL' ? '2px solid #f59e0b' : '1px solid #334155',
                      backgroundColor: formData.type === 'SCHOOL' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                      color: formData.type === 'SCHOOL' ? '#f59e0b' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <School size={15} />
                    <span>School</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.type !== 'TUITION') {
                        setFormData({ ...formData, type: 'TUITION' });
                        setSelectedSchoolId('');
                        setContactOptions([]);
                      }
                    }}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: formData.type === 'TUITION' ? '2px solid #10b981' : '1px solid #334155',
                      backgroundColor: formData.type === 'TUITION' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
                      color: formData.type === 'TUITION' ? '#10b981' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <BookOpen size={15} />
                    <span>Tuition</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.type !== 'OTHER') {
                        setFormData({ ...formData, type: 'OTHER' });
                        setSelectedSchoolId('');
                        setContactOptions([]);
                      }
                    }}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: formData.type === 'OTHER' ? '2px solid #c084fc' : '1px solid #334155',
                      backgroundColor: formData.type === 'OTHER' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
                      color: formData.type === 'OTHER' ? '#c084fc' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Briefcase size={15} />
                    <span>Other Duty</span>
                  </button>
                </div>
              </div>

              {/* Visit Date */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  VISIT DATE (Supports Past Date) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.visitDate}
                  onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Other Duty Presets OR Smart Auto-fill Section */}
              {formData.type === 'OTHER' ? (
                <div style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', letterSpacing: '0.04em' }}>
                      💼 QUICK DUTY CATEGORY
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Tap to select</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {[
                      '📞 Phone Follow-up (WFH / Rain)',
                      '🏢 Office Work / Desk Duty',
                      '🏛️ College / Campus Duty',
                      '📢 Canvassing / Pamphlets',
                      '👥 Parent / Student Meeting',
                      '📝 Review Meeting / Training',
                      '✏️ Other Special Work'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const catName = preset.replace(/^[^ws]+/, '').trim();
                          setFormData(prev => ({
                            ...prev,
                            name: preset,
                            contactPerson: prev.contactPerson || catName,
                          }));
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          border: formData.name.startsWith(preset.substring(0, 10))
                            ? '1px solid #c084fc'
                            : '1px solid #334155',
                          backgroundColor: formData.name.startsWith(preset.substring(0, 10))
                            ? 'rgba(168, 85, 247, 0.25)'
                            : '#0f172a',
                          color: formData.name.startsWith(preset.substring(0, 10))
                            ? '#f3e8ff'
                            : '#cbd5e1',
                          cursor: 'pointer',
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                      }}>⚡</span>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em' }}>
                          QUICK AUTO-FILL
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          Hierarchy helper (Mandal → Village → Institution)
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: '#7dd3fc',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      fontWeight: 600,
                    }}>
                      Master DB
                    </span>
                  </div>

                  {/* 1. Mandal Dropdown */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                        }}>1</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.03em' }}>
                          SELECT MANDAL
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', backgroundColor: '#1e293b', padding: '1px 6px', borderRadius: '6px', border: '1px solid #334155' }}>
                        {mandalsList.length} Mandals
                      </span>
                    </div>
                    <select
                      value={selectedMandalId}
                      onChange={e => {
                        const newMandal = e.target.value;
                        setSelectedMandalId(newMandal);
                        if (selectedVillageId && newMandal) {
                          const vObj = configs.find(c => c.id === selectedVillageId);
                          if (vObj && vObj.parentId !== newMandal) {
                            setSelectedVillageId('');
                            setSelectedSchoolId('');
                          }
                        } else if (!newMandal) {
                          setSelectedVillageId('');
                          setSelectedSchoolId('');
                        }
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.55rem 0.65rem',
                        fontSize: '0.82rem',
                      }}
                    >
                      <option value="">-- All Mandals ({mandalsList.length}) --</option>
                      {mandalsList.map(m => (
                        <option key={m.id} value={m.id}>{m.value}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Village Dropdown */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                        }}>2</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.03em' }}>
                          SELECT VILLAGE
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', backgroundColor: '#1e293b', padding: '1px 6px', borderRadius: '6px', border: '1px solid #334155' }}>
                        {availableVillages.length} Available
                      </span>
                    </div>
                    <select
                      value={selectedVillageId}
                      onChange={e => handleVillageSelect(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: selectedVillageId ? '1px solid #38bdf8' : '1px solid #334155',
                        color: '#f8fafc',
                        borderRadius: '8px',
                        padding: '0.55rem 0.65rem',
                        fontSize: '0.82rem',
                      }}
                    >
                      <option value="">
                        {selectedMandalId
                          ? `-- Choose Village (${availableVillages.length} in Mandal) --`
                          : `-- Choose Village (All ${availableVillages.length}) --`}
                      </option>
                      {availableVillages.map(v => (
                        <option key={v.id} value={v.id}>{v.value}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. School / Tuition Dropdown */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(168, 85, 247, 0.2)',
                          color: '#c084fc',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                        }}>3</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.03em' }}>
                          SELECT {formData.type === 'SCHOOL' ? 'SCHOOL' : 'TUITION CENTER'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', backgroundColor: '#1e293b', padding: '1px 6px', borderRadius: '6px', border: '1px solid #334155' }}>
                        {availableSchools.length} Available
                      </span>
                    </div>
                  <select
                    value={selectedSchoolId}
                    onChange={e => handleSchoolSelect(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: selectedSchoolId ? '1px solid #38bdf8' : '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.5rem 0.65rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <option value="">
                      {formData.type === 'SCHOOL' ? '-- Choose Existing School --' : '-- Choose Existing Tuition Center --'}
                    </option>
                    {availableSchools.map(s => {
                      const hmPart = s.headmasterName ? ` [HM: ${s.headmasterName}]` : (s.contactPerson ? ` [${s.contactPerson}]` : '');
                      const areaPart = s.village && !selectedVillageId ? ` (${s.village})` : '';
                      return (
                        <option key={s.id} value={s.id}>
                          {s.value}{areaPart}{hmPart}
                        </option>
                      );
                    })}
                    <option value="CUSTOM">
                      {formData.type === 'SCHOOL' ? '✏️ + Other / Enter Custom School' : '✏️ + Other / Enter Custom Tuition Center'}
                    </option>
                  </select>
                </div>

                {/* 3. Who did you meet? Contact Person Pills */}
                {contactOptions.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>
                      WHO DID YOU MEET? (Tap to auto-fill)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {contactOptions.map((opt, idx) => {
                        const isSelected = formData.contactPerson === opt.name;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectContactOption(opt)}
                            style={{
                              backgroundColor: isSelected ? '#2563eb' : '#0f172a',
                              color: isSelected ? '#fff' : '#cbd5e1',
                              border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                              borderRadius: '6px',
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <span>{opt.role}:</span>
                            <span style={{ fontWeight: 700 }}>{opt.name}</span>
                            {opt.phone && <span style={{ opacity: 0.8 }}>({opt.phone})</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Institution / Duty Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  {formData.type === 'OTHER' ? 'WORK TITLE / DUTY NAME *' : (formData.type === 'SCHOOL' ? 'SCHOOL NAME *' : 'TUITION CENTER NAME *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === 'OTHER' ? 'e.g. Phone Follow-up (WFH / Rain) - 45 Calls' : (formData.type === 'SCHOOL' ? 'e.g. ZPHS Kothapeta' : 'e.g. Master Minds Tuitions')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Contact Person & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    {formData.type === 'OTHER' ? 'DUTY CATEGORY / LEAD' : (formData.type === 'SCHOOL' ? 'INCHARGE / HM NAME' : 'OWNER / TUTOR NAME')}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.type === 'OTHER' ? 'e.g. Phone Follow-up / Self' : 'e.g. Mr. Ramesh'}
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Village & Students Met Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    {formData.type === 'OTHER' ? 'WORK LOCATION (Optional)' : 'VILLAGE / LOCATION'}
                  </label>
                  <input
                    type="text"
                    placeholder={formData.type === 'OTHER' ? 'e.g. From Home / Campus / Office' : 'e.g. Tenali'}
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    {formData.type === 'OTHER' ? 'PERSONS REACHED (Optional)' : 'STUDENTS ADDRESSED'}
                  </label>
                  <input
                    type="number"
                    placeholder={formData.type === 'OTHER' ? 'e.g. 45' : 'e.g. 35'}
                    value={formData.studentsMetCount}
                    onChange={e => setFormData({ ...formData, studentsMetCount: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      borderRadius: '8px',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  {formData.type === 'OTHER' ? 'DETAILED WORK DESCRIPTION / REMARKS *' : 'REMARKS / DISCUSSION OUTCOME'}
                </label>
                <textarea
                  rows={3}
                  required={formData.type === 'OTHER'}
                  placeholder={formData.type === 'OTHER' ? 'e.g. Due to heavy rain, worked from home. Called 45 students/parents, explained scholarship details...' : 'e.g. Distributed college pamphlets to 10th batch, HM agreed for campus tour next week...'}
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.85rem',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.7rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingVisit ? 'Update Visit' : 'Save Visit'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
