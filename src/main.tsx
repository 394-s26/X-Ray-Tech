import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Dashboard from './pages/Dashboard.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  </StrictMode>,
)
