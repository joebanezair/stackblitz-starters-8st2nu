import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../api';

const ChatPanel = ({ partner, onClose, onMarkedRead }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messages/conversation/${partner._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to load conversation');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError('Error loading messages');
    }
  };

  const markAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messages/conversation/${partner._id}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return;
      const data = await response.json();
      if (onMarkedRead) onMarkedRead(data.unread);
    } catch (err) {
      // ignore marking errors
    }
  };

  useEffect(() => {
    if (partner) {
      markAsRead();
      fetchConversation();
    }
    const interval = setInterval(() => {
      if (partner) fetchConversation();
    }, 2500);
    return () => clearInterval(interval);
  }, [partner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId: partner._id, text })
      });
      if (!response.ok) throw new Error('Failed to send');
      setText('');
      fetchConversation();
    } catch (err) {
      setError('Error sending message');
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <button onClick={onClose} className="back-button">Back</button>
        <div className="chat-partner">
          <img src={partner.profilePicture ? `${API_BASE}${partner.profilePicture}` : '/default-avatar.png'} alt="p" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', marginRight:8 }} />
          <strong>{partner.firstName || partner.email}</strong>
        </div>
      </div>

      <div className="chat-messages" style={{ maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: '#fafafa' }}>
        {messages.map(m => (
          <div key={m._id} style={{ marginBottom: '0.5rem', textAlign: m.sender === partner._id ? 'left' : 'right' }}>
            <div style={{ display: 'inline-block', padding: '0.5rem 0.75rem', borderRadius: 8, background: m.sender === partner._id ? '#fff' : '#d1e7dd' }}>
              {m.text}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(m.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" style={{ flex: 1, padding: '0.5rem' }} />
        <button type="submit">Send</button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ChatPanel;