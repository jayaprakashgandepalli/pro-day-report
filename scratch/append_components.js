const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'student', 'dashboard', 'career-guidance', 'page.tsx');

const contentToAppend = `
function BasePathway({ categories, title = 'Select a Domain to view details:' }: { categories: any[], title?: string }) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{title}</h2>
      
      {categories.map((cat) => (
        <div
          key={cat.id}
          style={{
            borderRadius: '16px',
            border: \`2px solid \${activeCategory === cat.id ? '#6366f1' : '#f1f5f9'}\`,
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
                    Entrance Exams / Process
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
                    Undergraduate (UG)
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

                <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                    Higher Ed (PG)
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cat.details.higherEducation.map((pg: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', color: '#334155', fontSize: '0.95rem' }}>
                        <GraduationCap size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{pg}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'linear-gradient(to bottom right, #eef2ff, #f3e8ff)', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e0e7ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: '#9333ea' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                    Job Opportunities
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {cat.details.jobs.map((job: string, i: number) => (
                      <li key={i} style={{ display: 'flex', gap: '0.5rem', color: '#1e293b', fontSize: '0.95rem' }}>
                        <Briefcase size={16} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontWeight: 500 }}>{job}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MECPathways() {
  const categories = [
    {
      id: 'commerce',
      title: 'Commerce & Accounting',
      icon: <PieChart size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: 'Chartered Accountancy, B.Com, Finance.',
      details: {
        exams: ['CA Foundation', 'CMA Foundation', 'CS CET', 'CUET'],
        courses: ['B.Com (Gen / Comp / Hons)', 'CA (Chartered Accountant)', 'CMA', 'BBA'],
        higherEducation: ['M.Com', 'MBA (Finance)', 'CFA'],
        jobs: ['Auditor', 'Financial Analyst', 'Tax Consultant', 'Banker']
      }
    },
    {
      id: 'business',
      title: 'Business & Management',
      icon: <Briefcase size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: 'BBA, Management Studies, Entrepreneurship.',
      details: {
        exams: ['IPMAT (IIMs)', 'CUET', 'State Management Tests'],
        courses: ['BBA', 'BMS (Management Studies)', 'Integrated MBA (5 Yrs)'],
        higherEducation: ['MBA (IIMs, ISB)', 'PGDM', 'M.Sc Management'],
        jobs: ['HR Manager', 'Marketing Exec', 'Business Analyst', 'Entrepreneur']
      }
    },
    {
      id: 'economics',
      title: 'Economics & Statistics',
      icon: <Globe size={24} color="#059669" />,
      bg: '#ecfdf5',
      border: '#d1fae5',
      description: 'B.A. / B.Sc. Economics, Actuarial Sciences.',
      details: {
        exams: ['CUET', 'ISI Admission Test', 'Actuarial Exams (ACET)'],
        courses: ['B.A. (Hons) Economics', 'B.Sc. Statistics', 'Actuarial Science'],
        higherEducation: ['M.A. Economics', 'Indian Economic Service (IES)'],
        jobs: ['Economist', 'Data Analyst', 'Actuary', 'Policy Advisor']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function CECPathways() {
  const categories = [
    {
      id: 'commerce_cec',
      title: 'Commerce & Accounting',
      icon: <PieChart size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: 'B.Com, CA, CS, Corporate Sector.',
      details: {
        exams: ['CA Foundation', 'CS CET', 'State Degree admissions'],
        courses: ['B.Com (General/Computers)', 'BBA', 'CS (Company Secretary)'],
        higherEducation: ['M.Com', 'MBA', 'CA/CMA final'],
        jobs: ['Accountant', 'Company Secretary', 'Banking Sector', 'Corporate Admin']
      }
    },
    {
      id: 'law',
      title: 'Law & Legal Studies',
      icon: <Landmark size={24} color="#7c3aed" />,
      bg: '#f5f3ff',
      border: '#ede9fe',
      description: 'LLB, Corporate Law, Judiciary.',
      details: {
        exams: ['CLAT', 'LSAT', 'State LAWCET'],
        courses: ['B.A. LLB (5 Years)', 'B.Com LLB (5 Years)', 'BBA LLB'],
        higherEducation: ['LLM', 'Judicial Services Training'],
        jobs: ['Lawyer / Advocate', 'Corporate Legal Advisor', 'Civil Judge', 'Public Prosecutor']
      }
    },
    {
      id: 'arts_civics',
      title: 'Humanities & Govt Services',
      icon: <BookOpen size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: 'B.A, Civils, Teaching.',
      details: {
        exams: ['UPSC Civil Services', 'State PSC (Groups)', 'SSC'],
        courses: ['B.A. (History, Economics, Pol. Science)', 'B.A. (Sociology, Public Admin)'],
        higherEducation: ['M.A.', 'B.Ed.', 'M.Ed.', 'Ph.D.'],
        jobs: ['IAS / IPS Officer', 'Govt Teacher / Lecturer', 'Group-1 & 2 Officers', 'Journalist']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}

function HECPathways() {
  const categories = [
    {
      id: 'humanities',
      title: 'Humanities & Social Sciences',
      icon: <BookOpen size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: 'B.A. in History, Economics, Civics.',
      details: {
        exams: ['CUET', 'Degree Online Services'],
        courses: ['B.A. (History, Economics, Civics)', 'B.A. (Literature/Languages)', 'B.A. (Psychology)'],
        higherEducation: ['M.A. (Various Subjects)', 'B.Ed.', 'Ph.D.'],
        jobs: ['Professor/Lecturer', 'Historian/Archeologist', 'Psychologist/Counselor', 'NGO/Social Worker']
      }
    },
    {
      id: 'govt',
      title: 'Civil Services & Admin',
      icon: <Landmark size={24} color="#059669" />,
      bg: '#ecfdf5',
      border: '#d1fae5',
      description: 'UPSC, State Groups, Government roles.',
      details: {
        exams: ['UPSC CSE', 'State Public Service (Groups)', 'SSC CGL'],
        courses: ['Any Degree (B.A. preferred for Humanities base)'],
        higherEducation: ['Specialized Admin Diplomas', 'Public Administration Masters'],
        jobs: ['IAS/IPS/IRS', 'State Civil Servant', 'Diplomat (IFS)', 'Policy Maker']
      }
    },
    {
      id: 'media',
      title: 'Journalism & Mass Media',
      icon: <PenTool size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: 'Mass Communication, Journalism, Content.',
      details: {
        exams: ['University Specific Entrance Exams', 'CUET'],
        courses: ['B.A. Journalism', 'B.Sc. Mass Comm', 'BMM'],
        higherEducation: ['M.A. Journalism', 'PG Diploma in Media'],
        jobs: ['Journalist / Reporter', 'Content Writer / Editor', 'PR Professional', 'Digital Media Strategist']
      }
    }
  ];
  return <BasePathway categories={categories} />;
}
`;

fs.appendFileSync(filePath, contentToAppend);
console.log('Appended successfully');
