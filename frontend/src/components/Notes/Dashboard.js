import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Notes.css';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'mine'
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await API.get('/notes');
      console.log('📝 Notes fetched:', response.data);
      setNotes(response.data.data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch notes');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId, noteOwner) => {
    // Admin delete warning
    if (user.role === 'ADMIN' && noteOwner !== user.userId) {
      if (!window.confirm('⚠️ You are deleting another user\'s note. Are you sure?')) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this note?')) {
        return;
      }
    }

    try {
      await API.delete(`/notes/${noteId}`);
      setNotes(notes.filter(note => note._id !== noteId));
      alert('✅ Note deleted successfully');
    } catch (error) {
      alert('❌ Failed to delete note');
      console.error('Error deleting note:', error);
    }
  };

  const handleEdit = (noteId) => {
    navigate(`/notes/${noteId}/edit`);
  };

  const handleRegenerateAI = async (noteId) => {
    try {
      await API.post(`/notes/${noteId}/regenerate`);
      alert('🤖 AI regeneration started. Refresh in a moment.');
      setTimeout(fetchNotes, 3000);
    } catch (error) {
      alert('❌ Failed to regenerate AI summary');
    }
  };

  const handleView = (noteId) => {
    navigate(`/notes/${noteId}`);
  };

  // Filter notes based on role and selected filter
  const getFilteredNotes = () => {
    if (user.role === 'MEMBER') {
      // Member always sees only their notes
      return notes;
    }
    
    // Admin can filter
    if (filter === 'mine') {
      return notes.filter(note => note.createdBy?._id === user.userId);
    }
    return notes; // Admin sees all
  };

  const filteredNotes = getFilteredNotes();

  if (loading) {
    return <div className="loading-spinner">Loading notes...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            {user.role === 'ADMIN' ? '👑 Admin Dashboard' : '👤 My Notes'}
          </h1>
          <p className="workspace-info">
            Workspace: {user.workspaceName || 'Your Workspace'}
          </p>
        </div>
        <button onClick={() => navigate('/notes/create')} className="create-btn">
          + Create New Note
        </button>
      </div>

      {/* Admin Filter Controls */}
      {user.role === 'ADMIN' && (
        <div className="admin-filters">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              📋 All Notes ({notes.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => setFilter('mine')}
            >
              👤 My Notes ({notes.filter(n => n.createdBy?._id === user.userId).length})
            </button>
          </div>
          <div className="admin-stats">
            <span className="stat-badge">
              Total Users: {new Set(notes.map(n => n.createdBy?._id)).size}
            </span>
            <span className="stat-badge">
              Total Notes: {notes.length}
            </span>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          {user.role === 'ADMIN' && filter === 'all' ? (
            <>
              <p>No notes in workspace yet.</p>
              <p className="hint">Be the first to create a note!</p>
            </>
          ) : (
            <>
              <p>You haven't created any notes yet.</p>
              <button onClick={() => navigate('/notes/create')} className="create-first-btn">
                Create Your First Note
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map(note => {
            const isOwner = note.createdBy?._id === user.userId;
            const ownerEmail = note.createdBy?.email || 'Unknown';
            
            return (
              <div 
                key={note._id} 
                className={`note-card ${!isOwner && user.role === 'ADMIN' ? 'other-user-note' : ''}`}
              >
                <div className="note-header">
                  <h3>{note.title}</h3>
                  <div className="note-badges">
                    {!isOwner && user.role === 'ADMIN' && (
                      <span className="user-badge" title={`Created by ${ownerEmail}`}>
                        👤 {ownerEmail.split('@')[0]}
                      </span>
                    )}
                    <span className={`ai-status ${note.aiProcessed ? 'processed' : 'processing'}`}>
                      {note.aiProcessed ? '✅ AI Ready' : '⏳ Processing'}
                    </span>
                  </div>
                </div>
                
                <div className="note-content">
                  <p className="content-preview">
                    {note.content.substring(0, 100)}...
                  </p>
                  
                  {note.summary && note.summary !== '⏳ AI is processing...' && (
                    <div className="ai-summary">
                      <strong>📝 Summary:</strong>
                      <p>{note.summary.substring(0, 80)}...</p>
                    </div>
                  )}
                  
                  {note.keyPoints && note.keyPoints.length > 0 && (
                    <div className="key-points">
                      <strong>🔑 Key Points:</strong>
                      <ul>
                        {note.keyPoints.slice(0, 2).map((point, idx) => (
                          <li key={idx}>{point.substring(0, 40)}...</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="note-footer">
                  <span className="note-author">
                    By: {ownerEmail}
                  </span>
                  <div className="note-actions">
                    <button 
                      onClick={() => handleView(note._id)} 
                      className="view-btn"
                      title="View note"
                    >
                      👁️ View
                    </button>
                    
                    {/* EDIT BUTTON - Admin can edit any note, Member only own */}
                    {(user.role === 'ADMIN' || isOwner) && (
                      <button 
                        onClick={() => handleEdit(note._id)} 
                        className="edit-btn"
                        title={!isOwner ? 'Editing as Admin' : 'Edit note'}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    
                    {/* AI REGENERATE - Admin can regenerate any, Member only own */}
                    {(user.role === 'ADMIN' || isOwner) && (
                      <button 
                        onClick={() => handleRegenerateAI(note._id)} 
                        className="ai-btn"
                        title="Regenerate AI summary"
                      >
                        🤖 AI
                      </button>
                    )}
                    
                    {/* DELETE BUTTON - Admin can delete any, Member only own */}
                    {(user.role === 'ADMIN' || isOwner) && (
                      <button 
                        onClick={() => handleDelete(note._id, note.createdBy?._id)} 
                        className="delete-btn"
                        title={!isOwner ? 'Delete as Admin' : 'Delete note'}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;