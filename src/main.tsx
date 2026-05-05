import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './pages/App.tsx'
import ExampleUsage from './pages/ExampleUsage.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import Navbar from './components/Navbar.tsx'

const path = window.location.pathname

const routes: Record<string, React.ReactNode> = {
  '/example': <ExampleUsage />,
}

const page = routes[path] ?? <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Navbar />
      {page}
    </ThemeProvider>
  </StrictMode>,
)
