import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/toaster';
import './index.css';

// Create hash router to avoid backend routing conflicts
const router = createHashRouter([
  {
    path: "/*",
    element: (
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    )
  }
], {
  future: {
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
