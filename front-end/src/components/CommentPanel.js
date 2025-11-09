import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api';

const CommentPanel = ({ noteId, onClose, onMarkedRead }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const bottomRef = useRef(null);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/note/${noteId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      setError('Error loading comments');
    }
  };

  useEffect(() => {
    if (noteId) fetchComments();
    // fetch current user id for edit permissions
    const fetchProfile = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/profile`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (!resp.ok) return;
        const data = await resp.json();
        setCurrentUserId(data._id || data.id || null);
      } catch (e) {
        // ignore
      }
    };
    fetchProfile();
  }, [noteId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/note/${noteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Failed');
      setText('');
      await fetchComments();
      // inform parent that comments were marked/read (owner mark happens when owner opens)
      if (onMarkedRead) onMarkedRead();
    } catch (err) {
      setError('Error adding comment');
    }
  };

  return (
    <div className="comment-panel" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Comments</strong>
        <button onClick={onClose}>Close</button>
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto', padding: 6, background: '#fafafa', borderRadius: 6 }}>
        {comments.map(c => (
          <div key={c._id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <img src={c.author?.profilePicture ? `${API_BASE}${c.author.profilePicture}` : '/default-avatar.png'} alt="a" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{c.author?.firstName || c.author?.email}</div>
                  <div style={{ fontSize: '0.75rem', color: '#777' }}>{new Date(c.createdAt).toLocaleString()}</div>
                </div>

                {editingId === c._id ? (
                  <div style={{ marginTop: 6 }}>
                    <input value={editingText} onChange={e => setEditingText(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button onClick={async () => {
                        // save
                        if (!editingText.trim()) return;
                        try {
                          const res = await fetch(`${API_BASE}/api/comments/${editingId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                            body: JSON.stringify({ text: editingText })
                          });
                          if (!res.ok) throw new Error('Failed to save');
                          setEditingId(null);
                          setEditingText('');
                          await fetchComments();
                          if (onMarkedRead) onMarkedRead();
                        } catch (err) {
                          setError('Error saving comment');
                        }
                      }}>Save</button>
                      <button onClick={() => { setEditingId(null); setEditingText(''); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.9rem' }}>{c.text}</div>
                    {currentUserId && c.author && (c.author._id ? c.author._id.toString() === currentUserId.toString() : c.author === currentUserId) && (
                      <div style={{ marginTop: 6 }}>
                        <button onClick={() => { setEditingId(c._id); setEditingText(c.text); }} style={{ fontSize: '0.85rem' }}>Edit</button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment" style={{ flex: 1, padding: '0.5rem' }} />
        <button type="submit">Add</button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default CommentPanel;
