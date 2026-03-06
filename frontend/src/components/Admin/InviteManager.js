import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import './Admin.css';

const InviteManager = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newInvite, setNewInvite] = useState(null);
  const [formData, setFormData] = useState({
    maxUses: 10,
    expiresInDays: 7
  });

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const response = await API.get('/invites');
      setInvites(response.data.data);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setNewInvite(null);

    try {
      const response = await API.post('/invites/generate', formData);
      setNewInvite(response.data.data);
      fetchInvites(); // Refresh list
      
      // Reset form
      setFormData({
        maxUses: 10,
        expiresInDays: 7
      });
    } catch (error) {
      alert('Failed to generate invite code');
    } finally {
      setGenerating(false);
    }
  };

  const deactivateInvite = async (code) => {
    if (!window.confirm('Deactivate this invite code? Users will not be able to use it.')) {
      return;
    }

    try {
      await API.put(`/invites/${code}/deactivate`);
      fetchInvites(); // Refresh list
    } catch (error) {
      alert('Failed to deactivate invite code');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusBadge = (invite) => {
    if (!invite.isActive) return <span className="badge inactive">Inactive</span>;
    if (new Date(invite.expiresAt) < new Date()) return <span className="badge expired">Expired</span>;
    if (invite.usedCount >= invite.maxUses) return <span className="badge full">Full</span>;
    return <span className="badge active">Active</span>;
  };

  return (
    <div className="invite-manager">
      <h2>Invite Code Management</h2>
      
      {/* Generate New Invite Form */}
      <div className="generate-invite">
        <h3>Generate New Invite Code</h3>
        <form onSubmit={generateInvite}>
          <div className="form-row">
            <div className="form-group">
              <label>Max Uses</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Expires In (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                required
              />
            </div>
            
            <button type="submit" disabled={generating} className="generate-btn">
              {generating ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        </form>
        
        {/* Show newly generated invite */}
        {newInvite && (
          <div className="new-invite-card">
            <h4>✨ New Invite Code Generated!</h4>
            <div className="invite-code-display">
              <code>{newInvite.code}</code>
              <button onClick={() => copyToClipboard(newInvite.code)}>Copy</button>
            </div>
            <div className="invite-details">
              <p>Max Uses: {newInvite.maxUses}</p>
              <p>Expires: {new Date(newInvite.expiresAt).toLocaleDateString()}</p>
            </div>
            <div className="invite-url">
              <strong>Share URL:</strong>
              <div className="url-display">
                <input 
                  type="text" 
                  value={newInvite.inviteUrl} 
                  readOnly 
                />
                <button onClick={() => copyToClipboard(newInvite.inviteUrl)}>
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Invite Codes List */}
      <div className="invite-list">
        <h3>Your Invite Codes</h3>
        
        {loading ? (
          <p>Loading invites...</p>
        ) : invites.length === 0 ? (
          <p className="no-data">No invite codes generated yet</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(invite => (
                <tr key={invite._id}>
                  <td>
                    <code>{invite.code}</code>
                    <button 
                      className="copy-btn-small"
                      onClick={() => copyToClipboard(invite.code)}
                      title="Copy code"
                    >
                      📋
                    </button>
                  </td>
                  <td>{getStatusBadge(invite)}</td>
                  <td>{invite.usedCount}/{invite.maxUses}</td>
                  <td>{new Date(invite.expiresAt).toLocaleDateString()}</td>
                  <td>{new Date(invite.createdAt).toLocaleDateString()}</td>
                  <td>
                    {invite.isActive && (
                      <button 
                        onClick={() => deactivateInvite(invite.code)}
                        className="deactivate-btn"
                        title="Deactivate"
                      >
                        ❌
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InviteManager;