import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './Notes.css';

const CreateNote = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await API.post('/notes', formData);
      
      // Show success message with AI processing info
      if (response.data.processing) {
        alert('Note created! AI is processing your content in the background.');
      }
      
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create note');
      console.error('Error creating note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-note">
      <h1>Create New Note</h1>
      
      <form onSubmit={handleSubmit} className="note-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter note title"
            maxLength="200"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your note content here..."
            rows="10"
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/dashboard')} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNote;