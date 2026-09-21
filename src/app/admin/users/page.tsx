'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [groups, setGroups] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Create form state
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [allowedGroups, setAllowedGroups] = useState<string[]>([]);
  const [allowedLocations, setAllowedLocations] = useState<string[]>([]);
  
  // Edit modal state
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editAllowedGroups, setEditAllowedGroups] = useState<string[]>([]);
  const [editAllowedLocations, setEditAllowedLocations] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        const configs = data.configs || [];
        setGroups(configs.filter((c: any) => c.type === 'GROUP'));
        setLocations(configs.filter((c: any) => c.type === 'STUDY_INTEREST'));
      }
    } catch (e) {
      console.error('Failed to fetch configs', e);
    }
  };

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
      const payload: any = { employeeId, name, password, role };
      if (role === 'COLLEGE') {
        payload.allowedGroups = allowedGroups;
        payload.allowedLocations = allowedLocations;
      }
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('User created successfully!');
        setEmployeeId(''); setName(''); setPassword('');
        setAllowedGroups([]); setAllowedLocations([]);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const openEditModal = (u: any) => {
    setEditUser(u);
    setEditName(u.name);
    setEditPassword('');
    setEditRole(u.role);
    setEditAllowedGroups(u.allowedGroups || []);
    setEditAllowedLocations(u.allowedLocations || []);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: editUser.employeeId,
          name: editName,
          password: editPassword,
          role: editRole,
          allowedGroups: editAllowedGroups,
          allowedLocations: editAllowedLocations,
        })
      });
      if (res.ok) {
        setEditUser(null);
        setSuccess('User updated successfully!');
        fetchUsers();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to update');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (u: any) => {
    if (!confirm(`Are you sure you want to delete "${u.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: u.employeeId })
      });
      if (res.ok) {
        setSuccess('User deleted.');
        fetchUsers();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to delete');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleToggleActive = async (u: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: u.employeeId, isActive: !u.isActive })
      });
      if (res.ok) {
        setSuccess(`${u.name} is now ${!u.isActive ? 'Active' : 'Inactive'}.`);
        fetchUsers();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const toggleArrayItem = (setter: any, array: string[], value: string) => {
    setter(array.includes(value) ? array.filter(v => v !== value) : [...array, value]);
  };

  const roleColors: Record<string, { bg: string; color: string }> = {
    ADMIN: { bg: '#fef3c7', color: '#92400e' },
    EMPLOYEE: { bg: '#dbeafe', color: '#1e40af' },
    TELECALLER: { bg: '#f3e8ff', color: '#6b21a8' },
    COLLEGE: { bg: '#dcfce7', color: '#166534' },
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Manage Users</h1>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '8px' }}>{success}</div>}

      <form className="card" onSubmit={handleAddUser}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Create New User</h2>
        
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EMPLOYEE">Employee</option>
            <option value="TELECALLER">Telecaller</option>
            <option value="ADMIN">Admin</option>
            <option value="COLLEGE">College</option>
          </select>
        </div>

        {role === 'COLLEGE' && (
          <>
            <div className="form-group" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Allowed Groups (Courses)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                {groups.map(g => (
                  <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={allowedGroups.includes(g.value)} onChange={() => toggleArrayItem(setAllowedGroups, allowedGroups, g.value)} />
                    {g.value}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Allowed Locations (Study Interest)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {locations.map(l => (
                  <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={allowedLocations.includes(l.value)} onChange={() => toggleArrayItem(setAllowedLocations, allowedLocations, l.value)} />
                    {l.value}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Full Name / College Name</label>
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
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Existing Users ({users.length})</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {users.map(u => {
              const rc = roleColors[u.role] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: u.isActive ? '#f8fafc' : '#fef2f2', padding: '0.875rem 1rem', borderRadius: '8px', border: `1px solid ${u.isActive ? '#e2e8f0' : '#fecaca'}` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</span>
                      {!u.isActive && <span style={{ fontSize: '0.65rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>INACTIVE</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {u.employeeId}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ backgroundColor: rc.bg, color: rc.color, padding: '0.2rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {u.role}
                    </span>
                    <button
                      onClick={() => handleToggleActive(u)}
                      title={u.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                      disabled={u.role === 'ADMIN'}
                      style={{ display: u.role === 'ADMIN' ? 'none' : 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', backgroundColor: u.isActive ? '#f0fdf4' : '#fff7ed', color: u.isActive ? '#166534' : '#9a3412', border: `1px solid ${u.isActive ? '#bbf7d0' : '#fed7aa'}`, borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {u.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => openEditModal(u)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Edit User</h2>
              <button onClick={() => setEditUser(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={editRole} onChange={e => setEditRole(e.target.value)}>
                <option value="EMPLOYEE">Employee</option>
                <option value="TELECALLER">Telecaller</option>
                <option value="ADMIN">Admin</option>
                <option value="COLLEGE">College</option>
              </select>
            </div>

            {editRole === 'COLLEGE' && (
              <>
                <div className="form-group" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Allowed Groups</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {groups.map(g => (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editAllowedGroups.includes(g.value)} onChange={() => toggleArrayItem(setEditAllowedGroups, editAllowedGroups, g.value)} />
                        {g.value}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Allowed Locations</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    {locations.map(l => (
                      <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editAllowedLocations.includes(l.value)} onChange={() => toggleArrayItem(setEditAllowedLocations, editAllowedLocations, l.value)} />
                        {l.value}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">New Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave blank to keep current)</span></label>
              <input type="text" className="form-control" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Enter new password..." />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#0F2B47', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Check size={16} /> {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditUser(null)} style={{ padding: '0.75rem 1.25rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
