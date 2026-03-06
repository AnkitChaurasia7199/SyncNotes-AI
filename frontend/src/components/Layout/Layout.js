import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate('/dashboard')}>
          SyncNotes AI
        </div>
        
        {user && (
          <div className="nav-menu">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button onClick={() => navigate('/notes/create')}>Create Note</button>
            {user.role === 'ADMIN' && (
              <button onClick={() => navigate('/admin')}>Admin Panel</button>
            )}
            <div className="user-info">
              <span>{user.email}</span>
              <span className="role-badge">{user.role}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        )}
      </nav>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;