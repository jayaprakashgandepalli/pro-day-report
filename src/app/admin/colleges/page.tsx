'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Users,
  GraduationCap,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Check,
  X,
  Pencil,
  KeyRound,
  Power,
  Headset,
  Briefcase
} from 'lucide-react';

export default function AdminCollegesPage() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states - College Info
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Subscription & Pricing states
  const [subscriptionPlan, setSubscriptionPlan] = useState('YEARLY');
  const [subscriptionPrice, setSubscriptionPrice] = useState('50000');
  const [subscriptionEnd, setSubscriptionEnd] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Role Permissions Quotas
  const [maxAgms, setMaxAgms] = useState('2');
  const [maxTelecallers, setMaxTelecallers] = useState('5');
  const [maxEmployees, setMaxEmployees] = useState('10');
  const [maxStudents, setMaxStudents] = useState('5000');

  // Primary Admin Credentials
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Edit / Password modal states
  const [editCollege, setEditCollege] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-set subscription end date based on plan
  const updateEndDateByPlan = (plan: string) => {
    setSubscriptionPlan(plan);
    const d = new Date();
    if (plan === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    else if (plan === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
    else if (plan === 'HALF_YEARLY') d.setMonth(d.getMonth() + 6);
    else if (plan === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    setSubscriptionEnd(d.toISOString().split('T')[0]);
  };

  useEffect(() => {
    fetchColleges();
    updateEndDateByPlan('YEARLY');
  }, []);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/colleges');
      if (res.ok) {
        const data = await res.json();
        setColleges(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          contactPerson,
          phone,
          email,
          address,
          maxStudents,
          maxAgms,
          maxTelecallers,
          maxEmployees,
          subscriptionPlan,
          subscriptionPrice,
          subscriptionEnd,
          isActive,
          adminUsername,
          adminPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`College "${name}" created successfully! Admin ID: ${adminUsername}`);
        setName('');
        setCode('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        setAdminUsername('');
        setAdminPassword('');
        setShowAddModal(false);
        fetchColleges();
      } else {
        setError(data.error || 'Failed to create college');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleToggleStatus = async (college: any) => {
    try {
      const res = await fetch('/api/admin/colleges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: college.id,
          isActive: !college.isActive,
        }),
      });
      if (res.ok) {
        fetchColleges();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveEdit = async () => {
    if (!editCollege) return;
    setEditLoading(true);
    try {
      const adminUser = editCollege.users?.find((u: any) => u.role === 'COLLEGE');
      const res = await fetch('/api/admin/colleges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editCollege.id,
          name: editCollege.name,
          contactPerson: editCollege.contactPerson,
          phone: editCollege.phone,
          email: editCollege.email,
          address: editCollege.address,
          maxStudents: editCollege.maxStudents,
          maxAgms: editCollege.maxAgms,
          maxTelecallers: editCollege.maxTelecallers,
          maxEmployees: editCollege.maxEmployees,
          subscriptionPlan: editCollege.subscriptionPlan,
          subscriptionPrice: editCollege.subscriptionPrice,
          subscriptionEnd: editCollege.subscriptionEnd,
          isActive: editCollege.isActive,
          newPassword: newPassword.trim() || undefined,
          adminUserId: adminUser?.id,
        }),
      });
      if (res.ok) {
        setEditCollege(null);
        setNewPassword('');
        fetchColleges();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  const formatPlanName = (p: string) => {
    switch (p) {
      case 'MONTHLY': return 'Monthly';
      case 'QUARTERLY': return 'Quarterly';
      case 'HALF_YEARLY': return 'Half-Yearly';
      case 'YEARLY': return 'Yearly';
      default: return p || 'Yearly';
    }
  };

  const totalColleges = colleges.length;
  const activeColleges = colleges.filter(c => c.isActive).length;
  const totalRevenue = colleges.reduce((acc, c) => acc + (c.subscriptionPrice || 0), 0);
  const totalStaff = colleges.reduce((acc, c) => acc + (c._count?.users || 0), 0);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={28} color="#047857" /> Colleges & SaaS Subscriptions
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Manage client institutions, subscription pricing, billing cycles, and staff quota permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setError('');
            setSuccess('');
            updateEndDateByPlan('YEARLY');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(4, 120, 87, 0.25)',
          }}
        >
          <Plus size={18} /> Add New College
        </button>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #047857' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Colleges</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F2B47', marginTop: '0.25rem' }}>{totalColleges}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Subscriptions</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>{activeColleges}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Active Staff</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>{totalStaff}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Subscriptions Value</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>₹{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Check size={18} /> {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <X size={18} /> {error}
        </div>
      )}

      {/* Colleges List Table */}
      <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0F2B47' }}>
          Registered Colleges ({colleges.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading colleges...</div>
        ) : colleges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem' }}>No Colleges Registered Yet</p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Click "Add New College" above to create your first client institution.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem 1rem' }}>CODE / NAME</th>
                <th style={{ padding: '0.75rem 1rem' }}>ADMIN USER</th>
                <th style={{ padding: '0.75rem 1rem' }}>PLAN & PRICING</th>
                <th style={{ padding: '0.75rem 1rem' }}>SUBSCRIPTION END</th>
                <th style={{ padding: '0.75rem 1rem' }}>STAFF QUOTA PERMISSIONS</th>
                <th style={{ padding: '0.75rem 1rem' }}>STATUS</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((c) => {
                const adminUser = c.users?.find((u: any) => u.role === 'COLLEGE');
                const isExpired = c.subscriptionEnd && new Date(c.subscriptionEnd) < new Date();
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#e6f4ea', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 700, color: '#047857', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                        {c.code}
                      </span>
                      <strong style={{ color: '#0F2B47' }}>{c.name}</strong>
                      {c.phone && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>📞 {c.phone} {c.contactPerson ? `(${c.contactPerson})` : ''}</div>}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {adminUser?.employeeId || 'N/A'}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                        {formatPlanName(c.subscriptionPlan)}
                      </span>
                      <div style={{ fontWeight: 700, color: '#047857', marginTop: '0.2rem', fontSize: '0.9rem' }}>
                        ₹{Number(c.subscriptionPrice || 0).toLocaleString()}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      {c.subscriptionEnd ? (
                        <div>
                          <div style={{ fontWeight: 600, color: isExpired ? '#b91c1c' : '#334155' }}>
                            {new Date(c.subscriptionEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: isExpired ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                            {isExpired ? '⚠️ Expired' : '✅ Active'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Lifetime / No Expiry</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                        <span style={{ color: '#475569' }}>👔 AGMs Limit: <strong>{c.maxAgms || 2}</strong></span>
                        <span style={{ color: '#475569' }}>📞 Telecallers Limit: <strong>{c.maxTelecallers || 5}</strong></span>
                        <span style={{ color: '#475569' }}>🏃 Employees Limit: <strong>{c.maxEmployees || 10}</strong></span>
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: c.isActive ? '#dcfce7' : '#fee2e2',
                        color: c.isActive ? '#166534' : '#991b1b',
                      }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            const formatted = { ...c };
                            if (c.subscriptionEnd) {
                              formatted.subscriptionEnd = new Date(c.subscriptionEnd).toISOString().split('T')[0];
                            }
                            setEditCollege(formatted);
                          }}
                          title="Edit Details, Plan, Quota, or Password"
                          style={{
                            padding: '0.45rem 0.65rem',
                            backgroundColor: '#f1f5f9',
                            color: '#0F2B47',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title={c.isActive ? 'Deactivate College' : 'Activate College'}
                          style={{
                            padding: '0.45rem 0.65rem',
                            backgroundColor: c.isActive ? '#fee2e2' : '#dcfce7',
                            color: c.isActive ? '#991b1b' : '#166534',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Power size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add College Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '720px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={24} color="#047857" /> Register New College Client
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Configure institution profile, subscription plan, and staff permission quotas.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateCollege} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* College Basic Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>College Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sri Chaitanya Degree College"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Unique Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. SCDC"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Principal / Director"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admissions@college.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Campus Address / Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Vijayawada, Andhra Pradesh"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Subscription & Pricing Section */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#047857" /> Subscription Plan & Pricing
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  {['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateEndDateByPlan(p)}
                      style={{
                        padding: '0.6rem 0.5rem',
                        borderRadius: '8px',
                        border: subscriptionPlan === p ? '2px solid #047857' : '1px solid #cbd5e1',
                        backgroundColor: subscriptionPlan === p ? '#ecfdf5' : '#ffffff',
                        color: subscriptionPlan === p ? '#047857' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {formatPlanName(p)}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Subscription Price (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 50000"
                      value={subscriptionPrice}
                      onChange={e => setSubscriptionPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Subscription End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={subscriptionEnd}
                      onChange={e => setSubscriptionEnd(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                    <select
                      className="form-control"
                      value={isActive ? 'true' : 'false'}
                      onChange={e => setIsActive(e.target.value === 'true')}
                    >
                      <option value="true">✅ Active</option>
                      <option value="false">❌ Inactive / Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Staff Permission Quotas Section */}
              <div style={{ backgroundColor: '#f0fdf4', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} /> Staff Permission Quotas (ఎంతమందికి పర్మిషన్)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: '#166534' }}>👔 AGMs Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={maxAgms}
                      onChange={e => setMaxAgms(e.target.value)}
                      required
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: '#166534' }}>📞 Telecallers Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={maxTelecallers}
                      onChange={e => setMaxTelecallers(e.target.value)}
                      required
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, color: '#166534' }}>🏃 Employees Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={maxEmployees}
                      onChange={e => setMaxEmployees(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Credentials */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: '#0F2B47', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <KeyRound size={18} color="#047857" /> Primary College Admin Login Credentials
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Login ID (Username) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. scdc_admin"
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Password *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter initial password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    backgroundColor: '#047857',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Create College & Provision Access
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.85rem 1.5rem',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Password Modal */}
      {editCollege && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '640px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F2B47' }}>Edit {editCollege.name}</h2>
              <button onClick={() => setEditCollege(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>College Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCollege.name}
                    onChange={e => setEditCollege({ ...editCollege, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editCollege.phone || ''}
                    onChange={e => setEditCollege({ ...editCollege, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Subscription & Pricing */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#0F2B47' }}>Subscription & Plan Settings</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Billing Cycle</label>
                    <select
                      className="form-control"
                      value={editCollege.subscriptionPlan || 'YEARLY'}
                      onChange={e => setEditCollege({ ...editCollege, subscriptionPlan: e.target.value })}
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="HALF_YEARLY">Half-Yearly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editCollege.subscriptionPrice || 0}
                      onChange={e => setEditCollege({ ...editCollege, subscriptionPrice: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editCollege.subscriptionEnd || ''}
                      onChange={e => setEditCollege({ ...editCollege, subscriptionEnd: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label">Active / Inactive Status</label>
                  <select
                    className="form-control"
                    value={editCollege.isActive ? 'true' : 'false'}
                    onChange={e => setEditCollege({ ...editCollege, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">✅ Active</option>
                    <option value="false">❌ Inactive / Disabled</option>
                  </select>
                </div>
              </div>

              {/* Staff Quotas */}
              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#166534' }}>Staff Permission Quotas</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">👔 AGMs Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editCollege.maxAgms || 2}
                      onChange={e => setEditCollege({ ...editCollege, maxAgms: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">📞 Telecallers Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editCollege.maxTelecallers || 5}
                      onChange={e => setEditCollege({ ...editCollege, maxTelecallers: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">🏃 Employees Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editCollege.maxEmployees || 10}
                      onChange={e => setEditCollege({ ...editCollege, maxEmployees: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reset Admin Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave empty to keep current)</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter new password..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#047857',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditCollege(null)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
