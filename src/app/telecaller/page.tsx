'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, FileText, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TelecallerDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);
  const router = useRouter();

  // We can filter by follow up date or status later
  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.students) setStudents(data.students);
        setLoading(false);
      });

    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.configs) setConfigs(data.configs);
      });
  }, []);

  const getStatuses = () => configs.filter(c => c.type === 'STATUS');

  const handleUpdate = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setStudents(students.map(s => s.id === id ? { ...s, ...updates } : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Telecaller Dashboard</h1>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total Leads: {students.length}</div>
        </div>
        <Link href="/reports/generate" className="btn btn-outline" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} /> Generate PDF
        </Link>
      </header>

      {loading ? (
        <p>Loading leads...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map(student => (
            <div key={student.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{student.studentName}</h3>
                <span className="badge badge-primary">{student.group}</span>
              </div>
              
              <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Added by: <strong>{student.employee?.name || student.employeeId}</strong>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <a href={`tel:${student.phone}`} className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <Phone size={16} /> Call
                </a>
                {student.whatsapp && (
                  <a href={`https://wa.me/91${student.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-success" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
              </div>

              {/* Editable Fields for Telecaller */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, minWidth: '100px' }}>Status:</label>
                  <select 
                    className="form-control" 
                    value={student.leadStatus || 'New'} 
                    onChange={(e) => handleUpdate(student.id, { leadStatus: e.target.value })}
                    style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                  >
                    <option value="New">New</option>
                    {getStatuses().map(s => <option key={s.id} value={s.value}>{s.value}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, minWidth: '100px' }}>Follow Up:</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={student.nextFollowUpDate ? new Date(student.nextFollowUpDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleUpdate(student.id, { nextFollowUpDate: e.target.value })}
                    style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Remarks:</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    value={student.remarks || ''}
                    onChange={(e) => setStudents(students.map(s => s.id === student.id ? { ...s, remarks: e.target.value } : s))}
                    onBlur={(e) => handleUpdate(student.id, { remarks: e.target.value })}
                    placeholder="Add telecalling remarks here..."
                    style={{ fontSize: '0.875rem' }}
                  ></textarea>
                </div>
              </div>

            </div>
          ))}
          {students.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No students found.</p>}
        </div>
      )}
    </div>
  );
}
