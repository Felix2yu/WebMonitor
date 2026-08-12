import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// 路由级代码分割：每个页面独立成 chunk，降低首屏主包体积
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const MonitorTasks = React.lazy(() => import('./pages/MonitorTasks'));
const MonitorLogs = React.lazy(() => import('./pages/MonitorLogs'));
const NotificationConfig = React.lazy(() => import('./pages/EmailConfig'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const BlacklistManagement = React.lazy(() => import('./pages/BlacklistManagement'));
const Documentation = React.lazy(() => import('./pages/Documentation'));
const Settings = React.lazy(() => import('./pages/Settings'));

// 懒加载期间的占位，避免路由切换白屏
const PageFallback = () => null;

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
            <Suspense fallback={<PageFallback />}>
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
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
