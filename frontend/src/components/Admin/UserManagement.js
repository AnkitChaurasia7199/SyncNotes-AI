import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/users');
      setUsers(response.data.data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This will also delete all their notes.`)) {
      return;
    }

    try {
      await API.delete(`/admin/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers(); // Refresh list
    } catch (error) {
      alert('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-management">
      <h3>User Management</h3>
      
      {users.length === 0 ? (
        <p className="no-data">No users found in workspace</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Notes Count</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  {user.email}
                  {user._id === currentUser?.id && <span className="you-badge"> (You)</span>}
                </td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.noteCount || 0}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {user._id !== currentUser?.id && (
                    <button 
                      onClick={() => handleDeleteUser(user._id, user.email)}
                      className="delete-user-btn"
                      title="Delete user"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;