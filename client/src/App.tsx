import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import Emergency from './pages/Emergency';
import AdminDashboard from './pages/AdminDashboard';
import Inventory from './pages/Inventory';
import Vault from './pages/Vault';
import MapView from './pages/MapView';

// Route Guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Secure Network...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.profileCompleted) return <Navigate to="/complete-profile" replace />;
  return children;
};

const SetupRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user && user.profileCompleted) return <Navigate to="/" replace />;
    return children;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) return <div>Authenticating...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user && user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
};

function App() {
  return (
    <div className="app-container">
      <main className="main-content" style={{ padding: 0 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/complete-profile" element={<SetupRoute><CompleteProfile /></SetupRoute>} />
          
          {/* Protected Routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/emergency" element={<PrivateRoute><Emergency /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/vault" element={<PrivateRoute><Vault /></PrivateRoute>} />
          <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
