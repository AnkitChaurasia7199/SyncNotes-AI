import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Notes.css';

const NoteDetail = () => {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/notes/${id}`);
      setNote(response.data.data);
      setEditForm({
        title: response.data.data.title,
        content: response.data.data.content
      });
      setError(null);
    } catch (error) {
      setError('Failed to fetch note');
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      await API.put(`/notes/${id}`, editForm);
      setIsEditing(false);
      fetchNote();
      alert('✅ Note updated successfully');
    } catch (error) {
      alert('❌ Failed to update note');
    }
  };

  const handleDelete = async () => {
    const isOwner = note.createdBy?._id === user.userId;
    
    if (user.role === 'ADMIN' && !isOwner) {
      if (!window.confirm('⚠️ You are deleting another user\'s note. Are you sure?')) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this note?')) {
        return;
      }
    }

    try {
      await API.delete(`/notes/${id}`);
      alert('✅ Note deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      alert('❌ Failed to delete note');
    }
  };

  const handleRegenerateAI = async () => {
    try {
      await API.post(`/notes/${id}/regenerate`);
      alert('🤖 AI regeneration started. Refresh in a moment.');
      setTimeout(fetchNote, 3000);
    } catch (error) {
      alert('❌ Failed to regenerate AI summary');
    }
  };

  // Check if user can edit/delete this note
  const isOwner = note?.createdBy?._id === user?.userId;
  const canModify = user?.role === 'ADMIN' || isOwner;

  if (loading) {
    return <div className="loading">Loading note...</div>;
  }

  if (error || !note) {
    return <div className="error-message">{error || 'Note not found'}</div>;
  }

  return (
    <div className="note-detail">
      {isEditing ? (
        <div className="edit-form">
          <h2>Edit Note</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              rows="10"
            />
          </div>
          <div className="form-actions">
            <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            <button onClick={handleEdit} className="submit-btn">Save Changes</button>
          </div>
        </div>
      ) : (
        <>
          <div className="note-header">
            <h1>
              {note.title}
              {user.role === 'ADMIN' && !isOwner && (
                <span className="admin-badge">👑 Admin View</span>
              )}
            </h1>
            <div className="note-meta">
              <span>Created by: {note.createdBy?.email}</span>
              <span>Role: {note.createdBy?.role}</span>
              <span>Date: {new Date(note.createdAt).toLocaleDateString()}</span>
              {!isOwner && user.role === 'ADMIN' && (
                <span className="other-user-warning">
                  ⚠️ You are viewing another user's note
                </span>
              )}
            </div>
          </div>

          <div className="note-content-full">
            <h3>Content</h3>
            <p>{note.content}</p>
          </div>

          <div className="ai-section">
            <h3>🤖 AI Analysis</h3>
            <div className={`ai-status-badge ${note.aiProcessed ? 'processed' : 'processing'}`}>
              Status: {note.aiProcessed ? '✅ Processed' : '⏳ Processing'}
            </div>
            
            {note.summary && note.summary !== '⏳ AI is processing...' && (
              <div className="summary-box">
                <h4>Summary</h4>
                <p>{note.summary}</p>
              </div>
            )}

            {note.keyPoints && note.keyPoints.length > 0 && (
              <div className="key-points-box">
                <h4>Key Points</h4>
                <ul>
                  {note.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {canModify && (
            <div className="note-actions">
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                ✏️ Edit Note
              </button>
              <button onClick={handleRegenerateAI} className="ai-btn">
                🤖 Regenerate AI
              </button>
              <button onClick={handleDelete} className="delete-btn">
                🗑️ Delete Note
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NoteDetail;