import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import InviteManager from './InviteManager';
import API from '../../services/api';
import './Admin.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="admin-panel">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button 
          className={activeTab === 'invites' ? 'active' : ''}
          onClick={() => setActiveTab('invites')}
        >
          🔑 Invite Codes
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>
      
      <div className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'invites' && <InviteManager />}
        {activeTab === 'stats' && <WorkspaceStats />}
      </div>
    </div>
  );
};

// WorkspaceStats Component
const WorkspaceStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get('/admin/stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading stats...</div>;

  return (
    <div className="stats-dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats?.totalUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Notes</h3>
          <p className="stat-number">{stats?.totalNotes || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Workspace</h3>
          <p className="stat-text">{stats?.workspace || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;