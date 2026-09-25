'use client';

import React, { useState } from 'react';
import { BookOpen, GraduationCap, Building, Award, Banknote, MapPin, ExternalLink, School, FileText, CheckCircle, Lightbulb, Clock, Brain, Smile } from 'lucide-react';

type Tab = 'IIIT' | 'Scholarships' | 'Colleges' | 'StudyTips';

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('IIIT');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'IIIT', label: 'IIIT Admissions (ట్రిపుల్ ఐటీ)', icon: <Building size={20} /> },
    { id: 'Scholarships', label: 'Scholarships (స్కాలర్షిప్స్)', icon: <Banknote size={20} /> },
    { id: 'Colleges', label: 'Top Colleges (ఉత్తమ కాలేజీలు)', icon: <School size={20} /> },
    { id: 'StudyTips', label: '10th Study Tips (పరీక్షల టిప్స్)', icon: <Lightbulb size={20} /> },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#1e293b' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Student Resources</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>ఉచిత ఉన్నత విద్య, స్కాలర్షిప్స్ మరియు బెస్ట్ కాలేజీల గురించిన పూర్తి సమాచారం.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
              color: activeTab === tab.id ? 'white' : '#475569',
              transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', minHeight: '500px' }}>
        {activeTab === 'IIIT' && <IIITInfo />}
        {activeTab === 'Scholarships' && <ScholarshipsInfo />}
        {activeTab === 'Colleges' && <CollegesInfo />}
        {activeTab === 'StudyTips' && <StudyTipsInfo />}
      </div>
    </div>
  );
}

function IIITInfo() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '16px' }}>
          <Building size={32} color="#059669" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#064e3b' }}>RGUKT - IIIT Admissions</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>10వ తరగతి తర్వాత 6 ఏళ్ల ఉచిత ఇంటిగ్రేటెడ్ B.Tech కోర్సు (PUC + B.Tech)</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="#10b981" /> ఎందుకు చేరాలి?
          </h3>
          <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#334155' }}>
            <li>ప్రభుత్వ పాఠశాలల్లో చదివిన విద్యార్థులకు అత్యధిక ప్రాధాన్యత.</li>
            <li>ఆరు సంవత్సరాల పాటు పూర్తి ఉచిత విద్య మరియు హాస్టల్ వసతి (ఫీజు రియంబర్స్మెంట్ ద్వారా).</li>
            <li>లాప్టాప్ ఉచితంగా ఇస్తారు మరియు చదువుకు కావాల్సిన అన్ని వసతులు ఉంటాయి.</li>
            <li>కోర్సు పూర్తవ్వగానే క్యాంపస్ ఇంటర్వ్యూల ద్వారా మంచి జీతంతో ఉద్యోగాలు.</li>
          </ul>
        </div>

        <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#3b82f6" /> అడ్మిషన్ ఎలా?
          </h3>
          <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#334155' }}>
            
            <li><strong>ఆంధ్రప్రదేశ్ (నూజివీడు, ఆర్కే వ్యాలీ, ఇడుపులపాయ, ఒంగోలు, శ్రీకాకుళం):</strong> ప్రభుత్వ పాఠశాల విద్యార్థులకు ప్రత్యేక వెయిటేజ్ తో 10th మార్కుల ద్వారా సెలక్షన్.</li>
            <li>10th రిజల్ట్స్ రాగానే RGUKT వెబ్సైట్ లో నోటిఫికేషన్ వస్తుంది, ఆన్లైన్ లో అప్లై చేయాలి.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ScholarshipsInfo() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '16px' }}>
          <Banknote size={32} color="#d97706" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#92400e' }}>Scholarships (స్కాలర్షిప్స్)</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>ఆర్థిక స్థోమత లేక చదువు ఆపాల్సిన అవసరం లేకుండా ఆర్థిక సహాయం.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', gap: '1rem', background: '#fff' }}>
          <Award size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1e293b' }}>విద్యాధన్ స్కాలర్షిప్ (Vidyadhan)</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
              10వ తరగతిలో 90% (లేదా 9 CGPA) కంటే ఎక్కువ మార్కులు వచ్చి, వార్షిక ఆదాయం 2 లక్షల లోపు ఉన్న విద్యార్థులకు ఇంటర్ 2 ఏళ్లు సంవత్సరానికి రూ.10,000 ఇస్తారు. ఆ తర్వాత డిగ్రీకి కూడా సహాయం చేస్తారు.
            </p>
          </div>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', gap: '1rem', background: '#fff' }}>
          <Award size={24} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1e293b' }}>ప్రభుత్వ ఫీజు రియంబర్స్మెంట్ (Fee Reimbursement)</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
              ఆంధ్రప్రదేశ్ లో ప్రభుత్వ 'పోస్ట్ మెట్రిక్ స్కాలర్షిప్స్ (ఫీజు రియంబర్స్మెంట్)' ద్వారా ఇంటర్, డిగ్రీ, ఇంజనీరింగ్ చదివే పేద విద్యార్థులకు కాలేజీ ఫీజు మరియు హాస్టల్ ఖర్చులు ప్రభుత్వమే భరిస్తుంది.
            </p>
          </div>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', gap: '1rem', background: '#fff' }}>
          <Award size={24} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#1e293b' }}>రిలయన్స్ ఫౌండేషన్ (Reliance Foundation)</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
              ఇంటర్ లేదా డిగ్రీ చదువుతున్న ప్రతిభావంతులైన విద్యార్థులకు ఏటా రూ.2 లక్షల వరకు ఆర్థిక సహాయం అందజేస్తారు. ప్రతి సంవత్సరం నోటిఫికేషన్ వస్తుంది.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollegesInfo() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '16px' }}>
          <School size={32} color="#2563eb" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#1e40af' }}>Top Colleges (ఉత్తమ కాలేజీలు)</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>10వ తరగతి తర్వాత ఉచితంగా చదువుకోగలిగే బెస్ట్ ప్రభుత్వ కాలేజీలు.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
        
        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>గురుకులాలు (Residential Colleges)</h3>
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>ఉచిత హాస్టల్, భోజనం మరియు అద్భుతమైన విద్య.</p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#334155', margin: 0 }}>
            <li>APRJC</li>
            <li>Social Welfare (APSWRJC)</li>
            <li>Tribal Welfare (APTWRJC)</li>
            <li>BC Welfare Residential Colleges</li>
          </ul>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>ప్రభుత్వ పాలిటెక్నిక్ (Govt Polytechnics)</h3>
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>పాలిసెట్ ఎగ్జామ్ ద్వారా డిప్లొమా లోకి ప్రవేశం.</p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#334155', margin: 0 }}>
            <li>Govt Polytechnic Colleges in AP</li>
            <li>చాలా తక్కువ ఫీజుతో నాణ్యమైన టెక్నికల్ విద్య</li>
            <li>క్యాంపస్ ప్లేస్మెంట్స్ అవకాశం</li>
          </ul>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>వ్యవసాయ డిప్లొమా (Agriculture)</h3>
          <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem' }}>పాలిసెట్ (Agriculture) ద్వారా ప్రవేశం.</p>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#334155', margin: 0 }}>
            <li>ANGRAU / PJTSAU అనుబంధ కాలేజీలు</li>
            <li>వ్యవసాయ, విత్తన సాంకేతిక డిప్లొమా</li>
            <li>గ్రామీణ రైతు పిల్లలకు అత్యంత అనుకూలం</li>
          </ul>
        </div>

      </div>
    </div>
  );
}


function StudyTipsInfo() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fef08a', padding: '1rem', borderRadius: '16px' }}>
          <Lightbulb size={32} color="#ca8a04" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#854d0e' }}>10th Class Study Tips</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>పబ్లిక్ పరీక్షలలో మంచి మార్కులు (10/10 GPA) సాధించడానికి నిపుణుల సలహాలు.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        
        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="#2563eb" /> టైమ్ టేబుల్ (Study Plan)
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            రోజుకు కనీసం 3-4 గంటలు సెల్ఫ్ స్టడీకి కేటాయించండి. కష్టంగా అనిపించే మ్యాథ్స్, సైన్స్ సబ్జెక్టులను ఉదయం పూట ఫ్రెష్ గా ఉన్నప్పుడు చదవండి.
          </p>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="#10b981" /> పాత ప్రశ్నపత్రాలు (Previous Papers)
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            గత 5 సంవత్సరాల పబ్లిక్ ఎగ్జామ్ పేపర్లను ప్రాక్టీస్ చేయండి. ఏ ప్రశ్నలు ఎక్కువ సార్లు వస్తున్నాయో గమనించి, వాటిపై ఎక్కువ దృష్టి పెట్టండి.
          </p>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={20} color="#8b5cf6" /> రివిజన్ (Revision)
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            చదివింది మర్చిపోకుండా ఉండాలంటే, వారం చివరిలో (ఆదివారం) ఆ వారం అంతా చదివిన వాటిని ఒకసారి రివిజన్ చేయాలి. షార్ట్ నోట్స్ రాసుకోవడం చాలా ముఖ్యం.
          </p>
        </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smile size={20} color="#f59e0b" /> ఆరోగ్యం & నిద్ర (Health)
          </h3>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            పరీక్షలని భయపడకండి. రోజూ కనీసం 7 గంటలు నిద్రపోవాలి. మంచి ఆహారం తీసుకోవాలి. బట్టి కొట్టకుండా అర్థం చేసుకుని చదివితే 10/10 సులభంగా వస్తాయి.
          </p>
        </div>

      </div>
    </div>
  );
}
