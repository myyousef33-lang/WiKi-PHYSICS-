import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CinematicIntroProps {
  onFinish: () => void;
}

/**
 * WiKi-PHYSICS — Premium Cinematic Opening
 * Pure Canvas + CSS: no heavy video asset required.
 */
export const INTRO_TOTAL_DURATION_SEC = 14.2;
export const SKIP_BUTTON_APPEAR_SEC = 2.6;

const REDUCED_MOTION_DURATION_SEC = 2.6;

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

    const count = reducedMotion ? 18 : Math.min(150, Math.max(70, Math.floor(width / 9)));
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
      const fieldStart = 1.25;
      if (t >= fieldStart && t < 7.0) {
        const p = easeOut((t - fieldStart) / 2.2);
        const maxR = Math.min(width, height) * 0.58;

        drawGlow(cx, cy, maxR * 0.75, 'rgba(30,79,216,' + (0.09 * p) + ')');

        for (let i = 0; i < 6; i++) {
          drawOrbit(
            cx,
            cy,
            135 + i * 78,
            46 + i * 30,
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
      if (t >= 6.5 && t < 12.3) {
        const p = easeOut((t - 6.5) / 1.05);
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
      if (t >= 12.7) {
        const p = easeInOut((t - 12.7) / 1.5);
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
  const showBrand = elapsed >= 6.15;
  const exiting = elapsed >= 12.7;
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

      {/* ================================================================ */}
      {/* PREMIUM CINEMATIC STORY LAYERS                                  */}
      {/* ================================================================ */}
      <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 pointer-events-none">

        {/* Scene 1 — Opening statement */}
        <div
          className={
            'absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-1000 ' +
            (elapsed < 2.5 ? 'opacity-100 scale-100' : 'opacity-0 scale-105')
          }
        >
          <div className="mb-5 text-[10px] sm:text-xs font-bold tracking-[0.45em] text-sky-300/60" dir="ltr">
            WELCOME TO A NEW PHYSICS EXPERIENCE
          </div>
          <div className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
            الفيزياء بشكل مختلف
          </div>
          <div className="mt-3 text-sm sm:text-lg text-slate-300/70">
            من الفهم إلى الإتقان
          </div>
        </div>

        {/* Scene 2 — Equations + physics universe */}
        <div
          className={
            'absolute inset-0 flex items-center justify-center transition-all duration-1000 ' +
            (elapsed >= 2.1 && elapsed < 5.1 ? 'opacity-100' : 'opacity-0')
          }
        >
          <div className="relative w-[min(900px,90vw)] h-[min(500px,62vh)]">
            <div className="absolute inset-0 rounded-[36px] border border-sky-300/10 bg-sky-400/[0.025] backdrop-blur-[1px]" />
            <div className="absolute left-[7%] top-[12%] font-mono text-sky-200/65 text-sm sm:text-base md:text-lg rotate-[-7deg]">E = mc²</div>
            <div className="absolute right-[8%] top-[20%] font-mono text-sky-200/55 text-sm sm:text-base md:text-lg rotate-[6deg]">F = ma</div>
            <div className="absolute left-[13%] bottom-[20%] font-mono text-sky-200/50 text-xs sm:text-base rotate-[5deg]">V = IR</div>
            <div className="absolute right-[12%] bottom-[16%] font-mono text-sky-200/55 text-xs sm:text-base rotate-[-6deg]">λ = h / p</div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-white">
                قوانين... <span className="text-sky-300">تفهمها</span>
              </div>
              <div className="mt-3 text-xs sm:text-base text-slate-300/65">
                مش مجرد معادلات تحفظها
              </div>
            </div>
          </div>
        </div>

        {/* Scene 3 — Energy core */}
        <div
          className={
            'absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ' +
            (elapsed >= 4.6 && elapsed < 6.7 ? 'opacity-100' : 'opacity-0')
          }
        >
          <div className="relative h-44 w-44 sm:h-60 sm:w-60">
            <div className="absolute inset-0 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="absolute inset-[14%] rounded-full border border-sky-300/30 animate-[spin_7s_linear_infinite]" />
            <div className="absolute inset-[25%] rounded-full border border-sky-200/25 animate-[spin_5s_linear_infinite_reverse]" />
            <div className="absolute inset-[37%] rounded-full bg-sky-300/10 border border-sky-200/40 shadow-[0_0_70px_rgba(56,189,248,.45)]" />
            <div className="absolute inset-0 flex items-center justify-center text-4xl sm:text-6xl font-black text-white">Ψ</div>
          </div>
          <div className="mt-7 text-lg sm:text-2xl font-bold text-white">
            هنا تبدأ الرحلة
          </div>
        </div>

        {/* Scene 4 — Platform identity / product reveal */}
        <div
          className={
            'absolute inset-0 flex items-center justify-center transition-all duration-1000 ' +
            (elapsed >= 6.2 && elapsed < 9.7 ? 'opacity-100' : 'opacity-0')
          }
        >
          <div className="w-[min(1040px,92vw)] flex flex-col items-center">
            <div className="relative w-full max-w-[820px] h-[190px] sm:h-[280px] md:h-[330px] rounded-[22px] sm:rounded-[32px] border border-sky-200/15 bg-[#061127]/80 shadow-[0_25px_100px_rgba(0,0,0,.45)] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,.18),transparent_55%)]" />
              <div className="absolute top-0 left-0 right-0 h-9 sm:h-11 border-b border-white/10 bg-white/[0.025] flex items-center px-4 gap-2">
                <span className="h-2 w-2 rounded-full bg-white/20" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/10" />
                <span className="mx-auto text-[8px] sm:text-[10px] tracking-[0.28em] text-sky-200/40" dir="ltr">
                  WIKIPHYSICS
                </span>
              </div>
              <div className="absolute top-16 left-5 right-5 sm:top-20 sm:left-10 sm:right-10 grid grid-cols-3 gap-3 sm:gap-5">
                <div className="col-span-2 h-20 sm:h-32 rounded-2xl border border-sky-300/10 bg-sky-300/[0.045] p-3 sm:p-5">
                  <div className="h-2 w-24 sm:w-40 rounded bg-sky-300/20" />
                  <div className="mt-4 h-2 w-32 sm:w-56 rounded bg-white/10" />
                  <div className="mt-3 h-2 w-20 sm:w-36 rounded bg-white/5" />
                  <div className="mt-5 h-1.5 w-full rounded bg-gradient-to-r from-sky-300/60 via-sky-300/20 to-transparent" />
                </div>
                <div className="h-20 sm:h-32 rounded-2xl border border-amber-200/10 bg-amber-200/[0.035] p-3 sm:p-5">
                  <div className="text-[9px] sm:text-xs text-slate-300/60">تقدمك اليوم</div>
                  <div className="mt-3 text-lg sm:text-3xl font-black text-white">+82%</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-sky-300/60" /></div>
                </div>
              </div>
              <div className="absolute bottom-4 left-5 right-5 sm:left-10 sm:right-10 flex gap-2 sm:gap-3">
                <span className="h-1.5 flex-1 rounded bg-sky-300/30" />
                <span className="h-1.5 flex-1 rounded bg-white/10" />
                <span className="h-1.5 flex-1 rounded bg-white/10" />
                <span className="h-1.5 flex-1 rounded bg-white/10" />
              </div>
            </div>
            <div className="mt-6 text-xl sm:text-3xl md:text-4xl font-black text-white">
              منصة واحدة لكل رحلتك في الفيزياء
            </div>
            <div className="mt-2 text-xs sm:text-base text-slate-300/65">
              شرح • تدريبات • امتحانات • متابعة مستواك
            </div>
          </div>
        </div>

        {/* Scene 5 — Logo + teacher */}
        <div
          className={
            'absolute inset-0 flex items-center justify-center transition-all duration-1000 ' +
            (elapsed >= 8.9 && elapsed < 12.5 ? 'opacity-100 scale-100' : 'opacity-0 scale-90')
          }
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-7 sm:mb-9">
              <div className="absolute -inset-12 rounded-full blur-3xl bg-sky-400/20" />
              <div className="relative h-36 w-36 sm:h-48 sm:w-48 md:h-56 md:w-56 rounded-[38px] sm:rounded-[48px] border border-sky-300/35 bg-[#07142d]/90 shadow-[0_0_90px_rgba(56,189,248,.25)] flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_12s_linear_infinite]" aria-hidden="true">
                  <ellipse cx="50" cy="50" rx="43" ry="16" fill="none" stroke="#38BDF8" strokeWidth="1.4" transform="rotate(28 50 50)" />
                  <ellipse cx="50" cy="50" rx="43" ry="16" fill="none" stroke="#60A5FA" strokeWidth="1.1" transform="rotate(-28 50 50)" />
                  <ellipse cx="50" cy="50" rx="43" ry="16" fill="none" stroke="#F5B301" strokeWidth="1" strokeDasharray="3 4" transform="rotate(90 50 50)" />
                  <circle cx="50" cy="50" r="8" fill="rgba(56,189,248,.16)" stroke="#BAE6FD" strokeWidth="1" />
                  <circle cx="50" cy="50" r="3.2" fill="#fff" />
                </svg>
                <span className="relative z-10 text-8xl sm:text-9xl md:text-[9rem] font-black italic text-white leading-none" style={{textShadow:'0 0 30px rgba(56,189,248,.75)'}}>Ψ</span>
              </div>
              <span className="absolute right-1 top-1 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-amber-300" style={{boxShadow:'0 0 20px rgba(245,179,1,.95)'}} />
            </div>

            <div className="tracking-[-0.055em] leading-none text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white">
              <span>WiKi-</span><span className="text-sky-300" style={{textShadow:'0 0 38px rgba(56,189,248,.4)'}}>PHYSICS</span>
            </div>

            <div className="mt-7 sm:mt-9 flex items-center gap-4">
              <span className="h-px w-10 sm:w-20 bg-gradient-to-l from-transparent to-sky-300/70" />
              <span className="text-base sm:text-xl md:text-2xl font-bold text-slate-100">مع أستاذ أحمد صلاح</span>
              <span className="h-px w-10 sm:w-20 bg-gradient-to-r from-transparent to-sky-300/70" />
            </div>

            <div className="mt-4 text-[10px] sm:text-xs uppercase tracking-[0.45em] text-sky-200/55" dir="ltr">
              PHYSICS • UNDERSTOOD • MASTERED
            </div>
          </div>
        </div>

        {/* Scene 6 — Final promise before handoff */}
        <div
          className={
            'absolute bottom-[12%] sm:bottom-[10%] text-center transition-all duration-700 ' +
            (elapsed >= 10.5 && elapsed < 12.6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3')
          }
        >
          <div className="text-sm sm:text-lg font-semibold text-slate-200/80">
            ابدأ... افهم... واتقن الفيزياء
          </div>
          <div className="mt-2 text-[9px] sm:text-[11px] tracking-[0.3em] text-sky-200/40" dir="ltr">
            YOUR JOURNEY STARTS HERE
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
