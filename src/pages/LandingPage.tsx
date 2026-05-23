import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import groupphoto from '../assets/groupphoto.jpg';
import michelle from '../assets/michelle.jpg';
import arrtBlackText from '../assets/arrtblacktext.png';
import '../styles/pages/LandingPage.css';

gsap.registerPlugin(ScrollToPlugin);

// Email parts split + reassembled at runtime so static-HTML scrapers and
// regex bots scanning the bundle for `\w+@\w+` find nothing.
const MAIL_DOMAIN = 'u.northwestern.edu';
const AT = String.fromCharCode(64);
const DEVELOPERS: ReadonlyArray<{ name: string; user: string }> = [
  { name: 'Adnan Alhabian', user: 'adnanalhabian2027' },
  { name: 'Yusuf Ozdemir', user: 'yusuf.ozdemir' },
  { name: 'Azan Malik', user: 'azanmalik2027' },
  { name: 'Fiorelli Wong', user: 'fiorelliwong2027' },
  { name: 'Aidan Zea', user: 'aidanzea2027' },
];
const buildEmail = (user: string) => user + AT + MAIL_DOMAIN;

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
      // wave displacement — adds an erratic, undulating distortion to the sampling field
      vec2 wave = vec2(
        0.06 * sin(p.y * 6.0 + t * 1.8) + 0.04 * sin(p.x * 9.0 + t * 2.4),
        0.06 * cos(p.x * 5.0 + t * 1.6) + 0.04 * cos(p.y * 8.0 + t * 2.2)
      );
      p += wave;
      vec2 c1 = vec2((0.20 + 0.22 * sin(t * 1.40 + 0.0) + 0.06 * sin(t * 3.10 + 1.2)) * aspect,
                      0.28 + 0.26 * cos(t * 1.10 + 1.7) + 0.05 * cos(t * 3.40 + 0.3));
      vec2 c2 = vec2((0.82 + 0.20 * cos(t * 1.20 + 2.3) + 0.05 * sin(t * 2.90 + 4.1)) * aspect,
                      0.22 + 0.24 * sin(t * 1.60 + 0.4) + 0.05 * cos(t * 3.20 + 2.5));
      vec2 c3 = vec2((0.52 + 0.34 * sin(t * 0.90 + 4.1) + 0.06 * cos(t * 2.70 + 0.6)) * aspect,
                      0.55 + 0.22 * cos(t * 1.30 + 2.9) + 0.05 * sin(t * 3.00 + 5.2));
      vec2 c4 = vec2((0.12 + 0.28 * cos(t * 0.70 + 5.2) + 0.06 * sin(t * 2.50 + 1.9)) * aspect,
                      0.72 + 0.24 * sin(t * 1.00 + 3.6) + 0.05 * cos(t * 3.30 + 4.6));
      vec2 c5 = vec2((0.70 + 0.26 * sin(t * 1.00 + 1.1) + 0.06 * cos(t * 2.80 + 3.7)) * aspect,
                      0.78 + 0.22 * cos(t * 0.80 + 2.2) + 0.05 * sin(t * 3.10 + 0.8));
      vec2 c6 = vec2((0.40 + 0.24 * cos(t * 1.24 + 3.3) + 0.06 * sin(t * 2.90 + 5.5)) * aspect,
                      0.12 + 0.18 * sin(t * 1.44 + 5.0) + 0.05 * cos(t * 3.50 + 1.1));
      vec2 c7 = vec2((0.92 + 0.22 * sin(t * 0.84 + 4.7) + 0.05 * cos(t * 3.00 + 2.1)) * aspect,
                      0.60 + 0.26 * cos(t * 1.16 + 0.9) + 0.05 * sin(t * 3.20 + 3.7));
      vec2 c8 = vec2((0.30 + 0.26 * cos(t * 1.10 + 2.6) + 0.06 * sin(t * 2.60 + 4.2)) * aspect,
                      0.45 + 0.24 * sin(t * 0.96 + 4.4) + 0.05 * cos(t * 3.10 + 0.7));
      vec2 c9 = vec2((0.05 + 0.24 * sin(t * 1.32 + 0.8) + 0.05 * cos(t * 2.80 + 5.1)) * aspect,
                      0.50 + 0.26 * cos(t * 1.04 + 3.1) + 0.05 * sin(t * 3.30 + 2.4));
      vec2 c10 = vec2((0.65 + 0.28 * cos(t * 0.96 + 5.5) + 0.06 * sin(t * 2.70 + 0.2)) * aspect,
                       0.40 + 0.22 * sin(t * 1.36 + 1.4) + 0.05 * cos(t * 3.40 + 4.0));
      vec2 c11 = vec2((0.45 + 0.30 * sin(t * 1.16 + 2.0) + 0.06 * cos(t * 2.90 + 1.7)) * aspect,
                       0.88 + 0.16 * cos(t * 0.88 + 4.8) + 0.05 * sin(t * 3.20 + 3.0));
      vec2 c12 = vec2((0.88 + 0.22 * cos(t * 1.40 + 0.5) + 0.05 * sin(t * 3.00 + 2.6)) * aspect,
                       0.92 + 0.16 * sin(t * 1.04 + 2.7) + 0.05 * cos(t * 3.30 + 5.3));
      float h = 0.0;
      h += blob(p, c1, 0.55);
      h += blob(p, c2, 0.50);
      h += blob(p, c3, 0.60);
      h += blob(p, c4, 0.45);
      h += blob(p, c5, 0.50);
      h += blob(p, c6, 0.42);
      h += blob(p, c7, 0.48);
      h += blob(p, c8, 0.52);
      h += blob(p, c9, 0.46);
      h += blob(p, c10, 0.50);
      h += blob(p, c11, 0.44);
      h += blob(p, c12, 0.40);
      return clamp(h * 0.32, 0.0, 1.0);
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
  gl.uniform1f(uSpeed, 8.0);
  gl.uniform3fv(uCanvas, pal.canvas);
  gl.uniform3fv(uA, pal.accentA);
  gl.uniform3fv(uB, pal.accentB);

  let needsResize = true;
  const scheduleResize = () => {
    needsResize = true;
  };

  let resizeObserver: ResizeObserver | null = null;
  window.addEventListener('resize', scheduleResize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(canvas);
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targetFps = window.innerWidth < 700 || reduced ? 30 : 60;
  const minDelta = 1000 / targetFps;
  let last = 0;
  const t0 = performance.now();
  let rafId = 0;
  let cancelled = false;
  let revealed = false;

  function applyResize(): boolean {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const dprCap = window.innerWidth < 700 ? 1.25 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const w = Math.floor(cssW * dpr);
    const h = Math.floor(cssH * dpr);
    if (w === canvas.width && h === canvas.height) return false;
    canvas.width = w;
    canvas.height = h;
    gl!.viewport(0, 0, w, h);
    gl!.uniform2f(uRes, w, h);
    return true;
  }

  function draw() {
    gl!.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  function tick(now: number) {
    if (cancelled) return;
    let drewThisFrame = false;
    if (needsResize) {
      needsResize = false;
      if (applyResize()) {
        draw();
        last = now;
        drewThisFrame = true;
      }
    }
    if (!drewThisFrame && (!last || now - last >= minDelta)) {
      draw();
      last = now;
      drewThisFrame = true;
    }
    if (drewThisFrame && !revealed) {
      revealed = true;
      requestAnimationFrame(() => canvas.classList.add('is-ready'));
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', scheduleResize);
    resizeObserver?.disconnect();
  };
}

function pinHazeHeight(haze: HTMLElement, visual: HTMLElement): () => void {
  let scheduled = false;
  let lastHeight = -1;
  let cancelled = false;

  function apply() {
    scheduled = false;
    if (cancelled) return;
    const r = visual.getBoundingClientRect();
    const docTop = window.scrollY + r.top;
    const overlap = Math.min(120, r.height * 0.18);
    const next = Math.max(320, Math.round(docTop + overlap));
    if (next === lastHeight) return;
    lastHeight = next;
    haze.style.height = next + 'px';
  }

  function schedule() {
    if (scheduled || cancelled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  schedule();
  window.addEventListener('resize', schedule, { passive: true });
  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(schedule);
    observer.observe(visual);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  return () => {
    cancelled = true;
    window.removeEventListener('resize', schedule);
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
    });

    return () => {
      stopHaze?.();
      stopPin?.();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.lp-main .lp-section'),
    );
    if (!sections.length) return;

    sections.forEach((section) => {
      const title = section.querySelector<HTMLElement>('.lp-section-title');
      if (title) splitHeadline(title);
    });

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animateSection = (section: HTMLElement) => {
      const title = section.querySelector<HTMLElement>('.lp-section-title');
      const eyebrow = section.querySelector<HTMLElement>('.lp-section-lead-col .lp-eyebrow');
      const lede = section.querySelector<HTMLElement>('.lp-section-lede');
      const detail = section.querySelector<HTMLElement>('.lp-section-detail-col');
      const chars = title ? Array.from(title.querySelectorAll<HTMLElement>('.lp-char')) : [];

      if (reduced) {
        gsap.set([eyebrow, lede, detail].filter(Boolean), { opacity: 1, y: 0 });
        if (chars.length) gsap.set(chars, { y: '0%' });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (eyebrow) {
        tl.to(eyebrow, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
          .from(eyebrow, { y: 10, duration: 0.5, ease: 'power2.out' }, 0);
      }
      if (chars.length) {
        tl.to(chars, { y: '0%', duration: 1.0, stagger: { amount: 0.45, from: 'start' } }, 0.05);
      }
      if (lede) {
        tl.to(lede, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.4)
          .from(lede, { y: 14, duration: 0.55, ease: 'power2.out' }, 0.4);
      }
      if (detail) {
        tl.to(detail, { opacity: 1, duration: 0.65, ease: 'power2.out' }, 0.55)
          .from(detail, { y: 20, duration: 0.65, ease: 'power2.out' }, 0.55);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateSection(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;

      e.preventDefault();
      gsap.to(window, {
        duration: 1.05,
        ease: 'power3.inOut',
        scrollTo: { y: target, offsetY: 0, autoKill: true },
      });
      history.replaceState(null, '', hash);
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="landing-page" data-screen-label="01 Landing">
      <canvas ref={hazeRef} className="lp-haze" aria-hidden="true" />

      <nav className="lp-nav">
        <Link to="/" className="lp-logo">
          <img src="/logoNoBg.png" alt="" className="lp-logo-img" />
          <span>X-Ray Tech</span>
        </Link>
        <div className="lp-nav-links">
          <a href="#contact">Contact</a>
          <a href="#about">About</a>
          <a href="#liability">Liability</a>
        </div>
        <div className="lp-nav-actions">
          <Link to="/login" className="lp-text-link">Log in</Link>
          <Link to="/signup" className="lp-text-link">Create account</Link>
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
            <Link to="/login" className="lp-cta-light">Sign in</Link>
          </div>

          <div ref={visualRef} className="lp-visual">
            <div className="lp-cards-col">
              <div ref={balanceRef} className="lp-balance-card">
                <span className="lp-balance-title">CE points</span>
                <div className="lp-balance-body">
                  <div className="lp-donut">
                    <svg className="lp-donut-svg" viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ink-200)" strokeWidth="14" />
                      <g transform="rotate(-90 50 50)">
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="var(--brand-600)" strokeWidth="14"
                          strokeDasharray="104.72 251.33" strokeDashoffset="0"
                        />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke="var(--brand-300)" strokeWidth="14"
                          strokeDasharray="104.72 251.33" strokeDashoffset="-104.72"
                        />
                      </g>
                    </svg>
                    <span className="lp-donut-label">40 / 48</span>
                  </div>
                  <div className="lp-legend">
                    <div className="lp-legend-row">
                      <span className="lp-legend-dot is-iema" />
                      <span className="lp-legend-name">IEMA</span>
                      <span className="lp-legend-val">20h</span>
                    </div>
                    <div className="lp-legend-row">
                      <span className="lp-legend-dot is-arrt" />
                      <span className="lp-legend-name">ARRT</span>
                      <span className="lp-legend-val">20h</span>
                    </div>
                    <div className="lp-legend-total">
                      <span className="lp-legend-total-label">Total</span>
                      <span className="lp-legend-total-val">40/48h</span>
                    </div>
                  </div>
                </div>
              </div>

              <div ref={pillRef} className="lp-iema-card">
                <div className="lp-iema-head">
                  <h3 className="lp-iema-title">Days to ARRT Renewal</h3>
                  <span className="lp-iema-badge">
                    <img src={arrtBlackText} alt="ARRT" className="lp-iema-mark-light" />
                  </span>
                </div>
                <div className="lp-iema-number">
                  <span className="lp-iema-num">87</span>
                  <span className="lp-iema-unit">days</span>
                </div>
                <span className="lp-iema-meta">Renews Aug 13, 2026</span>
              </div>
            </div>

            <div ref={photoRef} className="lp-photo">
              <img src={michelle} alt="X-Ray Tech dashboard preview" />
            </div>
          </div>
        </section>

        <section id="contact" className="lp-section">
          <div className="lp-section-grid">
            <div className="lp-section-lead-col">
              <span className="lp-eyebrow">01 · Contact</span>
              <h2 className="lp-section-title">Get in <span className="lp-accent">touch.</span></h2>
              <p className="lp-section-lede">
                Questions, feedback, or partnership inquiries.
              </p>
            </div>
            <div className="lp-section-detail-col">
              <span className="lp-eyebrow lp-eyebrow--inline">Developers</span>
              <dl className="lp-detail-list">
                {DEVELOPERS.map(({ name, user }) => {
                  const email = buildEmail(user);
                  return (
                    <div key={user} className="lp-detail-row">
                      <dt>{name}</dt>
                      <dd>
                        <a className="lp-section-link" href={`mailto:${email}`}>
                          {email}
                        </a>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </section>

        <section id="about" className="lp-section">
          <div className="lp-section-grid lp-section-grid--reverse">
            <div className="lp-section-lead-col">
              <span className="lp-eyebrow">02 · About</span>
              <h2 className="lp-section-title">
                Built for radiologic <span className="lp-accent">technologists.</span>
              </h2>
              <p className="lp-section-lede">
                X-Ray Tech is a Northwestern CS394 project that pulls every CE credit, license,
                and renewal deadline into one live screen. Stop juggling spreadsheets and
                state-board portals.
              </p>
            </div>
            <div className="lp-section-detail-col">
              <div className="lp-section-image">
                <img src={groupphoto} alt="The X-Ray Tech team" />
              </div>
            </div>
          </div>
        </section>

        <section id="liability" className="lp-section">
          <div className="lp-section-grid">
            <div className="lp-section-lead-col">
              <span className="lp-eyebrow">03 · Liability</span>
              <h2 className="lp-section-title">
                Your files, <span className="lp-accent">handled with care.</span>
              </h2>
              <p className="lp-section-lede">
                Short and honest about how we treat the data you trust us with.
              </p>
            </div>
            <div className="lp-section-detail-col">
              <div className="lp-promise-block">
                <span className="lp-eyebrow lp-eyebrow--inline">What we promise today</span>
                <ul className="lp-section-list">
                  <li>OCR runs locally in your browser before files reach Firebase Storage.</li>
                  <li>EXIF metadata (GPS, camera serials, timestamps) is stripped before storage.</li>
                  <li>Each file is locked to your account, other users can't read it through the app.</li>
                  <li>Scan-tron tests are stored as text only, never uploaded as files.</li>
                </ul>
              </div>
              <div className="lp-promise-block">
                <span className="lp-eyebrow lp-eyebrow--inline lp-eyebrow--warn">Do not upload</span>
                <ul className="lp-section-list">
                  <li>Patient records, PHI, or any HIPAA-regulated data</li>
                  <li>Identification documents (passports, driver's licenses, SSNs)</li>
                  <li>Financial documents, insurance cards, or anything with account numbers</li>
                  <li>Anything you do not personally have the right to upload</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <Link to="/" className="lp-footer-brand">
            <img src="/logoNoBg.png" alt="" className="lp-logo-img" />
            <span>X-Ray Tech</span>
          </Link>
          <ul>
            <li><a className="lp-flink" href="#contact">Contact</a></li>
            <li><a className="lp-flink" href="#about">About</a></li>
            <li><a className="lp-flink" href="#liability">Liability</a></li>
            <li><Link className="lp-flink" to="/signup">Create account</Link></li>
            <li><Link className="lp-flink" to="/login">Log in</Link></li>
          </ul>
          <span className="lp-footer-copy">Northwestern University · CS394 Project · 2026</span>
        </div>
      </footer>
    </div>
  );
}
