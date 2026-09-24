import { getStudentSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Award, Briefcase, Calendar, Target, AlertTriangle, Sparkles, BookOpen, ShieldAlert, Users, Compass } from 'lucide-react';
import Link from 'next/link';
import ResetTestButton from '@/components/ResetTestButton';

export default async function AssessmentReportPage() {
  const session = await getStudentSession();
  if (!session) redirect('/student/login');

  const report = await prisma.assessmentReport.findUnique({
    where: { studentId: session.id },
    include: {
      student: {
        select: { studentName: true }
      }
    }
  });

  if (!report) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={40} color="#64748b" />
        </div>
        <h2 style={{ fontSize: '1.75rem', color: '#0f172a', marginBottom: '1rem' }}>No Report Found</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
          You haven't completed your career assessment test yet. Take the test to discover your ideal career path!
        </p>
        <Link 
          href="/student/dashboard/test"
          style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)' }}
        >
          Start Assessment Now
        </Link>
      </div>
    );
  }

  // Helper to render score bar
  const renderScoreBar = (title: string, score: number | null, icon: any, color: string) => {
    const val = score || 0;
    const percentage = val * 10; // since score is out of 10
    
    let remark = 'Needs Improvement';
    if (val >= 8) remark = 'Excellent';
    else if (val >= 5) remark = 'Average';

    return (
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>{title}</h3>
          </div>
          <span style={{ fontWeight: 700, color: color }}>{val}/10 ({remark})</span>
        </div>
        <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '5px' }}></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '24px', padding: '3rem 2rem', color: 'white', textAlign: 'center', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-40px', right: '-20px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Sparkles size={48} color="#a855f7" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'white' }}>Your 360° Career Report</h1>
          <p style={{ fontSize: '1.2rem', color: '#cbd5e1', margin: 0, opacity: 0.9 }}>
            Congratulations, {report.student?.studentName}! Here is your personalized analysis.
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Section 1: Group Clarity</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Recommended Group */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#4f46e5" />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#1e1b4b', margin: 0, fontWeight: 700 }}>Recommended Group</h2>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5', margin: 0, background: 'linear-gradient(90deg, #4f46e5, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {report.recommendedGroup || 'Not Determined'}
          </p>
        </div>

        {/* Recommended Jobs */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={24} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: '#1e1b4b', margin: 0, fontWeight: 700 }}>Ideal Career Paths</h2>
          </div>
          <p style={{ fontSize: '1.1rem', color: '#334155', margin: 0, lineHeight: '1.6', fontWeight: 500 }}>
            {report.recommendedJobs || 'Not Determined'}
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Section 2: Behavioral Analysis</h2>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
        {renderScoreBar('Study Discipline', report.disciplineScore, <Target size={20} color="#10b981" />, '#10b981')}
        {renderScoreBar('Screen Time & Habits', report.screenTimeScore, <ShieldAlert size={20} color="#ef4444" />, '#ef4444')}
        {renderScoreBar('Family Attitude', report.familyAttitudeScore, <Users size={20} color="#8b5cf6" />, '#8b5cf6')}
        {renderScoreBar('Career Readiness', report.careerClarityScore, <Compass size={20} color="#f59e0b" />, '#f59e0b')}
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>Section 3: Detailed Action Plan & Advice</h2>
      <Link href="/student/dashboard/report/analysis" style={{ textDecoration: 'none' }}>
        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={32} color="#4f46e5" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: '#1e1b4b', margin: '0 0 0.5rem 0', fontWeight: 700 }}>View Full Action Plan & Advice</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', margin: 0 }}>Click here to view your personalized suggestions and identified areas for improvement in Telugu.</p>
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            ➔
          </div>
        </div>
      </Link>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <ResetTestButton />
      </div>

    </div>
  );
}
