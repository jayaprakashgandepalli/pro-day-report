'use client';

import { useState, useEffect } from 'react';
import { Phone, MessageCircle, FileText, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TelecallerDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);
  const [callsMadeToday, setCallsMadeToday] = useState(0);
  const router = useRouter();

  // We can filter by follow up date or status later
  useEffect(() => {
    fetch('/api/students?limit=5000')
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
      
    fetch('/api/telecaller/stats')
      .then(res => res.json())
      .then(data => {
        if (data.callsMadeToday !== undefined) {
          setCallsMadeToday(data.callsMadeToday);
        }
      });
  }, []);

  const configMap = configs.reduce((acc, c) => ({ ...acc, [c.id]: c.value }), {} as Record<string, string>);
  const resolveName = (id: string | null) => id ? (configMap[id] || id) : '';

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

  const newLeadsToday = students.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length;

  const primeStudentsCount = students.filter(s => {
    const interest = resolveName(s.studyInterestedAt).toLowerCase();
    const fee = resolveName(s.ableToBearFee).toLowerCase();
    const g = resolveName(s.group).toUpperCase();

    const isVizag = interest.includes('vizag') || interest.includes('visakhapatnam');
    const isBearable = fee.includes('yes') || fee.includes('bearable');
    const isTargetGroup = g.includes('mpc') || g.includes('bipc') || g.includes('MPC') || g.includes('BIPC');

    return isVizag && isBearable && isTargetGroup;
  }).length;

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <header className="app-header" style={{ margin: '-1rem -1rem 1rem -1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Telecaller Dashboard</h1>
        </div>
      </header>

      {loading ? (
        <p>Loading leads...</p>
      ) : (
        <div>
          {newLeadsToday > 0 && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fca5a5' }}>
              <span>🔔</span> You have {newLeadsToday} new leads added today!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#1e40af' }}>{students.length}</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6' }}>Total Leads Assigned</p>
            </div>
            
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#b45309' }}>
                {students.filter(s => s.nextFollowUpDate && new Date(s.nextFollowUpDate).toDateString() === new Date().toDateString()).length}
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#d97706' }}>Today's Follow-ups</p>
            </div>
            
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe' }}>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#4338ca' }}>{callsMadeToday}</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#6366f1' }}>Calls Made Today</p>
            </div>

            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#166534' }}>
                {students.filter(s => s.leadStatus === 'Admitted').length}
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#22c55e' }}>Total Admitted</p>
            </div>

            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#fdf4ff', border: '1px solid #fbcfe8' }}>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#be185d' }}>{newLeadsToday}</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#db2777' }}>New Leads Today</p>
            </div>

            <Link href="/telecaller/students?preset=prime" prefetch={false} className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#ffedd5', border: '1px solid #fdba74', display: 'block', textDecoration: 'none', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.1), 0 2px 4px -1px rgba(249, 115, 22, 0.06)' }}>
              <h3 style={{ margin: 0, fontSize: '2rem', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⭐</span> {primeStudentsCount}
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 600, color: '#ea580c' }}>Star Leads</p>
            </Link>
          </div>

          {/* Today's Follow-ups Table */}
          <div className="card" style={{ padding: '1.5rem', marginTop: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} color="#f59e0b" /> Today's Follow-ups Priority
              </h2>
              <Link href="/telecaller/followups" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            
            {students.filter(s => s.nextFollowUpDate && new Date(s.nextFollowUpDate).toDateString() === new Date().toDateString()).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>🎉</div>
                No pending follow-ups for today! Great job!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>Remarks</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.filter(s => s.nextFollowUpDate && new Date(s.nextFollowUpDate).toDateString() === new Date().toDateString())
                      .slice(0, 10) // Show only top 10
                      .map((student, idx) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#0f172a' }}>{student.studentName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                          <a href={`tel:${student.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{student.phone}</a>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.remarks || 'No remarks'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <Link href={`/telecaller/followups`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#f59e0b', color: '#fff', padding: '0.375rem 0.75rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, transition: 'background-color 0.2s' }}>
                            <Phone size={14} /> Call
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
