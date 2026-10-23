// React imports: StrictMode, the root renderer and the router that App's routes depend on.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Global styles (CSS variables, base typography) and the root component.
import './index.css'
import App from './App.jsx'

/**
 * Entry point for the React frontend.
 *
 * Mounts the main App component into the root DOM node using React StrictMode.
 */
// Mounts into the #root element from index.html; BrowserRouter enables useNavigate/Routes inside App.
// How: createRoot attaches React to the existing #root element. StrictMode runs extra checks in development, and
// BrowserRouter exposes the URL to useNavigate and Routes through React context.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
