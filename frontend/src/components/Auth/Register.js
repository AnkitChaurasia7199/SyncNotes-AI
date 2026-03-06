import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
    inviteCode: ''
  });
  
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState(null);
  const [inviteChecking, setInviteChecking] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL for invite code on page load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    
    if (codeFromUrl) {
      setFormData(prev => ({ ...prev, inviteCode: codeFromUrl }));
      validateInviteCode(codeFromUrl);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setValidationError('');
    
    // If invite code changes, validate it
    if (e.target.name === 'inviteCode' && e.target.value.length > 5) {
      validateInviteCode(e.target.value);
    }
  };

  const validateInviteCode = async (code) => {
    if (!code || code.length < 5) return;
    
    setInviteChecking(true);
    try {
      const response = await API.post('/invites/validate', { code });
      if (response.data.success) {
        setInviteValid(true);
        setInviteInfo(response.data.data);
        setValidationError('');
      }
    } catch (error) {
      setInviteValid(false);
      setInviteInfo(null);
      setValidationError(error.response?.data?.message || 'Invalid invite code');
    } finally {
      setInviteChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      setValidationError('Email and password are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    // If invite code is provided, it should be valid
    if (formData.inviteCode && !inviteValid) {
      setValidationError('Please enter a valid invite code');
      return;
    }
    
    setLoading(true);
    
    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        workspaceName: formData.workspaceName || undefined
      };
      
      // Only add inviteCode if it exists (for non-first users)
      if (formData.inviteCode) {
        registerData.inviteCode = formData.inviteCode;
      }
      
      const result = await register(
        registerData.email,
        registerData.password,
        registerData.workspaceName,
        registerData.inviteCode
      );
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setValidationError(result.error || 'Registration failed');
      }
    } catch (err) {
      setValidationError('An unexpected error occurred');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        
        {(error || validationError) && (
          <div className="error-message">
            {error || validationError}
          </div>
        )}
        
        {/* Invite Code Info */}
        {inviteInfo && (
          <div className="invite-info success">
            <strong>✓ Valid Invite Code!</strong>
            <p>Joining workspace: {inviteInfo.workspaceName}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              autoComplete="new-password"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>

          {/* Invite Code Field - Show for everyone except first user */}
          <div className="form-group invite-group">
            <label>
              Invite Code 
              {inviteChecking && <span className="checking"> (Checking...)</span>}
              {inviteValid === true && <span className="valid"> ✓ Valid</span>}
              {inviteValid === false && <span className="invalid"> ✗ Invalid</span>}
            </label>
            <div className="invite-input-wrapper">
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleChange}
                placeholder="Enter invite code (if you have one)"
                className={inviteValid === true ? 'input-valid' : inviteValid === false ? 'input-invalid' : ''}
              />
              {inviteValid === true && (
                <span className="input-icon">✅</span>
              )}
            </div>
            <small className="hint">
              First user? Leave invite code empty to create workspace.
              <br />
              Have invite code? Enter it to join existing workspace.
            </small>
          </div>
          
          <div className="form-group">
            <label>Workspace Name (Optional for first user)</label>
            <input
              type="text"
              name="workspaceName"
              value={formData.workspaceName}
              onChange={handleChange}
              placeholder="Enter workspace name"
            />
            <small className="hint">Only needed if you're creating new workspace</small>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || inviteChecking} 
            className="auth-btn"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;