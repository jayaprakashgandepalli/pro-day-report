import { getStudentSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight, Trophy, BookOpen, Clock, Activity, Zap } from 'lucide-react';

export default async function StudentDashboardPage() {
  const session = await getStudentSession();
  
  if (!session) return null;

  // Check if student has taken the assessment
  const report = await prisma.assessmentReport.findUnique({
    where: { studentId: session.id }
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e1b4b', marginBottom: '0.5rem' }}>
          Welcome back, {session.name}! 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Here is your personal career tracking dashboard.
        </p>
      </header>

      {/* Main Action Banner */}
      {!report ? (
        <div style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
          borderRadius: '24px', 
          padding: '3rem 2.5rem', 
          color: 'white', 
          boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '3rem'
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ position: 'absolute', bottom: '-80px', right: '100px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.2)', width: 'fit-content', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600 }}>
              <Zap size={16} color="#fbbf24" /> Action Required
            </div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, margin: '0 0 1rem 0', lineHeight: 1.2 }}>Discover Your Perfect Career Path</h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '2rem', lineHeight: 1.6 }}>
              Take our AI-powered assessment test to find out which groups and jobs suit you best based on your interests and skills.
            </p>
            <Link 
              href="/student/dashboard/test" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                background: 'white', 
                color: '#6366f1', 
                padding: '1rem 1.5rem', 
                borderRadius: '12px', 
                fontWeight: 700, 
                fontSize: '1.1rem',
                textDecoration: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}
            >
              Start Assessment Now <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          borderRadius: '24px', 
          padding: '2rem 2.5rem', 
          color: 'white', 
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Assessment Completed! 🎉</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Your personalized career report is ready to view.</p>
          </div>
          <Link 
            href="/student/dashboard/report" 
            style={{ 
              background: 'white', 
              color: '#059669', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '10px', 
              fontWeight: 600, 
              textDecoration: 'none' 
            }}
          >
            View My Report
          </Link>
        </div>
      )}

      {/* Quick Stats / Info Cards */}
      <h3 style={{ fontSize: '1.25rem', color: '#334155', marginBottom: '1rem' }}>Your Journey</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>Career Group</h4>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>
              {report?.recommendedGroup || 'Not Tested'}
            </p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#fdf4ff', color: '#d946ef', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>Daily Activities</h4>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>
              {report ? 'Available' : 'Pending'}
            </p>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', background: '#fffbeb', color: '#d97706', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>Profile Status</h4>
            <p style={{ margin: 0, fontWeight: 700, color: '#059669', fontSize: '1.25rem' }}>
              Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
