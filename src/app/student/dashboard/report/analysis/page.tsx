import { getStudentSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export default async function AnalysisPage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const report = await prisma.assessmentReport.findUnique({
    where: { studentId: session.id },
    include: { student: { select: { studentName: true } } }
  });

  if (!report) redirect('/student/dashboard/report');

  const flaws = report.identifiedFlaws?.split('\n\n').filter(Boolean) || [];
  const adviceList = report.advice?.split('\n\n').filter(Boolean) || [];
  const dailyActs = report.dailyActivities?.split('\n').filter(Boolean) || [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          href="/student/dashboard/report" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Back to Report
        </Link>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '24px', padding: '2.5rem', color: 'white', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'white' }}>Detailed Analysis & Action Plan</h1>
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: 0 }}>
          {report.student?.studentName}, here is a deep dive into your behavior and clear steps for your future.
        </p>
      </div>

      {/* Flaws Section */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #fee2e2', boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#1e1b4b', margin: 0, fontWeight: 700 }}>Areas for Improvement (మీరు సరిదిద్దుకోవాల్సినవి)</h2>
        </div>
        
        {flaws.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {flaws.map((flaw, i) => (
              <li key={i} style={{ padding: '1rem', background: '#fff5f5', borderRadius: '12px', color: '#991b1b', marginBottom: '0.75rem', fontSize: '1.1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>⚠️</span>
                {flaw.replace('• ', '')}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#15803d', fontSize: '1.1rem', fontWeight: 600 }}>అంతా అద్భుతంగా ఉంది! ఎలాంటి లోపాలు లేవు.</p>
        )}
      </div>

      {/* Advice Section */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #e0e7ff', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lightbulb size={24} color="#4f46e5" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#1e1b4b', margin: 0, fontWeight: 700 }}>Personalized Advice (మా సలహాలు)</h2>
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {adviceList.length > 0 ? adviceList.map((adv, i) => (
            <li key={i} style={{ padding: '1rem', background: '#f8fafc', borderLeft: '4px solid #4f46e5', borderRadius: '0 12px 12px 0', color: '#334155', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
              {adv.replace('• ', '')}
            </li>
          )) : (
            <li style={{ padding: '1rem', color: '#64748b' }}>No specific advice available.</li>
          )}
        </ul>
      </div>

      {/* Daily Activities Section */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1px solid #dcfce7', boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#1e1b4b', margin: 0, fontWeight: 700 }}>Daily Action Plan (రోజువారీ సూచనలు)</h2>
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {dailyActs.map((act, i) => (
            <li key={i} style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '12px', color: '#166534', marginBottom: '0.75rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={20} color="#22c55e" />
              {act.replace(/^[0-9]+\.\s*/, '')}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
