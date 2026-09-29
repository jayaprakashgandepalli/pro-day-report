import { getSession, getStudentSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  BrainCircuit, 
  BarChart4, 
  Lightbulb, 
  CalendarCheck, 
  MessageCircleQuestion,
  GraduationCap
} from 'lucide-react';

export default async function RootPage() {
  const session = await getSession();
  const studentSession = await getStudentSession();

  if (session) {
    if (session.role === 'ADMIN') redirect('/admin');
    else if (session.role === 'TELECALLER') redirect('/telecaller');
    else if (session.role === 'COLLEGE') redirect('/college');
    else redirect('/employee');
  } else if (studentSession) {
    redirect('/student/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>

      {/* Modern Navigation */}
      <nav style={{ backgroundColor: 'white', padding: '1rem 4vw', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                Navanidhi Trust
              </h1>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Education and Rural Development</p>
            </div>
          </div>

          <div>
            <Link href="/login" style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'all 0.2s' }} className="staff-login-btn">
              Staff Login
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        
        {/* Hero Section */}
        <section style={{ padding: '5rem 4vw 6rem 4vw', textAlign: 'center', background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Background decorations */}
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(4,120,87,0.1) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: '#ecfdf5', color: '#047857', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', border: '1px solid #6ee7b7' }}>
              Exclusive for 10th & Intermediate Students
            </div>
            
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Design your future with <br/>
              <span style={{ color: '#047857' }}>Navanidhi</span>
            </h2>
            
            <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#475569', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 3rem auto' }}>
              Join thousands of students discovering their true potential. Take our scientific career test, get personalized guidance, and secure your admission in top colleges.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/student/register" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#047857', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 10px 25px -5px rgba(4,120,87,0.4)', transition: 'all 0.3s' }}>
                New Student? Register Here <ArrowRight size={20} />
              </Link>
              
              <Link href="/student/login" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: '#1e293b', border: '2px solid #e2e8f0', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.3s' }}>
                Student Login
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '4rem 4vw 6rem 4vw', background: 'white', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h3 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Everything you need to succeed</h3>
              <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Our student portal is packed with powerful features designed to give you clarity and confidence in your career journey.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Feature 1 */}
              <div className="feature-card" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                <div style={{ width: '56px', height: '56px', background: '#ecfdf5', color: '#10b981', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <BrainCircuit size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>AI Career Assessment</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  Not sure whether to choose MPC, BiPC, or CEC? Take our 5-minute scientific test to discover the perfect intermediate stream for your mindset.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                <div style={{ width: '56px', height: '56px', background: '#f0fdf4', color: '#10b981', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <BarChart4 size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Personalized Career Report</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  Get a detailed report highlighting your strengths, weaknesses, and a curated list of future jobs that perfectly match your personality.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                <div style={{ width: '56px', height: '56px', background: '#fdf4ff', color: '#d946ef', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Lightbulb size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Memory & Study Secrets</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  Learn scientifically proven techniques to remember what you read, overcome phone addiction, and build unbreakable study discipline.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-card" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                <div style={{ width: '56px', height: '56px', background: '#fffbeb', color: '#f59e0b', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <CalendarCheck size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Daily Action Plan</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  Stay on track with a customized daily routine and habits checklist designed to keep you focused on your ultimate career goals.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="feature-card" style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', transition: 'all 0.3s' }}>
                <div style={{ width: '56px', height: '56px', background: '#fef2f2', color: '#ef4444', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <MessageCircleQuestion size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Ask an Expert</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  Confused about college admissions, fees, or specific courses? Send your questions directly to our educational experts for clear answers.
                </p>
              </div>

              {/* Final CTA Card */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '2rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'white' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>Ready to start?</h4>
                <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>Join the Navanidhi student community today.</p>
                <Link href="/student/register" style={{ background: '#059669', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', transition: 'background 0.2s' }} className="cta-mini">
                  Register Now
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0f172a', color: '#cbd5e1', padding: '3rem 4vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <GraduationCap size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Navanidhi Education and Rural Development Trust</h3>
            </div>
            <p style={{ fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.6, color: '#94a3b8' }}>
              Empowering students with data-backed career counseling and transparent college admissions guidance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Portals</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/student/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">Student Login</Link>
                <Link href="/student/register" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">Student Registration</Link>
                <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">Admin / Staff Login</Link>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}>Privacy Policy</span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}>Terms of Service</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '2rem auto 0 auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          &copy; {new Date().getFullYear()} Navanidhi Education and Rural Development Trust. All rights reserved.
        </div>
      </footer>

      {/* Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        html { scroll-behavior: smooth; }
        
        .staff-login-btn:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a !important;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          background: #064e3b !important;
          box-shadow: 0 15px 30px -5px rgba(6,78,59,0.5) !important;
        }

        .btn-secondary:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1 !important;
          background: #f8fafc !important;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
          border-color: #cbd5e1 !important;
        }

        .cta-mini:hover {
          background-color: #047857 !important;
        }

        .footer-link:hover {
          color: white !important;
        }

        @media (max-width: 600px) {
          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .staff-login-btn {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}

