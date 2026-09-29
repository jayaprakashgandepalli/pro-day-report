'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

type Video = {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Failed to fetch videos', error);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, youtubeUrl }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setYoutubeUrl('');
        fetchVideos();
        alert('Video added successfully');
      } else {
        alert('Failed to add video');
      }
    } catch (error) {
      console.error(error);
      alert('Error adding video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVideos();
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error(error);
      alert('Error deleting video');
    }
  };

  // Helper to extract YouTube ID for thumbnail
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Manage Study Videos</h1>
      
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Video</h2>
        <form onSubmit={handleAddVideo} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title *</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="e.g., Chapter 1: Physics Basics" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>YouTube Video URL *</label>
            <input required type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description (Optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }} placeholder="Short description about the video..." />
          </div>
          <button type="submit" disabled={loading} style={{ background: '#ef4444', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, justifySelf: 'start' }}>
            {loading ? 'Adding...' : 'Add Video'}
          </button>
        </form>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Uploaded Videos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {videos.map(video => {
            const ytId = getYouTubeId(video.youtubeUrl);
            const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : 'https://via.placeholder.com/300x200?text=No+Thumbnail';

            return (
              <div key={video.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <img src={thumbnailUrl} alt={video.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{video.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>{video.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Watch on YouTube</a>
                    <button onClick={() => handleDelete(video.id)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {videos.length === 0 && <p style={{ color: '#6b7280', gridColumn: '1 / -1' }}>No videos added yet.</p>}
        </div>
      </div>
    </div>
  );
}
