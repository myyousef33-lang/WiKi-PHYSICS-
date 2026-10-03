import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CinematicIntroProps {
  onFinish: () => void;
}

/**
 * WiKi-PHYSICS — Premium Cinematic Opening
 * Pure Canvas + CSS: no heavy video asset required.
 */
export const INTRO_TOTAL_DURATION_SEC = 11.5;
export const SKIP_BUTTON_APPEAR_SEC = 2.2;

const REDUCED_MOTION_DURATION_SEC = 2.2;

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  phase: number;
};

const EQUATIONS = [
  ['E = mc²', 13, 25, -8],
  ['F = ma', 78, 22, 7],
  ['V = IR', 12, 70, 6],
  ['λ = h / p', 80, 67, -6],
  ['ΔE = hν', 47, 18, 4],
  ['∇ × B = μ₀J', 27, 82, -5],
  ['Φ = B · A', 70, 82, 5]
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = (t: number) => {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const CinematicIntro3D: React.FC<CinematicIntroProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const finishedRef = useRef(false);
  const finishRef = useRef(onFinish);
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  const totalDuration = reducedMotion
    ? REDUCED_MOTION_DURATION_SEC
    : INTRO_TOTAL_DURATION_SEC;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    finishRef.current();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const count = reducedMotion ? 12 : Math.min(92, Math.max(42, Math.floor(width / 15)));
    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
      radius: Math.min(width, height) * (0.13 + Math.random() * 0.47),
      speed: (0.0017 + Math.random() * 0.0038) * (i % 2 ? 1 : -1),
      size: 0.7 + Math.random() * 1.8,
      alpha: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2
    }));

    startRef.current = performance.now();

    const drawGlow = (
      x: number,
      y: number,
      radius: number,
      inner: string,
      outer = 'rgba(2, 6, 18, 0)'
    ) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radius, 1));
      g.addColorStop(0, inner);
      g.addColorStop(1, outer);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(radius, 1), 0, Math.PI * 2);
      ctx.fill();
    };

    const drawOrbit = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      rotation: number,
      alpha: number,
      dash = ''
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.strokeStyle = 'rgba(70, 180, 255, ' + alpha + ')';
      ctx.lineWidth = 0.8;
      if (dash) ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);
    };

    const render = (now: number) => {
      const t = (now - startRef.current) / 1000;
      setElapsed(t);

      if (t >= totalDuration) {
        finish();
        return;
      }

      const cx = width / 2;
      const cy = height / 2;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#020611';
      ctx.fillRect(0, 0, width, height);

      // Deep cinematic vignette.
      const bg = ctx.createRadialGradient(cx, cy * 0.92, 0, cx, cy, Math.max(width, height) * 0.78);
      bg.addColorStop(0, '#0a1834');
      bg.addColorStop(0.42, '#041026');
      bg.addColorStop(1, '#01030a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      if (reducedMotion) {
        drawGlow(cx, cy, 190, 'rgba(56,189,248,0.30)');
      }

      // Scene 1: singularity awakening.
      if (t < 2.15) {
        const p = easeOut(t / 2.15);
        drawGlow(cx, cy, 30 + p * 130, 'rgba(56,189,248,' + (0.28 * p) + ')');
        drawGlow(cx, cy, 3 + p * 12, 'rgba(255,255,255,' + (0.75 * p) + ')');
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.2 + p * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Scene 2: physics field comes alive.
      const fieldStart = 1.55;
      if (t >= fieldStart && t < 6.0) {
        const p = easeOut((t - fieldStart) / 2.2);
        const maxR = Math.min(width, height) * 0.46;

        drawGlow(cx, cy, maxR * 0.75, 'rgba(30,79,216,' + (0.09 * p) + ')');

        for (let i = 0; i < 4; i++) {
          drawOrbit(
            cx,
            cy,
            105 + i * 64,
            36 + i * 23,
            i * 0.58 + t * 0.035 * (i % 2 ? 1 : -1),
            0.12 * p,
            i % 2 === 0 ? 'dash' : ''
          );
        }

        ctx.globalCompositeOperation = 'lighter';
        particles.forEach((pt, i) => {
          const collapse = t >= 4.15 ? easeInOut((t - 4.15) / 1.55) : 0;
          pt.angle += pt.speed;
          const orbitR = pt.radius * (1 - collapse * 0.91);
          const x = cx + Math.cos(pt.angle) * orbitR;
          const y = cy + Math.sin(pt.angle) * orbitR * 0.62;
          const a = pt.alpha * p * (1 - collapse * 0.18);

          ctx.fillStyle = i % 7 === 0
            ? 'rgba(245,179,1,' + a + ')'
            : 'rgba(91,190,255,' + a + ')';
          ctx.beginPath();
          ctx.arc(x, y, pt.size, 0, Math.PI * 2);
          ctx.fill();

          if (collapse > 0.1 && i % 3 === 0) {
            ctx.strokeStyle = 'rgba(56,189,248,' + (0.08 * collapse) + ')';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(cx, cy);
            ctx.stroke();
          }
        });
        ctx.globalCompositeOperation = 'source-over';
      }

      // Equations are rendered as atmospheric typography in the first half.
      if (t >= 2.0 && t < 5.2) {
        const ep = easeInOut((t - 2) / 2.0);
        EQUATIONS.forEach(([text, x, y, rot]) => {
          const collapse = t > 4.1 ? easeInOut((t - 4.1) / 1.1) : 0;
          const dx = (50 - Number(x)) * collapse * 0.55;
          const dy = (50 - Number(y)) * collapse * 0.55;
          ctx.save();
          ctx.translate((Number(x) + dx) * width / 100, (Number(y) + dy) * height / 100);
          ctx.rotate(Number(rot) * Math.PI / 180);
          ctx.font = '600 ' + (Math.max(11, Math.min(17, width * 0.012))) + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(180,225,255,' + (0.16 * ep * (1 - collapse * 0.7)) + ')';
          ctx.fillText(String(text), 0, 0);
          ctx.restore();
        });
      }

      // Scene 3: energy core and flash.
      if (t >= 4.15 && t < 6.65) {
        const p = easeInOut((t - 4.15) / 1.85);
        const r = 74 * (1 - p) + 9;
        drawGlow(cx, cy, r * 4.5, 'rgba(30,79,216,' + (0.18 + p * 0.12) + ')');
        drawGlow(cx, cy, r * 1.8, 'rgba(56,189,248,' + (0.35 + p * 0.28) + ')');

        ctx.strokeStyle = 'rgba(135,225,255,' + (0.22 + p * 0.5) + ')';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          const rr = 32 + i * 24 + Math.sin(t * 5 + i) * 3;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (t >= 5.65 && t < 6.45) {
          const fp = Math.sin(((t - 5.65) / 0.8) * Math.PI);
          ctx.fillStyle = 'rgba(105,205,255,' + (0.34 * fp) + ')';
          ctx.fillRect(0, 0, width, height);
          drawGlow(cx, cy, Math.max(width, height) * (0.2 + fp * 0.65), 'rgba(255,255,255,' + (0.28 * fp) + ')');
        }
      }

      // Scene 4/5: brand reveal and calm wave field.
      if (t >= 6.0 && t < 10.65) {
        const p = easeOut((t - 6) / 0.85);
        drawGlow(cx, cy - 25, 270, 'rgba(56,189,248,' + (0.16 * p) + ')');

        ctx.save();
        ctx.globalAlpha = 0.14 * p;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        const base = height * 0.76;
        for (let x = 0; x <= width; x += 7) {
          const y = base + Math.sin(x * 0.0105 + t * 1.8) * (12 + 5 * Math.sin(t)) + Math.sin(x * 0.023 - t) * 5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 20; i++) {
          const a = t * (0.24 + (i % 4) * 0.025) + i * 1.8;
          const rr = 115 + (i % 5) * 27;
          const x = cx + Math.cos(a) * rr;
          const y = cy - 20 + Math.sin(a * 1.18) * rr * 0.42;
          ctx.fillStyle = i % 6 === 0
            ? 'rgba(245,179,1,0.52)'
            : 'rgba(90,200,255,0.52)';
          ctx.beginPath();
          ctx.arc(x, y, 0.9 + (i % 3) * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // Scene 6: luminous handoff to the actual site.
      if (t >= 10.0) {
        const p = easeInOut((t - 10) / 1.5);
        const targetX = width > 700 ? width * 0.86 : width * 0.5;
        const targetY = width > 700 ? 42 : 28;
        const x = cx + (targetX - cx) * p;
        const y = cy + (targetY - cy) * p;
        drawGlow(x, y, 160 * (1 - p * 0.45), 'rgba(56,189,248,' + (0.25 * (1 - p)) + ')');

        const sweep = width * (p * 1.25 - 0.25);
        const grad = ctx.createLinearGradient(sweep - 260, 0, sweep + 260, 0);
        grad.addColorStop(0, 'rgba(56,189,248,0)');
        grad.addColorStop(0.5, 'rgba(120,220,255,' + (0.08 * (1 - p)) + ')');
        grad.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [finish, reducedMotion, totalDuration]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finish]);

  const showEquations = elapsed >= 2 && elapsed < 5.25;
  const showBrand = elapsed >= 5.85;
  const exiting = elapsed >= 10.0;
  const showSkip = elapsed >= SKIP_BUTTON_APPEAR_SEC && !exiting;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="افتتاحية منصة ويكي فيزياء"
      className={
        'fixed inset-0 z-[9999] overflow-hidden select-none bg-[#020611] ' +
        'transition-opacity duration-1000 ease-out ' +
        (exiting ? 'opacity-0 pointer-events-none' : 'opacity-100')
      }
      style={{ width: '100vw', height: '100dvh' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      {/* Soft cinematic vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 46%, transparent 0%, rgba(1,3,10,.10) 45%, rgba(0,0,0,.78) 100%)'
        }}
      />

      {/* Atmospheric equations */}
      <div
        aria-hidden="true"
        className={
          'pointer-events-none absolute inset-0 transition-opacity duration-700 ' +
          (showEquations ? 'opacity-100' : 'opacity-0')
        }
      >
        {EQUATIONS.map(([text, left, top, rotation], i) => (
          <span
            key={i}
            className="absolute font-mono text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest text-sky-100/25"
            style={{
              left: left + '%',
              top: top + '%',
              transform: 'translate(-50%, -50%) rotate(' + rotation + 'deg)',
              textShadow: '0 0 18px rgba(56,189,248,.22)'
            }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* Premium brand reveal */}
      <div
        className={
          'absolute inset-0 flex items-center justify-center px-6 transition-all duration-[900ms] ' +
          (showBrand
            ? exiting
              ? 'opacity-0 scale-95 -translate-y-6'
              : 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-90 translate-y-5')
        }
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-7 sm:mb-8">
            <div
              className="absolute -inset-8 rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(56,189,248,.34) 0%, rgba(30,79,216,.18) 42%, transparent 72%)'
              }}
            />

            <div
              className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-[30px] border border-sky-300/40 bg-[#07142d]/90 shadow-[0_0_70px_rgba(56,189,248,.28)] flex items-center justify-center overflow-hidden"
            >
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full animate-[spin_14s_linear_infinite] opacity-80"
                aria-hidden="true"
              >
                <ellipse cx="50" cy="50" rx="43" ry="16" fill="none" stroke="#38BDF8" strokeWidth="1.4" transform="rotate(28 50 50)" />
                <ellipse cx="50" cy="50" rx="43" ry="16" fill="none" stroke="#60A5FA" strokeWidth="1.1" transform="rotate(-28 50 50)" />
                <ellipse cx="50" cy="50" rx="43" ry="16" fill="none" stroke="#F5B301" strokeWidth="1" strokeDasharray="3 4" transform="rotate(90 50 50)" />
                <circle cx="50" cy="50" r="8" fill="rgba(56,189,248,.16)" stroke="#BAE6FD" strokeWidth="1" />
                <circle cx="50" cy="50" r="3.2" fill="#fff" />
              </svg>

              <span
                className="relative z-10 text-5xl sm:text-6xl font-black italic text-white"
                style={{ textShadow: '0 0 25px rgba(56,189,248,.7)' }}
              >
                Ψ
              </span>
            </div>

            <span
              className="absolute -right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-300"
              style={{ boxShadow: '0 0 16px rgba(245,179,1,.9)' }}
            />
          </div>

          <div className="tracking-[-0.04em] leading-none text-4xl sm:text-6xl md:text-7xl font-black text-white">
            <span>WiKi-</span>
            <span
              className="text-sky-300"
              style={{ textShadow: '0 0 34px rgba(56,189,248,.35)' }}
            >
              PHYSICS
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px w-9 sm:w-14 bg-gradient-to-l from-transparent to-sky-300/70" />
            <span className="text-sm sm:text-base md:text-lg font-bold tracking-wide text-slate-200/90">
              مع أستاذ أحمد صلاح
            </span>
            <span className="h-px w-9 sm:w-14 bg-gradient-to-r from-transparent to-sky-300/70" />
          </div>

          <div
            className="mt-3 text-[9px] sm:text-[11px] uppercase tracking-[0.35em] text-sky-200/45"
            dir="ltr"
          >
            PHYSICS • UNDERSTOOD
          </div>
        </div>
      </div>

      {/* Minimal skip control */}
      <div
        className={
          'absolute left-5 bottom-5 sm:left-7 sm:bottom-7 transition-all duration-500 ' +
          (showSkip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none')
        }
      >
        <button
          type="button"
          onClick={finish}
          className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-[11px] font-bold text-white/65 backdrop-blur-md transition hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300/50"
          aria-label="تخطي المقدمة"
        >
          تخطي المقدمة
        </button>
      </div>

      {/* Tiny progress indicator — intentionally subtle */}
      {!reducedMotion && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/5">
          <div
            className="h-full bg-sky-300/70 transition-[width] duration-100"
            style={{ width: Math.min(100, (elapsed / totalDuration) * 100) + '%' }}
          />
        </div>
      )}
    </div>
  );
};
