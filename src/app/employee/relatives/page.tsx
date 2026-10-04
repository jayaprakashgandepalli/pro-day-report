'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Phone, MessageCircle, 
  MapPin, Briefcase, HeartHandshake, Trash2, Edit2, 
  X, Filter, Check, User, Building2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, Users, Map
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface RelativeContact {
  id: string;
  name: string;
  phone: string;
  occupation: string | null;
  village: string;
  mandal: string | null;
  district: string | null;
  relation: string | null;
  createdAt: string;
}

export default function VillageRelativesPage() {
  const [relatives, setRelatives] = useState<RelativeContact[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hierarchical Filters: Mandal & Village
  const [selectedMandal, setSelectedMandal] = useState('ALL');
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  
  // Search & Debounce Optimization
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Pagination Optimization (Default Limit 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const listTopRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<RelativeContact | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    occupation: '',
    district: '',
    mandal: '',
    village: '',
    relation: ''
  });

  // Debounce search input by 300ms
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  // Reset to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedMandal, selectedVillage, pageSize]);

  useEffect(() => {
    fetchConfigs();
    fetchRelatives();
  }, []);

  // Performance: Config caching with sessionStorage & TTL
  const fetchConfigs = async () => {
    try {
      // 1. Try instant sessionStorage cache
      try {
        const cached = sessionStorage.getItem('app_configs_cache_v1');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.configs) && parsed.configs.length > 0) {
            setConfigs(parsed.configs);
            // If cache is less than 5 minutes old, skip network fetch
            if (Date.now() - (parsed.timestamp || 0) < 300000) {
              return;
            }
          }
        }
      } catch (cacheErr) {
        console.warn('Config cache error:', cacheErr);
      }

      // 2. Fetch fresh configs from API
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const confList = data.configs || [];
        setConfigs(confList);
        try {
          sessionStorage.setItem('app_configs_cache_v1', JSON.stringify({
            configs: confList,
            timestamp: Date.now()
          }));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error fetching configs:', e);
    }
  };

  const fetchRelatives = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/relatives');
      if (res.ok) {
        const data = await res.json();
        setRelatives(data.relatives || []);
      }
    } catch (e) {
      console.error('Error fetching relatives:', e);
    } finally {
      setLoading(false);
    }
  };

  // Config lookup helpers
  const configMap = useMemo(() => {
    return configs.reduce((acc, c) => ({ ...acc, [c.id]: c.value }), {} as Record<string, string>);
  }, [configs]);

  const resolveName = (id: string | null) => {
    if (!id) return '';
    return configMap[id] || id;
  };

  // Distinct villages from existing contacts
  const contactVillages = useMemo(() => {
    const counts: Record<string, number> = {};
    relatives.forEach(r => {
      if (r.village) {
        const vConfig = configs.find(c => c.id === r.village || c.value === r.village);
        const canonicalKey = vConfig ? vConfig.id : r.village;
        counts[canonicalKey] = (counts[canonicalKey] || 0) + 1;
        if (vConfig) {
          counts[vConfig.value] = counts[canonicalKey];
        }
      }
    });
    return counts;
  }, [relatives, configs]);

  // Distinct mandals from existing contacts
  const mandalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    relatives.forEach(r => {
      let mId = r.mandal;
      if (!mId && r.village) {
        const vConfig = configs.find(c => c.id === r.village || c.value === r.village);
        mId = vConfig?.parentId || null;
      }
      if (mId) {
        const mConfig = configs.find(c => c.id === mId || c.value === mId);
        const canonicalKey = mConfig ? mConfig.id : mId;
        counts[canonicalKey] = (counts[canonicalKey] || 0) + 1;
        if (mConfig) {
          counts[mConfig.value] = counts[canonicalKey];
        }
      }
    });
    return counts;
  }, [relatives, configs]);

  // Village filter options (hierarchically cascaded by selected Mandal)
  const filterVillageOptions = useMemo(() => {
    if (selectedMandal !== 'ALL') {
      return configs
        .filter(c => c.type === 'VILLAGE' && (c.parentId === selectedMandal || resolveName(c.parentId) === resolveName(selectedMandal)))
        .sort((a, b) => a.value.localeCompare(b.value));
    }
    return configs.filter(c => c.type === 'VILLAGE').sort((a, b) => a.value.localeCompare(b.value));
  }, [configs, selectedMandal]);

  const handleMandalFilterChange = (mandalId: string) => {
    setSelectedMandal(mandalId);
    setSelectedVillage('ALL');
  };

  const handleVillageFilterChange = (villageId: string) => {
    setSelectedVillage(villageId);
    if (villageId !== 'ALL' && selectedMandal === 'ALL') {
      const vConfig = configs.find(c => c.id === villageId || c.value === villageId);
      if (vConfig?.parentId) {
        setSelectedMandal(vConfig.parentId);
      }
    }
  };

  // Dropdown list helpers for Add/Edit Modal
  const getByType = (type: string) => configs.filter(c => c.type === type);
  const getByParent = (type: string, parentId: string) => configs.filter(c => c.type === type && c.parentId === parentId);
  
  // Available villages for form dropdown: if mandal selected, filter by parent; otherwise all villages
  const availableVillages = useMemo(() => {
    if (formData.mandal) {
      return configs.filter(c => c.type === 'VILLAGE' && (c.parentId === formData.mandal || resolveName(c.parentId) === resolveName(formData.mandal)));
    }
    return configs.filter(c => c.type === 'VILLAGE');
  }, [configs, formData.mandal]);

  const handleFormMandalChange = (mandalId: string) => {
    let newVillage = formData.village;
    if (newVillage && mandalId) {
      const vConfig = configs.find(c => c.id === newVillage || c.value === newVillage);
      if (vConfig && vConfig.parentId !== mandalId) {
        newVillage = '';
      }
    }
    const mConfig = configs.find(c => c.id === mandalId);
    setFormData(prev => ({
      ...prev,
      mandal: mandalId,
      village: newVillage,
      district: mConfig?.parentId || prev.district
    }));
  };

  const handleFormVillageChange = (villageId: string) => {
    const vConfig = configs.find(c => c.id === villageId || c.value === villageId);
    let parentMandal = formData.mandal;
    let parentDistrict = formData.district;

    if (vConfig?.parentId) {
      parentMandal = vConfig.parentId;
      const mConfig = configs.find(c => c.id === vConfig.parentId);
      if (mConfig?.parentId) {
        parentDistrict = mConfig.parentId;
      }
    }

    setFormData(prev => ({
      ...prev,
      village: villageId,
      mandal: parentMandal,
      district: parentDistrict
    }));
  };

  const availableOccupations = useMemo(() => {
    return configs.filter(c => c.type === 'OCCUPATION').map(c => c.value);
  }, [configs]);

  // Filtered contacts based on hierarchical Mandal + Village + Search
  const filteredRelatives = useMemo(() => {
    return relatives.filter(r => {
      // 1. Mandal filter
      if (selectedMandal !== 'ALL') {
        let contactMandal = r.mandal;
        if (!contactMandal && r.village) {
          const vConfig = configs.find(c => c.id === r.village || c.value === r.village);
          contactMandal = vConfig?.parentId || null;
        }
        const matchesMandalId = contactMandal === selectedMandal;
        const matchesMandalName = resolveName(contactMandal) === resolveName(selectedMandal);
        if (!matchesMandalId && !matchesMandalName) {
          return false;
        }
      }

      // 2. Village filter
      if (selectedVillage !== 'ALL') {
        const matchesVillageId = r.village === selectedVillage;
        const matchesVillageName = resolveName(r.village) === resolveName(selectedVillage);
        if (!matchesVillageId && !matchesVillageName) {
          return false;
        }
      }

      // 3. Debounced Search filter
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
        const nameMatch = r.name.toLowerCase().includes(q);
        const phoneMatch = r.phone.includes(q);
        const occMatch = (r.occupation || '').toLowerCase().includes(q);
        const relMatch = (r.relation || '').toLowerCase().includes(q);
        const villageMatch = resolveName(r.village).toLowerCase().includes(q);
        const mandalMatch = resolveName(r.mandal).toLowerCase().includes(q);
        return nameMatch || phoneMatch || occMatch || relMatch || villageMatch || mandalMatch;
      }

      return true;
    });
  }, [relatives, selectedMandal, selectedVillage, debouncedSearchQuery, configs, configMap]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredRelatives.length / pageSize));

  const paginatedRelatives = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRelatives.slice(startIndex, startIndex + pageSize);
  }, [filteredRelatives, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClearFilters = () => {
    setSelectedMandal('ALL');
    setSelectedVillage('ALL');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
  };

  // Modal open helpers
  const handleOpenAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      occupation: '',
      district: '',
      mandal: '',
      village: selectedVillage !== 'ALL' ? selectedVillage : '',
      relation: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contact: RelativeContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      occupation: contact.occupation || '',
      district: contact.district || '',
      mandal: contact.mandal || '',
      village: contact.village || '',
      relation: contact.relation || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.village.trim()) {
      alert('Please fill in Name, Phone, and Village.');
      return;
    }

    setSaving(true);
    try {
      const url = editingContact ? `/api/relatives/${editingContact.id}` : '/api/relatives';
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        if (editingContact) {
          setRelatives(relatives.map(r => r.id === editingContact.id ? data.relative : r));
        } else {
          setRelatives([data.relative, ...relatives]);
        }
        handleCloseModal();
      } else {
        alert(data.error || 'Failed to save contact');
      }
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from your relatives list?`)) return;

    try {
      const res = await fetch(`/api/relatives/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRelatives(relatives.filter(r => r.id !== id));
      } else {
        alert('Failed to delete contact');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete contact');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link href="/employee" className="btn-icon" style={{ color: '#fff' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HeartHandshake size={20} color="#38bdf8" /> Village Relatives
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.85 }}>
              Contacts & relatives in your assigned villages
            </p>
          </div>
        </div>

        <button 
          onClick={handleOpenAddModal}
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
            border: 'none',
            color: '#fff',
            fontSize: '0.8rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
          }}
        >
          <Plus size={16} /> Add Relative
        </button>
      </header>

      {/* Main Content Area */}
      <div style={{ padding: '1rem' }}>

        {/* Quick Metrics Overview Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '0.65rem 0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{relatives.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Contacts</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '0.65rem 0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{Object.keys(mandalCounts).length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Mandals</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '0.65rem 0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{Object.keys(contactVillages).length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Villages</div>
          </div>
        </div>
        
        {/* Filter & Search Bar */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
            
            {/* Debounced Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search name, phone, occupation, relation, village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
              {isSearching ? (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: '#2563eb' }} />
                </div>
              ) : searchQuery ? (
                <button
                  onClick={() => { setSearchQuery(''); setDebouncedSearchQuery(''); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {/* Hierarchical Filters: Mandal & Village */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              
              {/* Step 1: Mandal Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#334155', fontWeight: 700, marginBottom: '0.3rem' }}>
                  <Building2 size={14} color="#2563eb" /> 1. Filter Mandal:
                </label>
                <select
                  value={selectedMandal}
                  onChange={(e) => handleMandalFilterChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    border: selectedMandal !== 'ALL' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: selectedMandal !== 'ALL' ? '#eff6ff' : '#ffffff',
                    fontWeight: 600,
                    color: selectedMandal !== 'ALL' ? '#1d4ed8' : '#0f172a'
                  }}
                >
                  <option value="ALL">All Mandals ({relatives.length})</option>
                  {configs
                    .filter(c => c.type === 'MANDAL')
                    .sort((a, b) => a.value.localeCompare(b.value))
                    .map(m => {
                      const count = mandalCounts[m.id] || mandalCounts[m.value] || 0;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.value} {count > 0 ? `(${count})` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Step 2: Village Filter (hierarchically cascaded by selected Mandal) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#334155', fontWeight: 700, marginBottom: '0.3rem' }}>
                  <MapPin size={14} color="#059669" /> 2. Filter Village:
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => handleVillageFilterChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    border: selectedVillage !== 'ALL' ? '2px solid #059669' : '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: selectedVillage !== 'ALL' ? '#f0fdf4' : '#ffffff',
                    fontWeight: 600,
                    color: selectedVillage !== 'ALL' ? '#15803d' : '#0f172a'
                  }}
                >
                  <option value="ALL">
                    {selectedMandal !== 'ALL' ? `All Villages in ${resolveName(selectedMandal)}` : `All Villages (${relatives.length})`}
                  </option>
                  {filterVillageOptions.map(v => {
                    const count = contactVillages[v.id] || contactVillages[v.value] || 0;
                    return (
                      <option key={v.id} value={v.id}>
                        {v.value} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

            </div>

          </div>

          {/* Active Filter Pill & Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b' }}>
            <span>
              Showing <strong>{filteredRelatives.length}</strong> {filteredRelatives.length === 1 ? 'relative' : 'relatives'}
              {selectedMandal !== 'ALL' && (
                <> in <strong style={{ color: '#1d4ed8' }}>{resolveName(selectedMandal)}</strong> Mandal</>
              )}
              {selectedVillage !== 'ALL' && (
                <> ➔ <strong style={{ color: '#15803d' }}>{resolveName(selectedVillage)}</strong> Village</>
              )}
            </span>
            {(selectedMandal !== 'ALL' || selectedVillage !== 'ALL' || searchQuery || debouncedSearchQuery) && (
              <button
                onClick={handleClearFilters}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <X size={13} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Anchor for Smooth Pagination Scroll */}
        <div ref={listTopRef} />

        {/* Contacts Grid */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="card"
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e2e8f0', opacity: 0.6 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                    <div style={{ width: '35%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                    <div style={{ width: '20%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                  </div>
                </div>
                <div style={{ width: '60%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{ height: '36px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                  <div style={{ height: '36px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRelatives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <HeartHandshake size={52} style={{ margin: '0 auto 1rem', opacity: 0.25, color: '#2563eb' }} />
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
              {relatives.length === 0 ? 'No Relatives Added Yet' : 'No Contacts Match Filters'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              {relatives.length === 0 
                ? 'Save your family, friends, and trusted local contacts across villages for easy coordination.' 
                : 'Try adjusting your search query or selecting "All Villages".'}
            </p>
            {relatives.length === 0 ? (
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem', borderRadius: '10px' }}
              >
                <Plus size={16} /> Add Your First Contact
              </button>
            ) : (
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                Show All Contacts
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {paginatedRelatives.map((contact) => (
              <div 
                key={contact.id}
                className="card"
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* Top Row: Name, Relation, Edit/Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      color: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem'
                    }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                          {contact.name}
                        </h3>
                        {contact.relation && (
                          <span style={{
                            fontSize: '0.68rem',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: 600,
                            letterSpacing: '0.3px'
                          }}>
                            {contact.relation}
                          </span>
                        )}
                      </div>
                      
                      {contact.occupation && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <Briefcase size={12} color="#64748b" /> {contact.occupation}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => handleOpenEditModal(contact)}
                      title="Edit Contact"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.4rem',
                        cursor: 'pointer',
                        color: '#475569'
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id, contact.name)}
                      title="Delete Contact"
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.4rem',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Village / Location Row with Hierarchy */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'wrap',
                  gap: '0.4rem', 
                  fontSize: '0.8rem', 
                  color: '#475569', 
                  backgroundColor: '#f8fafc', 
                  padding: '0.45rem 0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid #f1f5f9' 
                }}>
                  <MapPin size={14} color="#0284c7" />
                  {contact.mandal && (
                    <>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        {resolveName(contact.mandal)}
                      </span>
                      <span style={{ color: '#94a3b8' }}>➔</span>
                    </>
                  )}
                  <span>
                    Village: <strong style={{ color: '#0f172a' }}>{resolveName(contact.village)}</strong>
                  </span>
                </div>

                {/* Bottom Row: Call and WhatsApp buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', paddingTop: '0.25rem' }}>
                  <a
                    href={`tel:${contact.phone}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '10px',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={15} /> Call ({contact.phone})
                  </a>

                  <a
                    href={`https://wa.me/91${contact.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem',
                      borderRadius: '10px',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                </div>

              </div>
            ))}

            {/* Pagination Controls (Limit 10 default) */}
            {filteredRelatives.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.1rem 0.5rem 0.5rem',
                marginTop: '0.5rem',
                borderTop: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong>–<strong>{Math.min(currentPage * pageSize, filteredRelatives.length)}</strong> of <strong>{filteredRelatives.length}</strong> contacts
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {/* Page Size Selector */}
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      backgroundColor: '#ffffff',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                      outline: 'none',
                      marginRight: '0.25rem'
                    }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>

                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage <= 1}
                    title="First Page"
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                      color: currentPage <= 1 ? '#cbd5e1' : '#475569',
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronsLeft size={15} />
                  </button>

                  {/* Prev Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                      color: currentPage <= 1 ? '#cbd5e1' : '#0f172a',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>

                  {/* Page indicator pill */}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', padding: '0 0.4rem' }}>
                    {currentPage} / {totalPages}
                  </span>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                      color: currentPage >= totalPages ? '#cbd5e1' : '#0f172a',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                  >
                    Next <ChevronRight size={15} />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage >= totalPages}
                    title="Last Page"
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                      color: currentPage >= totalPages ? '#cbd5e1' : '#475569',
                      cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronsRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ADD / EDIT RELATIVE MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.1rem 1.4rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <HeartHandshake size={20} color="#38bdf8" />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {editingContact ? 'Edit Relative Contact' : 'Add Village Relative'}
                </h2>
              </div>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveContact} style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Relative Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sanyasi Rao"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Phone Number *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="10 digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Relation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Relation (Optional)
                </label>
                <input
                  type="text"
                  list="relation-options"
                  placeholder="e.g. Uncle, Cousin, Brother, Friend, Sarpanch"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                <datalist id="relation-options">
                  <option value="Uncle" />
                  <option value="Aunt" />
                  <option value="Brother" />
                  <option value="Cousin" />
                  <option value="In-Law" />
                  <option value="Family Friend" />
                  <option value="Relative" />
                </datalist>
              </div>

              {/* Occupation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Occupation
                </label>
                <input
                  type="text"
                  list="occupation-options"
                  placeholder="Select or type occupation (e.g. Farmer, Business, Teacher)"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
                <datalist id="occupation-options">
                  {availableOccupations.map(occ => (
                    <option key={occ} value={occ} />
                  ))}
                  <option value="Farmer / Agriculture" />
                  <option value="Business" />
                  <option value="Govt Employee" />
                  <option value="Private Employee" />
                  <option value="Teacher" />
                  <option value="Driver" />
                </datalist>
              </div>

              {/* Location Cascade */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Village Location
                </span>

                {/* Mandal optional filter */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Filter by Mandal
                    </label>
                    <select
                      value={formData.mandal}
                      onChange={(e) => handleFormMandalChange(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#fff' }}
                    >
                      <option value="">All Mandals</option>
                      {getByType('MANDAL').map(m => (
                        <option key={m.id} value={m.id}>{m.value}</option>
                      ))}
                    </select>
                  </div>

                  {/* Village Dropdown */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, marginBottom: '0.25rem' }}>
                      Village *
                    </label>
                    <select
                      required
                      value={formData.village}
                      onChange={(e) => handleFormVillageChange(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1.5px solid #2563eb', fontSize: '0.8rem', backgroundColor: '#fff', fontWeight: 500 }}
                    >
                      <option value="">Select Village *</option>
                      {availableVillages.map(v => (
                        <option key={v.id} value={v.id}>{v.value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
                  }}
                >
                  {saving ? 'Saving...' : (editingContact ? 'Save Changes' : 'Add Contact')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
