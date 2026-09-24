'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function ResetTestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your test? All previous answers will be deleted. (Demo Purpose Only)')) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/student/test/reset', { method: 'POST' });
      if (res.ok) {
        router.push('/student/dashboard/test');
        router.refresh();
      } else {
        alert('Failed to reset test.');
        setIsLoading(false);
      }
    } catch (error) {
      alert('Error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReset} 
      disabled={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#fee2e2',
        color: '#ef4444',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid #fca5a5',
        fontWeight: 600,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        marginTop: '2rem',
        transition: 'all 0.2s'
      }}
    >
      <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
      {isLoading ? 'Resetting...' : 'Reset Test (Demo Only)'}
    </button>
  );
}
