import 'primeicons/primeicons.css'
import 'font-awesome/css/font-awesome.min.css'
import 'material-icons/iconfont/material-icons.css'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react';
import {BrowserRouter } from 'react-router-dom'
import { decodeToken } from './utils/tokenUtils'

// StrictMode is disabled to avoid TipTap flushSync warnings
// TipTap uses flushSync internally for custom node views which conflicts with React 18's StrictMode
// This is a known issue: https://github.com/ueberdosis/tiptap/issues/3764
const root = createRoot(document.getElementById('root')!)


function extractAndSaveToken(){
  const url = new URL(window.location.href);
  const params = url.searchParams;

  const token = params.get('token');
  if (token) {
    localStorage.setItem("accessToken", token)
    localStorage.setItem("refreshToken", token)

    // Decode token to extract claims
    const claims = decodeToken(token)
    if (claims) {
      // Store ai_edit feature flag from token claims
      localStorage.setItem("show_chat", claims.ai_edit ? 'true' : 'false')
    }
  }
}

/**
 * Render the application
 */
function renderApp() {
  extractAndSaveToken()
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
}
renderApp()



if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
      const token=localStorage.getItem("accessToken")
      const swUrl = `/sw.js?baseURL=${encodeURI(import.meta.env.VITE_BACKEND_URL)}&token=${token}`;
      console.log(swUrl)
      navigator.serviceWorker.register(swUrl)
      .then(_reg => console.log('SW registered successfully'))
      .catch(err => console.error('error registering SW', err));
  });
}
