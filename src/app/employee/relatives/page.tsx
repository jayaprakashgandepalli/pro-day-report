'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Phone, MessageCircle, 
  MapPin, Briefcase, HeartHandshake, Trash2, Edit2, 
  X, Filter, Check, User, Building2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2, Users, Map,
  ChevronDown, ChevronUp, SlidersHorizontal
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

const STANDARD_RELATIONS = [
  'Uncle',
  'Aunt',
  'Brother',
  'Sister',
  'Cousin',
  'In-Law',
  'Family Friend',
  'Relative',
  'Village Leader / Sarpanch'
];

const STANDARD_OCCUPATIONS = [
  'Agriculture / Farmer',
  'Business',
  'Govt Employee',
  'Private Employee',
  'Teacher',
  'Driver',
  'Daily Wage Worker / Coolie',
  'Housewife',
  'Student',
  'Self Employed',
  'Retired'
];

export default function VillageRelativesPage() {
  const [relatives, setRelatives] = useState<RelativeContact[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hierarchical Filters: Mandal, Village & Occupation
  const [selectedMandal, setSelectedMandal] = useState('ALL');
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  const [selectedOccupation, setSelectedOccupation] = useState('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount = (selectedMandal !== 'ALL' ? 1 : 0) + 
                            (selectedVillage !== 'ALL' ? 1 : 0) + 
                            (selectedOccupation !== 'ALL' ? 1 : 0);
  
  // Search & Debounce Optimization
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Pagination Optimization (Default Limit 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const listTopRef = useRef<HTMLDivElement>(null);

  // Expandable Contact State (Phone contact list style)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getAvatarStyle = (name: string) => {
    const palettes = [
      { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, // Blue
      { bg: '#fef3c7', color: '#b45309', border: '#fde68a' }, // Amber
      { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }, // Green
      { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' }, // Purple
      { bg: '#ffe4e6', color: '#be123c', border: '#fecdd3' }, // Rose
      { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' }, // Orange
      { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' }, // Indigo
      { bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' }, // Teal
    ];
    const charCode = (name && name.length > 0) ? name.charCodeAt(0) : 0;
    return palettes[charCode % palettes.length];
  };

  // Helper to parse composite occupation: "Teacher (Anakapalle)" -> { role: 'Teacher', workLocation: 'Anakapalle' }
  const parseOccupation = (raw: string | null | undefined) => {
    if (!raw) return { role: '', workLocation: '' };
    const parenMatch = raw.match(/^(.*?)\s*\((.*?)\)$/);
    if (parenMatch) {
      return { role: parenMatch[1].trim(), workLocation: parenMatch[2].trim() };
    }
    const dashMatch = raw.match(/^(.*?)\s*[-•]\s*(.*)$/);
    if (dashMatch) {
      return { role: dashMatch[1].trim(), workLocation: dashMatch[2].trim() };
    }
    return { role: raw.trim(), workLocation: '' };
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<RelativeContact | null>(null);
  const [saving, setSaving] = useState(false);
  const [isCustomOccupation, setIsCustomOccupation] = useState(false);
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [formWorkLocation, setFormWorkLocation] = useState('');

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
  }, [debouncedSearchQuery, selectedMandal, selectedVillage, selectedOccupation, pageSize]);

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

  // Distinct occupations from existing contacts with counts
  const occupationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    relatives.forEach(r => {
      if (r.occupation && r.occupation.trim()) {
        const { role } = parseOccupation(r.occupation);
        if (role) {
          counts[role] = (counts[role] || 0) + 1;
        }
      }
    });
    return counts;
  }, [relatives]);

  // Combined options for occupation filter
  const filterOccupationOptions = useMemo(() => {
    const occSet = new Set<string>();
    relatives.forEach(r => {
      if (r.occupation && r.occupation.trim()) {
        const { role } = parseOccupation(r.occupation);
        if (role) occSet.add(role);
      }
    });
    STANDARD_OCCUPATIONS.forEach(o => occSet.add(o));
    return Array.from(occSet).sort((a, b) => a.localeCompare(b));
  }, [relatives]);

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

      // 3. Occupation filter
      if (selectedOccupation !== 'ALL') {
        const { role } = parseOccupation(r.occupation);
        const contactOcc = (role || '').trim().toLowerCase();
        const targetOcc = selectedOccupation.trim().toLowerCase();
        if (contactOcc !== targetOcc) {
          const isFuzzyMatch = (contactOcc.includes('agriculture') && targetOcc.includes('agriculture')) ||
                               (contactOcc.includes('farmer') && targetOcc.includes('farmer'));
          if (!isFuzzyMatch) {
            return false;
          }
        }
      }

      // 4. Debounced Search filter
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
  }, [relatives, selectedMandal, selectedVillage, selectedOccupation, debouncedSearchQuery, configs, configMap]);

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
    setSelectedOccupation('ALL');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
  };

  const handleResetDropdownFilters = () => {
    setSelectedMandal('ALL');
    setSelectedVillage('ALL');
    setSelectedOccupation('ALL');
    setCurrentPage(1);
  };

  // Modal open helpers
  const handleOpenAddModal = () => {
    setEditingContact(null);
    setIsCustomOccupation(false);
    setIsCustomRelation(false);
    setFormWorkLocation('');
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
    const { role, workLocation } = parseOccupation(contact.occupation);
    setFormWorkLocation(workLocation);

    const occIsStd = STANDARD_OCCUPATIONS.includes(role) || availableOccupations.includes(role) || role === 'Agriculture';
    setIsCustomOccupation(Boolean(role) && !occIsStd);

    const rel = contact.relation || '';
    const relIsStd = STANDARD_RELATIONS.includes(rel);
    setIsCustomRelation(Boolean(rel) && !relIsStd);

    setFormData({
      name: contact.name,
      phone: contact.phone,
      occupation: role,
      district: contact.district || '',
      mandal: contact.mandal || '',
      village: contact.village || '',
      relation: rel
    });
    setIsModalOpen(true);
  };

  const handleOccupationSelectChange = (val: string) => {
    if (val === 'OTHER') {
      setIsCustomOccupation(true);
      setFormData(prev => ({ ...prev, occupation: '' }));
    } else {
      setIsCustomOccupation(false);
      setFormData(prev => ({ ...prev, occupation: val }));
    }
  };

  const handleRelationSelectChange = (val: string) => {
    if (val === 'OTHER') {
      setIsCustomRelation(true);
      setFormData(prev => ({ ...prev, relation: '' }));
    } else {
      setIsCustomRelation(false);
      setFormData(prev => ({ ...prev, relation: val }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setIsCustomOccupation(false);
    setIsCustomRelation(false);
    setFormWorkLocation('');
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

      const finalOccupation = formWorkLocation.trim()
        ? (formData.occupation.trim() 
            ? `${formData.occupation.trim()} (${formWorkLocation.trim()})` 
            : formWorkLocation.trim())
        : (formData.occupation.trim() || null);

      const payload = {
        ...formData,
        occupation: finalOccupation
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link 
            href="/employee" 
            title="Back to Dashboard"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <HeartHandshake size={20} color="#2563eb" /> Village Relatives
            </h1>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
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


        
        {/* Search Bar & Filter Action Row */}
        <div style={{ marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search name, phone, occupation, village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease'
                }}
              />
              {isSearching ? (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Loader2 size={16} className="animate-spin" style={{ color: '#2563eb' }} />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setDebouncedSearchQuery(''); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: activeFilterCount > 0 ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
                backgroundColor: activeFilterCount > 0 ? '#2563eb' : '#ffffff',
                color: activeFilterCount > 0 ? '#ffffff' : '#334155',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeFilterCount > 0 ? '0 4px 12px rgba(37,99,235,0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <SlidersHorizontal size={17} color={activeFilterCount > 0 ? '#ffffff' : '#475569'} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span style={{
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  borderRadius: '999px',
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 5px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '2px'
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Tags (if any selected) */}
          {activeFilterCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexWrap: 'wrap',
              marginTop: '0.55rem',
              paddingLeft: '0.2rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active:</span>

              {selectedMandal !== 'ALL' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  🏢 {resolveName(selectedMandal)}
                  <button
                    type="button"
                    onClick={() => handleMandalFilterChange('ALL')}
                    style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {selectedVillage !== 'ALL' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  📍 {resolveName(selectedVillage)}
                  <button
                    type="button"
                    onClick={() => handleVillageFilterChange('ALL')}
                    style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {selectedOccupation !== 'ALL' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  💼 {selectedOccupation}
                  <button
                    type="button"
                    onClick={() => setSelectedOccupation('ALL')}
                    style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetDropdownFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  textDecoration: 'underline'
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Result Count Status Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
            padding: '0 0.2rem',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <span>
              Showing <strong style={{ color: '#0f172a' }}>{filteredRelatives.length}</strong> {filteredRelatives.length === 1 ? 'contact' : 'contacts'}
              {searchQuery && <> for &quot;<strong>{searchQuery}</strong>&quot;</>}
            </span>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Reset all
              </button>
            )}
          </div>
        </div>

        {/* Anchor for Smooth Pagination Scroll */}
        <div ref={listTopRef} />

        {/* Contacts List (Phone Contact Style) */}
        {loading ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                style={{
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  borderBottom: i !== 4 ? '1px solid #f1f5f9' : 'none'
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e2e8f0', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ width: '40%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                  <div style={{ width: '60%', height: '11px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9' }} />
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
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              {paginatedRelatives.map((contact, index) => {
                const isExpanded = expandedId === contact.id;
                const avatarStyle = getAvatarStyle(contact.name);
                const isLast = index === paginatedRelatives.length - 1;

                return (
                  <div 
                    key={contact.id}
                    style={{
                      borderBottom: !isLast ? '1px solid #f1f5f9' : 'none',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: isExpanded ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    {/* Phone Contact Row (Click anywhere to expand/collapse) */}
                    <div
                      onClick={() => toggleExpand(contact.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      {/* Circle Avatar with Initial */}
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: avatarStyle.bg,
                        color: avatarStyle.color,
                        border: `1.5px solid ${avatarStyle.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        flexShrink: 0
                      }}>
                        {contact.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Main Name & Subtitle */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.98rem',
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {contact.name}
                          </span>
                          {contact.relation && (
                            <span style={{
                              fontSize: '0.68rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              {contact.relation}
                            </span>
                          )}
                        </div>

                        {/* Phone & Occupation subtitle */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.8rem',
                          color: '#64748b',
                          marginTop: '0.15rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          <span style={{ color: '#334155', fontWeight: 500 }}>
                            {contact.phone}
                          </span>
                          {contact.occupation && (() => {
                            const { role, workLocation } = parseOccupation(contact.occupation);
                            return (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span style={{ color: '#475569', fontWeight: 500 }}>{role}</span>
                                {workLocation && (
                                  <span style={{
                                    fontSize: '0.72rem',
                                    color: '#0369a1',
                                    backgroundColor: '#e0f2fe',
                                    padding: '0.08rem 0.4rem',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    📍 {workLocation}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right Action Icons: Quick Call & Expand Chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          title={`Call ${contact.name}`}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Phone size={15} />
                        </a>

                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isExpanded ? '#2563eb' : '#94a3b8'
                          }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Contact Card (Shows all details on click) */}
                    {isExpanded && (
                      <div style={{
                        padding: '0.9rem 1rem 1.1rem 1rem',
                        backgroundColor: '#f8fafc',
                        borderTop: '1px solid #edf2f7',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}>
                        {/* Location & Meta Information Card */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                          gap: '0.6rem',
                          backgroundColor: '#ffffff',
                          padding: '0.75rem 0.85rem',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.8rem'
                        }}>
                          {/* Mandal */}
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Building2 size={12} color="#2563eb" /> Mandal
                            </div>
                            <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '0.15rem' }}>
                              {resolveName(contact.mandal) || 'Not Specified'}
                            </div>
                          </div>

                          {/* Village */}
                          <div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} color="#059669" /> Native Village
                            </div>
                            <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '0.15rem' }}>
                              {resolveName(contact.village)}
                            </div>
                          </div>

                          {/* Occupation & Workplace */}
                          {contact.occupation && (() => {
                            const { role, workLocation } = parseOccupation(contact.occupation);
                            return (
                              <>
                                <div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Briefcase size={12} color="#64748b" /> Occupation
                                  </div>
                                  <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '0.15rem' }}>
                                    {role}
                                  </div>
                                </div>

                                {workLocation && (
                                  <div>
                                    <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                      <Building2 size={12} color="#0284c7" /> Workplace / Location
                                    </div>
                                    <div style={{ color: '#0369a1', fontWeight: 600, marginTop: '0.15rem' }}>
                                      📍 {workLocation}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {/* Relation */}
                          {contact.relation && (
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <HeartHandshake size={12} color="#d97706" /> Relation
                              </div>
                              <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '0.15rem' }}>
                                {contact.relation}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Full Actions: Call, WhatsApp, Edit, Delete */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
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
                              fontSize: '0.82rem',
                              textDecoration: 'none'
                            }}
                          >
                            <Phone size={14} /> Call ({contact.phone})
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
                              fontSize: '0.82rem',
                              textDecoration: 'none'
                            }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        </div>

                        {/* Edit and Delete Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.15rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(contact);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact.id, contact.name);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>

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

      {/* FILTER BOTTOM SHEET / MODAL */}
      {isFilterModalOpen && (
        <div 
          onClick={() => setIsFilterModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.1rem 1.35rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(37,99,235,0.25)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SlidersHorizontal size={18} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                    Filter Contacts
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                    Filter by Mandal, Village or Occupation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Controls Body */}
            <div style={{
              padding: '1.3rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.15rem'
            }}>
              {/* 1. Mandal */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.45rem' }}>
                  <Building2 size={16} color="#2563eb" /> 1. Mandal:
                </label>
                <select
                  value={selectedMandal}
                  onChange={(e) => handleMandalFilterChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.68rem 0.85rem',
                    borderRadius: '10px',
                    border: selectedMandal !== 'ALL' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    backgroundColor: selectedMandal !== 'ALL' ? '#eff6ff' : '#ffffff',
                    color: selectedMandal !== 'ALL' ? '#1d4ed8' : '#0f172a',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">🏢 All Mandals ({relatives.length})</option>
                  {configs
                    .filter(c => c.type === 'MANDAL')
                    .sort((a, b) => a.value.localeCompare(b.value))
                    .map(m => {
                      const count = mandalCounts[m.id] || mandalCounts[m.value] || 0;
                      return (
                        <option key={m.id} value={m.id}>
                          🏢 {m.value} {count > 0 ? `(${count})` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* 2. Village */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.45rem' }}>
                  <MapPin size={16} color="#059669" /> 2. Village:
                  {selectedMandal !== 'ALL' && (
                    <span style={{ fontSize: '0.74rem', color: '#2563eb', fontWeight: 600 }}>
                      (in {resolveName(selectedMandal)})
                    </span>
                  )}
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => handleVillageFilterChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.68rem 0.85rem',
                    borderRadius: '10px',
                    border: selectedVillage !== 'ALL' ? '2px solid #059669' : '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    backgroundColor: selectedVillage !== 'ALL' ? '#f0fdf4' : '#ffffff',
                    color: selectedVillage !== 'ALL' ? '#15803d' : '#0f172a',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">
                    📍 {selectedMandal !== 'ALL' ? `All Villages in ${resolveName(selectedMandal)}` : 'All Villages'}
                  </option>
                  {filterVillageOptions.map(v => {
                    const count = contactVillages[v.id] || contactVillages[v.value] || 0;
                    return (
                      <option key={v.id} value={v.id}>
                        📍 {v.value} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Occupation */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.45rem' }}>
                  <Briefcase size={16} color="#d97706" /> 3. Occupation:
                </label>
                <select
                  value={selectedOccupation}
                  onChange={(e) => setSelectedOccupation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.68rem 0.85rem',
                    borderRadius: '10px',
                    border: selectedOccupation !== 'ALL' ? '2px solid #d97706' : '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    backgroundColor: selectedOccupation !== 'ALL' ? '#fffbeb' : '#ffffff',
                    color: selectedOccupation !== 'ALL' ? '#b45309' : '#0f172a',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">💼 All Occupations ({relatives.length})</option>
                  {filterOccupationOptions.map(occ => {
                    const count = occupationCounts[occ] || 0;
                    return (
                      <option key={occ} value={occ}>
                        💼 {occ} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '1rem 1.3rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={handleResetDropdownFilters}
                disabled={activeFilterCount === 0}
                style={{
                  padding: '0.65rem 1.1rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: activeFilterCount === 0 ? '#94a3b8' : '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: activeFilterCount === 0 ? 'not-allowed' : 'pointer',
                  opacity: activeFilterCount === 0 ? 0.6 : 1
                }}
              >
                Reset All
              </button>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.7rem 1.25rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem'
                }}
              >
                <Check size={16} /> Show Results ({filteredRelatives.length})
              </button>
            </div>
          </div>
        </div>
      )}

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
                <select
                  value={isCustomRelation ? 'OTHER' : (formData.relation || '')}
                  onChange={(e) => handleRelationSelectChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="">Select Relation (Optional)</option>
                  {STANDARD_RELATIONS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                  <option value="OTHER">Other (Type custom)</option>
                </select>
                {isCustomRelation && (
                  <input
                    type="text"
                    placeholder="Enter custom relation (e.g. Sarpanch, Neighbor)"
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: '0.45rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                )}
              </div>

              {/* Occupation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Occupation (Optional)
                </label>
                <select
                  value={isCustomOccupation ? 'OTHER' : (formData.occupation || '')}
                  onChange={(e) => handleOccupationSelectChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="">Select Occupation (Optional)</option>
                  {STANDARD_OCCUPATIONS.map(occ => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                  {availableOccupations
                    .filter(o => !STANDARD_OCCUPATIONS.includes(o))
                    .map(occ => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  <option value="OTHER">Other (Type custom)</option>
                </select>
                {isCustomOccupation && (
                  <input
                    type="text"
                    placeholder="Enter custom occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    style={{
                      width: '100%',
                      marginTop: '0.45rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                )}
              </div>

              {/* Workplace / Job Location (Optional) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  <Building2 size={15} color="#0284c7" /> Workplace / Job Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anakapalle, Visakhapatnam, Hyderabad, Steel Plant..."
                  value={formWorkLocation}
                  onChange={(e) => setFormWorkLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  ఉద్యోగం / వ్యాపారం చేసే ఊరు లేదా ఆఫీస్ (సొంతూరు కాకుండా వేరే ప్రదేశమైతే రాయండి)
                </span>
              </div>

              {/* Location Cascade */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="#059669" /> Residential / Native Village (నివాస గ్రామం)
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
