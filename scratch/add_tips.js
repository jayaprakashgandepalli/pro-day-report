const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(process.cwd(), 'src/app/student/dashboard/resources/page.tsx'), 'utf8');

// Add Lightbulb import
code = code.replace('School, FileText, CheckCircle }', 'School, FileText, CheckCircle, Lightbulb, Clock, BookOpen, Brain, Smile }');

// Add StudyTips type
code = code.replace(/type Tab = 'IIIT' \| 'Scholarships' \| 'Colleges';/, "type Tab = 'IIIT' | 'Scholarships' | 'Colleges' | 'StudyTips';");

// Add Tab
code = code.replace(
  "{ id: 'Colleges', label: 'Top Colleges (ఉత్తమ కాలేజీలు)', icon: <School size={20} /> },",
  "{ id: 'Colleges', label: 'Top Colleges (ఉత్తమ కాలేజీలు)', icon: <School size={20} /> },\n    { id: 'StudyTips', label: '10th Study Tips (పరీక్షల టిప్స్)', icon: <Lightbulb size={20} /> },"
);

// Render StudyTips
code = code.replace(
  "{activeTab === 'Colleges' && <CollegesInfo />}",
  "{activeTab === 'Colleges' && <CollegesInfo />}\n        {activeTab === 'StudyTips' && <StudyTipsInfo />}"
);

const tipsCode = `
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
`;

code += '\n' + tipsCode;
fs.writeFileSync(path.join(process.cwd(), 'src/app/student/dashboard/resources/page.tsx'), code);
