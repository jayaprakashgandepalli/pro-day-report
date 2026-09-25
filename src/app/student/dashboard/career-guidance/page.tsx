
'use client';

import React, { useState } from 'react';
import { Stethoscope, Leaf, Microscope, Briefcase, GraduationCap, ArrowRight, ChevronDown, ChevronRight, CheckCircle2, Cpu, Building, Shield, Calculator, Landmark, BookOpen, PieChart, PenTool, Globe, Wrench, Settings, Activity, Target, Heart, Plane, Utensils, Palette, Scissors } from 'lucide-react';

type Stream = 'Bi.P.C' | 'MPC' | 'CEC' | 'MEC' | 'HEC' | '10th & Others';

export default function CareerGuidancePage() {
  const [activeStream, setActiveStream] = useState<Stream>('Bi.P.C');
  const streams: Stream[] = ['Bi.P.C', 'MPC', 'MEC', 'CEC', 'HEC', '10th & Others'];

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#1e293b' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>Career Pathways (కెరీర్ గైడెన్స్)</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>మీరు తీసుకున్న గ్రూప్ ఆధారంగా మీ భవిష్యత్తు అవకాశాలను (Opportunities) ఇక్కడ తెలుసుకోండి.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {streams.map((stream) => (
          <button
            key={stream}
            onClick={() => setActiveStream(stream)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              border: activeStream === stream ? 'none' : '1px solid #e2e8f0',
              background: activeStream === stream ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'white',
              color: activeStream === stream ? 'white' : '#475569',
              transform: activeStream === stream ? 'scale(1.05)' : 'scale(1)',
              boxShadow: activeStream === stream ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            {stream}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', minHeight: '600px' }}>
        {activeStream === 'Bi.P.C' && <BiPCPathways />}
        {activeStream === 'MPC' && <MPCPathways />}
        {activeStream === 'MEC' && <MECPathways />}
        {activeStream === 'CEC' && <CECPathways />}
        {activeStream === 'HEC' && <HECPathways />}
        {activeStream === '10th & Others' && <VocationalPathways />}
      </div>
    </div>
  );
}

function BasePathway({ categories, title = 'మీకు నచ్చిన రంగాన్ని ఎంచుకోండి:' }: { categories: any[], title?: string }) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{title}</h2>
      
      {categories.map((cat: any) => (
        <div
          key={cat.id}
          style={{
            borderRadius: '16px',
            border: `2px solid ${activeCategory === cat.id ? '#6366f1' : '#f1f5f9'}`,
            background: activeCategory === cat.id ? 'white' : '#f8fafc',
            transition: 'all 0.3s ease',
            boxShadow: activeCategory === cat.id ? '0 10px 25px -5px rgba(0, 0, 0, 0.1)' : 'none',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
            style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {cat.icon}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>{cat.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{cat.description}</p>
              </div>
            </div>
            <div style={{ background: activeCategory === cat.id ? '#e0e7ff' : 'transparent', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
              <ChevronDown color={activeCategory === cat.id ? '#6366f1' : '#cbd5e1'} style={{ transform: activeCategory === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </div>
          </div>

          {activeCategory === cat.id && (
            <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '2px dashed #e2e8f0', animation: 'fadeIn 0.4s ease-in-out' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                
                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#6366f1' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                    ప్రవేశ పరీక్షలు (Exams)
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cat.details.exams.map((exam: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', color: '#334155', fontSize: '0.95rem' }}>
                        <CheckCircle2 size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{exam}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                    డిగ్రీ కోర్సులు (UG)
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cat.details.courses.map((course: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', color: '#334155', fontSize: '0.95rem' }}>
                        <GraduationCap size={16} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: 500 }}>{course}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)', padding: '1.25rem', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#16a34a' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                    డిగ్రీ తర్వాత ఉద్యోగాలు
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#15803d', marginBottom: '0.75rem', fontWeight: 600 }}>డిగ్రీ అవ్వగానే వీటికి వెళ్లొచ్చు:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cat.details.ugJobs.map((job: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', color: '#1e293b', fontSize: '0.95rem' }}>
                        <Briefcase size={16} color="#4ade80" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{job}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'linear-gradient(to bottom right, #eef2ff, #f3e8ff)', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e0e7ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#9333ea' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                    పైచదువులు (ఆసక్తి ఉంటే)
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#7e22ce', marginBottom: '0.75rem', fontWeight: 600 }}>ఉన్నత విద్య & స్పెషలిస్ట్ జాబ్స్:</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cat.details.pgOptions.map((opt: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', color: '#1e293b', fontSize: '0.95rem' }}>
                        <GraduationCap size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: 500 }}>{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

function BiPCPathways() {
  const categories = [
    {
      id: 'medical',
      title: 'Medical Sciences (వైద్య రంగం)',
      icon: <Stethoscope size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: 'అల్లోపతి డాక్టర్ అవ్వాలంటే లేదా హాస్పిటల్స్ లో పని చేయాలంటే ఇవి చదవాలి.',
      details: {
        exams: ['NEET (నేషనల్ లెవెల్ ఎగ్జామ్)', 'AIIMS / JIPMER'],
        courses: ['MBBS (జనరల్ డాక్టర్)', 'BDS (డెంటల్ డాక్టర్)'],
        ugJobs: ['క్లినిక్ లో జూనియర్ డాక్టర్', 'మెడికల్ ఆఫీసర్'],
        pgOptions: ['MD / MS చేసి స్పెషలిస్ట్ డాక్టర్ అవ్వడం', 'కార్పొరేట్ హాస్పిటల్స్ లో సర్జన్']
      }
    },
    {
      id: 'ayush',
      title: 'Ayush & Physio (ఆయుర్వేద & ఫిజియోథెరపీ)',
      icon: <Heart size={24} color="#0d9488" />,
      bg: '#f0fdfa',
      border: '#ccfbf1',
      description: 'ఆయుర్వేద, హోమియోపతి డాక్టర్ లేదా ఫిజియోథెరపిస్ట్ అవ్వాలనుకునే వాళ్ళకి.',
      details: {
        exams: ['NEET (ఆయుష్ కోసం)', 'EAMCET (రాష్ట్ర స్థాయి)'],
        courses: ['BAMS (ఆయుర్వేద)', 'BHMS (హోమియోపతి)', 'BPT (ఫిజియోథెరపీ)'],
        ugJobs: ['ఆయుర్వేద / హోమియోపతి డాక్టర్', 'ఫిజియోథెరపిస్ట్ (హాస్పిటల్స్, స్పోర్ట్స్ లో)'],
        pgOptions: ['M.D (ఆయుర్వేద / హోమియోపతి)', 'MPT (మాస్టర్ ఆఫ్ ఫిజియోథెరపీ)']
      }
    },
    {
      id: 'agriculture',
      title: 'Agriculture & Allied (వ్యవసాయ రంగం)',
      icon: <Leaf size={24} color="#059669" />,
      bg: '#ecfdf5',
      border: '#d1fae5',
      description: 'వ్యవసాయం, పశువైద్యం, డైరీ, ఫిషరీస్ (చేపల పెంపకం) కి సంబంధించిన కోర్సులు.',
      details: {
        exams: ['AP EAPCET', 'ICAR (నేషనల్ లెవెల్ ఎగ్జామ్)'],
        courses: ['B.Sc. Agriculture (వ్యవసాయం)', 'B.V.Sc. (పశు వైద్యుడు)', 'B.F.Sc (ఫిషరీస్)'],
        ugJobs: ['అగ్రికల్చర్ ఆఫీసర్ (ఏవో / AO)', 'బ్యాంకులలో అగ్రికల్చర్ ఫీల్డ్ ఆఫీసర్'],
        pgOptions: ['M.Sc. Agriculture చేసి అగ్రికల్చర్ సైంటిస్ట్ అవ్వడం', 'Ph.D. చేసి యూనివర్సిటీ ప్రొఫెసర్ అవ్వడం']
      }
    },
    {
      id: 'paramedical',
      title: 'Pharmacy & Paramedical (ఫార్మసీ / నర్సింగ్)',
      icon: <Microscope size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: 'మందులు (మెడిసిన్స్) తయారీ, ల్యాబ్ టెస్టులు మరియు నర్సింగ్ కోర్సులు.',
      details: {
        exams: ['EAMCET (ఫార్మసీ కోసం)', 'State Paramedical Board Exams'],
        courses: ['B.Pharmacy / Pharm-D (మందుల తయారీ)', 'B.Sc. Nursing (నర్సింగ్)', 'Paramedical (ల్యాబ్ టెక్నీషియన్)'],
        ugJobs: ['హాస్పిటల్స్ లో నర్స్', 'మెడికల్ షాప్ (సొంత ఫార్మసీ)', 'ల్యాబ్ టెక్నీషియన్ (బ్లడ్ టెస్టింగ్)'],
        pgOptions: ['M.Pharmacy చేసి ఫార్మా కంపెనీల్లో రీసెర్చ్ (మందుల తయారీ)', 'M.Sc Nursing చేసి నర్సింగ్ కాలేజీలో టీచర్']
      }
    },
    {
      id: 'general',
      title: 'General Sciences (సాధారణ డిగ్రీ కోర్సులు)',
      icon: <GraduationCap size={24} color="#7c3aed" />,
      bg: '#f5f3ff',
      border: '#ede9fe',
      description: 'బోటనీ, జువాలజీ లాంటి సబ్జెక్టులతో డిగ్రీ చదివి ప్రభుత్వ ఉద్యోగాలకు వెళ్లడం.',
      details: {
        exams: ['DOST (డిగ్రీ అడ్మిషన్స్)', 'CUET (సెంట్రల్ యూనివర్సిటీస్)'],
        courses: ['B.Sc. (Botany, Zoology, Chemistry)', 'B.Sc. (Biotech, Microbiology)', 'B.Sc Food Technology'],
        ugJobs: ['పోలీస్ (కానిస్టేబుల్, ఎస్ఐ)', 'గ్రూప్స్ (Group-2, 4) ఉద్యోగాలు', 'ల్యాబ్ అసిస్టెంట్ / ఫుడ్ ఇన్స్పెక్టర్'],
        pgOptions: ['M.Sc. / B.Ed. చేసి ప్రభుత్వ టీచర్ / లెక్చరర్ అవ్వడం']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function MPCPathways() {
  const categories = [
    {
      id: 'engineering',
      title: 'Engineering (ఇంజనీరింగ్ / B.Tech)',
      icon: <Cpu size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: 'సాఫ్ట్‌వేర్ లేదా కోర్ ఇంజనీర్ (మెకానికల్, సివిల్) అవ్వాలనుకుంటే చదవాల్సిన కోర్సులు.',
      details: {
        exams: ['JEE Mains & Advanced (NIT/IIT)', 'AP EAPCET (రాష్ట్ర స్థాయి)'],
        courses: ['B.Tech Computer Science (సాఫ్ట్‌వేర్)', 'B.Tech ECE, EEE (ఎలక్ట్రానిక్స్)', 'B.Tech Mechanical, Civil'],
        ugJobs: ['సాఫ్ట్‌వేర్ ఇంజనీర్ (IT Jobs)', 'సివిల్ / మెకానికల్ ఇంజనీర్', 'గవర్నమెంట్ టెక్నికల్ జాబ్స్'],
        pgOptions: ['M.Tech / M.S. చేసి పెద్ద కంపెనీల్లో రీసెర్చ్ / డేటా సైంటిస్ట్', 'MBA చేసి కంపెనీ మేనేజర్ అవ్వడం']
      }
    },
    {
      id: 'architecture',
      title: 'Architecture & Design (భవన నిర్మాణ ప్లానింగ్)',
      icon: <Building size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: 'ఇల్లు, బిల్డింగ్స్ డిజైన్ చేయడం, ఇంటీరియర్ డిజైనింగ్ లాంటివి ఇష్టపడే వారి కోసం.',
      details: {
        exams: ['NATA (నేషనల్ లెవెల్ ఎగ్జామ్)', 'JEE Mains (Paper 2)'],
        courses: ['B.Arch (ఆర్కిటెక్చర్ - 5 Years)', 'B.Planning', 'B.Design'],
        ugJobs: ['జూనియర్ ఆర్కిటెక్ట్ (భవనాల డిజైనర్)', 'ఇంటీరియర్ డిజైనర్', 'ప్రభుత్వ టౌన్ ప్లానింగ్ ఆఫీసర్'],
        pgOptions: ['M.Arch చేసి సీనియర్ అర్బన్ ప్లానర్ లేదా ఆర్కిటెక్చర్ ప్రొఫెసర్']
      }
    },
    {
      id: 'aviation',
      title: 'Aviation & Marine (పైలట్, నేవీ కోర్సులు)',
      icon: <Plane size={24} color="#0284c7" />,
      bg: '#f0f9ff',
      border: '#e0f2fe',
      description: 'విమానాలు నడపడం, సముద్రంలో నౌకలపై పనిచేయడం ఇష్టమున్న వారికి.',
      details: {
        exams: ['IMU CET (మెరైన్ కోసం)', 'NDA / పైలట్ ఎంట్రన్స్'],
        courses: ['Commercial Pilot Training (CPL)', 'B.Tech Marine Engineering', 'Aeronautical Engineering'],
        ugJobs: ['కమర్షియల్ పైలట్', 'మెరైన్ ఇంజనీర్ (మర్చంట్ నేవీ)', 'ఎయిర్ ట్రాఫిక్ కంట్రోలర్ (ATC)'],
        pgOptions: ['విమానయాన రంగంలో ఉన్నత స్థాయి శిక్షణ (Advanced Aviation Training)']
      }
    },
    {
      id: 'defence',
      title: 'National Defence (ఆర్మీ, నేవీ, ఎయిర్ ఫోర్స్)',
      icon: <Shield size={24} color="#059669" />,
      bg: '#ecfdf5',
      border: '#d1fae5',
      description: 'సైన్యంలో ఆఫీసర్ స్థాయికి వెళ్లాలనుకుంటే ఇంటర్ తర్వాత రాసే పరీక్షలు.',
      details: {
        exams: ['NDA (National Defence Academy)'],
        courses: ['Army Wing (ఆర్మీ)', 'Navy Wing (నేవీ)', 'Air Force Wing (వాయుసేన)'],
        ugJobs: ['(ట్రైనింగ్ పూర్తి కాగానే) డిఫెన్స్ ఆఫీసర్', 'డిఫెన్స్ పైలట్', 'నేవీ ఆఫీసర్ (దేశ సేవ)'],
        pgOptions: ['సర్వీస్ లో ఉంటూనే పై స్థాయి ప్రమోషన్ల కోసం డిఫెన్స్ కోర్సులు']
      }
    },
    {
      id: 'general',
      title: 'General Sciences & Maths (డిగ్రీ కోర్సులు)',
      icon: <Calculator size={24} color="#7c3aed" />,
      bg: '#f5f3ff',
      border: '#ede9fe',
      description: 'మ్యాథ్స్, ఫిజిక్స్ ఇష్టపడే వారు డిగ్రీ చదివి సాఫ్ట్‌వేర్ లేదా ప్రభుత్వ ఉద్యోగాలకు వెళ్లడం.',
      details: {
        exams: ['DOST (రాష్ట్ర స్థాయి డిగ్రీ)', 'CUET'],
        courses: ['B.Sc. (Maths, Physics, Computers)', 'BCA (కంప్యూటర్స్)', 'B.Sc. Statistics'],
        ugJobs: ['సాఫ్ట్‌వేర్ డెవలపర్ (BCA తర్వాత)', 'పోలీస్, బ్యాంక్ ఉద్యోగాలు, గ్రూప్స్'],
        pgOptions: ['MCA చేసి టాప్ IT జాబ్స్', 'M.Sc / B.Ed చేసి గవర్నమెంట్ టీచర్ / లెక్చరర్']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function MECPathways() {
  const categories = [
    {
      id: 'commerce',
      title: 'Commerce & CA (కామర్స్ మరియు అకౌంట్స్)',
      icon: <PieChart size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: 'కంపెనీల లెక్కలు చూడటం, చార్టర్డ్ అకౌంటెంట్ (CA) అవ్వాలనుకునే వారి కోసం.',
      details: {
        exams: ['CA Foundation (సీఏ ఎంట్రన్స్)', 'CUET'],
        courses: ['CA (Chartered Accountant)', 'B.Com (కంప్యూటర్స్ / జనరల్)', 'CMA (Cost Management)'],
        ugJobs: ['ఆడిటర్ అసిస్టెంట్ / టాక్స్ ఆఫీసర్', 'బ్యాంక్ ఉద్యోగాలు (క్లర్క్/పీవో)'],
        pgOptions: ['CA ఫైనల్ పాస్ అయ్యి చార్టర్డ్ అకౌంటెంట్ అవ్వడం', 'MBA ఫైనాన్స్ చేసి బ్యాంక్ మేనేజర్']
      }
    },
    {
      id: 'business',
      title: 'Business Management (బిజినెస్ మరియు మేనేజ్మెంట్)',
      icon: <Briefcase size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: 'స్వంత వ్యాపారం పెట్టాలన్నా, పెద్ద కంపెనీలలో మేనేజర్ అవ్వాలన్నా ఇది బెస్ట్.',
      details: {
        exams: ['IPMAT (IIMs కోసం)', 'State Management Tests'],
        courses: ['BBA (బిజినెస్ అడ్మినిస్ట్రేషన్)', 'BMS', 'Integrated MBA (5 సంవత్సరాలు)'],
        ugJobs: ['కంపెనీలలో మార్కెటింగ్ ఎగ్జిక్యూటివ్', 'సొంత వ్యాపారం (బిజినెస్)'],
        pgOptions: ['MBA (IIMs) చేసి మల్టీ నేషనల్ కంపెనీల సీఈఓ (CEO) / హెచ్ ఆర్ మేనేజర్']
      }
    },
    {
      id: 'hotel_fashion',
      title: 'Hotel Management & Fashion (హోటల్ మేనేజ్మెంట్)',
      icon: <Utensils size={24} color="#db2777" />,
      bg: '#fdf2f8',
      border: '#fbcfe8',
      description: 'పెద్ద హోటల్స్ లో చెఫ్ లేదా మేనేజర్ అవ్వాలన్నా, బట్టలు డిజైన్ చేయాలన్నా ఈ కోర్సులు.',
      details: {
        exams: ['NCHMCT JEE (హోటల్ కోర్సులకు)', 'NIFT (ఫ్యాషన్ డిజైన్)'],
        courses: ['BHM (Bachelor of Hotel Management)', 'B.Des (ఫ్యాషన్ డిజైనింగ్)', 'ఈవెంట్ మేనేజ్మెంట్ (Event Mgmt)'],
        ugJobs: ['హోటల్ షెఫ్ / మేనేజర్', 'ఈవెంట్ మేనేజర్ / వెడ్డింగ్ ప్లానర్', 'ఫ్యాషన్ డిజైనర్'],
        pgOptions: ['MBA ఇన్ హాస్పిటాలిటీ / టూరిజం చేసి స్టార్ హోటల్స్ కు మేనేజర్ అవ్వడం']
      }
    },
    {
      id: 'economics',
      title: 'Economics (ఎకనామిక్స్ / ఆర్థిక శాస్త్రం)',
      icon: <Globe size={24} color="#059669" />,
      bg: '#ecfdf5',
      border: '#d1fae5',
      description: 'దేశ ఆర్థిక పరిస్థితి, బ్యాంకింగ్ సిస్టమ్ మీద ఆసక్తి ఉన్న వారి కోసం.',
      details: {
        exams: ['CUET', 'ISI Admission Test'],
        courses: ['B.A. (Hons) Economics', 'B.Sc. Statistics'],
        ugJobs: ['ప్రైవేట్ కంపెనీల్లో డేటా అనలిస్ట్', 'ప్రభుత్వ ఎకనామిక్స్ డిపార్ట్మెంట్ లో ఉద్యోగాలు'],
        pgOptions: ['M.A. Economics చేసి ప్రభుత్వ ఆర్థిక సలహాదారు (Economist) అవ్వడం']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function CECPathways() {
  const categories = [
    {
      id: 'commerce_cec',
      title: 'Commerce & Accounting (కామర్స్ / లెక్కలు)',
      icon: <PieChart size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: 'డిగ్రీలో B.Com చేసి బ్యాంకింగ్ లేదా కంపెనీ అకౌంట్స్ లో స్థిరపడడం.',
      details: {
        exams: ['DOST (డిగ్రీ కోసం)', 'CS CET'],
        courses: ['B.Com (జనరల్ / కంప్యూటర్స్)', 'CS (కంపెనీ సెక్రటరీ)'],
        ugJobs: ['అకౌంటెంట్', 'బ్యాంక్ ఉద్యోగాలు (క్లర్క్, పీవో)', 'ఆఫీస్ అడ్మిన్'],
        pgOptions: ['MBA చేసి కంపెనీ మేనేజర్', 'CS ఫైనల్ కంప్లీట్ చేసి కంపెనీ సెక్రటరీ']
      }
    },
    {
      id: 'hotel_fashion',
      title: 'Hotel Management & Fashion (హోటల్ మేనేజ్మెంట్)',
      icon: <Utensils size={24} color="#db2777" />,
      bg: '#fdf2f8',
      border: '#fbcfe8',
      description: 'పెద్ద హోటల్స్ లో చెఫ్ లేదా మేనేజర్ అవ్వాలన్నా, బట్టలు డిజైన్ చేయాలన్నా ఈ కోర్సులు.',
      details: {
        exams: ['NCHMCT JEE (హోటల్ కోర్సులకు)', 'NIFT (ఫ్యాషన్ డిజైన్)'],
        courses: ['BHM (Bachelor of Hotel Management)', 'B.Des (ఫ్యాషన్ డిజైనింగ్)', 'ఈవెంట్ మేనేజ్మెంట్ (Event Mgmt)'],
        ugJobs: ['హోటల్ షెఫ్ / మేనేజర్', 'ఈవెంట్ మేనేజర్ / వెడ్డింగ్ ప్లానర్', 'ఫ్యాషన్ డిజైనర్'],
        pgOptions: ['MBA ఇన్ హాస్పిటాలిటీ / టూరిజం చేసి స్టార్ హోటల్స్ కు మేనేజర్ అవ్వడం']
      }
    },
    {
      id: 'law',
      title: 'Law / Judiciary (న్యాయ శాస్త్రం / లాయర్)',
      icon: <Landmark size={24} color="#7c3aed" />,
      bg: '#f5f3ff',
      border: '#ede9fe',
      description: 'లాయర్, న్యాయమూర్తి (జడ్జి) లేదా లీగల్ అడ్వైజర్ అవ్వాలనుకునే వారికి.',
      details: {
        exams: ['CLAT (నేషనల్ లెవెల్)', 'LAWCET (రాష్ట్ర స్థాయి)'],
        courses: ['B.A. LLB (5 సంవత్సరాలు)', 'B.Com LLB (5 సంవత్సరాలు)'],
        ugJobs: ['లాయర్ (Advocate)', 'కార్పొరేట్ కంపెనీలకు లీగల్ అడ్వైజర్'],
        pgOptions: ['LLM చదివి ప్రొఫెసర్ అవ్వడం', 'పరీక్ష రాసి సివిల్ జడ్జి లేదా ప్రభుత్వ లాయర్ అవ్వడం']
      }
    },
    {
      id: 'arts_civics',
      title: 'Arts & Govt Jobs (గవర్నమెంట్ ఉద్యోగాలు)',
      icon: <BookOpen size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: 'డిగ్రీ చదివి సివిల్స్, గ్రూప్స్, లేదా పోలీస్ ఉద్యోగాలు సాధించాలనుకునే వారికి.',
      details: {
        exams: ['DOST (డిగ్రీ కోసం)', 'UPSC / APPSC'],
        courses: ['B.A. (హిస్టరీ, పాలిటీ, ఎకనామిక్స్)'],
        ugJobs: ['పోలీస్ (ఎస్ఐ, కానిస్టేబుల్)', 'విఆర్ఓ, పంచాయతీ సెక్రటరీ', 'గ్రూప్-2 లేదా గ్రూప్-4 ఆఫీసర్స్'],
        pgOptions: ['సివిల్స్ రాసి IAS / IPS', 'B.Ed. చేసి గవర్నమెంట్ టీచర్']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function HECPathways() {
  const categories = [
    {
      id: 'govt',
      title: 'Civil Services & Groups (సివిల్స్ & ప్రభుత్వ ఉద్యోగాలు)',
      icon: <Landmark size={24} color="#059669" />,
      bg: '#ecfdf5',
      border: '#d1fae5',
      description: 'కలెక్టర్, ఎస్పీ లాంటి ఉన్నత అధికారులు లేదా గ్రూప్స్ ఆఫీసర్లు అవ్వాలనుకుంటే.',
      details: {
        exams: ['UPSC CSE (సివిల్స్)', 'State Groups (గ్రూప్ 1, 2)'],
        courses: ['B.A. (ఏదైనా ఆర్ట్స్ డిగ్రీ)'],
        ugJobs: ['గ్రూప్-2, 4 ఉద్యోగాలు', 'మండల స్థాయి అధికారులు (MRO, సబ్-రిజిస్ట్రార్)'],
        pgOptions: ['సివిల్స్ లో విజయం సాధించి IAS, IPS (కలెక్టర్, ఎస్పీ) అవ్వడం']
      }
    },
    {
      id: 'humanities',
      title: 'Humanities (చరిత్ర, పాలిటీ, సోషల్ సైన్సెస్)',
      icon: <BookOpen size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: 'చరిత్ర (History), రాజనీతి (Polity) మీద ఆసక్తి ఉండి లెక్చరర్ అవ్వాలనుకుంటే.',
      details: {
        exams: ['CUET', 'DOST'],
        courses: ['B.A. History, Economics', 'B.A. Political Science'],
        ugJobs: ['పోలీస్, కానిస్టేబుల్ ఉద్యోగాలు', 'సోషల్ వర్కర్ (NGO)'],
        pgOptions: ['M.A / B.Ed చేసి డిగ్రీ కాలేజ్ లెక్చరర్, ప్రభుత్వ టీచర్', 'Ph.D చేసి చరిత్రకారుడు అవ్వడం']
      }
    },
    {
      id: 'media',
      title: 'Journalism & Media (జర్నలిజం / న్యూస్ రిపోర్టర్)',
      icon: <PenTool size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: 'టీవీ న్యూస్ రిపోర్టర్, పత్రికా విలేకరి లేదా మీడియా రంగంలోకి వెళ్లాలనుకుంటే.',
      details: {
        exams: ['వర్సిటీ ఎంట్రన్స్ ఎగ్జామ్స్'],
        courses: ['B.A. Journalism', 'Mass Communication (మాస్ కమ్యూనికేషన్)'],
        ugJobs: ['న్యూస్ రిపోర్టర్', 'కంటెంట్ రైటర్ (ఆన్లైన్)', 'సోషల్ మీడియా ఎడిటర్'],
        pgOptions: ['M.A. Journalism చేసి సీనియర్ న్యూస్ ఎడిటర్ / మీడియా పీఆర్ఓ']
      }
    },
    {
      id: 'fine_arts',
      title: 'Fine Arts & Languages (కళలు & బాషలు)',
      icon: <Palette size={24} color="#ea580c" />,
      bg: '#fff7ed',
      border: '#ffedd5',
      description: 'పెయింటింగ్, డాన్స్, యానిమేషన్ లేదా విదేశీ భాషలు నేర్చుకోవాలని ఆసక్తి ఉంటే.',
      details: {
        exams: ['వర్సిటీ స్థాయి ఆర్ట్స్ ఎగ్జామ్స్'],
        courses: ['BFA (Bachelor of Fine Arts)', 'B.A. in Foreign Languages (ఫ్రెంచ్, జర్మన్)'],
        ugJobs: ['ఆర్టిస్ట్ / పెయింటర్ / యానిమేటర్', 'భాషా అనువాదకులు (Translator) / టూరిజం గైడ్'],
        pgOptions: ['MFA చేసి ప్రొఫెషనల్ ఆర్టిస్ట్ లేదా ఆర్ట్ డైరెక్టర్ అవ్వడం']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function VocationalPathways() {
  const categories = [
    {
      id: 'polytechnic',
      title: 'Polytechnic (పాలిటెక్నిక్ / డిప్లొమా)',
      icon: <Settings size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: '10వ తరగతి తర్వాత 3 ఏళ్ళ ఇంజనీరింగ్ కోర్సులు (తొందరగా జాబ్ రావడానికి).',
      details: {
        exams: ['POLYCET (పాలిసెట్)'],
        courses: ['డిప్లొమా ఇన్ సివిల్, మెకానికల్', 'డిప్లొమా ఇన్ ECE, EEE (కరెంట్ పనులు)'],
        ugJobs: ['జూనియర్ ఇంజనీర్ (గవర్నమెంట్ జాబ్స్)', 'ప్రైవేట్ కంపెనీల్లో సూపర్వైజర్'],
        pgOptions: ['B.Tech లో లాటరల్ ఎంట్రీ తీసుకుని సాఫ్ట్‌వేర్ ఇంజనీర్ అవ్వడం']
      }
    },
    {
      id: 'iti',
      title: 'ITI (చేతివృత్తి కోర్సులు)',
      icon: <Wrench size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: '1 లేదా 2 సంవత్సరాల వృత్తి విద్య (చేతిపని నేర్చుకుని తొందరగా స్థిరపడడం).',
      details: {
        exams: ['టెన్త్ మార్కుల ఆధారంగా డైరెక్ట్ అడ్మిషన్'],
        courses: ['ఎలక్ట్రీషియన్, ఫిట్టర్, వెల్డర్', 'మోటార్ మెకానిక్, డ్రాఫ్ట్స్ మెన్'],
        ugJobs: ['రైల్వే టెక్నీషియన్ / లోకో పైలట్', 'లైన్ మెన్ (కరెంట్ ఆఫీస్ లో)', 'సొంత షాప్ పెట్టుకోవడం'],
        pgOptions: ['అప్రెంటిస్ షిప్ చేసి BHEL లాంటి ప్రభుత్వ ఫ్యాక్టరీలో పర్మనెంట్ జాబ్', 'పాలిటెక్నిక్ చదవడం']
      }
    },
    {
      id: 'vocational',
      title: 'Vocational Inter (ఒకేషనల్ ఇంటర్)',
      icon: <Activity size={24} color="#10b981" />,
      bg: '#d1fae5',
      border: '#a7f3d0',
      description: 'రెగ్యులర్ ఇంటర్ కాకుండా డైరెక్ట్ గా నర్సింగ్, ల్యాబ్ టెస్టింగ్ లాంటి పనులు నేర్చుకునే కోర్సులు.',
      details: {
        exams: ['డైరెక్ట్ అడ్మిషన్ (టెన్త్ తర్వాత)'],
        courses: ['MLT (ల్యాబ్ టెక్నీషియన్)', 'MPHW (నర్సింగ్ / హెల్త్ వర్కర్)', 'అగ్రికల్చర్, కంప్యూటర్స్', 'TTC / D.Ed (టీచర్ ట్రైనింగ్)'],
        ugJobs: ['హాస్పిటల్స్ లో హెల్త్ అసిస్టెంట్', 'ల్యాబ్ టెక్నీషియన్ (బ్లడ్ టెస్టింగ్)', 'ప్రైమరీ స్కూల్ టీచర్ (D.Ed తర్వాత)'],
        pgOptions: ['B.Sc. నర్సింగ్ చేసి గవర్నమెంట్ నర్స్ అవ్వడం', 'బ్రిడ్జ్ కోర్సు చేసి డిగ్రీ చదవడం']
      }
    },
    {
      id: 'defence',
      title: 'Defence / Forces (ఆర్మీ, పారామిలటరీ)',
      icon: <Target size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: '10వ తరగతి లేదా ఇంటర్ పాస్ అయ్యాక దేశ సేవలో (ఆర్మీ, నేవీ, ఎయిర్ ఫోర్స్) చేరడం.',
      details: {
        exams: ['అగ్నివీర్ ర్యాలీలు', 'SSC GD (కానిస్టేబుల్ పోస్టులకు)'],
        courses: ['ఆర్మీ టెక్నికల్, జీడీ (GD)', 'నేవీ, ఎయిర్ ఫోర్స్ శిక్షణ', 'BSF, CRPF కానిస్టేబుల్స్'],
        ugJobs: ['ఆర్మీ జవాన్ / సోల్జర్', 'మిలటరీ లో క్లర్క్', 'పారామిలటరీ కానిస్టేబుల్'],
        pgOptions: ['డ్యూటీ చేస్తూనే డిగ్రీ చదవడం', 'డిపార్ట్మెంట్ ఎగ్జామ్స్ రాసి ఆఫీసర్ అవ్వడం']
      }
    }
  ];
  return <BasePathway categories={categories} title="వృత్తి విద్యా కోర్సులు (Vocational & ITI):" />;
}
