import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthRoute } from './components/AuthRoute';
import NewLogin from './pages/NewLogin';
import NewRegister from './pages/NewRegister';
import NewDashboard from './pages/NewDashboard';
import NewApps from './pages/NewApps';
import NewApiKeys from './pages/NewApiKeys';
import NewExamples from './pages/NewExamples';
import NewLogs from './pages/NewLogs';
import Chat from './pages/Chat';
import NewLayout from './components/NewLayout';

function App() {
  return (
    <Routes>
      <Route 
        path="login" 
        element={
          <AuthRoute requireAuth={false}>
            <NewLogin />
          </AuthRoute>
        } 
      />
      <Route 
        path="register" 
        element={
          <AuthRoute requireAuth={false}>
            <NewRegister />
          </AuthRoute>
        } 
      />
      <Route 
        path="chat" 
        element={<Chat />} 
      />
      <Route
        path="/"
        element={
          <AuthRoute requireAuth={true}>
            <NewLayout />
          </AuthRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route 
          path="dashboard" 
          element={
            <AuthRoute requireAuth={true}>
              <NewDashboard />
            </AuthRoute>
          } 
        />
        <Route 
          path="apps" 
          element={
            <AuthRoute requireAuth={true}>
              <NewApps />
            </AuthRoute>
          } 
        />
        <Route 
          path="api-keys" 
          element={
            <AuthRoute requireAuth={true}>
              <NewApiKeys />
            </AuthRoute>
          } 
        />
        <Route 
          path="examples" 
          element={
            <AuthRoute requireAuth={true}>
              <NewExamples />
            </AuthRoute>
          } 
        />
        <Route 
          path="logs" 
          element={
            <AuthRoute requireAuth={true}>
              <NewLogs />
            </AuthRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
