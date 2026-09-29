'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

type Book = {
  id: string;
  title: string;
  description: string | null;
  pdfUrl: string;
  thumbnailUrl: string;
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/admin/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Failed to fetch books', error);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, pdfUrl, thumbnailUrl }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setPdfUrl('');
        setThumbnailUrl('');
        fetchBooks();
        alert('Book added successfully');
      } else {
        alert('Failed to add book');
      }
    } catch (error) {
      console.error(error);
      alert('Error adding book');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      const res = await fetch(`/api/admin/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBooks();
      } else {
        alert('Failed to delete book');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting book');
    }
  };

  const getThumbnailUrl = (book: Book) => {
    if (book.thumbnailUrl && book.thumbnailUrl.trim() !== '') {
      return book.thumbnailUrl;
    }
    if (book.pdfUrl && book.pdfUrl.includes('drive.google.com/file/d/')) {
      const match = book.pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600-h800`;
      }
    }
    return 'https://via.placeholder.com/400x600?text=Book+Cover';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Manage Study Books</h1>
      
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Book</h2>
        <form onSubmit={handleAddBook} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title *</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="e.g., Mathematics Vol 1" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Google Drive PDF URL *</label>
            <input required type="url" value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="https://drive.google.com/file/d/..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thumbnail Image URL (Optional)</label>
            <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="Leave blank to auto-generate from PDF" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description (Optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }} placeholder="Short description about the book..." />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, justifySelf: 'start' }}>
            {loading ? 'Adding...' : 'Add Book'}
          </button>
        </form>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Uploaded Books</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {books.map(book => (
            <div key={book.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <img src={getThumbnailUrl(book)} alt={book.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x600?text=Book+Cover' }} />
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{book.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{book.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>View PDF</a>
                  <button onClick={() => handleDelete(book.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {books.length === 0 && <p style={{ color: '#6b7280', gridColumn: '1 / -1' }}>No books added yet.</p>}
        </div>
      </div>
    </div>
  );
}
