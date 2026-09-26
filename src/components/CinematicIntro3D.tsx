import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CinematicIntro3DProps {
  onFinish: () => void;
}

interface StarParticle {
  x: number;
  y: number;
  z: number;
  pz: number;
  color: string;
  size: number;
}

const INTRO_DURATION_MS = 10000; // 10 seconds (within 8-12s target)
const REDUCED_MOTION_DURATION_MS = 3200; // Fast, calm transition when Reduce Motion is active

interface StageInfo {
  id: number;
  stepLabel: string;
  chainLabel: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

const STAGES: StageInfo[] = [
  {
    id: 0,
    stepLabel: '01 / 05',
    chainLabel: 'عالم فيزياء ثلاثي الأبعاد ← رحلة تعلم',
    title: 'عالم فيزياء ثلاثي الأبعاد يبدأ رحلة تفوقك',
    subtitle: 'انطلق في مسار تعليمي ذكي يحوّل قوانين الفيزياء العميقة إلى تجربة بصرية تفاعلية',
    accentColor: '#38BDF8',
  },
  {
    id: 1,
    stepLabel: '02 / 05',
    chainLabel: 'فيديوهات ودروس ← بنك أسئلة',
    title: 'فيديوهات ودروس تفاعلية وبنك أسئلة متدرج',
    subtitle: 'محاضرات مصورة بأعلى جودة متصلة بآلاف الأسئلة التدريبية المتدرجة لتثبيت كل فكرة',
    accentColor: '#60A5FA',
  },
  {
    id: 2,
    stepLabel: '03 / 05',
    chainLabel: 'امتحانات تفاعلية ← متابعة مستوى الطالب',
    title: 'امتحانات تفاعلية ومتابعة دقيقة لمستوى الطالب',
    subtitle: 'اختبارات إلكترونية فورية التصحيح مع قياس حي لتطور مستواك وتشخيص نقاط القوة',
    accentColor: '#2DD4BF',
  },
  {
    id: 3,
    stepLabel: '04 / 05',
    chainLabel: 'المذكرات ← الإنجازات',
    title: 'مذكرات احترافية تقودك إلى قمة الإنجازات',
    subtitle: 'ملازم وملخصات منظمة بعناية وأوسمة تفوق تتوّج مجهودك في لوحة شرف الأوائل',
    accentColor: '#F5B301',
  },
  {
    id: 4,
    stepLabel: '05 / 05',
    chainLabel: 'شعار WiKi-PHYSICS ← الصفحة الرئيسية',
    title: 'ويكي فيزياء · WiKi-PHYSICS',
    subtitle: 'أستاذ أحمد صلاح — المنصة الأولى لفيزياء الثانوية العامة',
    accentColor: '#F5B301',
  },
];

export const CinematicIntro3D: React.FC<CinematicIntro3DProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  // Device capability & accessibility detection
  const [prefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isLowEndDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 4;
    const isSmallScreen = window.innerWidth < 768;
    return cores <= 4 || memory <= 3 || (isSmallScreen && cores <= 6);
  });

  const [activeStage, setActiveStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const totalDuration = prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS;

  // Immediate skip handler (zero delay as required)
  const handleSkipImmediate = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onFinish();
  }, [onFinish]);

  // Smooth completion handler when timeline reaches 100%
  const handleNaturalComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);
    window.setTimeout(() => {
      onFinish();
    }, 420);
  }, [onFinish]);

  // Keyboard accessibility: Escape skips immediately
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkipImmediate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkipImmediate]);

  // Subtle 3D mouse parallax on desktop devices
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || isLowEndDevice || window.innerWidth < 1024) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setTilt({ x: -ny * 7, y: nx * 9 });
    },
    [prefersReducedMotion, isLowEndDevice]
  );

  // Master timeline loop + 3D Quantum Field Canvas
  useEffect(() => {
    let rafId = 0;
    startTimeRef.current = performance.now();

    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, isLowEndDevice ? 1.25 : 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Initialize 3D quantum particles
    const particleCount = prefersReducedMotion ? 18 : isLowEndDevice ? 32 : 70;
    const palette = ['#38BDF8', '#60A5FA', '#F5B301', '#93C5FD', '#2DD4BF'];
    const particles: StarParticle[] = Array.from({ length: particleCount }, (_, i) => {
      const z = Math.random() * width + 50;
      return {
        x: (Math.random() - 0.5) * width * 1.6,
        y: (Math.random() - 0.5) * height * 1.6,
        z,
        pz: z,
        color: palette[i % palette.length],
        size: (i % 3 === 0 ? 2.2 : 1.4) * dpr,
      };
    });

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const ratio = Math.min(Math.max(elapsed / totalDuration, 0), 1);
      setProgress(ratio);

      const computedStage = Math.min(Math.floor(ratio * STAGES.length), STAGES.length - 1);
      if (computedStage !== stageRef.current) {
        stageRef.current = computedStage;
        setActiveStage(computedStage);
      }

      // Render 3D Quantum Space on Canvas
      if (ctx && canvas) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w * 0.5;
        const cy = h * 0.44;

        // Deep cosmic physics background gradient
        const bgGrad = ctx.createRadialGradient(cx, cy, w * 0.04, cx, cy, Math.max(w, h) * 0.75);
        bgGrad.addColorStop(0, '#0E214F');
        bgGrad.addColorStop(0.48, '#07122E');
        bgGrad.addColorStop(1, '#030714');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtle 3D perspective wave grid at the bottom horizon
        if (!prefersReducedMotion) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.11)';
          ctx.lineWidth = 1 * dpr;
          const waveOffset = (elapsed * 0.0025) % 1;
          const horizonY = h * 0.68;
          for (let i = 0; i < 5; i++) {
            const p = (i + waveOffset) / 5;
            const yPos = horizonY + Math.pow(p, 1.7) * (h * 0.34);
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(w, yPos);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 3D Starfield / Quantum Photon Warp
        const warpSpeed = prefersReducedMotion ? 0.6 : stageRef.current === 4 ? 14 : 6.5;
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          pt.pz = pt.z;
          pt.z -= warpSpeed;

          if (pt.z <= 10) {
            pt.z = width;
            pt.pz = width;
            pt.x = (Math.random() - 0.5) * width * 1.6;
            pt.y = (Math.random() - 0.5) * height * 1.6;
          }

          const sx = (pt.x / pt.z) * (w * 0.45) + cx;
          const sy = (pt.y / pt.z) * (h * 0.45) + cy;
          const px = (pt.x / pt.pz) * (w * 0.45) + cx;
          const py = (pt.y / pt.pz) * (h * 0.45) + cy;

          if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
            const depthAlpha = Math.min(1, Math.max(0.15, 1 - pt.z / width));
            ctx.strokeStyle = pt.color;
            ctx.globalAlpha = depthAlpha * 0.75;
            ctx.lineWidth = pt.size * (1.2 - pt.z / (width * 1.3));
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            ctx.stroke();

            ctx.fillStyle = pt.color;
            ctx.globalAlpha = depthAlpha;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(1, pt.size * (1 - pt.z / width)), 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      if (ratio < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        handleNaturalComplete();
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [totalDuration, prefersReducedMotion, isLowEndDevice, handleNaturalComplete]);

  const currentStage = STAGES[activeStage] || STAGES[0];
  const remainingSeconds = Math.max(1, Math.ceil(((1 - progress) * totalDuration) / 1000));

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="مقدمة منصة ويكي فيزياء التفاعلية"
      onPointerMove={handlePointerMove}
      className={`fixed inset-0 z-[9999] flex flex-col justify-between overflow-hidden select-none transition-all duration-400 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: '#040918',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Background 3D Quantum Projection Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none"
      />

      {/* Ambient Volumetric Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 h-64 w-64 sm:h-96 sm:w-96 rounded-full opacity-35 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${currentStage.accentColor} 0%, rgba(30,79,216,0.18) 48%, transparent 72%)`,
          filter: isLowEndDevice ? 'none' : 'blur(36px)',
        }}
      />

      {/* Top Bar: Brand Identity + Prominent Skip Intro Button */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-8 pt-1">
        {/* Right side: Subtle Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#102048]/90 border border-[#38BDF8]/40 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <span className="text-lg sm:text-xl font-black text-[#F5B301]">Ψ</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-black tracking-tight">
              <span className="text-white">ويكي</span>
              <span className="text-[#38BDF8]">فيزياء</span>
              <span className="text-[#94A3B8] text-xs font-semibold">· WiKi-PHYSICS</span>
            </div>
            <span className="text-[11px] text-[#94A3B8] hidden xs:inline">
              أستاذ أحمد صلاح · فيزياء الثانوية العامة
            </span>
          </div>
        </div>

        {/* Left side: Immediate Skip Intro Button (Accessible & Mobile-optimized >= 44px height) */}
        <button
          type="button"
          onClick={handleSkipImmediate}
          aria-label="تخطي المقدمة والدخول إلى المنصة فوراً"
          className="group relative flex items-center gap-2 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/25 hover:border-[#F5B301]/70 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B301]"
          style={{ WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)' }}
        >
          <span>تخطي المقدمة</span>
          <span className="text-[#F5B301] text-xs font-mono tabular-nums">
            ({remainingSeconds}ث)
          </span>
          <svg
            className="h-4 w-4 text-[#F5B301] transition-transform duration-150 group-hover:-translate-x-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
            <path d="M9 18V6" />
          </svg>
        </button>
      </header>

      {/* Center 3D Spatial Viewport */}
      <div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 sm:px-8"
        style={{
          perspective: isLowEndDevice ? '800px' : '1200px',
        }}
      >
        {/* 3D Stage Container with GPU-accelerated preserve-3d */}
        <div
          className="relative flex flex-col items-center justify-center w-full max-w-4xl transition-transform duration-200 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            willChange: 'transform',
          }}
        >
          {/* ==============================================================
              3D SPATIAL CONSTRUCTS (Lightweight 3D Geometric Objects, NO Screenshots)
             ============================================================== */}
          <div
            className="relative flex h-56 w-full max-w-md sm:h-72 sm:max-w-xl items-center justify-center mb-4 sm:mb-6"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
            }}
          >
            {/* STAGE 0: عالم فيزياء ثلاثي الأبعاد ← رحلة تعلم (3D Quantum Atom & Learning Trajectory) */}
            {activeStage === 0 && (
              <div
                className="relative flex h-48 w-48 sm:h-64 sm:w-64 items-center justify-center transition-all duration-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Orbital Ring 1 */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#38BDF8]/60 shadow-[0_0_25px_rgba(56,189,248,0.3)]"
                  style={{
                    transform: 'rotateX(68deg) rotateY(18deg) translateZ(0px)',
                    animation: prefersReducedMotion ? 'none' : 'spin 7s linear infinite',
                  }}
                >
                  <span className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#38BDF8] shadow-[0_0_12px_#38BDF8]" />
                </div>

                {/* 3D Orbital Ring 2 */}
                <div
                  className="absolute inset-2 rounded-full border-2 border-[#F5B301]/65 shadow-[0_0_25px_rgba(245,179,1,0.25)]"
                  style={{
                    transform: 'rotateX(-60deg) rotateY(42deg) translateZ(10px)',
                    animation: prefersReducedMotion ? 'none' : 'spin 5.5s linear infinite reverse',
                  }}
                >
                  <span className="absolute -bottom-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#F5B301] shadow-[0_0_14px_#F5B301]" />
                </div>

                {/* 3D Orbital Ring 3 (Learning Path Spiral) */}
                <div
                  className="absolute -inset-3 rounded-full border border-dashed border-[#60A5FA]/50"
                  style={{
                    transform: 'rotateY(62deg) rotateX(22deg) translateZ(-15px)',
                    animation: prefersReducedMotion ? 'none' : 'spin 9s linear infinite',
                  }}
                />

                {/* Central 3D Quantum Nucleus */}
                <div
                  className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1E4FD8] via-[#0F265C] to-[#08122E] border-2 border-[#38BDF8]/80 shadow-[0_0_40px_rgba(56,189,248,0.5)]"
                  style={{ transform: 'translateZ(42px)' }}
                >
                  <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(56,189,248,0.9)]">
                    Ψ
                  </span>
                  <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-[#F5B301] shadow-[0_0_10px_#F5B301]" />
                </div>

                {/* Floating 3D Physics Vectors & Formulas */}
                <div
                  className="absolute -top-3 -right-6 sm:-right-12 font-mono text-xs sm:text-sm font-bold text-[#38BDF8] tracking-wider"
                  style={{ transform: 'translateZ(58px) rotateY(-12deg)' }}
                >
                  E = h·ν
                </div>
                <div
                  className="absolute -bottom-2 -left-6 sm:-left-12 font-mono text-xs sm:text-sm font-bold text-[#F5B301] tracking-wider"
                  style={{ transform: 'translateZ(50px) rotateY(14deg)' }}
                >
                  F = q·v·B
                </div>
                <div
                  className="absolute top-1/2 -left-10 sm:-left-20 -translate-y-1/2 text-xs font-bold text-[#93C5FD]"
                  style={{ transform: 'translateZ(34px)' }}
                >
                  رحلة تعلم 3D ✦
                </div>
              </div>
            )}

            {/* STAGE 1: فيديوهات ودروس ← بنك أسئلة (3D Holographic Video Prism & 3D Question Matrix) */}
            {activeStage === 1 && (
              <div
                className="relative flex w-full items-center justify-center gap-6 sm:gap-14 transition-all duration-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Construct A: Holographic Video Lesson Prism */}
                <div
                  className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(-18deg) rotateX(10deg) translateZ(28px)',
                  }}
                >
                  {/* Back Depth Ring */}
                  <div
                    className="absolute inset-0 rounded-full border border-[#38BDF8]/35"
                    style={{ transform: 'translateZ(-24px) scale(1.08)' }}
                  />
                  {/* Middle Holographic Lens */}
                  <div
                    className="absolute inset-3 rounded-3xl bg-gradient-to-tr from-[#1E4FD8]/40 to-[#38BDF8]/20 border border-[#38BDF8]/70 shadow-[0_0_30px_rgba(56,189,248,0.35)]"
                    style={{ transform: 'rotateZ(12deg) translateZ(8px)' }}
                  />
                  {/* Extruded 3D Play Polyhedron */}
                  <div
                    className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#1E4FD8] text-white shadow-[0_10px_30px_rgba(30,79,216,0.65)]"
                    style={{ transform: 'translateZ(42px)' }}
                  >
                    <svg className="h-8 w-8 sm:h-10 sm:w-10 fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span
                    className="absolute -bottom-6 text-xs sm:text-sm font-extrabold text-[#93C5FD] whitespace-nowrap"
                    style={{ transform: 'translateZ(48px)' }}
                  >
                    فيديوهات ودروس
                  </span>
                </div>

                {/* 3D Synaptic Energy Bridge */}
                <div
                  className="flex flex-col items-center gap-1 text-[#F5B301]"
                  style={{ transform: 'translateZ(35px)' }}
                >
                  <div className="h-0.5 w-8 sm:w-14 bg-gradient-to-l from-[#38BDF8] via-[#F5B301] to-[#60A5FA]" />
                  <span className="text-[11px] font-mono text-[#F5B301]">⚡ تفاعل ذكي</span>
                </div>

                {/* 3D Construct B: 3D Quantum Question Constellation (Question Bank) */}
                <div
                  className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(18deg) rotateX(10deg) translateZ(28px)',
                  }}
                >
                  {/* Rotating 3D Diamond Wireframe */}
                  <div
                    className="absolute inset-4 rounded-2xl border-2 border-[#F5B301]/60 bg-[#F5B301]/10 shadow-[0_0_30px_rgba(245,179,1,0.25)]"
                    style={{
                      transform: 'rotateZ(45deg) translateZ(10px)',
                      animation: prefersReducedMotion ? 'none' : 'spin 10s linear infinite',
                    }}
                  />
                  {/* Central 3D Question Core */}
                  <div
                    className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5B301] to-[#D97706] text-[#08122E] font-black text-3xl sm:text-4xl shadow-[0_10px_28px_rgba(245,179,1,0.45)]"
                    style={{ transform: 'translateZ(44px)' }}
                  >
                    ؟
                  </div>
                  {/* Floating 3D Question Nodes */}
                  <span
                    className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#1E4FD8] border border-[#60A5FA] text-xs font-bold text-white"
                    style={{ transform: 'translateZ(56px)' }}
                  >
                    A+
                  </span>
                  <span
                    className="absolute -bottom-6 text-xs sm:text-sm font-extrabold text-[#FDE68A] whitespace-nowrap"
                    style={{ transform: 'translateZ(48px)' }}
                  >
                    بنك أسئلة متدرج
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 2: امتحانات تفاعلية ← متابعة مستوى الطالب (3D Exam Chrono-Sphere & Live 3D Telemetry Pillars) */}
            {activeStage === 2 && (
              <div
                className="relative flex w-full items-center justify-center gap-8 sm:gap-16 transition-all duration-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Construct A: Interactive Exam Chrono-Ring */}
                <div
                  className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(-16deg) rotateX(14deg) translateZ(26px)',
                  }}
                >
                  <svg
                    className="h-full w-full -rotate-90 drop-shadow-[0_0_18px_rgba(45,212,191,0.45)]"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(45, 212, 191, 0.2)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#2DD4BF"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="251"
                      strokeDashoffset="35"
                    />
                  </svg>
                  <div
                    className="absolute flex flex-col items-center justify-center"
                    style={{ transform: 'translateZ(42px)' }}
                  >
                    <span className="font-mono text-2xl sm:text-3xl font-black text-white tabular-nums">
                      100%
                    </span>
                    <span className="text-[11px] font-bold text-[#2DD4BF]">تصحيح فوري</span>
                  </div>
                  <span
                    className="absolute -bottom-6 text-xs sm:text-sm font-extrabold text-[#5EEAD4] whitespace-nowrap"
                    style={{ transform: 'translateZ(46px)' }}
                  >
                    امتحانات تفاعلية
                  </span>
                </div>

                {/* 3D Construct B: 3D Extruded Student Level Telemetry Pillars */}
                <div
                  className="relative flex h-36 w-36 sm:h-44 sm:w-44 flex-col items-center justify-end pb-4"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(18deg) rotateX(12deg) translateZ(30px)',
                  }}
                >
                  {/* 3D Base Platform Ring */}
                  <div
                    className="absolute bottom-2 h-10 w-32 sm:w-36 rounded-full border border-[#38BDF8]/50 bg-[#1E4FD8]/20"
                    style={{ transform: 'rotateX(72deg) translateZ(-10px)' }}
                  />
                  {/* 4 Extruded 3D Volumetric Mastery Pillars */}
                  <div
                    className="relative flex items-end gap-2.5 sm:gap-3 h-24 sm:h-28 px-2"
                    style={{ transform: 'translateZ(36px)' }}
                  >
                    <div className="w-4 sm:w-5 h-10 rounded-t-md bg-gradient-to-t from-[#1E4FD8] to-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
                    <div className="w-4 sm:w-5 h-14 rounded-t-md bg-gradient-to-t from-[#1E4FD8] to-[#38BDF8] shadow-[0_0_14px_rgba(56,189,248,0.6)]" />
                    <div className="w-4 sm:w-5 h-20 rounded-t-md bg-gradient-to-t from-[#0D9488] to-[#2DD4BF] shadow-[0_0_16px_rgba(45,212,191,0.65)]" />
                    <div className="w-4 sm:w-5 h-24 sm:h-28 rounded-t-md bg-gradient-to-t from-[#D97706] to-[#F5B301] shadow-[0_0_20px_rgba(245,179,1,0.75)]" />
                  </div>
                  <span
                    className="absolute -bottom-6 text-xs sm:text-sm font-extrabold text-[#FDE68A] whitespace-nowrap"
                    style={{ transform: 'translateZ(46px)' }}
                  >
                    متابعة مستوى الطالب
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 3: المذكرات ← الإنجازات (3D Holographic Open Tome & 3D Golden Achievement Star) */}
            {activeStage === 3 && (
              <div
                className="relative flex w-full items-center justify-center gap-8 sm:gap-16 transition-all duration-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Construct A: 3D Unfolding Holographic Physics Manuscript (المذكرات) */}
                <div
                  className="relative flex h-36 w-40 sm:h-44 sm:w-48 items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateX(18deg) rotateY(-12deg) translateZ(26px)',
                  }}
                >
                  {/* Right Wing Page in 3D */}
                  <div
                    className="h-24 w-16 sm:h-28 sm:w-20 rounded-r-xl bg-gradient-to-bl from-[#38BDF8]/35 to-[#1E4FD8]/25 border border-[#38BDF8]/70 p-2 flex flex-col justify-center gap-2 shadow-[0_0_25px_rgba(56,189,248,0.3)]"
                    style={{ transform: 'rotateY(-26deg) translateZ(18px)' }}
                  >
                    <div className="h-1.5 w-full rounded bg-[#38BDF8]/80" />
                    <div className="h-1.5 w-3/4 rounded bg-white/60" />
                    <div className="h-1.5 w-5/6 rounded bg-[#F5B301]/80" />
                  </div>
                  {/* Center Glowing Spine */}
                  <div
                    className="h-26 sm:h-30 w-1.5 rounded-full bg-[#F5B301] shadow-[0_0_15px_#F5B301]"
                    style={{ transform: 'translateZ(26px)' }}
                  />
                  {/* Left Wing Page in 3D */}
                  <div
                    className="h-24 w-16 sm:h-28 sm:w-20 rounded-l-xl bg-gradient-to-br from-[#38BDF8]/35 to-[#1E4FD8]/25 border border-[#38BDF8]/70 p-2 flex flex-col justify-center gap-2 shadow-[0_0_25px_rgba(56,189,248,0.3)]"
                    style={{ transform: 'rotateY(26deg) translateZ(18px)' }}
                  >
                    <div className="h-1.5 w-4/5 rounded bg-white/70" />
                    <div className="h-1.5 w-full rounded bg-[#38BDF8]/80" />
                    <div className="h-1.5 w-2/3 rounded bg-white/50" />
                  </div>
                  <span
                    className="absolute -bottom-6 text-xs sm:text-sm font-extrabold text-[#93C5FD] whitespace-nowrap"
                    style={{ transform: 'translateZ(48px)' }}
                  >
                    المذكرات والملازم
                  </span>
                </div>

                {/* 3D Construct B: 3D Golden Achievement Trophy Star (الإنجازات) */}
                <div
                  className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(16deg) rotateX(10deg) translateZ(34px)',
                  }}
                >
                  {/* Golden Orbital Crown Ring */}
                  <div
                    className="absolute inset-2 rounded-full border-2 border-[#F5B301]/70 shadow-[0_0_35px_rgba(245,179,1,0.4)]"
                    style={{
                      transform: 'rotateX(65deg) translateZ(12px)',
                      animation: prefersReducedMotion ? 'none' : 'spin 6s linear infinite',
                    }}
                  />
                  {/* 3D Faceted Star Badge */}
                  <div
                    className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FDE047] via-[#F5B301] to-[#B45309] text-[#08122E] shadow-[0_12px_35px_rgba(245,179,1,0.55)]"
                    style={{ transform: 'translateZ(48px)' }}
                  >
                    <svg className="h-11 w-11 sm:h-13 sm:w-13 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span
                    className="absolute -bottom-6 text-xs sm:text-sm font-extrabold text-[#FDE68A] whitespace-nowrap"
                    style={{ transform: 'translateZ(50px)' }}
                  >
                    الإنجازات والأوائل
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 4: شعار WiKi-PHYSICS ← الانتقال إلى الصفحة الرئيسية (3D Brand Emblem Finale) */}
            {activeStage === 4 && (
              <div
                className="relative flex h-52 w-52 sm:h-64 sm:w-64 items-center justify-center transition-all duration-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Converging Triple 3D Atomic Rings */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#38BDF8]/75 shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                  style={{
                    transform: 'rotateX(64deg) rotateY(28deg)',
                    animation: prefersReducedMotion ? 'none' : 'spin 5s linear infinite',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#F5B301]/75 shadow-[0_0_30px_rgba(245,179,1,0.4)]"
                  style={{
                    transform: 'rotateX(-64deg) rotateY(28deg)',
                    animation: prefersReducedMotion ? 'none' : 'spin 5s linear infinite reverse',
                  }}
                />
                <div
                  className="absolute inset-4 rounded-full border border-[#60A5FA]/60"
                  style={{
                    transform: 'rotateY(72deg)',
                    animation: prefersReducedMotion ? 'none' : 'spin 7s linear infinite',
                  }}
                />

                {/* Central 3D WiKi-PHYSICS Quantum Emblem */}
                <div
                  className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-b from-[#162858] to-[#0A1432] border-2 border-[#F5B301] shadow-[0_0_50px_rgba(245,179,1,0.5)]"
                  style={{ transform: 'translateZ(60px)' }}
                >
                  <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#93C5FD] to-[#F5B301]">
                    Ψ
                  </span>
                  <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-[#F5B301] shadow-[0_0_12px_#F5B301]" />
                </div>
              </div>
            )}
          </div>

          {/* ==============================================================
              3D FLOATING STAGE TYPOGRAPHY (Clean, Unboxed, High Contrast)
             ============================================================== */}
          <div
            className="text-center max-w-2xl px-2 space-y-2 sm:space-y-3"
            style={{ transform: 'translateZ(36px)' }}
          >
            {/* Quiet Editorial Stage Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#93C5FD] tracking-wide">
              <span className="font-mono text-[#F5B301] tabular-nums">{currentStage.stepLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{currentStage.chainLabel}</span>
            </div>

            {/* Primary Stage Headline */}
            <h2
              className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {currentStage.title}
            </h2>

            {/* Stage Subtitle */}
            <p className="text-xs sm:text-base font-medium text-[#CBD5E1] max-w-xl mx-auto leading-relaxed">
              {currentStage.subtitle}
            </p>

            {/* Immediate Entry CTA on Final Stage */}
            {activeStage === 4 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSkipImmediate}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F5B301] hover:bg-[#fbbf24] text-[#08122E] font-black text-xs sm:text-sm px-6 py-2.5 shadow-[0_0_25px_rgba(245,179,1,0.5)] transition-transform duration-150 active:scale-95 cursor-pointer"
                >
                  <span>ابدأ رحلتك الآن</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timeline & Journey Milestones */}
      <footer className="relative z-20 mx-auto w-full max-w-4xl px-4 sm:px-8 pb-2">
        {/* Interactive Stage Labels */}
        <div className="mb-2.5 grid grid-cols-5 gap-1.5 sm:gap-3 text-center">
          {[
            'عالم الفيزياء 3D',
            'الدروس والأسئلة',
            'الامتحانات والمستوى',
            'المذكرات والإنجازات',
            'ويكي فيزياء',
          ].map((label, idx) => {
            const isCurrent = idx === activeStage;
            const isDone = idx < activeStage;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  startTimeRef.current = performance.now() - (idx / STAGES.length) * totalDuration;
                  stageRef.current = idx;
                  setActiveStage(idx);
                }}
                className={`text-[10px] sm:text-xs font-bold transition-colors duration-200 truncate py-1 cursor-pointer ${
                  isCurrent
                    ? 'text-[#F5B301]'
                    : isDone
                    ? 'text-[#93C5FD]'
                    : 'text-white/45 hover:text-white/75'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* GPU-Accelerated Progress Track */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full w-full origin-right rounded-full bg-gradient-to-l from-[#38BDF8] via-[#60A5FA] to-[#F5B301] transition-transform duration-75 ease-linear"
            style={{
              transform: `scaleX(${Math.max(0.02, progress)})`,
              willChange: 'transform',
            }}
          />
        </div>
      </footer>
    </div>
  );
};
