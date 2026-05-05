import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import Navbar from './components/Navbar.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Navbar />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
