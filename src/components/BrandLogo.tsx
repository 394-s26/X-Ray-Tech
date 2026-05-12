import '../styles/components/BrandLogo.css';

const BRAND = 'X-Ray Tech';

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${className}`} aria-label={BRAND} role="img">
      <span className="brand-logo__text">{BRAND}</span>
    </span>
  );
}
