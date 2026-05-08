import { useState } from 'react';
import Navbar from './Navbar';
import App from '../pages/App';
import OCRTest from '../pages/OCRTest';

export type PageKey = 'demo' | 'ocr';

const AppShell = () => {
  const [page, setPage] = useState<PageKey>('demo');

  return (
    <>
      <Navbar currentPage={page} onNavigate={setPage} />
      <main className="pt-20">
        {page === 'demo' && <App />}
        {page === 'ocr' && <OCRTest />}
      </main>
    </>
  );
};

export default AppShell;
