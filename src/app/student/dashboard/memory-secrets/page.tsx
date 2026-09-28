import MemorySecrets from '@/components/MemorySecrets';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MemorySecretsPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/student/dashboard" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: '#64748b', 
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: '1.5rem'
          }}
        >
          <ArrowLeft size={18} /> బ్యాక్ టు డాష్‌బోర్డ్ (Back to Dashboard)
        </Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>
          మెమరీ సీక్రెట్స్ & స్టడీ టిప్స్
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>
          జ్ఞాపకశక్తిని పెంచుకోవడానికి మరియు పరీక్షలలో అద్భుతంగా రాణించడానికి అవసరమైన ముఖ్యమైన సూత్రాలు!
        </p>
      </div>

      <MemorySecrets />
    </div>
  );
}
