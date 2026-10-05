'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, UserCheck, Phone, MessageSquare, 
  MapPin, User, LayoutGrid, Table as TableIcon, RefreshCw, 
  CheckCircle2, Building, MessageCircle, X
} from 'lucide-react';
import RemarksModal from '@/components/RemarksModal';

export default function TelecallerImpPersonsPage() {
  const [keyPersons, setKeyPersons] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [quickFilter, setQuickFilter] = useState<'all' | 'withPhone' | 'hasRemarks'>('all');
  
  // Filters
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');

  // Remarks Modal
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchKeyPersons();
  }, [district, mandal, village, search]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKeyPersons = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ limit: '500' });
      if (search) query.append('search', search);
      if (district) query.append('district', district);
      if (mandal) query.append('mandal', mandal);
      if (village) query.append('village', village);

      const res = await fetch(`/api/key-persons?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKeyPersons(data.keyPersons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getOptions = (type: string, parentId?: string) => {
    let opts = configs.filter(c => c.type === type);
    if (parentId) {
      opts = opts.filter(c => c.parentId === parentId);
    }
    return opts.sort((a, b) => a.value.localeCompare(b.value));
  };

  const resolveName = (id: string | null) => {
    if (!id) return '';
    const config = configs.find(c => c.id === id);
    return config ? config.value : id;
  };

  const handleSaveRemarks = async (newRemarks: any[]) => {
    if (!selectedPerson) return;
    
    const res = await fetch(`/api/key-persons/${selectedPerson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        remarks: newRemarks 
      })
    });
    
    if (!res.ok) throw new Error('Failed to save');
    
    // Update local state
    setKeyPersons(keyPersons.map(p => p.id === selectedPerson.id ? { ...p, remarks: newRemarks } : p));
    setSelectedPerson({ ...selectedPerson, remarks: newRemarks });
  };

  // Filtered & Mandal-wise sorted persons
  const filteredPersons = useMemo(() => {
    return keyPersons.filter(person => {
      const remarksCount = Array.isArray(person.remarks) ? person.remarks.length : 0;
      if (quickFilter === 'withPhone' && (!person.phone || person.phone.trim() === '')) return false;
      if (quickFilter === 'hasRemarks' && remarksCount === 0) return false;
      return true;
    }).sort((a, b) => {
      const mandalA = resolveName(a.mandal) || 'Other';
      const mandalB = resolveName(b.mandal) || 'Other';
      if (mandalA.localeCompare(mandalB) !== 0) {
        return mandalA.localeCompare(mandalB);
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [keyPersons, quickFilter, configs]);

  // Summary stats
  const stats = useMemo(() => {
    const total = keyPersons.length;
    const withPhone = keyPersons.filter(p => p.phone && p.phone.trim().length > 5).length;
    const withRemarks = keyPersons.filter(p => Array.isArray(p.remarks) && p.remarks.length > 0).length;
    const mandalsSet = new Set(keyPersons.map(p => resolveName(p.mandal)).filter(Boolean));
    return {
      total,
      withPhone,
      withRemarks,
      mandalsCount: mandalsSet.size
    };
  }, [keyPersons, configs]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1rem 1.5rem 5rem 1.5rem', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link 
            href="/telecaller" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0', 
              color: '#475569',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Important Persons Directory</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Private contacts & key influencers added by field employees</p>
          </div>
        </div>

        {/* View Toggle & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchKeyPersons}
            title="Refresh List"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#fff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? '#fff' : 'transparent',
                color: viewMode === 'table' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'table' ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <TableIcon size={15} /> Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'cards' ? '#fff' : 'transparent',
                color: viewMode === 'cards' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'cards' ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <LayoutGrid size={15} /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* Stats KPI Ribbon */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '0.875rem', 
        marginBottom: '1.25rem' 
      }}>
        <div style={{ backgroundColor: '#fff', padding: '0.875rem 1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Contacts</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.875rem 1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <Phone size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>With Phone</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>{stats.withPhone}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.875rem 1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mandals Covered</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed' }}>{stats.mandalsCount}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '0.875rem 1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>With Notes</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706' }}>{stats.withRemarks}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ backgroundColor: '#fff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name, phone, designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #cbd5e1' }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* District Dropdown */}
          <div>
            <select 
              className="form-control" 
              value={district} 
              onChange={e => { setDistrict(e.target.value); setMandal(''); setVillage(''); }}
              style={{ width: '100%', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #cbd5e1' }}
            >
              <option value="">All Districts</option>
              {getOptions('DISTRICT').map(d => (
                <option key={d.id} value={d.id}>{d.value}</option>
              ))}
            </select>
          </div>

          {/* Mandal Dropdown */}
          <div>
            <select 
              className="form-control" 
              value={mandal} 
              onChange={e => { setMandal(e.target.value); setVillage(''); }}
              style={{ width: '100%', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #cbd5e1' }}
            >
              <option value="">All Mandals</option>
              {getOptions('MANDAL', district || undefined).map(m => (
                <option key={m.id} value={m.id}>{m.value}</option>
              ))}
            </select>
          </div>

          {/* Village Dropdown */}
          <div>
            <select 
              className="form-control" 
              value={village} 
              onChange={e => setVillage(e.target.value)}
              disabled={!mandal}
              style={{ width: '100%', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #cbd5e1', backgroundColor: !mandal ? '#f1f5f9' : '#fff' }}
            >
              <option value="">All Villages</option>
              {getOptions('VILLAGE', mandal).map(v => (
                <option key={v.id} value={v.id}>{v.value}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginRight: '0.25rem' }}>FILTER:</span>
          
          <button
            onClick={() => setQuickFilter('all')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: quickFilter === 'all' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: quickFilter === 'all' ? '#eff6ff' : '#fff',
              color: quickFilter === 'all' ? '#1d4ed8' : '#64748b'
            }}
          >
            All Contacts ({keyPersons.length})
          </button>

          <button
            onClick={() => setQuickFilter('withPhone')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: quickFilter === 'withPhone' ? '1px solid #059669' : '1px solid #e2e8f0',
              backgroundColor: quickFilter === 'withPhone' ? '#ecfdf5' : '#fff',
              color: quickFilter === 'withPhone' ? '#047857' : '#64748b'
            }}
          >
            📞 With Phone ({stats.withPhone})
          </button>

          <button
            onClick={() => setQuickFilter('hasRemarks')}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: quickFilter === 'hasRemarks' ? '1px solid #d97706' : '1px solid #e2e8f0',
              backgroundColor: quickFilter === 'hasRemarks' ? '#fffbeb' : '#fff',
              color: quickFilter === 'hasRemarks' ? '#b45309' : '#64748b'
            }}
          >
            💬 Has Notes ({stats.withRemarks})
          </button>

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            Showing <strong style={{ color: '#0f172a' }}>{filteredPersons.length}</strong> of {keyPersons.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#3b82f6' }} />
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading Important Persons directory...</p>
        </div>
      ) : filteredPersons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <UserCheck size={48} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>No contacts found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            No important persons match the selected filters or search keyword.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Rich Desktop & Tablet Table View */
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700 }}>Contact Person</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>Phone & Actions</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>Location</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>Added By</th>
                  <th style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>Last Note</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersons.map((person, index) => {
                  const mandalName = resolveName(person.mandal) || 'Other Mandal';
                  const prevMandal = index > 0 ? (resolveName(filteredPersons[index - 1].mandal) || 'Other Mandal') : null;
                  const isNewMandal = mandalName !== prevMandal;
                  
                  const cleanPhone = (person.phone || '').replace(/\D/g, '');
                  const remarksList = Array.isArray(person.remarks) ? person.remarks : [];
                  const lastRemark = remarksList.length > 0 ? remarksList[remarksList.length - 1] : null;

                  return (
                    <Fragment key={person.id}>
                      {/* Mandal Group Divider Header */}
                      {isNewMandal && (
                        <tr style={{ backgroundColor: '#e2e8f0' }}>
                          <td colSpan={6} style={{ padding: '0.6rem 1.25rem', fontWeight: 700, color: '#1e293b', fontSize: '0.82rem', letterSpacing: '0.5px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Building size={14} color="#3b82f6" /> MANDAL: {mandalName.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      )}
                      
                      <tr style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }} className="hover:bg-slate-50">
                        {/* Person Name & Designation */}
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                            {person.name}
                          </div>
                          {person.designation ? (
                            <div style={{ display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                              {person.designation}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Key Person</span>
                          )}
                        </td>

                        {/* Phone & Direct Dial Buttons */}
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {person.phone ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <a 
                                href={`tel:${cleanPhone}`} 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.35rem', 
                                  padding: '0.35rem 0.65rem', 
                                  borderRadius: '6px', 
                                  backgroundColor: '#ecfdf5', 
                                  color: '#047857', 
                                  fontSize: '0.85rem', 
                                  fontWeight: 600, 
                                  textDecoration: 'none',
                                  border: '1px solid #a7f3d0'
                                }}
                                title="Click to call directly"
                              >
                                <Phone size={13} /> {person.phone}
                              </a>
                              <a 
                                href={`https://wa.me/91${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  width: '28px', 
                                  height: '28px', 
                                  borderRadius: '6px', 
                                  backgroundColor: '#25d366', 
                                  color: '#fff', 
                                  textDecoration: 'none' 
                                }}
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={15} />
                              </a>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No Phone</span>
                          )}
                        </td>

                        {/* Location */}
                        <td style={{ padding: '0.875rem 1rem', color: '#334155' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {resolveName(person.village) || person.address || '—'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {mandalName}, {resolveName(person.district)}
                          </div>
                        </td>

                        {/* Added By Employee */}
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.75rem', fontWeight: 700 }}>
                              {(person.employee?.name || 'E')[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>
                                {person.employee?.name || 'Staff Member'}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                ID: {person.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Last Remark / Note Preview */}
                        <td style={{ padding: '0.875rem 1rem', maxWidth: '240px' }}>
                          {lastRemark ? (
                            <div style={{ backgroundColor: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {lastRemark.text}
                              </p>
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                {new Date(lastRemark.date).toLocaleDateString()} by {lastRemark.addedBy}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontStyle: 'italic' }}>No notes yet</span>
                          )}
                        </td>

                        {/* Save Note Action */}
                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                          <button
                            onClick={() => setSelectedPerson(person)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.8rem',
                              borderRadius: '6px',
                              border: remarksList.length > 0 ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                              backgroundColor: remarksList.length > 0 ? '#eff6ff' : '#fff',
                              color: remarksList.length > 0 ? '#1d4ed8' : '#475569',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Add or view call notes"
                          >
                            <MessageSquare size={14} />
                            {remarksList.length > 0 ? `Notes (${remarksList.length})` : 'Note'}
                          </button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filteredPersons.map(person => {
            const mandalName = resolveName(person.mandal) || 'Other Mandal';
            const cleanPhone = (person.phone || '').replace(/\D/g, '');
            const remarksList = Array.isArray(person.remarks) ? person.remarks : [];
            const lastRemark = remarksList.length > 0 ? remarksList[remarksList.length - 1] : null;

            return (
              <div 
                key={person.id} 
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                        {person.name}
                      </h3>
                      {person.designation && (
                        <div style={{ display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {person.designation}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {mandalName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={14} color="#64748b" />
                      <span>{[resolveName(person.village), person.address, mandalName].filter(Boolean).join(', ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
                      <User size={13} color="#94a3b8" />
                      <span>Added by: <strong style={{ color: '#334155' }}>{person.employee?.name || person.employeeId}</strong></span>
                    </div>
                  </div>

                  {/* Last Remark preview */}
                  {lastRemark && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem' }}>LAST NOTE:</div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155' }}>{lastRemark.text}</p>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {new Date(lastRemark.date).toLocaleDateString()} • {lastRemark.addedBy}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.875rem' }}>
                  {person.phone ? (
                    <>
                      <a 
                        href={`tel:${cleanPhone}`}
                        style={{ 
                          flex: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '0.4rem', 
                          padding: '0.55rem', 
                          borderRadius: '8px', 
                          backgroundColor: '#ecfdf5', 
                          color: '#047857', 
                          border: '1px solid #a7f3d0',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={14} /> Call
                      </a>
                      <a 
                        href={`https://wa.me/91${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '8px', 
                          backgroundColor: '#25d366', 
                          color: '#fff', 
                          textDecoration: 'none'
                        }}
                        title="WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </a>
                    </>
                  ) : null}

                  <button
                    onClick={() => setSelectedPerson(person)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      backgroundColor: remarksList.length > 0 ? '#eff6ff' : '#f8fafc',
                      color: remarksList.length > 0 ? '#1d4ed8' : '#475569',
                      border: remarksList.length > 0 ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <MessageSquare size={15} />
                    {remarksList.length > 0 ? `Notes (${remarksList.length})` : 'Save Note'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remarks Modal */}
      <RemarksModal 
        isOpen={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        title={selectedPerson?.name || ''}
        remarks={Array.isArray(selectedPerson?.remarks) ? selectedPerson.remarks : []}
        onSave={handleSaveRemarks}
      />
    </div>
  );
}
