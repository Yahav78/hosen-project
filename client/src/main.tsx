import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/global.css' // Custom CSS per requirements
import './i18n'; // Import i18n configuration for translation hooks

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1028915940352-pduukjhmejqpmeou864ectn9ncfg21tn.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
