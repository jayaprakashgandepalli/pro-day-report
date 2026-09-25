const fs = require('fs');

const code = `
function VocationalPathways() {
  const categories = [
    {
      id: 'polytechnic',
      title: 'Polytechnic (Diploma)',
      icon: <Settings size={24} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#dbeafe',
      description: '3-Year Diploma in Engineering (After 10th).',
      details: {
        exams: ['POLYCET (State Level)'],
        courses: ['Diploma in Civil (DCE)', 'Diploma in Mechanical (DME)', 'Diploma in EEE / ECE', 'Diploma in Computers (DCME)'],
        higherEducation: ['B.Tech 2nd Year (via ECET)', 'B.E. (Lateral Entry)'],
        jobs: ['Junior Engineer (Govt/RRB)', 'Technical Assistant (ISRO/DRDO)', 'Factory Supervisor', 'IT Sector Technician']
      }
    },
    {
      id: 'iti',
      title: 'ITI (Industrial Training)',
      icon: <Wrench size={24} color="#f59e0b" />,
      bg: '#fffbeb',
      border: '#fef3c7',
      description: '1 or 2-Year Skill based Trades (After 10th).',
      details: {
        exams: ['Direct Admission / Merit Based'],
        courses: ['Electrician, Fitter, Welder', 'COPA (Computer Operator)', 'Motor Mechanic, Draftsman'],
        higherEducation: ['Apprenticeship (NCTVT)', 'Polytechnic 2nd Year (Lateral)'],
        jobs: ['Railway Technician / Loco Pilot', 'Electricity Board (Lineman)', 'BHEL, Singareni, Ordnance Factories', 'Self-Employment (Workshops)']
      }
    },
    {
      id: 'vocational',
      title: 'Vocational Intermediate',
      icon: <Activity size={24} color="#10b981" />,
      bg: '#d1fae5',
      border: '#a7f3d0',
      description: 'Job-oriented Intermediate courses.',
      details: {
        exams: ['Direct Admission (After 10th)'],
        courses: ['MLT (Medical Lab Tech)', 'MPHW (Nursing/Health Worker)', 'Agriculture & Accounting', 'Pre-School Teacher Training'],
        higherEducation: ['B.Sc MLT / B.Sc Nursing', 'Regular Degree (via Bridge Course)', 'D.Ed'],
        jobs: ['Lab Technician (Hospitals)', 'Nurse / Health Assistant', 'Data Entry Operator', 'Primary School Teacher']
      }
    },
    {
      id: 'defence',
      title: 'Defence & Paramilitary',
      icon: <Target size={24} color="#e11d48" />,
      bg: '#fff1f2',
      border: '#ffe4e6',
      description: 'Army, Navy, Air Force, and SSC GD.',
      details: {
        exams: ['Agniveer Rallies', 'SSC GD Constable', 'NDA (After Inter)'],
        courses: ['Army (GD, Tech, Clerk, Tradesman)', 'Navy (SSR, MR) & Air Force (X, Y)', 'BSF, CRPF, CISF, ITBP'],
        higherEducation: ['In-Service Degrees', 'Specialized Military Training', 'Officer Training Academy'],
        jobs: ['Soldier / Sailor / Airman', 'Paramilitary Constable', 'Technical Staff in Forces', 'Commissioned Officer (via NDA)']
      }
    }
  ];
  return <BasePathway categories={categories} title="Select a Vocational or Defence stream:" />;
}
`;

fs.appendFileSync('src/app/student/dashboard/career-guidance/page.tsx', code);
