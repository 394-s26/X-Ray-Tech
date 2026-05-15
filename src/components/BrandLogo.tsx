import '../styles/components/BrandLogo.css';

const BRAND = 'X-Ray Tech';

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${className}`} aria-label={BRAND} role="img">
      <img
        src="/xraytech-mark.png"
        alt=""
        aria-hidden="true"
        className="brand-logo__mark brand-logo__mark--light"
      />
      <img
        src="/xraytech-mark-badge.png"
        alt=""
        aria-hidden="true"
        className="brand-logo__mark brand-logo__mark--dark"
      />
      <span className="brand-logo__text">{BRAND}</span>
    </span>
  );
}
