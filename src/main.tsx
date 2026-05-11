import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Dashboard from './pages/Dashboard.tsx'
import CertList from './pages/CertList.tsx'
import { ARRT_RECORDS, IEMA_RECORDS } from './data/certs.ts'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import Navbar from './components/Navbar.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/arrt"
            element={
              <CertList
                name="ARRT"
                fullName="American Registry of Radiologic Technologists"
                accent="#1A4975"
                records={ARRT_RECORDS}
              />
            }
          />
          <Route
            path="/iema"
            element={
              <CertList
                name="IEMA"
                fullName="Illinois Emergency Management Agency"
                accent="#0EA37E"
                records={IEMA_RECORDS}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
