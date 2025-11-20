import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react';
import { HashRouter } from 'react-router-dom'
import { tenantContext } from './services/tenantContext'

// StrictMode is disabled to avoid TipTap flushSync warnings
// TipTap uses flushSync internally for custom node views which conflicts with React 18's StrictMode
// This is a known issue: https://github.com/ueberdosis/tiptap/issues/3764
const root = createRoot(document.getElementById('root')!)

/**
 * Render the application
 */
function renderApp() {
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  )
}

/**
 * Initialize multi-tenant mode
 * Waits for authentication message from parent window
 */
function initializeMultiTenantMode() {
  const tenantId = tenantContext.getTenantIdFromURL()
  const documentId = tenantContext.getDocumentIdFromURL()

  console.log('[Init] Multi-tenant mode detected:', { tenantId, documentId })

  // Show loading message
  const loadingDiv = document.createElement('div')
  loadingDiv.id = 'tenant-loading'
  loadingDiv.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    color: #6b7280;
    font-size: 14px;
  `
  loadingDiv.textContent = 'Authenticating...'
  document.getElementById('root')?.appendChild(loadingDiv)

  // Listen for authentication message from parent
  window.addEventListener('message', (event) => {
    // In production, validate event.origin here
    // if (event.origin !== 'https://tuapp.com') return;

    if (event.data.type === 'AUTH_TOKEN') {
      console.log('[Init] Received authentication from parent')

      // Validate that tenant ID matches
      if (event.data.tenantId !== tenantId) {
        console.error('[Init] Tenant ID mismatch!', {
          expected: tenantId,
          received: event.data.tenantId
        })
        showError('Authentication error: Tenant ID mismatch')
        return
      }

      // Initialize tenant context
      tenantContext.initialize({
        tenantId: event.data.tenantId,
        token: event.data.token,
        backendUrl: event.data.backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api',
        documentId: documentId || undefined
      })

      // Remove loading message
      document.getElementById('tenant-loading')?.remove()

      // Render app
      renderApp()

      // Notify parent that we're ready
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'EDITOR_READY',
          tenantId: event.data.tenantId
        }, '*') // In production, specify exact origin
      }
    } else if (event.data.type === 'TOKEN_REFRESH') {
      console.log('[Init] Received token refresh')

      // Update token
      tenantContext.updateToken(event.data.token)
    }
  })

  // Notify parent that we're ready to receive auth
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'EDITOR_LOADED',
      tenantId: tenantId
    }, '*') // In production, specify exact origin
  }

  // Timeout after 10 seconds
  setTimeout(() => {
    if (!tenantContext.isInitialized()) {
      console.error('[Init] Authentication timeout')
      showError('Authentication timeout. Please refresh the page.')
    }
  }, 10000)
}

/**
 * Show error message
 */
function showError(message: string) {
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
    color: #ef4444;
    font-size: 14px;
    padding: 20px;
    text-align: center;
  `
  errorDiv.textContent = message
  document.getElementById('root')!.innerHTML = ''
  document.getElementById('root')?.appendChild(errorDiv)
}

// Initialize based on mode
if (tenantContext.isMultiTenantMode()) {
  initializeMultiTenantMode()
} else {
  // Normal mode - render immediately
  renderApp()
}
