'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

function LocationSection({ type, items, configs, handleDelete, handleAdd, addValues, setAddValues, getByType }: any) {
  // Filter items based on parent selection
  let filteredItems = items;
  const parentValue = addValues[`${type}_parent`];
  
  if (type === 'MANDAL' && parentValue) {
    filteredItems = items.filter((item: any) => item.parentId === parentValue);
  } else if (type === 'VILLAGE' && parentValue) {
    filteredItems = items.filter((item: any) => item.parentId === parentValue);
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [parentValue, items.length]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px', marginBottom: 0 }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {type}
      </h2>
      
      {type === 'MANDAL' && (
        <select className="form-control" style={{ marginBottom: '0.5rem' }} value={addValues[`${type}_parent`] || ''} onChange={(e) => setAddValues((prev: any) => ({ ...prev, [`${type}_parent`]: e.target.value }))}>
          <option value="">-- Select Parent District --</option>
          {getByType('DISTRICT').map((d: any) => <option key={d.id} value={d.id}>{d.value}</option>)}
        </select>
      )}
      
      {type === 'VILLAGE' && (
        <select className="form-control" style={{ marginBottom: '0.5rem' }} value={addValues[`${type}_parent`] || ''} onChange={(e) => setAddValues((prev: any) => ({ ...prev, [`${type}_parent`]: e.target.value }))}>
          <option value="">-- Select Parent Mandal --</option>
          {getByType('MANDAL').map((d: any) => <option key={d.id} value={d.id}>{d.value}</option>)}
        </select>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder={`Add new ${type.toLowerCase()}...`} 
          value={addValues[type] || ''}
          onChange={(e) => setAddValues((prev: any) => ({ ...prev, [type]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd(type, addValues[`${type}_parent`])}
        />
        <button className="btn btn-primary" onClick={() => handleAdd(type, addValues[`${type}_parent`])} style={{ padding: '0.5rem' }}>
          <Plus size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {currentItems.map((item: any) => {
          const parent = configs.find((c: any) => c.id === item.parentId);
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.value}</span>
                {parent && <span className="text-muted" style={{ fontSize: '0.75rem' }}>in {parent.value}</span>}
              </div>
              <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.25rem' }}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        {filteredItems.length === 0 && <p className="text-muted" style={{ fontSize: '0.875rem' }}>No {type.toLowerCase()}s found.</p>}
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

export default function LocationsConfigPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addValues, setAddValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
    setLoading(false);
  };

  const getByType = (t: string) => configs.filter(c => c.type === t);

  const handleAdd = async (type: string, parentId: string | null = null) => {
    const value = addValues[type];
    if (!value) return;

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, parentId })
      });

      if (res.ok) {
        setAddValues(prev => ({ ...prev, [type]: '' }));
        fetchConfigs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const res = await fetch(`/api/config/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfigs(configs.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Locations</h1>

      {loading ? <p>Loading...</p> : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          alignItems: 'start'
        }}>
          {['DISTRICT', 'MANDAL', 'VILLAGE'].map(type => {
            const items = getByType(type);
            return (
              <LocationSection 
                key={type}
                type={type}
                items={items}
                configs={configs}
                handleAdd={handleAdd}
                handleDelete={handleDelete}
                addValues={addValues}
                setAddValues={setAddValues}
                getByType={getByType}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
