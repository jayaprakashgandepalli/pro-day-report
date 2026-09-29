'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, Maximize } from 'lucide-react';

type Book = {
  id: string;
  title: string;
  description: string | null;
  pdfUrl: string;
  thumbnailUrl: string;
};

export default function StudentBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      iframeContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/student/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Failed to fetch books', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    // Convert standard Google Drive link to preview link
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Appending ?rm=minimal helps remove extra UI elements from Google Drive preview
        return `https://drive.google.com/file/d/${match[1]}/preview?rm=minimal`;
      }
    }
    return url; // fallback
  };

  const getThumbnailUrl = (book: Book) => {
    if (book.thumbnailUrl && book.thumbnailUrl.trim() !== '') {
      return book.thumbnailUrl;
    }
    // If no thumbnail provided and it's a Google Drive link, get the first page auto-thumbnail
    if (book.pdfUrl && book.pdfUrl.includes('drive.google.com/file/d/')) {
      const match = book.pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600-h800`;
      }
    }
    return 'https://via.placeholder.com/400x600?text=Book+Cover';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <BookOpen size={32} color="#8b5cf6" /> 
          Study Library
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1.1rem' }}>Access all your study materials and books here.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {selectedBook ? (
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>{selectedBook.title}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={toggleFullScreen}
                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Maximize size={18} />
                    Full Screen
                  </button>
                  <button 
                    onClick={() => setSelectedBook(null)}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Close Book
                  </button>
                </div>
              </div>
              <div 
                ref={iframeContainerRef}
                style={{ height: isFullscreen ? '100vh' : '80vh', width: '100%', background: '#f1f5f9', position: 'relative' }}
              >
                {isFullscreen && (
                  <button 
                    onClick={toggleFullScreen}
                    style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', zIndex: 20 }}
                  >
                    Exit Full Screen
                  </button>
                )}
                <iframe 
                  src={getEmbedUrl(selectedBook.pdfUrl)} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={selectedBook.title}
                  allow="autoplay"
                />
                {/* Solid overlay to hide and block clicks on the Google Drive pop-out / share button.
                    Right is set to ~15px to avoid covering the scrollbar.
                    Background is set to match Google Drive's dark theme (#1f1f1f or #323232). */}
                <div style={{ position: 'absolute', top: 0, right: '15px', width: '50px', height: '50px', background: '#323232', zIndex: 10, cursor: 'default' }} title="Protected" />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
              {books.map(book => (
                <div 
                  key={book.id} 
                  style={{ 
                    background: '#fff', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s, boxShadow 0.2s',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={() => setSelectedBook(book)}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ position: 'relative', paddingTop: '140%', background: '#f1f5f9' }}>
                    <img 
                      src={getThumbnailUrl(book)} 
                      alt={book.title} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Book+Cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '1.5rem 0.75rem 0.75rem 0.75rem' }}>
                      <h3 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.title}</h3>
                    </div>
                  </div>
                  {book.description && (
                    <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {book.description}
                      </p>
                    </div>
                  )}
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.85rem' }}>Read Book &rarr;</span>
                  </div>
                </div>
              ))}
              
              {books.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ color: '#475569', fontSize: '1.25rem', margin: 0 }}>No books available yet</h3>
                  <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Check back later for new study materials.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
