import { Link } from 'react-router-dom';
import { ShieldIcon } from '../services/svgIcons';

const Liability = () => {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-8 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center gap-3">
        <span className="text-primary dark:text-secondary">
          <ShieldIcon size={32} />
        </span>
        <h1 className="text-2xl font-bold text-primary dark:text-secondary">
          Liability Protection Policy
        </h1>
      </header>

      <div className="card card--md card--orange mb-6">
        <p className="card-header">Coming soon</p>
        <p className="text-sm">
          The full liability and data-handling policy is being drafted. The page is reachable
          today so the link from the upload page works while we finish the document.
        </p>
      </div>

      <div className="card card--md mb-6">
        <p className="card-header">What we promise today</p>
        <ul className="text-sm leading-relaxed list-disc pl-5 space-y-2">
          <li>
            Files you upload are processed for OCR locally in your browser before being sent
            to Firebase Storage. No third-party OCR services receive your file contents.
          </li>
          <li>
            Image files are stripped of EXIF metadata (GPS coordinates, camera serial numbers,
            timestamps) before storage.
          </li>
          <li>
            Each file is locked to your user account. Other users cannot read it through
            the app.
          </li>
          <li>
            Scan-tron tests are stored as text only — no scan-tron file is ever uploaded
            to Firebase.
          </li>
        </ul>
      </div>

      <div className="card card--md card--red mb-6">
        <p className="card-header">What you should not upload</p>
        <ul className="text-sm leading-relaxed list-disc pl-5 space-y-2">
          <li>Patient records, PHI, or any HIPAA-regulated data</li>
          <li>Identification documents (passports, driver's licenses, SSNs)</li>
          <li>Financial documents, insurance cards, or anything with account numbers</li>
          <li>Anything you do not personally have the right to upload</li>
        </ul>
      </div>

      <div className="card card--md">
        <p className="card-header">Contact</p>
        <p className="text-sm">
          Questions or concerns:{' '}
          <a
            className="underline text-primary dark:text-secondary"
            href="mailto:adnanalhabian2027@u.northwestern.edu"
          >
            adnanalhabian2027@u.northwestern.edu
          </a>
        </p>
      </div>

      <div className="mt-8">
        <Link
          to="/"
          className="text-sm text-primary dark:text-secondary hover:underline"
        >
          ← Back to app
        </Link>
      </div>
    </div>
  );
};

export default Liability;
