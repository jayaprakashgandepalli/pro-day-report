'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Edit, Trash2, Search, FileText } from 'lucide-react';

type Student = {
  id: string;
  studentName: string;
  fatherName: string | null;
  phone: string;
  whatsapp: string | null;
  group: string;
  schoolName: string | null;
  schoolArea: string | null;
};

export default function TodayReport() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/students?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    // In a real app, you'd call a DELETE API endpoint here.
    // For now, we'll just remove from state to simulate.
    // const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    setStudents(students.filter(s => s.id !== id));
  };

  const filteredStudents = students.filter(s => 
    s.studentName.toLowerCase().includes(search.toLowerCase()) || 
    s.phone.includes(search)
  );

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" className="btn-icon">
            <ArrowLeft />
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Today's Report</h1>
        </div>
        <Link href="/reports/generate" className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          <FileText size={16} /> PDF
        </Link>
      </header>

      <div className="form-group" style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search name or phone..." 
          style={{ paddingLeft: '2.5rem' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Total: {filteredStudents.length}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading students...</div>
      ) : filteredStudents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No students found for today. <br/><br/>
          <Link href="/students/add" className="btn btn-primary" style={{ display: 'inline-flex', width: 'auto' }}>Add Student</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredStudents.map((s, index) => (
            <div key={s.id} className="card" style={{ marginBottom: 0, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {index + 1}. {s.studentName}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    {s.fatherName ? `Father: ${s.fatherName}` : 'No Father Name'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    <span className="badge badge-neutral">{s.group}</span>
                    {s.schoolName && <span className="badge badge-neutral" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>{s.schoolName}</span>}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/students/edit/${s.id}`} className="btn-icon" style={{ color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit size={18} />
                  </Link>
                  <button className="btn-icon" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <a href={`tel:${s.phone}`} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem' }}>
                  <Phone size={18} /> Call
                </a>
                {s.whatsapp && (
                  <a href={`https://wa.me/${s.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', color: '#16a34a', borderColor: '#16a34a' }}>
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
