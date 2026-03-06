import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Notes/Dashboard';
import AdminPanel from './components/Admin/AdminPanel';
import CreateNote from './components/Notes/CreateNote';
import NoteDetail from './components/Notes/NoteDetail';

// Components
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/Auth/PrivateRoute';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/notes/create" element={
        <PrivateRoute>
          <CreateNote />
        </PrivateRoute>
      } />
      
      <Route path="/notes/:id" element={
        <PrivateRoute>
          <NoteDetail />
        </PrivateRoute>
      } />
      
      <Route path="/admin" element={
        <PrivateRoute adminOnly={true}>
          <AdminPanel />
        </PrivateRoute>
      } />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;