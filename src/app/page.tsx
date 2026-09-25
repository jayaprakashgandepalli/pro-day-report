import { getSession, getStudentSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Compass, CheckCircle2, Search, BrainCircuit, ShieldCheck, MapPin, Sparkles, Microscope, Code, Briefcase, ChevronRight, Star } from 'lucide-react';
import logoImg from '../../public/logo.png';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>

      {/* Floating Glass Navigation */}
      <div className="nav-container" style={{ position: 'sticky', top: '1rem', zIndex: 100, padding: '0 4vw' }}>
        <nav className="main-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(226, 232, 240, 0.8)', padding: '0.75rem 2rem', borderRadius: '999px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div className="nav-logo">
              <Image src={logoImg} alt="Naaguru Logo" width={100} height={32} style={{ objectFit: 'contain' }} priority />
            </div>
            <div className="desktop-nav" style={{ display: 'flex', gap: '2rem' }}>
              <Link href="#discover" className="nav-link-hover" style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>Discover</Link>
              <Link href="#pathways" className="nav-link-hover" style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>Pathways</Link>
              <Link href="#journey" className="nav-link-hover" style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>Journey</Link>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/login" className="nav-link-hover hide-mobile-small" style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
              Staff Login
            </Link>
            <Link href="/student/login" className="nav-btn-glow" style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #004d40 0%, #059669 100%)', color: 'white', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', borderRadius: '999px', transition: 'all 0.3s' }}>
              Student Portal
            </Link>
          </div>
        </nav>
      </div>

      <main style={{ flex: 1 }}>

        {/* Next-Gen Hero Section */}
        <section className="section-padding hero-section" style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '3rem',
          paddingBottom: '4rem'
        }}>
          {/* Animated Mesh Gradient Background */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: -1, animation: 'float-slow 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(0,77,64,0.08) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: -1, animation: 'float-slow 10s ease-in-out infinite reverse' }} />

          <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3rem', padding: '0 4vw' }}>

            {/* Left Content */}
            <div style={{ flex: '1 1 100%', maxWidth: '600px', zIndex: 10 }}>
              <div className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', color: '#0f172a', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1.25rem', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }} />
                Exclusive for 10th Class Students | Admissions 2026-2027
              </div>

              <h1 className="hero-heading" style={{ fontSize: 'clamp(2.25rem, 7vw, 4.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1rem' }}>
                Design your future.<br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  Secure your path.
                  <svg style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%', height: '8px' }} viewBox="0 0 200 12" preserveAspectRatio="none">
                    <path d="M0,10 Q100,0 200,10" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="hero-desc" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', color: '#475569', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '500px' }}>
                Join thousands of 10th class students who have discovered their true potential. We provide data-backed career counseling and direct pathways to top Junior Colleges for your intermediate education.
              </p>

              {/* Creative Input Interaction */}
              <div className="search-bar" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.4rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', maxWidth: '100%' }}>
                <div style={{ padding: '0 0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <Search size={18} style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>What do you want to study?</span>
                </div>
                <Link href="/student/login" className="hero-btn-action" style={{ padding: '0.6rem 1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 600, textDecoration: 'none', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', flexShrink: 0 }}>
                  Begin <ArrowRight size={14} />
                </Link>
              </div>

              <div className="avatar-stack-container" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', border: '2px solid white', marginLeft: i > 1 ? '-10px' : '0', backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=e2e8f0')`, backgroundSize: 'cover' }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>10,000+</span> joined
                </div>
              </div>
            </div>

            {/* Right Visual composition */}
            <div className="hero-visuals" style={{ flex: '1 1 400px', position: 'relative', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="float-card-1" style={{ position: 'absolute', top: '5%', right: '5%', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '1.25rem', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', zIndex: 3, width: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#ecfdf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Aptitude Score</div>
                    <div style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>Exceptional</div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', backgroundColor: '#10b981', borderRadius: '3px' }} />
                </div>
              </div>

              <div className="float-card-2" style={{ position: 'absolute', bottom: '10%', left: '0%', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '1.25rem', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', zIndex: 2, width: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>Recommended Path</div>
                  <Sparkles size={14} color="#f59e0b" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <div style={{ width: '28px', height: '28px', backgroundColor: '#e0e7ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                    <Microscope size={14} />
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>BiPC Stream</div>
                  <CheckCircle2 size={14} color="#10b981" style={{ marginLeft: 'auto' }} />
                </div>
              </div>

              {/* Center Abstract Art */}
              <div style={{ width: '250px', height: '250px', borderRadius: '50%', background: 'conic-gradient(from 180deg at 50% 50%, #004d40 0deg, #10b981 180deg, #f0fdf4 360deg)', opacity: 0.15, animation: 'spin-slow 20s linear infinite', zIndex: 1 }} />
            </div>

          </div>
        </section>

        {/* Explore Pathways Section - Compact Version */}
        <section id="pathways" className="section-padding" style={{ backgroundColor: '#0f172a', color: 'white' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 4vw' }}>
            <div className="pathway-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Explore Your Potential Pathways</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>Not sure what group to choose after 10th? Our assessment engine maps your cognitive strengths to the most suitable intermediate streams.</p>
              </div>
              <Link href="/student/login" className="pathway-btn-ghost" style={{ padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', color: 'white', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s', fontSize: '0.8rem' }}>
                View All Streams <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {/* Compact Pathway Card 1 */}
              <div className="pathway-card" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', transition: 'all 0.3s', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="pathway-glow" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at left, rgba(59,130,246,0.15), transparent 70%)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ minWidth: '48px', height: '48px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <Code size={24} />
                </div>
                <div style={{ flex: 1, zIndex: 10 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ceffd9ff' }}>MPC Stream</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '0' }}>Mathematics, Physics, Chemistry. Ideal for future engineers.</p>
                </div>
                <div style={{ color: '#60a5fa', zIndex: 10 }}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Compact Pathway Card 2 */}
              <div className="pathway-card" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', transition: 'all 0.3s', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="pathway-glow" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at left, rgba(16,185,129,0.15), transparent 70%)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ minWidth: '48px', height: '48px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <Microscope size={24} />
                </div>
                <div style={{ flex: 1, zIndex: 10 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ceffd9ff' }}>BiPC Stream</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '0' }}>Biology, Physics, Chemistry. The gateway for medicine.</p>
                </div>
                <div style={{ color: '#34d399', zIndex: 10 }}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Compact Pathway Card 3 */}
              <div className="pathway-card" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', transition: 'all 0.3s', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="pathway-glow" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at left, rgba(245,158,11,0.15), transparent 70%)', opacity: 0, transition: 'opacity 0.3s' }} />
                <div style={{ minWidth: '48px', height: '48px', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <Briefcase size={24} />
                </div>
                <div style={{ flex: 1, zIndex: 10 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ceffd9ff' }}>Commerce</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '0' }}>CEC, MEC. The foundation for accountancy and business.</p>
                </div>
                <div style={{ color: '#fbbf24', zIndex: 10 }}>
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Bento Benefits Section */}
        <section id="discover" className="section-padding" style={{ backgroundColor: '#f8fafc' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 4vw' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem' }}>
                <Star size={12} /> The Naaguru Advantage
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Why students trust us.</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' }}>We replace guesswork with science and anxiety with assurance.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', gridAutoRows: 'minmax(200px, auto)' }}>

              <div className="bento-box-v2" style={{ gridColumn: 'span 7', backgroundColor: '#ffffff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ minWidth: '48px', height: '48px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '1.25rem', alignSelf: 'flex-start' }}>
                  <Compass size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Unbiased Guidance</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, maxWidth: '400px' }}>We don't push you towards random courses. Our advice is strictly based on your aptitude and career aspirations.</p>
              </div>

              <div className="bento-box-v2" style={{ gridColumn: 'span 5', background: 'linear-gradient(135deg, #004d40 0%, #065f46 100%)', borderRadius: '24px', padding: '2rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-10%', top: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                <ShieldCheck size={28} color="#34d399" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ceffd9ff' }}>Zero Hidden Fees</h3>
                <p style={{ color: '#d1fae5', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>Complete transparency in fee structures. Absolutely no middleman commissions.</p>
              </div>

              <div className="bento-box-v2" style={{ gridColumn: 'span 5', backgroundColor: '#ffffff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <MapPin size={28} color="#3b82f6" style={{ marginBottom: '1.25rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Local Expertise</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>Deep knowledge of the best educational institutions across your preferred districts and mandals.</p>
              </div>

              <div className="bento-box-v2" style={{ gridColumn: 'span 7', backgroundColor: '#f8fafc', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ minWidth: '48px', height: '48px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.25rem', alignSelf: 'flex-start' }}>
                  <BrainCircuit size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Psychometric Testing</h3>
                <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, maxWidth: '400px' }}>Understand your innate strengths through our scientifically designed career assessment modules before deciding your group.</p>
              </div>

            </div>
          </div>
        </section>

        {/* Dynamic Journey Timeline */}
        <section id="journey" className="section-padding" style={{ backgroundColor: '#ffffff', overflow: 'hidden' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 4vw' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '3rem', textAlign: 'center' }}>Your Journey with Us</h2>

            <div className="journey-path" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', gap: '1rem' }}>

              {/* Connecting Track */}
              <div className="journey-line" style={{ position: 'absolute', top: '28px', left: '10%', right: '10%', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', zIndex: 0 }}>
                {/* Animated glowing progress */}
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'linear-gradient(90deg, #10b981 0%, #004d40 100%)', opacity: 0.2, borderRadius: '2px' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '50%', background: 'linear-gradient(90deg, #10b981 0%, #004d40 100%)', borderRadius: '2px', animation: 'progress-glow 3s ease-in-out infinite alternate' }} />
              </div>

              {/* Step 1 */}
              <div className="journey-step" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <div className="journey-circle" style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', borderRadius: '50%', border: '4px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8', marginBottom: '1.25rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexShrink: 0, transition: 'all 0.3s' }}>
                  1
                </div>
                <div className="journey-text">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Profile Creation</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, maxWidth: '240px' }}>Register and fill in your academic details, location preferences, and financial capabilities.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="journey-step" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <div className="journey-circle" style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', borderRadius: '50%', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginBottom: '1.25rem', boxShadow: '0 0 0 4px rgba(16,185,129,0.1)', flexShrink: 0, transition: 'all 0.3s' }}>
                  2
                </div>
                <div className="journey-text">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Smart Assessment</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, maxWidth: '240px' }}>Take our career assessment to perfectly align your chosen group with your strengths.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="journey-step" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <div className="journey-circle" style={{ width: '56px', height: '56px', backgroundColor: '#004d40', borderRadius: '50%', border: '4px solid #004d40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '1.25rem', boxShadow: '0 0 0 6px rgba(0,77,64,0.1), 0 8px 16px rgba(0,77,64,0.2)', flexShrink: 0, transition: 'all 0.3s' }}>
                  3
                </div>
                <div className="journey-text">
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#004d40', marginBottom: '0.5rem' }}>Secure Admission</h3>
                  <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, maxWidth: '240px' }}>Our ground team assists you personally with documentation, college visits, and final enrollment.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Full-width Impact CTA */}
        <section className="section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', borderRadius: '50%', zIndex: 1 }} />

          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 4vw' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Your future is too important for guesswork.
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
              Join the platform that guarantees transparency, data-backed guidance, and a secured seat in the institution of your dreams.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/student/login" className="cta-btn-primary" style={{ padding: '0.875rem 2rem', backgroundColor: '#10b981', color: 'white', fontWeight: 700, textDecoration: 'none', borderRadius: '999px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)' }}>
                Create Student Account <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Clean Footer */}
      <footer style={{ backgroundColor: '#ffffff', padding: '2rem 4vw', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Image src={logoImg} alt="Naaguru Logo" width={90} height={28} style={{ objectFit: 'contain', opacity: 0.8 }} />
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>&copy; {new Date().getFullYear()} Naaguru Educational Society. All rights reserved.</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/student/login" className="footer-link" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>Student Portal</Link>
            <Link href="/login" className="footer-link" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>Staff Intranet</Link>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* Strict Mobile Responsive Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        html { scroll-behavior: smooth; }
        
        .section-padding { padding-top: 5rem; padding-bottom: 5rem; }

        @keyframes float-slow {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes progress-glow {
          0% { width: 30%; opacity: 0.5; }
          100% { width: 70%; opacity: 1; }
        }

        .pulse-dot {
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .nav-btn-glow:hover {
          box-shadow: 0 10px 20px -5px rgba(5,150,105,0.4);
          transform: translateY(-2px);
        }
        .nav-link-hover:hover { color: #059669 !important; }
        
        .hero-btn-action:hover {
          background-color: #1e293b !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 15px -5px rgba(15,23,42,0.3);
        }

        .float-card-1 { animation: float-slow 6s ease-in-out infinite; }
        .float-card-2 { animation: float-slow 8s ease-in-out infinite reverse; }

        .pathway-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.2) !important;
        }
        .pathway-card:hover .pathway-glow { opacity: 1 !important; }
        .pathway-btn-ghost:hover {
          background-color: rgba(255,255,255,0.1);
        }

        .bento-box-v2 {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bento-box-v2:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px -10px rgba(0,0,0,0.1);
          border-color: #cbd5e1 !important;
        }

        .journey-step:hover .journey-circle {
          transform: scale(1.1);
        }

        .cta-btn-primary:hover {
          background-color: #059669 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(16,185,129,0.5) !important;
        }
        .footer-link:hover { color: #004d40 !important; }

        /* Tablet Adjustments */
        @media (max-width: 900px) {
          .bento-box-v2 { grid-column: span 12 !important; }
          .hero-visuals { display: none !important; }
        }
        
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .section-padding { padding-top: 4rem; padding-bottom: 4rem; }
        }
        
        /* Strict Mobile Overrides */
        @media (max-width: 600px) {
          .section-padding { padding-top: 3rem !important; padding-bottom: 3rem !important; }
          
          .nav-container { padding: 0 1rem !important; top: 0.5rem !important; }
          .main-nav { padding: 0.5rem 1rem !important; }
          .nav-logo img { width: 80px !important; height: 26px !important; }
          .hide-mobile-small { display: none !important; }
          .nav-btn-glow { padding: 0.4rem 1rem !important; font-size: 0.8rem !important; }

          .badge-pill { font-size: 0.65rem !important; padding: 0.2rem 0.6rem !important; margin-bottom: 1rem !important; }
          .hero-desc { font-size: 0.9rem !important; margin-bottom: 1.5rem !important; }
          
          .search-bar { padding: 0.3rem !important; }
          .hero-btn-action { padding: 0.5rem 1rem !important; font-size: 0.8rem !important; }
          
          .pathway-header { gap: 0.75rem !important; margin-bottom: 1.5rem !important; }
          .pathway-card { padding: 1rem !important; border-radius: 12px !important; }
          
          .bento-box-v2 { padding: 1.5rem !important; border-radius: 16px !important; }

          
          .journey-path { flex-direction: column !important; align-items: flex-start !important; gap: 2rem !important; padding-left: 0.5rem !important; }
          .journey-line { width: 3px !important; height: calc(100% - 24px) !important; left: 32px !important; top: 24px !important; border-radius: 0 !important; }
          .journey-step { flex-direction: row !important; text-align: left !important; gap: 1.25rem !important; align-items: flex-start !important; }
          .journey-circle { width: 48px !important; height: 48px !important; font-size: 1.1rem !important; border-width: 3px !important; margin-bottom: 0 !important; }
        }
      `}} />
    </div>
  );
}
