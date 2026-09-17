'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';

function ConfigSection({ type, items, configs, handleDelete, handleAdd, getByType, getByParent }: any) {
  const [valueState, setValueState] = useState('');
  
  // For Schools
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');

  let filteredItems = items;
  if (type === 'SCHOOL') {
    if (village) {
      filteredItems = items.filter((s: any) => s.parentId === village);
    } else if (mandal) {
      const mandalVillages = getByParent('VILLAGE', mandal).map((v: any) => v.id);
      filteredItems = items.filter((s: any) => mandalVillages.includes(s.parentId));
    } else if (district) {
      const districtMandals = getByParent('MANDAL', district).map((m: any) => m.id);
      const districtVillages = configs.filter((c: any) => c.type === 'VILLAGE' && districtMandals.includes(c.parentId)).map((v: any) => v.id);
      filteredItems = items.filter((s: any) => districtVillages.includes(s.parentId));
    }
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [district, mandal, village, items.length]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const onAddClick = () => {
    handleAdd(type, valueState, setValueState, type === 'SCHOOL' ? village : undefined);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px', marginBottom: 0 }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {type.replace('_', ' ')}
      </h2>
      
      {type === 'SCHOOL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <select className="form-control" value={district} onChange={(e) => { setDistrict(e.target.value); setMandal(''); setVillage(''); }}>
            <option value="">Select District</option>
            {getByType('DISTRICT').map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>
          
          {district && (
            <select className="form-control" value={mandal} onChange={(e) => { setMandal(e.target.value); setVillage(''); }}>
              <option value="">Select Mandal</option>
              {getByParent('MANDAL', district).map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          )}

          {mandal && (
            <select className="form-control" value={village} onChange={(e) => setVillage(e.target.value)}>
              <option value="">Select Village</option>
              {getByParent('VILLAGE', mandal).map((c: any) => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
          )}
        </div>
      )}

      {(type !== 'SCHOOL' || village) && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder={type === 'SCHOOL' ? "Add School Name..." : "Add new..."} 
            value={valueState}
            onChange={(e) => setValueState(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddClick()}
          />
          <button className="btn btn-primary" onClick={onAddClick} style={{ padding: '0.5rem' }}>
            <Plus size={20} />
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentItems.map((item: any) => {
          let parentVillage = null;
          if (type === 'SCHOOL' && item.parentId) {
            parentVillage = configs.find((c: any) => c.id === item.parentId);
          }
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.value}</span>
                {parentVillage && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Village: {parentVillage.value}</span>}
              </div>
              <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        {filteredItems.length === 0 && <p className="text-muted" style={{ fontSize: '0.875rem' }}>No items found.</p>}
      </div>

      {filteredItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.25rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfigPage() {
  const params = useParams();
  const routeType = params.type as string;

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
    setLoading(false);
  };

  const getDbTypes = (): string[] => {
    if (routeType === 'groups') return ['GROUP'];
    if (routeType === 'occupations') return ['OCCUPATION'];
    if (routeType === 'schools') return ['SCHOOL'];
    if (routeType === 'statuses') return ['STATUS'];
    if (routeType === 'survey') return ['STUDY_INTEREST', 'FEE_BEARABLE', 'EDUCATION_STAGE'];
    return [];
  };

  const getTitle = () => {
    if (routeType === 'survey') return 'Survey Fields';
    return routeType.charAt(0).toUpperCase() + routeType.slice(1);
  };

  const getByType = (t: string) => configs.filter(c => c.type === t);
  const getByParent = (t: string, pid: string) => configs.filter(c => c.type === t && c.parentId === pid);

  const handleAdd = async (type: string, value: string, setter: any, parentId?: string) => {
    if (!value) return;
    if (type === 'SCHOOL' && !parentId) {
      alert("Please select a Village first to add a School.");
      return;
    }
    
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, parentId })
      });
      if (res.ok) {
        setter('');
        fetchConfigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;
    try {
      const res = await fetch(`/api/config/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfigs(configs.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dbTypes = getDbTypes();

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Manage {getTitle()}</h1>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: dbTypes.length > 1 ? '1fr 1fr' : '1fr' }}>
          {dbTypes.map((type) => {
            const items = configs.filter(c => c.type === type);
            return (
              <ConfigSection 
                key={type}
                type={type}
                items={items}
                configs={configs}
                handleAdd={handleAdd}
                handleDelete={handleDelete}
                getByType={getByType}
                getByParent={getByParent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
