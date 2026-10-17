'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PageItem {
  id: number;
  label: string;
  localSrc: string;
  cdnSrc: string;
}

const PAGES: PageItem[] = [
  { id: 0, label: 'Page 0 (Cover)', localSrc: '/scannn/page-0.jpeg', cdnSrc: 'https://files.catbox.moe/na3eeh.jpeg' },
  { id: 1, label: 'Page 1', localSrc: '/scannn/page-1.jpg', cdnSrc: 'https://files.catbox.moe/sslv84.jpg' },
  { id: 2, label: 'Page 2', localSrc: '/scannn/page-2.jpg', cdnSrc: 'https://files.catbox.moe/gosddd.jpg' },
  { id: 3, label: 'Page 3', localSrc: '/scannn/page-3.jpg', cdnSrc: 'https://files.catbox.moe/xfi1wm.jpg' },
  { id: 4, label: 'Page 4', localSrc: '/scannn/page-4.jpg', cdnSrc: 'https://files.catbox.moe/kd67bz.jpg' },
  { id: 5, label: 'Page 5', localSrc: '/scannn/page-5.jpeg', cdnSrc: 'https://files.catbox.moe/oufw8n.jpeg' },
  { id: 6, label: 'Page 6', localSrc: '/scannn/page-6.jpeg', cdnSrc: 'https://files.catbox.moe/akwhbu.jpeg' },
  { id: 7, label: 'Page 7', localSrc: '/scannn/page-7.jpeg', cdnSrc: 'https://files.catbox.moe/37l58s.jpeg' },
  { id: 8, label: 'Page 8', localSrc: '/scannn/page-8.jpeg', cdnSrc: 'https://files.catbox.moe/8gdmz9.jpeg' },
  { id: 9, label: 'Page 9', localSrc: '/scannn/page-9.jpeg', cdnSrc: 'https://files.catbox.moe/g432hd.jpeg' },
  { id: 10, label: 'Page 10', localSrc: '/scannn/page-10.jpeg', cdnSrc: 'https://files.catbox.moe/jglcy2.jpeg' },
  { id: 11, label: 'Page 11', localSrc: '/scannn/page-11.jpeg', cdnSrc: 'https://files.catbox.moe/bdqn95.jpeg' },
  { id: 12, label: 'Page 12', localSrc: '/scannn/page-12.jpeg', cdnSrc: 'https://files.catbox.moe/ejrj9r.jpeg' },
  { id: 13, label: 'Page 13', localSrc: '/scannn/page-13.jpeg', cdnSrc: 'https://files.catbox.moe/zqq17r.jpeg' },
  { id: 14, label: 'Page 14', localSrc: '/scannn/page-14.jpeg', cdnSrc: 'https://files.catbox.moe/380qn2.jpeg' },
  { id: 15, label: 'Page 15', localSrc: '/scannn/page-15.jpeg', cdnSrc: 'https://files.catbox.moe/sib2sj.jpeg' },
  { id: 16, label: 'Page 16', localSrc: '/scannn/page-16.jpeg', cdnSrc: 'https://files.catbox.moe/wbfuj2.jpeg' },
  { id: 17, label: 'Page 17', localSrc: '/scannn/page-17.jpeg', cdnSrc: 'https://files.catbox.moe/c3o5yv.jpeg' },
  { id: 18, label: 'Page 18', localSrc: '/scannn/page-18.jpeg', cdnSrc: 'https://files.catbox.moe/hzjlgn.jpeg' },
];

export default function BrochureViewerPage() {
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

  const scrollToPage = (id: number) => {
    const index = PAGES.findIndex(p => p.id === id);
    const el = pageRefs.current[index];
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Document & Brochure (19 Pages)',
        text: 'View all 19 pages in this single scrollable link:',
        url: url,
      }).catch(() => copyLink(url));
    } else {
      copyLink(url);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ backgroundColor: '#090D16', minHeight: '100vh', color: '#F1F5F9', paddingBottom: '90px' }}>
      {/* Sticky Top Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '10px 14px',
      }}>
        <div style={{
          maxWidth: '580px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              📑 College Document & Brochure
            </h1>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0 0' }}>
              19 Pages All-in-One Viewer
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '4px 9px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              P-{activePage} / 18
            </span>

            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? '✓ Copied' : '🔗 Share'}
            </button>
          </div>
        </div>

        {/* Horizontal Page Tabs */}
        <div style={{
          maxWidth: '580px',
          margin: '8px auto 0 auto',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}>
          {PAGES.map((p) => {
            const isCurrent = activePage === p.id;
            return (
              <button
                key={p.id}
                onClick={() => scrollToPage(p.id)}
                style={{
                  flex: '0 0 auto',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: isCurrent ? 800 : 600,
                  border: isCurrent ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isCurrent ? '#2563EB' : 'rgba(255, 255, 255, 0.05)',
                  color: isCurrent ? '#FFFFFF' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                P-{p.id}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Pages List */}
      <main style={{ maxWidth: '580px', margin: '0 auto', padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {PAGES.map((page, index) => (
          <div
            key={page.id}
            ref={(el) => { pageRefs.current[index] = el; }}
            style={{
              backgroundColor: '#131B2E',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Page Header */}
            <div style={{
              padding: '9px 14px',
              backgroundColor: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38BDF8' }}>
                📄 {page.label}
              </span>
              <span style={{ fontSize: '11px', color: '#94A3B8', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                {index + 1} of {PAGES.length}
              </span>
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
                alt={page.label}
                loading={index < 2 ? 'eager' : 'lazy'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
                onError={(e) => {
                  // Fallback to local image if CDN has any issue
                  const target = e.target as HTMLImageElement;
                  if (target.src !== page.localSrc) {
                    target.src = page.localSrc;
                  }
                }}
              />

              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                color: '#F8FAFC',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '16px',
                pointerEvents: 'none',
              }}>
                🔍 Tap to Zoom
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Floating Bottom Quick Bar */}
      <footer style={{
        position: 'fixed',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '30px',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            background: 'none',
            border: 'none',
            color: '#CBD5E1',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ⬆️ Top
        </button>

        <a
          href="tel:9908353814"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            padding: '7px 14px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '12px',
            textDecoration: 'none',
          }}
        >
          📞 Call
        </a>

        <a
          href="https://wa.me/919908353814"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            padding: '7px 14px',
            borderRadius: '20px',
            fontWeight: 700,
            fontSize: '12px',
            textDecoration: 'none',
          }}
        >
          💬 WhatsApp
        </a>
      </footer>

      {/* Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.96)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>Tap anywhere to close</span>
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
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '92vh', overflow: 'auto' }}>
            <img
              src={zoomedImage}
              alt="Zoomed"
              style={{ width: '100%', maxHeight: '92vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
