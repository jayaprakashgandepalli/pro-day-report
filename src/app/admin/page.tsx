'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [date, setDate] = useState('');
  const [interest, setInterest] = useState('');
  const [fee, setFee] = useState('');
  const [district, setDistrict] = useState('');
  const [mandal, setMandal] = useState('');
  const [village, setVillage] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch, date, interest, fee, district, mandal, village, page]);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.configs) setConfigs(data.configs);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (date) params.append('date', date);
      if (interest) params.append('interest', interest);
      if (fee) params.append('fee', fee);
      
      const activeLocation = village || mandal || district;
      if (activeLocation) params.append('location', activeLocation);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
        setTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRemark = async (id: string, remarks: string) => {
    try {
      await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getConfigName = (id: string | null) => {
    if (!id) return '-';
    const conf = configs.find(c => c.id === id || c.value === id);
    return conf ? conf.value : id;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Students Database</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.5rem 1rem', borderRadius: '999px', fontWeight: 600 }}>
            Total Records: {total}
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0 0.5rem', background: '#fff' }}>
            <Search size={20} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '0.75rem', width: '100%' }}
            />
          </div>

          <input 
            type="date" 
            className="form-control" 
            value={date} 
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
          />

          <select className="form-control" value={interest} onChange={(e) => { setInterest(e.target.value); setPage(1); }}>
            <option value="">All Interests</option>
            {configs.filter(c => c.type === 'STUDY_INTEREST').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>

          <select className="form-control" value={fee} onChange={(e) => { setFee(e.target.value); setPage(1); }}>
            <option value="">All Fee Bearings</option>
            {configs.filter(c => c.type === 'FEE_BEARABLE').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <select className="form-control" value={district} onChange={(e) => { setDistrict(e.target.value); setMandal(''); setVillage(''); setPage(1); }}>
              <option value="">All Districts</option>
              {configs.filter(c => c.type === 'DISTRICT').map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
            </select>
            
            {district && (
              <select className="form-control" value={mandal} onChange={(e) => { setMandal(e.target.value); setVillage(''); setPage(1); }}>
                <option value="">All Mandals</option>
                {configs.filter(c => c.type === 'MANDAL' && c.parentId === district).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            )}

            {mandal && (
              <select className="form-control" value={village} onChange={(e) => { setVillage(e.target.value); setPage(1); }}>
                <option value="">All Villages</option>
                {configs.filter(c => c.type === 'VILLAGE' && c.parentId === mandal).map(c => <option key={c.id} value={c.id}>{c.value}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading students...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Name / Phone</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Location</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Added By</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Interest / Fee</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569', width: '300px' }}>Remarks</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{student.studentName}</div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{student.phone}</div>
                    <span className="badge badge-primary" style={{ marginTop: '0.25rem', display: 'inline-block' }}>{student.group}</span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div>{getConfigName(student.village)}</div>
                    <div style={{ color: '#64748b' }}>{getConfigName(student.mandal)}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {student.employee?.name || student.employeeId}
                    <div style={{ color: '#64748b' }}>{new Date(student.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <div><strong>Int:</strong> {getConfigName(student.studyInterestedAt)}</div>
                    <div><strong>Fee:</strong> {getConfigName(student.ableToBearFee)}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <textarea 
                      className="form-control"
                      rows={2}
                      defaultValue={student.remarks || ''}
                      onBlur={(e) => handleUpdateRemark(student.id, e.target.value)}
                      placeholder="Add remarks..."
                      style={{ fontSize: '0.875rem', padding: '0.5rem', width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <Link href={`/students/edit/${student.id}`} className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.5rem', fontSize: '0.875rem' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No students match the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={20} /> Prev
          </button>
          <span style={{ fontWeight: 500 }}>Page {page} of {totalPages}</span>
          <button 
            className="btn btn-outline" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
