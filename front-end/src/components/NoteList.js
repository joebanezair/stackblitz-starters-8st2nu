import React, { useState } from 'react';
import CommentPanel from './CommentPanel';

const NoteList = ({ notes, onEdit, onDelete, unreadCommentsByNote = {}, totalCommentsByNote = {}, refreshComments }) => {
  const [openNoteForComments, setOpenNoteForComments] = useState(null);

  return (
    <div className="note-list">
      {notes.map(note => (
        <div key={note._id} className="note-card">
          <div className="note-content">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <div className="note-date">
              {new Date(note.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="note-actions">
            <button onClick={() => onEdit(note)} className="edit-button">
              Edit
            </button>
            <button onClick={() => onDelete(note._id)} className="delete-button">
              Delete
            </button>
            <button onClick={() => setOpenNoteForComments(note._id)} style={{ position: 'relative', marginLeft: 8, padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 8 }} aria-label={`Comments for ${note.title}`}>
              <span>Comments</span>
              {/* total comments badge (show only when > 0) */}
              {totalCommentsByNote?.[note._id] > 0 && (
                <span style={{ background: '#0d6efd', color: '#fff', borderRadius: '12px', padding: '2px 7px', fontSize: '0.75rem', minWidth: 20, textAlign: 'center' }}>{totalCommentsByNote[note._id]}</span>
              )}
              {/* unread comments badge (red) */}
              {unreadCommentsByNote[note._id] > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -12, background: 'red', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem' }}>{unreadCommentsByNote[note._id]}</span>
              )}
            </button>
          </div>

          {openNoteForComments === note._id && (
            <div style={{ marginTop: 8 }}>
              <CommentPanel noteId={note._id} onClose={() => { setOpenNoteForComments(null); if (refreshComments) refreshComments(); }} onMarkedRead={() => { if (refreshComments) refreshComments(); }} />
            </div>
          )}
        </div>
      ))}
      {notes.length === 0 && (
        <p className="no-notes">No notes yet. Create one above!</p>
      )}
    </div>
  );
};

export default NoteList;