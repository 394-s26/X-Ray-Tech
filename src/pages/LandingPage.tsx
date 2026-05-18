import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import xrayTechImage from '../assets/xraytech.jpg';
import '../styles/pages/LandingPage.css';

const PALETTES = {
  violet: {
    canvas: [0.973, 0.961, 0.996],
    accentA: [0.788, 0.722, 0.953],
    accentB: [0.91, 0.87, 0.992],
  },
} as const;

function startHazeShader(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vert = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const frag = `
    precision mediump float;
    uniform vec2  u_res;
    uniform float u_time;
    uniform float u_intensity;
    uniform float u_speed;
    uniform vec3  u_canvas;
    uniform vec3  u_a;
    uniform vec3  u_b;

    float blob(vec2 p, vec2 c, float r) {
      float d = distance(p, c) / r;
      float f = 1.0 - smoothstep(0.0, 1.0, d);
      return f * f;
    }

    float blobField(vec2 p, float t, float aspect) {
      vec2 c1 = vec2((0.25 + 0.18 * sin(t * 0.70 + 0.0)) * aspect,
                      0.30 + 0.22 * cos(t * 0.55 + 1.7));
      vec2 c2 = vec2((0.80 + 0.15 * cos(t * 0.60 + 2.3)) * aspect,
                      0.25 + 0.20 * sin(t * 0.80 + 0.4));
      vec2 c3 = vec2((0.55 + 0.30 * sin(t * 0.45 + 4.1)) * aspect,
                      0.55 + 0.18 * cos(t * 0.65 + 2.9));
      vec2 c4 = vec2((0.15 + 0.25 * cos(t * 0.35 + 5.2)) * aspect,
                      0.70 + 0.20 * sin(t * 0.50 + 3.6));
      float h = 0.0;
      h += blob(p, c1, 0.55);
      h += blob(p, c2, 0.50);
      h += blob(p, c3, 0.60);
      h += blob(p, c4, 0.45);
      return clamp(h * 0.55, 0.0, 1.0);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res.xy;
      float aspect = u_res.x / u_res.y;
      vec2 p = vec2(uv.x * aspect, uv.y);
      float t = u_time * 0.08 * u_speed;

      float h = blobField(p, t, aspect);
      float hi = 0.5 + 0.5 * sin(p.x * 1.2 - p.y * 0.8 + t * 0.35);
      hi *= h;

      vec3 col = mix(u_canvas, u_a, h);
      col = mix(col, u_b, hi * 0.55);

      vec2 vc = uv - 0.5;
      float vig = 1.0 - smoothstep(0.30, 0.95, length(vc) * 1.35);
      col = mix(u_canvas, col, u_intensity * (0.45 + 0.55 * vig));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type: number, src: string) {
    const s = gl!.createShader(type)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.error(gl!.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uIntensity = gl.getUniformLocation(prog, 'u_intensity');
  const uSpeed = gl.getUniformLocation(prog, 'u_speed');
  const uCanvas = gl.getUniformLocation(prog, 'u_canvas');
  const uA = gl.getUniformLocation(prog, 'u_a');
  const uB = gl.getUniformLocation(prog, 'u_b');

  const pal = PALETTES.violet;
  gl.uniform1f(uIntensity, 1.0);
  gl.uniform1f(uSpeed, 1.6);
  gl.uniform3fv(uCanvas, pal.canvas);
  gl.uniform3fv(uA, pal.accentA);
  gl.uniform3fv(uB, pal.accentB);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const dprCap = window.innerWidth < 700 ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(uRes, canvas.width, canvas.height);
  }

  let resizeObserver: ResizeObserver | null = null;
  window.addEventListener('resize', resize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
  }
  resize();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targetFps = window.innerWidth < 700 || reduced ? 30 : 60;
  const minDelta = 1000 / targetFps;
  let last = 0;
  const t0 = performance.now();
  let rafId = 0;
  let cancelled = false;

  function tick(now: number) {
    if (cancelled) return;
    if (!last || now - last >= minDelta) {
      gl!.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      last = now;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    resizeObserver?.disconnect();
  };
}

function pinHazeHeight(haze: HTMLElement, visual: HTMLElement): () => void {
  function sync() {
    const r = visual.getBoundingClientRect();
    const docTop = window.scrollY + r.top;
    const overlap = Math.min(120, r.height * 0.18);
    haze.style.height = Math.max(320, docTop + overlap) + 'px';
  }
  sync();
  window.addEventListener('resize', sync, { passive: true });
  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(sync);
    observer.observe(visual);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
  return () => {
    window.removeEventListener('resize', sync);
    observer?.disconnect();
  };
}

interface SplitNode {
  word: string;
  accent: boolean;
}

function splitHeadline(h: HTMLElement) {
  const out: SplitNode[] = [];
  h.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      (node.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => {
        out.push({ word: w, accent: false });
      });
    } else if (node.nodeType === 1) {
      const el = node as HTMLElement;
      const isAccent = el.classList.contains('lp-accent');
      (el.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => {
        out.push({ word: w, accent: isAccent });
      });
    }
  });
  h.innerHTML = out
    .map(({ word, accent }) => {
      const chars = [...word].map((c) => `<span class="lp-char">${c}</span>`).join('');
      return accent
        ? `<span class="lp-word"><span class="lp-accent">${chars}</span></span>`
        : `<span class="lp-word">${chars}</span>`;
    })
    .join(' ');
}

export default function LandingPage() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const hazeRef = useRef<HTMLCanvasElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stopHaze: (() => void) | null = null;
    let stopPin: (() => void) | null = null;
    const ctx = gsap.context(() => {
      if (headlineRef.current) splitHeadline(headlineRef.current);

      if (hazeRef.current) stopHaze = startHazeShader(hazeRef.current);
      if (hazeRef.current && visualRef.current) {
        stopPin = pinHazeHeight(hazeRef.current, visualRef.current);
      }

      const chars = gsap.utils.toArray<HTMLElement>('.lp-headline .lp-char');
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.to(chars, { y: '0%', duration: 1.1, stagger: { amount: 0.55, from: 'start' } }, 0.1)
        .to(subRef.current, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.7)
        .from(subRef.current, { y: 14, duration: 0.55, ease: 'power2.out' }, 0.7)
        .to(ctaRef.current, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.85)
        .from(ctaRef.current, { y: 16, duration: 0.55, ease: 'power2.out' }, 0.85)
        .to(visualRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0.95)
        .to(pillRef.current, { opacity: 1, duration: 0.5 }, 1.2)
        .from(pillRef.current, { y: 24, duration: 0.7, ease: 'expo.out' }, 1.2)
        .to(balanceRef.current, { opacity: 1, duration: 0.5 }, 1.35)
        .from(balanceRef.current, { y: 32, duration: 0.8, ease: 'expo.out' }, 1.35)
        .to(photoRef.current, { opacity: 1, duration: 0.9 }, 1.3)
        .from(photoRef.current, { scale: 1.04, duration: 1.2, ease: 'expo.out' }, 1.3);

      gsap.to(pillRef.current, { y: '+=8', duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.4 });
      gsap.to(balanceRef.current, { y: '-=6', duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.8 });

      if (matchMedia('(pointer: fine)').matches && pillRef.current && balanceRef.current) {
        const px = gsap.quickTo(pillRef.current, 'x', { duration: 0.6, ease: 'power3' });
        const py = gsap.quickTo(pillRef.current, 'y', { duration: 0.6, ease: 'power3' });
        const bx = gsap.quickTo(balanceRef.current, 'x', { duration: 0.7, ease: 'power3' });
        const by = gsap.quickTo(balanceRef.current, 'y', { duration: 0.7, ease: 'power3' });
        const onMove = (e: MouseEvent) => {
          const cx = (e.clientX / window.innerWidth - 0.5) * 2;
          const cy = (e.clientY / window.innerHeight - 0.5) * 2;
          px(cx * 10);
          py(cy * 6);
          bx(cx * 14);
          by(cy * 8);
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
      }
    });

    return () => {
      stopHaze?.();
      stopPin?.();
      ctx.revert();
    };
  }, []);

  return (
    <div className="landing-page" data-screen-label="01 Landing">
      <canvas ref={hazeRef} className="lp-haze" aria-hidden="true" />

      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <span className="lp-logo-mark">
            <img src="/xraytech-mark.png" alt="" className="lp-mark-light" />
            <img src="/xraytech-mark-badge.png" alt="" className="lp-mark-dark" />
          </span>
          <span>X-Ray Tech</span>
        </Link>
        <div className="lp-nav-links">
          <a href="#about">About</a>
          <a href="#how">How it works</a>
          <a href="#liability">Liability</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="lp-nav-actions">
          <Link to="/login" className="lp-text-link">Log in</Link>
          <Link to="/signup" className="lp-cta-dark is-brand">Create account</Link>
        </div>
      </nav>

      <main className="lp-main">
        <section className="lp-hero">
          <h1 ref={headlineRef} className="lp-headline">
            Stay ahead of your <span className="lp-accent">license.</span>
          </h1>

          <p ref={subRef} className="lp-hero-sub">
            One live screen for every CE credit and renewal date.
            {' '}<span className="lp-mono">40 of 48</span> points logged.{' '}
            <span className="lp-mono">87 days</span> to renewal. No spreadsheet, no four state-board tabs.
          </p>

          <div ref={ctaRef} className="lp-hero-cta-wrap">
            <Link to="/signup" className="lp-cta-dark is-brand">Create your account</Link>
            <Link to="/login" className="lp-cta-ghost">Sign in</Link>
          </div>

          <div ref={visualRef} className="lp-visual">
            <div className="lp-cards-col">
              <div ref={pillRef} className="lp-pill-card">
                <div className="lp-labels">
                  <span className="lp-top">Cycle 2024 – 2026</span>
                  <span className="lp-bot">License vault</span>
                </div>
                <div className="lp-lock-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

              <div ref={balanceRef} className="lp-balance-card">
                <span className="lp-renewal-pill">87 days</span>
                <span className="lp-label">CE points logged</span>
                <span className="lp-amount">
                  40<span className="lp-total"> / 48</span>
                </span>
                <span className="lp-ce-row">
                  <span className="lp-ce-dot" />
                  <span className="lp-agency">IEMA</span>
                  <span className="lp-sep">·</span>
                  <span>Renews Aug 13, 2026</span>
                </span>
                <div className="lp-holder-row">
                  <div className="lp-holder-avatar">AH</div>
                  <div className="lp-holder-text">
                    <span className="lp-label">Technologist</span>
                    <span className="lp-name">Adnan Hassan</span>
                  </div>
                </div>
              </div>
            </div>

            <div ref={photoRef} className="lp-photo">
              <span className="lp-photo-tag">Live dashboard</span>
              <img src={xrayTechImage} alt="X-Ray Tech dashboard preview" />
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <Link to="/" className="lp-footer-brand">
            <img src="/xraytech-mark.png" alt="" className="lp-mark-light" />
            <img src="/xraytech-mark-badge.png" alt="" className="lp-mark-dark" />
            <span>X-Ray Tech</span>
          </Link>
          <ul>
            <li><a className="lp-flink" href="#about">About</a></li>
            <li><a className="lp-flink" href="#liability">Liability</a></li>
            <li><a className="lp-flink" href="#contact">Contact</a></li>
            <li><Link className="lp-flink" to="/signup">Create account</Link></li>
            <li><Link className="lp-flink" to="/login">Log in</Link></li>
          </ul>
          <span className="lp-footer-copy">© 2026 X-Ray Tech</span>
        </div>
      </footer>
    </div>
  );
}
