import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CertificateCreatePage } from './CertificateCreatePage';
import App from './App';
import Navbar from '../components/Navbar';

export default function RoutesLayout() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CertificateCreatePage />} />
        <Route
          path="/demo"
          element={
            <div className="min-h-screen">
              <Navbar />
              <App />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
