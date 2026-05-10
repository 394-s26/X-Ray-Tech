import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './pages/Router.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

const path = window.location.pathname

const routes: Record<string, React.ReactNode> = {
  '/example': <ExampleUsage />,
}

const page = routes[path] ?? <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Router />
    </ThemeProvider>
  </StrictMode>,
)
