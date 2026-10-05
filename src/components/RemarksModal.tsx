import { useState, useEffect } from 'react';
import { X, Save, User, Clock, Lock } from 'lucide-react';

interface Remark {
  text: string;
  date: string;
  addedBy: string;
}

export default function RemarksModal({ 
  isOpen, 
  onClose, 
  title, 
  remarks, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  remarks: Remark[]; 
  onSave: (newRemarks: Remark[]) => Promise<void>;
}) {
  const [newRemark, setNewRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, employeeId: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => setCurrentUser(data.user || { name: 'Unknown User', employeeId: '' }))
        .catch(() => setCurrentUser({ name: 'Unknown User', employeeId: '' }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    
    setIsSaving(true);
    const newRemarkObj = {
      text: newRemark.trim(),
      date: new Date().toISOString(),
      addedBy: currentUser?.name || 'Unknown'
    };
    
    const updatedRemarks = [...(remarks || []), newRemarkObj];
    
    try {
      await onSave(updatedRemarks);
      setNewRemark('');
    } catch (e) {
      console.error(e);
      alert('Failed to save remark');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#fff', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>{title} Remarks</h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Internal call notes & history</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>
        
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(!remarks || remarks.length === 0) ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', margin: 0 }}>No remarks added yet.</p>
          ) : (
            remarks.map((r, i) => (
              <div key={i} style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.4 }}>{r.text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={12} /> {r.addedBy}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {new Date(r.date).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#fff' }}>
          <textarea
            className="form-control"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical', fontSize: '0.9rem' }}
            placeholder="Type internal call note / remark here (e.g. Spoke with HM, will call tomorrow)..."
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            disabled={isSaving}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={13} color="#94a3b8" /> Internal only (not sent outside)
            </span>
            <button 
              className="btn btn-primary" 
              onClick={handleAddRemark}
              disabled={isSaving || !newRemark.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: isSaving ? '#93c5fd' : '#2563eb', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
