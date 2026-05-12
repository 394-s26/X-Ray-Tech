import { Link } from 'react-router-dom';
import { ShieldIcon } from '../services/svgIcons';
import '../styles/components/UploadCard.css';

export const UploadTransparencyNotice = () => {
  return (
    <div className="upload-notice">
      <span className="upload-notice__icon">
        <ShieldIcon size={18} />
      </span>
      <p className="upload-notice__copy">
        Files stay tied to your account and are processed in your browser. Upload only your own
        certificates and scan-trons.
      </p>
      <Link to="/legal" className="upload-notice__link">
        Liability policy
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
};
