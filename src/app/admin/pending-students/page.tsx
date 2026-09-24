'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, User, Phone, School } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PendingStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const fetchPendingStudents = async () => {
    try {
      const res = await fetch('/api/admin/pending-students');
      const data = await res.json();
      if (data.students) setStudents(data.students);
      if (data.employees) setEmployees(data.employees);
    } catch (error) {
      console.error('Error fetching pending students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const employeeId = selectedEmployees[id];
    if (action === 'APPROVE' && !employeeId) {
      alert('Please select an employee to assign this student to.');
      return;
    }

    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this student?`)) return;

    try {
      const res = await fetch('/api/admin/pending-students/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, employeeId }),
      });

      if (res.ok) {
        // Remove student from list immediately
        setStudents(students.filter(s => s.id !== id));
      } else {
        alert('Failed to process request.');
      }
    } catch (error) {
      alert('An error occurred.');
    }
  };

  const filteredStudents = students.filter(s => 
    s.studentName.toLowerCase().includes(search.toLowerCase()) || 
    s.phone.includes(search)
  );

  return (
    <div className="container">
      <header className="app-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Pending Approvals</h1>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '35px' }}
          />
        </div>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading pending students...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <User size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Pending Approvals</h3>
          <p style={{ color: '#94a3b8' }}>All registered students have been approved or rejected.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>Student Name</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>Phone</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>School</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>Reg. Date</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem' }}>Assign To</th>
                  <th style={{ padding: '1rem', color: '#475569', fontWeight: 600, fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {student.studentName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{student.studentName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="#94a3b8" /> {student.phone}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <School size={14} color="#94a3b8" /> {student.schoolName || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#475569', fontSize: '0.875rem' }}>
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select 
                        className="form-control" 
                        value={selectedEmployees[student.id] || ''}
                        onChange={(e) => setSelectedEmployees({...selectedEmployees, [student.id]: e.target.value})}
                        style={{ padding: '0.5rem', width: '150px' }}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>{emp.name}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleAction(student.id, 'APPROVE')}
                          style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button 
                          onClick={() => handleAction(student.id, 'REJECT')}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
