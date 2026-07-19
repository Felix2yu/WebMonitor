import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import MonitorTasks from './pages/MonitorTasks';
import MonitorLogs from './pages/MonitorLogs';
import NotificationConfig from './pages/EmailConfig';
import UserManagement from './pages/UserManagement';
import BlacklistManagement from './pages/BlacklistManagement';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/docs" element={<Documentation />} />

              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/tasks" element={
                <ProtectedRoute>
                  <Layout><MonitorTasks /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute>
                  <Layout><MonitorLogs /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/notification-config" element={
                <ProtectedRoute>
                  <Layout><NotificationConfig /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/blacklist-management" element={
                <ProtectedRoute adminOnly>
                  <Layout><BlacklistManagement /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/user-management" element={
                <ProtectedRoute adminOnly>
                  <Layout><UserManagement /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
