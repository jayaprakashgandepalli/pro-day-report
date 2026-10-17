'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PageItem {
  id: number;
  title: string;
  subtitle: string;
  src: string;
  cdnSrc: string;
  tag: string;
}

const PAGES: PageItem[] = [
  {
    id: 0,
    title: 'శ్రీ వాత్సల్య జూనియర్ కళాశాల - కవర్ పేజీ',
    subtitle: 'Sri Vaatsalya Junior College • Visakhapatnam',
    src: '/scannn/page-0.jpeg',
    cdnSrc: 'https://files.catbox.moe/na3eeh.jpeg',
    tag: 'Cover Page',
  },
  {
    id: 1,
    title: 'JEE Mains & EAPCET 2026 ప్రభంజనం',
    subtitle: 'All India Ranks AIR 1136, AIR 1286 & EAPCET State Ranks',
    src: '/scannn/page-1.jpg',
    cdnSrc: 'https://files.catbox.moe/sslv84.jpg',
    tag: 'JEE / NEET Front Page',
  },
  {
    id: 2,
    title: 'AP Junior Intermediate 2026 ఫలితాలు',
    subtitle: 'State 2nd Rank 467/470, 466/470 - అఖండ విజయం',
    src: '/scannn/page-2.jpg',
    cdnSrc: 'https://files.catbox.moe/gosddd.jpg',
    tag: 'Jr Inter Results',
  },
  {
    id: 3,
    title: 'AP Senior Intermediate & IIT/NIT సీట్లు',
    subtitle: 'NIT Calicut, IIT Chittoor, IIIT Kurnool & 990/1000 Marks',
    src: '/scannn/page-3.jpg',
    cdnSrc: 'https://files.catbox.moe/xfi1wm.jpg',
    tag: 'Sr Inter & IIT / NIT',
  },
  {
    id: 4,
    title: '1st Year Inter 100% Pass & క్యాంపస్‌లు',
    subtitle: "Day's Scholar, Boys & Girls Campuses • Visakhapatnam",
    src: '/scannn/page-4.jpg',
    cdnSrc: 'https://files.catbox.moe/kd67bz.jpg',
    tag: 'Campuses & Admissions',
  },
  {
    id: 5,
    title: 'పేజీ 5 - సమగ్ర సమాచారం',
    subtitle: 'Sri Vaatsalya Junior College Information',
    src: '/scannn/page-5.jpeg',
    cdnSrc: 'https://files.catbox.moe/oufw8n.jpeg',
    tag: 'Page 5',
  },
  {
    id: 6,
    title: 'పేజీ 6 - అడ్మిషన్ల వివరాలు',
    subtitle: 'Sri Vaatsalya Junior College Details',
    src: '/scannn/page-6.jpeg',
    cdnSrc: 'https://files.catbox.moe/akwhbu.jpeg',
    tag: 'Page 6',
  },
  {
    id: 7,
    title: 'పేజీ 7 - ఫ్యాకల్టీ & బోధనా విధానం',
    subtitle: 'Experienced Faculty & Methodology',
    src: '/scannn/page-7.jpeg',
    cdnSrc: 'https://files.catbox.moe/37l58s.jpeg',
    tag: 'Page 7',
  },
  {
    id: 8,
    title: 'పేజీ 8 - అచీవ్‌మెంట్స్ & ర్యాంకర్స్',
    subtitle: 'Top Performers & Rank Holders',
    src: '/scannn/page-8.jpeg',
    cdnSrc: 'https://files.catbox.moe/8gdmz9.jpeg',
    tag: 'Page 8',
  },
  {
    id: 9,
    title: 'పేజీ 9 - కాలేజీ వివరాలు',
    subtitle: 'Academic Structure & Highlights',
    src: '/scannn/page-9.jpeg',
    cdnSrc: 'https://files.catbox.moe/g432hd.jpeg',
    tag: 'Page 9',
  },
  {
    id: 10,
    title: 'పేజీ 10 - విద్యా ప్రణాళిక',
    subtitle: 'Curriculum & Special Coaching',
    src: '/scannn/page-10.jpeg',
    cdnSrc: 'https://files.catbox.moe/jglcy2.jpeg',
    tag: 'Page 10',
  },
  {
    id: 11,
    title: 'పేజీ 11 - హాస్టల్ & క్యాంపస్ సదుపాయాలు',
    subtitle: 'Hostel & Infrastructure Amenities',
    src: '/scannn/page-11.jpeg',
    cdnSrc: 'https://files.catbox.moe/bdqn95.jpeg',
    tag: 'Page 11',
  },
  {
    id: 12,
    title: 'పేజీ 12 - విద్యార్థుల విజయాలు',
    subtitle: 'Student Success Stories & Awards',
    src: '/scannn/page-12.jpeg',
    cdnSrc: 'https://files.catbox.moe/ejrj9r.jpeg',
    tag: 'Page 12',
  },
  {
    id: 13,
    title: 'పేజీ 13 - ప్రత్యేక కార్యక్రమాలు',
    subtitle: 'Special Programs & Guidance',
    src: '/scannn/page-13.jpeg',
    cdnSrc: 'https://files.catbox.moe/zqq17r.jpeg',
    tag: 'Page 13',
  },
  {
    id: 14,
    title: 'పేజీ 14 - కోర్సులు & గ్రూపులు',
    subtitle: 'MPC, BiPC, MEC & Integrated Coaching',
    src: '/scannn/page-14.jpeg',
    cdnSrc: 'https://files.catbox.moe/380qn2.jpeg',
    tag: 'Page 14',
  },
  {
    id: 15,
    title: 'పేజీ 15 - టెస్ట్ సిరీస్ & మెటీరియల్',
    subtitle: 'Daily Practice Papers & Mock Exams',
    src: '/scannn/page-15.jpeg',
    cdnSrc: 'https://files.catbox.moe/sib2sj.jpeg',
    tag: 'Page 15',
  },
  {
    id: 16,
    title: 'పేజీ 16 - స్కాలర్‌షిప్ & ఫీజు రాయితీలు',
    subtitle: 'Merit Scholarships & Support',
    src: '/scannn/page-16.jpeg',
    cdnSrc: 'https://files.catbox.moe/wbfuj2.jpeg',
    tag: 'Page 16',
  },
  {
    id: 17,
    title: 'పేజీ 17 - తల్లిదండ్రుల అభిప్రాయాలు',
    subtitle: 'Parent Testimonials & Trust',
    src: '/scannn/page-17.jpeg',
    cdnSrc: 'https://files.catbox.moe/c3o5yv.jpeg',
    tag: 'Page 17',
  },
  {
    id: 18,
    title: 'పేజీ 18 - సంప్రదించండి & అడ్మిషన్ల హెల్ప్‌లైన్',
    subtitle: 'Contact Us, Campuses & Helpline',
    src: '/scannn/page-18.jpeg',
    cdnSrc: 'https://files.catbox.moe/hzjlgn.jpeg',
    tag: 'Helpline & Campuses',
  },
];

export default function PamphletPage() {
  const [activePage, setActivePage] = useState<number>(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      pageRefs.current.forEach((el, index) => {
        if (!el) return;
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          setActivePage(PAGES[index].id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToPage = (pageNum: number) => {
    const idx = PAGES.findIndex(p => p.id === pageNum);
    const el = pageRefs.current[idx];
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Sri Vaatsalya Junior College - 2026 Brochure',
      text: 'శ్రీ వాత్సల్య జూనియర్ కళాశాల - 2026 ఫలితాలు & బ్రోచర్ వివరాలు ఇక్కడ చూడండి:',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '24px'
    }}>
      {/* Top Eye-Catchy Header with College Name Only */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '14px 16px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{
          maxWidth: '560px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 900,
            margin: 0,
            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #EF4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.3px',
            textShadow: '0 2px 12px rgba(245, 158, 11, 0.3)',
            lineHeight: 1.3,
          }}>
            🏛️ శ్రీ వాత్సల్య జూనియర్ కళాశాల
          </h1>
          <span style={{
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: 600,
            letterSpacing: '1px',
            marginTop: '3px',
            textTransform: 'uppercase',
          }}>
            Sri Vaatsalya Educational Institutions • Visakhapatnam
          </span>
        </div>
      </header>

      {/* Main Pages Content */}
      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '16px 12px' }}>
        {PAGES.map((page, index) => (
          <div
            key={page.id}
            ref={(el) => { pageRefs.current[index] = el; }}
            style={{
              marginBottom: '28px',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Page Header Banner */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#38BDF8',
                  letterSpacing: '0.8px',
                  display: 'block',
                  marginBottom: '2px',
                }}>
                  {page.tag}
                </span>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  margin: 0,
                  color: '#F8FAFC',
                }}>
                  {page.title}
                </h2>
              </div>

              <button
                onClick={() => setZoomedImage(page.cdnSrc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                Zoom
              </button>
            </div>

            {/* Image Container with Tap to Zoom */}
            <div
              onClick={() => setZoomedImage(page.cdnSrc)}
              style={{
                position: 'relative',
                width: '100%',
                cursor: 'zoom-in',
                backgroundColor: '#020617',
              }}
            >
              <img
                src={page.cdnSrc}
                alt={page.title}
                loading={index < 2 ? 'eager' : 'lazy'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== page.src) {
                    target.src = page.src;
                  }
                }}
              />

              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                color: '#F8FAFC',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '20px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                🔍 Tap to Zoom
              </div>
            </div>

            {/* Page Footer Caption */}
            <div style={{
              padding: '10px 14px',
              fontSize: '12px',
              color: '#94A3B8',
              backgroundColor: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{page.subtitle}</span>
              <span style={{ fontWeight: 700, color: '#CBD5E1' }}>{index + 1} / {PAGES.length}</span>
            </div>
          </div>
        ))}

        {/* Visakhapatnam Campus Details Card */}
        <div style={{
          backgroundColor: '#1E293B',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#F59E0B', margin: '0 0 10px 0' }}>
            🏛️ శ్రీ వాత్సల్య క్యాంపస్ వివరాలు - విశాఖపట్నం
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 700, color: '#60A5FA' }}>1. SRI VAIBHAV CAMPUS (Day's Scholar)</div>
              <div style={{ color: '#94A3B8', marginTop: '2px' }}>45-2-45/2, Narasimha Nagar, Akkayyapalem, Visakhapatnam</div>
              <div style={{ color: '#F1F5F9', marginTop: '2px', fontWeight: 600 }}>📞 9908353814 / 9603334934</div>
            </div>

            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 700, color: '#34D399' }}>2. SRI VIRINCHI BHAVAN (Boys Campus)</div>
              <div style={{ color: '#94A3B8', marginTop: '2px' }}>Carshed Junction, P.M Palem, Vijetha Super Market Opp. Road, VSKP</div>
              <div style={{ color: '#F1F5F9', marginTop: '2px', fontWeight: 600 }}>📞 9908353814 / 9491571268</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#F472B6' }}>3. SRI VAARAHI BHAVAN (Girls Campus)</div>
              <div style={{ color: '#94A3B8', marginTop: '2px' }}>Bakkanapalem, Siva Sai PVR Fortune Opp., Visakhapatnam</div>
              <div style={{ color: '#F1F5F9', marginTop: '2px', fontWeight: 600 }}>📞 9908353814 / 8519945894</div>
            </div>
          </div>
        </div>
      </main>

      {/* Full Screen Pinch & Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>Tap anywhere to close</span>
            <button
              onClick={() => setZoomedImage(null)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: '8px',
            }}
          >
            <img
              src={zoomedImage}
              alt="Zoomed View"
              style={{
                width: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
