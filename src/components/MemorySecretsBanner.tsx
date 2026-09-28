'use client';

import Link from 'next/link';
import { Brain, Sparkles, ArrowRight, Lock } from 'lucide-react';

interface MemorySecretsBannerProps {
  isLocked?: boolean;
}

export default function MemorySecretsBanner({ isLocked = false }: MemorySecretsBannerProps) {
  return (
    <div style={{ marginTop: '3rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        borderRadius: '24px',
        padding: '2rem',
        color: 'white',
        boxShadow: '0 20px 25px -5px rgba(139, 92, 246, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        opacity: isLocked ? 0.85 : 1,
        filter: isLocked ? 'grayscale(20%)' : 'none',
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', right: '20%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>

        <div style={{ position: 'relative', zIndex: 1, flex: '1 1 300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Brain size={24} color="#fcd34d" />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              మెమరీ సీక్రెట్స్ & స్టడీ టిప్స్ {isLocked && <Lock size={20} style={{ marginLeft: '0.5rem', opacity: 0.8 }} />}
            </h2>
          </div>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0 0 1rem 2.5rem', lineHeight: 1.5 }}>
            మీ జ్ఞాపకశక్తిని పెంచుకోవడానికి, చదువులో రాణించడానికి అద్భుతమైన సీక్రెట్స్ మరియు పాపులర్ టెక్నిక్స్!
          </p>
          <ul style={{ margin: '0 0 0 2.5rem', padding: '0 0 0 1rem', fontSize: '0.95rem', opacity: 0.95, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>జ్ఞాపక శక్తిని పెంపొందించుకోవడం ఎలా?</li>
            <li>చదువుతున్న విషయాలను దీర్ఘకాల స్మృతిలో ఉంచుకునే అవకాశం ఉందా?</li>
            <li>మతిమరుపును వదిలించుకోవడం ఎలా?</li>
            <li>చదివిన విషయాలను పరీక్షలలో ఏ మాత్రం మరచిపోకుండా రాయడం ఎలా?</li>
          </ul>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {isLocked ? (
            <button
              onClick={() => alert('దయచేసి ముందుగా పైన ఉన్న ఎగ్జామ్ (Assessment Test) పూర్తి చేయండి. ఆ తర్వాతే ఈ మెమరీ సీక్రెట్స్ అన్‌లాక్ అవుతాయి!')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '1rem 1.75rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '1.1rem',
                border: '1px solid rgba(255,255,255,0.4)',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Lock size={18} /> అన్‌లాక్ చేయడానికి ఎగ్జామ్ రాయండి
            </button>
          ) : (
            <Link
              href="/student/dashboard/memory-secrets"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'white',
                color: '#db2777',
                padding: '1rem 1.75rem',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '1.1rem',
                textDecoration: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
              }}
            >
              <Sparkles size={18} /> ఇప్పుడే చదవండి <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
