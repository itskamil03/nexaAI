import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import InvestmentsPage from './pages/InvestmentsPage';
import ReferralsPage from './pages/ReferralsPage';
import RoiHistoryPage from './pages/RoiHistoryPage';
import WalletPage from './pages/WalletPage';
import CronTestPage from './pages/CronTestPage';
import Login from './pages/Login';
import Register from './pages/Register';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <LoadingSpinner text="Authenticating user session..." />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <LoadingSpinner text="Checking session..." />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/referrals" element={<ReferralsPage />} />
              <Route path="/roi" element={<RoiHistoryPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/cron-test" element={<CronTestPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
