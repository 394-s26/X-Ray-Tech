import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import '../styles/components/BrandLogo.css';

gsap.registerPlugin(SplitText);

const ANIMATED_FLAG = 'xray-brand-animated';
const BRAND = 'X-Ray Tech';
const NEON_COLOR = '#A876FF';
const NEON_GLOW =
  '0 0 6px #A876FF, 0 0 14px #A876FF, 0 0 26px rgba(168,118,255,0.85), 0 0 44px rgba(168,118,255,0.55)';

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = '' }: BrandLogoProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const target = textRef.current;
    if (!target) return;

    if (sessionStorage.getItem(ANIMATED_FLAG) === '1') {
      gsap.set(target, { opacity: 1, textShadow: 'none' });
      return;
    }

    const split = SplitText.create(target, { type: 'chars' });
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem(ANIMATED_FLAG, '1');
        gsap.to(split.chars, {
          textShadow: '0 0 0px rgba(168,118,255,0)',
          color: '',
          duration: 1.2,
          delay: 1.6,
          ease: 'power2.inOut',
        });
      },
    });

    split.chars.forEach((ch, i) => {
      tl.set(ch, { opacity: 0, color: NEON_COLOR, textShadow: 'none' })
        .to(ch, { opacity: 1, duration: 0.05 }, i * 0.12)
        .to(ch, { opacity: 0.25, duration: 0.04 }, i * 0.12 + 0.05)
        .to(ch, { opacity: 1, duration: 0.04 }, i * 0.12 + 0.09)
        .to(ch, { opacity: 0.55, duration: 0.04 }, i * 0.12 + 0.13)
        .to(
          ch,
          {
            opacity: 1,
            textShadow: NEON_GLOW,
            duration: 0.18,
            ease: 'power2.out',
          },
          i * 0.12 + 0.17,
        );
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <span className={`brand-logo ${className}`} aria-label={BRAND} role="img">
      <span ref={textRef} className="brand-logo__text">
        {BRAND}
      </span>
    </span>
  );
}
