import { getSession, getStudentSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Briefcase, 
  Smartphone, 
  BarChart, 
  CheckCircle2,
  PhoneCall
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

      {/* Corporate Navigation */}
      <nav style={{ backgroundColor: 'white', padding: '1rem 4vw', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Building2 size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                Navanidhi Business
              </h1>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise Management</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="#pricing" style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }} className="nav-link">
              Pricing
            </Link>
            <Link href="/login" style={{ background: '#1e40af', color: 'white', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(30,64,175,0.2)' }} className="login-btn">
              Login Portal
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        
        {/* Hero Section */}
        <section style={{ padding: '6rem 4vw 8rem 4vw', textAlign: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: '#dbeafe', color: '#1e40af', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem', border: '1px solid #bfdbfe' }}>
              B2B Institutional Platform
            </div>
            
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
              Streamline Your Admissions & <br/>
              <span style={{ color: '#2563eb' }}>Field Operations (PRO)</span>
            </h2>
            
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#475569', marginBottom: '3rem', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 3rem auto' }}>
              The ultimate SaaS solution for Colleges. Manage your entire admission funnel, empower your Public Relations Officers (PROs) with easy field tools, and oversee telecallers all in one unified dashboard.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="#pricing" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e40af', color: 'white', padding: '1rem 2rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 10px 25px -5px rgba(30,64,175,0.4)', transition: 'all 0.3s' }}>
                View Subscription Plans
              </Link>
            </div>
          </div>
        </section>

        {/* PRO / Employee Value Proposition */}
        <section style={{ padding: '5rem 4vw', background: 'white', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h3 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>Make Field Work Effortless for PROs</h3>
              <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                Our Employee (PRO) portal is designed specifically for on-the-ground efficiency. Capture leads, track targets, and report progress without the paperwork.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="feature-card" style={{ background: '#f8fafc', padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '48px', height: '48px', background: '#eff6ff', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Smartphone size={24} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Mobile-Optimized Portal</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  PROs can log visits, update student statuses, and add new leads directly from their mobile phones while visiting schools or students' homes.
                </p>
              </div>

              <div className="feature-card" style={{ background: '#f8fafc', padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '48px', height: '48px', background: '#f0fdf4', color: '#16a34a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <TrendingUp size={24} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Real-time Tracking</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  No more end-of-day Excel sheets. Every data entry is synced in real-time to the management dashboard.
                </p>
              </div>

              <div className="feature-card" style={{ background: '#f8fafc', padding: '2.5rem 2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '48px', height: '48px', background: '#fef2f2', color: '#dc2626', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <BarChart size={24} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Target & Incentive Dashboard</h4>
                <p style={{ color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  Employees have full visibility into their monthly admission targets, daily achievements, and calculated incentives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / Subscriptions */}
        <section id="pricing" style={{ padding: '6rem 4vw', background: '#0f172a' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h3 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'white', marginBottom: '1rem' }}>Subscription Packages</h3>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Choose the plan that fits your business needs. Scale your admissions seamlessly.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
              
              {/* PRO Subscriptions Card */}
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Briefcase size={24} color="#2563eb" />
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>PRO / Employee Plan</h4>
                  </div>
                  <p style={{ color: '#64748b', margin: 0 }}>For individual field officers (PROs) looking to manage their leads and targets.</p>
                </div>
                <div style={{ padding: '2rem', flex: 1 }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }}/><span style={{ color: '#334155' }}>Individual PRO Login Portal</span></li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }}/><span style={{ color: '#334155' }}>Lead capture & Student follow-up</span></li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}><CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }}/><span style={{ color: '#334155' }}>Daily activity reporting tools</span></li>
                  </ul>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>Monthly</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>₹999 / mo</span>
                    </div>
                    <div style={{ border: '2px solid #2563eb', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>POPULAR</div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>Yearly</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>₹9,999 / yr</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>3-Years</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>₹24,999</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* College Whole Package */}
              <div style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #3b82f6', transform: 'scale(1.05)', zIndex: 10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} className="college-card">
                <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                    ENTERPRISE SOLUTION
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Building2 size={24} color="white" />
                    <h4 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>College Package</h4>
                  </div>
                  <p style={{ color: '#bfdbfe', margin: 0 }}>The complete all-in-one institutional suite.</p>
                </div>
                <div style={{ padding: '2rem', flex: 1, color: 'white' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Building2 size={20}/></div>
                      <div>
                        <div style={{ fontWeight: 700 }}>College Admin Login</div>
                        <div style={{ fontSize: '0.85rem', color: '#93c5fd' }}>Full control & analytics</div>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}><ShieldCheck size={20}/></div>
                      <div>
                        <div style={{ fontWeight: 700 }}>AGM Login</div>
                        <div style={{ fontSize: '0.85rem', color: '#93c5fd' }}>Management oversight</div>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}><Users size={20}/></div>
                      <div>
                        <div style={{ fontWeight: 700 }}>Unlimited PRO Logins</div>
                        <div style={{ fontSize: '0.85rem', color: '#93c5fd' }}>For all your field staff</div>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '8px' }}><PhoneCall size={20}/></div>
                      <div>
                        <div style={{ fontWeight: 700 }}>Telecaller Logins</div>
                        <div style={{ fontSize: '0.85rem', color: '#93c5fd' }}>Call center integration</div>
                      </div>
                    </li>
                  </ul>
                  
                  <Link href="/login" style={{ display: 'block', width: '100%', padding: '1rem', background: 'white', color: '#1e3a8a', textAlign: 'center', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }} className="cta-btn">
                    Contact Sales
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#020617', color: '#94a3b8', padding: '3rem 4vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Building2 size={24} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Navanidhi Business</h3>
            </div>
            <p style={{ fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.6 }}>
              The most powerful SaaS platform for educational institutions and field admissions management.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Login Portals</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">College Login</Link>
                <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">AGM Login</Link>
                <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">PRO / Employee Login</Link>
                <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">Telecaller Login</Link>
              </div>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '1rem' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }} className="footer-link">Pricing</Link>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}>Privacy Policy</span>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer' }}>Terms of Service</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '2rem auto 0 auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} Navanidhi Enterprise Management. All rights reserved.
        </div>
      </footer>

      {/* Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        html { scroll-behavior: smooth; }
        
        .nav-link:hover {
          color: #1e40af !important;
        }

        .login-btn:hover {
          background-color: #1e3a8a !important;
          transform: translateY(-1px);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          background: #1e3a8a !important;
          box-shadow: 0 15px 30px -5px rgba(30,64,175,0.5) !important;
        }

        .feature-card {
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
          border-color: #cbd5e1 !important;
        }

        .cta-btn:hover {
          background-color: #f8fafc !important;
          transform: scale(1.02);
        }

        .footer-link:hover {
          color: white !important;
        }

        @media (max-width: 768px) {
          .college-card {
            transform: scale(1) !important;
            margin-top: 1rem;
          }
        }
      `}} />
    </div>
  );
}
