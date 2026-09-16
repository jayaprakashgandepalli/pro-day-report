'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, name, password, role })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('User created successfully!');
        setEmployeeId('');
        setName('');
        setPassword('');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Users</h1>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '4px' }}>{success}</div>}

      <form className="card" onSubmit={handleAddUser}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Create New User</h2>
        
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPLOYEE">Employee</option>
            <option value="TELECALLER">Telecaller</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">User ID (Login ID)</label>
          <input type="text" className="form-control" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="text" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          <UserPlus size={20} /> Create User
        </button>
      </form>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Existing Users</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: '4px' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-color)', opacity: 0.8 }}>ID: {u.employeeId}</div>
                </div>
                <span className="badge badge-primary">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
