import 'primeicons/primeicons.css'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react';
import {BrowserRouter } from 'react-router-dom'

// StrictMode is disabled to avoid TipTap flushSync warnings
// TipTap uses flushSync internally for custom node views which conflicts with React 18's StrictMode
// This is a known issue: https://github.com/ueberdosis/tiptap/issues/3764
const root = createRoot(document.getElementById('root')!)


function extractAndSaveToken(){
  const url = new URL(window.location.href);

  const params = url.searchParams;

  const value = params.get('token');
  if(!!value)localStorage.setItem("accessToken",value)
  if(!!value)localStorage.setItem("refreshToken",value)
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

