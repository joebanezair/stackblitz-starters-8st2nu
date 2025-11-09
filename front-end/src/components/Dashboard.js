import React, { useState, useEffect } from 'react';
import NoteForm from './NoteForm';
import NoteList from './NoteList';
import Profile from './Profile';
import ChatPanel from './ChatPanel';
import CommentPanel from './CommentPanel';
import { API_BASE } from '../api';

const Dashboard = ({ onLogout, onEditProfile }) => {
  const [notes, setNotes] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friendEmail, setFriendEmail] = useState('');
  const [viewingFriendNotes, setViewingFriendNotes] = useState(false);
  const [friendNotes, setFriendNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBySender, setUnreadBySender] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCommentsByNote, setUnreadCommentsByNote] = useState({});
  const [activeCommentNoteId, setActiveCommentNoteId] = useState(null);
  const [totalCommentsByNote, setTotalCommentsByNote] = useState({});

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data);
      // fetch total comment counts for these notes
      if (data && data.length > 0) {
        const ids = data.map(n => n._id).join(',');
        fetchCommentCounts(ids);
      }
    } catch (error) {
      setError('Error fetching notes');
    }
  };

  const fetchCommentCounts = async (noteIdsCsv) => {
    try {
      const res = await fetch(`${API_BASE}/api/comments/counts?noteIds=${noteIdsCsv}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      if (!res.ok) return;
      const data = await res.json();
      const map = {};
      data.forEach(d => { map[d.note] = d.count; });
      setTotalCommentsByNote(map);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (noteData) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(noteData)
      });
      if (!response.ok) throw new Error('Failed to create note');
      const newNote = await response.json();
      setNotes([newNote, ...notes]);
      setError('');
    } catch (error) {
      setError('Error creating note');
    }
  };

  const handleUpdateNote = async (id, noteData) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(noteData)
      });
      if (!response.ok) throw new Error('Failed to update note');
      const updatedNote = await response.json();
      setNotes(notes.map(note => note._id === id ? updatedNote : note));
      setEditingNote(null);
      setError('');
    } catch (error) {
      setError('Error updating note');
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete note');
      setNotes(notes.filter(note => note._id !== id));
      setError('');
    } catch (error) {
      setError('Error deleting note');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      setError('Error fetching profile');
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchFriends();
    fetchIncomingRequests();
    fetchUnreadCount();
    fetchUnreadBySender();
    fetchNotificationsList();
  }, []);

  const fetchNotificationsList = async () => {
    try {
      // fetch message notifications and comment notifications
      const [msgRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/api/messages/unread/list`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${API_BASE}/api/comments/unread/list`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      const msgs = msgRes.ok ? await msgRes.json() : [];
      const comms = cRes.ok ? await cRes.json() : [];

      // normalize and combine: messages -> { type: 'message', ... }, comments -> { type: 'comment', ... }
      const normalized = [];
      msgs.forEach(m => normalized.push({ type: 'message', sender: m.sender, count: m.count, last: m.lastMessage, senderInfo: m.senderInfo }));
      comms.forEach(c => normalized.push({ type: 'comment', note: c.note, noteTitle: c.noteTitle, count: c.count, last: c.lastComment, authorInfo: c.authorInfo }));

      // sort by last.createdAt desc
      normalized.sort((a, b) => {
        const ta = a.last?.createdAt ? new Date(a.last.createdAt).getTime() : 0;
        const tb = b.last?.createdAt ? new Date(b.last.createdAt).getTime() : 0;
        return tb - ta;
      });

      setNotifications(normalized);
    } catch (err) {
      // ignore
    }
  };

  const fetchUnreadBySender = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messages/unread/by-sender`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return;
      const data = await response.json();
      // data is array of { sender, count }
      const map = {};
      data.forEach(d => { map[d.sender] = d.count; });
      setUnreadBySender(map);
    } catch (err) {
      // ignore
    }
  };

    const fetchCommentUnreadList = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/comments/unread/list`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) return;
        const data = await res.json();
        const map = {};
        data.forEach(d => { map[d.note] = d.count; });
        setUnreadCommentsByNote(map);
        return data;
      } catch (err) {
        // ignore
      }
    };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/messages/unread/count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return;
      const data = await response.json();
      setUnreadCount(data.unread || 0);
    } catch (err) {
      // ignore
    }
  };

  // poll unread count
  useEffect(() => {
    const id = setInterval(() => fetchUnreadCount(), 5000);
    return () => clearInterval(id);
  }, []);

  // poll unread-by-sender as well
  useEffect(() => {
    const id = setInterval(() => fetchUnreadBySender(), 5000);
    return () => clearInterval(id);
  }, []);

  // poll notifications list
  useEffect(() => {
    const id = setInterval(() => fetchNotificationsList(), 5000);
    return () => clearInterval(id);
  }, []);

  // poll comment unread list
  useEffect(() => {
    const id = setInterval(() => fetchCommentUnreadList(), 5000);
    // initial
    fetchCommentUnreadList();
    return () => clearInterval(id);
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/friends`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      // ignore for now
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/incoming`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setIncomingRequests(data);
    } catch (error) {
      // ignore
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: friendEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send request');
      setFriendEmail('');
      fetchFriends();
      fetchIncomingRequests();
    } catch (err) {
      setError(err.message || 'Error sending friend request');
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/${requesterId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to accept request');
      fetchFriends();
      fetchIncomingRequests();
    } catch (err) {
      setError(err.message || 'Error accepting request');
    }
  };

  const handleRejectRequest = async (requesterId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/requests/${requesterId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to reject request');
      fetchIncomingRequests();
    } catch (err) {
      setError(err.message || 'Error rejecting request');
    }
  };

  const handleViewFriendNotes = async (friendId) => {
    try {
      const response = await fetch(`${API_BASE}/api/friends/${friendId}/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch notes');
      }
      const data = await response.json();
      setFriendNotes(data);
      setViewingFriendNotes(true);
      // fetch comment counts for friend's notes as well
      if (data && data.length > 0) {
        const ids = data.map(n => n._id).join(',');
        fetchCommentCounts(ids);
      }
    } catch (err) {
      setError(err.message || 'Error fetching friend notes');
    }
  };

  const handleBackToMyNotes = () => {
    setViewingFriendNotes(false);
    setFriendNotes([]);
  };

  return (
    <>
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="dashboard-profile">
            <div className="profile-preview">
              <img 
                src={userProfile?.profilePicture ? 
                  `${API_BASE}${userProfile.profilePicture}` : 
                  '/default-avatar.png'} 
                alt="Profile" 
                className="profile-picture-small"
              />
              <div className="profile-info">
                <h2>{userProfile?.fullName || 'User'}</h2>
                <p>{userProfile?.email}</p>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={onEditProfile} className="edit-profile-button">
                Edit Profile
              </button>
              <div style={{ position: 'relative', display: 'inline-block', marginLeft: 8 }}>
                <button className="notifications-button" title="Notifications" onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotificationsList(); }}>🔔</button>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -6, background: 'red', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem' }}>{unreadCount}</span>
                )}

                {showNotifications && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', width: 360, maxHeight: 360, overflowY: 'auto', background: '#fff', border: '1px solid #ddd', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', borderRadius: 6, zIndex: 60 }}>
                    <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #eee', fontWeight: 700 }}>Notifications</div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '0.75rem' }}>No notifications</div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, padding: '0.5rem', alignItems: 'center', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }} onClick={async () => {
                          setShowNotifications(false);
                          if (n.type === 'message') {
                            setChatPartner(n.senderInfo);
                            // refresh
                            fetchUnreadBySender();
                            fetchNotificationsList();
                          } else if (n.type === 'comment') {
                            // open comment panel for note
                            setActiveCommentNoteId(n.note);
                            // mark as read for that note
                            try {
                              await fetch(`${API_BASE}/api/comments/note/${n.note}/mark-read`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                            } catch (e) { /* ignore */ }
                            fetchCommentUnreadList();
                            fetchNotificationsList();
                          }
                        }}>
                          {n.type === 'message' ? (
                            <>
                              <img src={n.senderInfo?.profilePicture ? `${API_BASE}${n.senderInfo.profilePicture}` : '/default-avatar.png'} alt="a" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontWeight: 600 }}>{n.senderInfo?.firstName || n.senderInfo?.email}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{n.count}</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#333', marginTop: 4 }}>{n.last?.text?.length > 80 ? n.last.text.substring(0, 77) + '...' : n.last?.text}</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4 }}>{n.last ? new Date(n.last.createdAt).toLocaleString() : ''}</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <img src={n.authorInfo?.profilePicture ? `${API_BASE}${n.authorInfo.profilePicture}` : '/default-avatar.png'} alt="a" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontWeight: 600 }}>{n.authorInfo?.firstName || n.authorInfo?.email}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{n.count}</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#333', marginTop: 4 }}><strong>{n.noteTitle}</strong> — {n.last?.text?.length > 80 ? n.last.text.substring(0, 77) + '...' : n.last?.text}</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4 }}>{n.last ? new Date(n.last.createdAt).toLocaleString() : ''}</div>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button onClick={onLogout} className="logout-button">Logout</button>
            </div>
          </div>
        </header>

        {error && <div className="error">{error}</div>}
        
        <div className="dashboard-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{viewingFriendNotes ? 'Friend\'s Notes' : 'My Notes'}</h2>
            {viewingFriendNotes && (
              <button onClick={handleBackToMyNotes} style={{ marginLeft: '1rem' }}>Back to My Notes</button>
            )}
          </div>
          <div className="friends-panel" style={{ marginBottom: '1rem' }}>
            <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input type="email" placeholder="Friend's email" value={friendEmail} onChange={(e) => setFriendEmail(e.target.value)} required style={{ flex: 1, padding: '0.5rem' }} />
              <button type="submit">Send Request</button>
            </form>

            <div className="incoming-requests" style={{ marginBottom: '0.75rem' }}>
              <h4>Incoming Friend Requests</h4>
              {incomingRequests.length === 0 ? (
                <div>No incoming requests</div>
              ) : (
                incomingRequests.map(r => (
                  <div key={r._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={r.profilePicture ? `${API_BASE}${r.profilePicture}` : '/default-avatar.png'} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.firstName || r.email}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{r.email}</div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => handleAcceptRequest(r._id)} style={{ marginRight: '0.5rem' }}>Accept</button>
                      <button onClick={() => handleRejectRequest(r._id)}>Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="friend-list">
              {friends.length === 0 ? (
                <div>No friends yet</div>
              ) : (
                friends.map(f => (
                  <div key={f._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img src={f.profilePicture ? `${API_BASE}${f.profilePicture}` : '/default-avatar.png'} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{f.firstName || f.email}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{f.email}</div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => handleViewFriendNotes(f._id)} style={{ marginRight: '0.5rem' }}>View Notes</button>
                      <button onClick={() => setChatPartner(f)} style={{ position: 'relative' }}>
                        Message
                        {unreadBySender[f._id] > 0 && (
                          <span style={{ position: 'absolute', top: -8, right: -12, background: 'red', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem' }}>{unreadBySender[f._id]}</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <NoteForm 
            onSubmit={editingNote ? 
              (data) => handleUpdateNote(editingNote._id, data) : 
              handleCreateNote}
            initialData={editingNote}
            onCancel={() => setEditingNote(null)}
          />
          {viewingFriendNotes ? (
            <NoteList notes={friendNotes} onEdit={() => {}} onDelete={() => {}} unreadCommentsByNote={unreadCommentsByNote} totalCommentsByNote={totalCommentsByNote} refreshComments={() => { fetchCommentUnreadList(); fetchNotificationsList(); if (friendNotes && friendNotes.length) fetchCommentCounts(friendNotes.map(n=>n._id).join(',')); }} />
          ) : (
            <NoteList 
              notes={notes} 
              onEdit={setEditingNote}
              onDelete={handleDeleteNote}
              unreadCommentsByNote={unreadCommentsByNote}
              totalCommentsByNote={totalCommentsByNote}
              refreshComments={() => { fetchCommentUnreadList(); fetchNotificationsList(); if (notes && notes.length) fetchCommentCounts(notes.map(n=>n._id).join(',')); }}
            />
          )}
        </div>
      </div>

      
      {chatPartner && (
        <div className="chat-container" style={{ position: 'fixed', right: 20, bottom: 20, width: 360, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <ChatPanel partner={chatPartner} onClose={() => setChatPartner(null)} onMarkedRead={(newCount) => { setUnreadCount(newCount); fetchUnreadBySender(); }} />
        </div>
      )}
      {activeCommentNoteId && (
        <div className="comment-container" style={{ position: 'fixed', right: 400, bottom: 20, width: 420, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { setActiveCommentNoteId(null); fetchCommentUnreadList(); fetchNotificationsList(); }}>Close</button>
          </div>
          <div style={{ marginTop: 6 }}>
            <CommentPanel noteId={activeCommentNoteId} onClose={() => { setActiveCommentNoteId(null); fetchCommentUnreadList(); fetchNotificationsList(); }} onMarkedRead={() => { fetchCommentUnreadList(); fetchNotificationsList(); }} />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;