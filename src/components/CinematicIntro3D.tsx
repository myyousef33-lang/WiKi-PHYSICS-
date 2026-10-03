import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CinematicIntroProps {
  onFinish: () => void;
}

/**
 * ============================================================================
 * WiKi-PHYSICS CINEMATIC OPENING INTRO CONFIGURATION
 * ============================================================================
 * - To adjust total duration: change INTRO_TOTAL_DURATION_SEC (default: 11.0s)
 * - To adjust when the skip button appears: change SKIP_BUTTON_APPEAR_SEC (default: 2.0s)
 * - To disable intro completely in development: see src/App.tsx (showIntro state)
 */
export const INTRO_TOTAL_DURATION_SEC = 11.0;
export const SKIP_BUTTON_APPEAR_SEC = 2.0;
const REDUCED_MOTION_DURATION_SEC = 2.5;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  targetAlpha: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  color: string;
}

const SUBTLE_EQUATIONS = [
  { text: 'E = mc²', xRatio: 0.18, yRatio: 0.28 },
  { text: 'F = ma', xRatio: 0.82, yRatio: 0.24 },
  { text: 'V = IR', xRatio: 0.16, yRatio: 0.72 },
  { text: 'λ = h / p', xRatio: 0.84, yRatio: 0.68 },
  { text: 'ΔE = h · ν', xRatio: 0.50, yRatio: 0.84 },
  { text: '∇ × B = μ₀ J', xRatio: 0.32, yRatio: 0.18 },
  { text: 'Φ_B = B · A', xRatio: 0.68, yRatio: 0.18 }
];

export const CinematicIntro3D: React.FC<CinematicIntroProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  // Check prefers-reduced-motion
  const [prefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isTransitioningToSite, setIsTransitioningToSite] = useState<boolean>(false);

  const totalDuration = prefersReducedMotion ? REDUCED_MOTION_DURATION_SEC : INTRO_TOTAL_DURATION_SEC;

  // Cleanup & trigger completion
  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    onFinish();
  }, [onFinish]);

  // Immediate skip (0ms delay)
  const handleSkipNow = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Keyboard accessibility: Escape skips immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkipNow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkipNow]);

  // Canvas-based particles, energy fields, and gravitational collapse simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate lightweight quantum particles
    const particleCount = prefersReducedMotion ? 20 : Math.min(65, Math.floor(width / 20));
    const particles: Particle[] = [];
    const colors = ['#38BDF8', '#60A5FA', '#93C5FD', '#F5B301', '#E0F2FE'];

    for (let i = 0; i < particleCount; i++) {
      const orbitRadius = 40 + Math.random() * (Math.min(width, height) * 0.42);
      const orbitAngle = Math.random() * Math.PI * 2;
      particles.push({
        x: width / 2 + Math.cos(orbitAngle) * orbitRadius,
        y: height / 2 + Math.sin(orbitAngle) * orbitRadius,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1 + Math.random() * 2,
        alpha: 0,
        targetAlpha: 0.35 + Math.random() * 0.55,
        orbitRadius,
        orbitAngle,
        orbitSpeed: (0.004 + Math.random() * 0.008) * (Math.random() > 0.5 ? 1 : -1),
        color: colors[i % colors.length]
      });
    }

    startTimeRef.current = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedSec(elapsed);

      // Trigger seamless exit at Scene 6
      if (elapsed >= 10.0 && !isTransitioningToSite && !prefersReducedMotion) {
        setIsTransitioningToSite(true);
      }

      if (elapsed >= totalDuration) {
        handleComplete();
        return;
      }

      // Clear with deepest midnight navy background
      ctx.fillStyle = '#02050E';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // =======================================================================
      // SCENE 1 (0:00 -> 0:02): البداية
      // Tiny blue singularity at center awakening gradually
      // =======================================================================
      if (elapsed < 2.0) {
        const p = elapsed / 2.0;
        // Central blue light point growing from 0 to 4px with soft ambient glow
        const glowRadius = p * 60;
        const radialGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(glowRadius, 1));
        radialGlow.addColorStop(0, 'rgba(56, 189, 248, ' + (0.9 * p) + ')');
        radialGlow.addColorStop(0.3, 'rgba(30, 79, 216, ' + (0.45 * p) + ')');
        radialGlow.addColorStop(1, 'rgba(2, 5, 14, 0)');
        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(glowRadius, 1), 0, Math.PI * 2);
        ctx.fill();

        // Core white-blue spark
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, 1.2 + p * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // =======================================================================
      // SCENE 2 (0:02 -> 0:04): ولادة عالم الفيزياء
      // Particles drifting, fine field lines and orbits, subtle background equations
      // =======================================================================
      if (elapsed >= 2.0 && elapsed < 4.2) {
        const sceneP = (elapsed - 2.0) / 2.2;

        // Ambient radial field glow
        const radialGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.45);
        radialGlow.addColorStop(0, 'rgba(30, 79, 216, 0.22)');
        radialGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        radialGlow.addColorStop(1, 'rgba(2, 5, 14, 0)');
        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(width, height) * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Fine luminous orbital & field lines
        ctx.strokeStyle = 'rgba(56, 189, 248, ' + (0.16 * sceneP) + ')';
        ctx.lineWidth = 1;

        // 3 elegant orbital ellipses
        for (let i = 0; i < 3; i++) {
          const rx = 120 + i * 55;
          const ry = 45 + i * 22;
          const rot = (i * Math.PI) / 3 + elapsed * 0.15;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Update and draw particles orbiting smoothly
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          pt.orbitAngle += pt.orbitSpeed;
          pt.x = cx + Math.cos(pt.orbitAngle) * pt.orbitRadius;
          pt.y = cy + Math.sin(pt.orbitAngle) * (pt.orbitRadius * 0.65);
          pt.alpha = Math.min(pt.targetAlpha, pt.alpha + 0.02);

          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.alpha * sceneP;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // =======================================================================
      // SCENE 3 (0:04 -> 0:06): تجمع الطاقة & الفلاش السينمائي
      // Particles and lines gravitate inward toward center -> Energy Core -> Blue Flash
      // =======================================================================
      if (elapsed >= 4.2 && elapsed < 6.0) {
        const sceneP = (elapsed - 4.2) / 1.8;
        const collapseSpeed = Math.pow(sceneP, 2.2);

        // Core pulsation
        const coreRadius = (1 - sceneP * 0.7) * 45 + Math.sin(elapsed * 18) * 8;
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(coreRadius * 2, 2));
        coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        coreGlow.addColorStop(0.2, 'rgba(56, 189, 248, 0.85)');
        coreGlow.addColorStop(0.6, 'rgba(30, 79, 216, 0.45)');
        coreGlow.addColorStop(1, 'rgba(2, 5, 14, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(coreRadius * 2, 2), 0, Math.PI * 2);
        ctx.fill();

        // Inward gravitational pull of particles
        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          const dx = cx - pt.x;
          const dy = cy - pt.y;
          pt.x += dx * (0.04 + collapseSpeed * 0.12);
          pt.y += dy * (0.04 + collapseSpeed * 0.12);

          // Connecting energy streak toward center
          ctx.strokeStyle = pt.color;
          ctx.globalAlpha = (1 - sceneP * 0.4) * 0.35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x - dx * 0.1, pt.y - dy * 0.1);
          ctx.stroke();

          ctx.fillStyle = pt.color;
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // At 5.7s -> 6.0s: Cinematic short electric-blue energy flash
        if (elapsed >= 5.65) {
          const flashP = (elapsed - 5.65) / 0.35;
          const flashAlpha = Math.sin(flashP * Math.PI) * 0.85;

          const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.75);
          flashGrad.addColorStop(0, 'rgba(255, 255, 255, ' + flashAlpha + ')');
          flashGrad.addColorStop(0.25, 'rgba(56, 189, 248, ' + (flashAlpha * 0.9) + ')');
          flashGrad.addColorStop(0.65, 'rgba(30, 79, 216, ' + (flashAlpha * 0.6) + ')');
          flashGrad.addColorStop(1, 'rgba(2, 5, 14, 0)');
          ctx.fillStyle = flashGrad;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // =======================================================================
      // SCENE 4 & 5 (0:06 -> 0:10): ظهور اللوجو & الإحساس التعليمي
      // Logo emerges with 3D depth and blue glow, calm physics wave on horizon
      // =======================================================================
      if (elapsed >= 6.0 && elapsed < 10.0) {
        // Ambient backdrop glow behind logo
        const ambientGlow = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 240);
        ambientGlow.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
        ambientGlow.addColorStop(0.45, 'rgba(30, 79, 216, 0.16)');
        ambientGlow.addColorStop(1, 'rgba(2, 5, 14, 0)');
        ctx.fillStyle = ambientGlow;
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 240, 0, Math.PI * 2);
        ctx.fill();

        // Scene 5: Gentle educational physics wave in background horizon
        if (elapsed >= 8.0) {
          const waveP = Math.min((elapsed - 8.0) / 1.0, 1);
          ctx.strokeStyle = 'rgba(56, 189, 248, ' + (0.18 * waveP) + ')';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const waveY = height * 0.78;
          for (let x = 0; x <= width; x += 8) {
            const y = waveY + Math.sin(x * 0.012 + elapsed * 2.2) * 14;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Subtle secondary golden wavelength
          ctx.strokeStyle = 'rgba(245, 179, 1, ' + (0.12 * waveP) + ')';
          ctx.beginPath();
          for (let x = 0; x <= width; x += 8) {
            const y = waveY + Math.sin(x * 0.018 - elapsed * 1.8) * 10;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Delicate floating quantum sparks around logo
        for (let i = 0; i < Math.min(particles.length, 24); i++) {
          const pt = particles[i];
          pt.orbitAngle += pt.orbitSpeed * 0.7;
          const r = 90 + (i % 6) * 22;
          const px = cx + Math.cos(pt.orbitAngle) * r;
          const py = cy - 20 + Math.sin(pt.orbitAngle) * (r * 0.5);

          ctx.fillStyle = pt.color;
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // =======================================================================
      // SCENE 6 (0:10 -> 0:11.2): الانتقال للموقع
      // Blue light sweeps smoothly toward top right, seamless fade into homepage
      // =======================================================================
      if (elapsed >= 10.0) {
        const exitP = Math.min((elapsed - 10.0) / 1.2, 1);
        // Light moves from center toward top navbar position
        const targetX = width > 768 ? width * 0.85 : width * 0.5;
        const targetY = 40;
        const lightX = cx + (targetX - cx) * exitP;
        const lightY = cy + (targetY - cy) * exitP;

        const exitGlow = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 180 * (1 - exitP * 0.5));
        exitGlow.addColorStop(0, 'rgba(56, 189, 248, ' + (0.35 * (1 - exitP)) + ')');
        exitGlow.addColorStop(1, 'rgba(2, 5, 14, 0)');
        ctx.fillStyle = exitGlow;
        ctx.beginPath();
        ctx.arc(lightX, lightY, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [prefersReducedMotion, totalDuration, isTransitioningToSite, handleComplete]);

  // Stage condition flags for CSS Typography & Logo layers
  // Scene 2 equations: visible between 2.0s and 4.8s
  const showEquations = elapsedSec >= 2.0 && elapsedSec < 4.8;
  // Scene 4 Logo: appears at 6.0s
  const showLogo = elapsedSec >= 5.95;
  // Skip button appears strictly after 2.0s as requested
  const showSkipButton = elapsedSec >= SKIP_BUTTON_APPEAR_SEC && elapsedSec < 10.0;

  // Scene 6 smooth dissolve: 10.0s -> 11.0s
  const isDissolving = elapsedSec >= 10.0;

  return (
    <div
      ref={containerRef}
      dir="rtl"
      role="dialog"
      aria-label="افتتاحية منصة ويكي فيزياء"
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#02050E] select-none transition-all duration-1000 ease-out ${
        isDissolving ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      {/* Background Canvas (Particles, Fields, Energy Flash, Cosmic Atmosphere) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none"
      />

      {/* =====================================================================
          SCENE 2: SUBTLE PHYSICS EQUATIONS LAYER (Floating unobtrusively in background)
         ===================================================================== */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-out ${
          showEquations ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {SUBTLE_EQUATIONS.map((item, index) => {
          // Calculate subtle inward drift toward center as Scene 3 approaches
          const isCollapsing = elapsedSec >= 4.2;
          const collapseOffset = isCollapsing ? (elapsedSec - 4.2) * 45 : 0;
          const driftX = (0.5 - item.xRatio) * collapseOffset;
          const driftY = (0.5 - item.yRatio) * collapseOffset;

          return (
            <div
              key={index}
              dir="ltr"
              className="absolute font-mono font-bold text-xs sm:text-sm tracking-wider text-blue-200/25 blur-[0.3px] transition-transform duration-500 ease-out"
              style={{
                left: `${item.xRatio * 100}%`,
                top: `${item.yRatio * 100}%`,
                transform: `translate3d(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px), 0)`
              }}
            >
              {item.text}
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          SCENE 4 & 5: REAL WIKI-PHYSICS LOGO & TYPOGRAPHY
          (Emerges from energy flash at 6.0s with subtle 3D depth and blue glow)
         ===================================================================== */}
      <div
        className={`
          pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4
          transition-all duration-1000 ease-out
          ${
            showLogo && !isDissolving
              ? 'opacity-100 scale-100 translate-y-0'
              : showLogo && isDissolving
              ? 'opacity-0 scale-95 -translate-y-8'
              : 'opacity-0 scale-90 translate-y-4'
          }
        `}
      >
        <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
          {/* Visual Physics Quantum Badge with Real Project Psi (Ψ) Emblem */}
          <div className="relative group">
            {/* Ambient Radial Blue Glow Halo */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#1E4FD8]/60 via-[#38BDF8]/50 to-[#F5B301]/30 blur-xl opacity-90 transition-opacity" />

            {/* Inner Badge Frame (Real WiKi-PHYSICS Quantum Emblem) */}
            <div className="relative flex h-20 w-20 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-[#091536]/90 border-2 border-[#38BDF8]/60 shadow-[0_0_40px_rgba(56,189,248,0.5)] overflow-hidden shrink-0">
              {/* Spinning Quantum Atomic Orbits SVG (From Project Logo) */}
              <svg
                className="absolute inset-0 h-full w-full opacity-75 animate-[spin_10s_linear_infinite]"
                viewBox="0 0 100 100"
              >
                <ellipse
                  cx="50"
                  cy="50"
                  rx="42"
                  ry="16"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.2"
                  strokeDasharray="4 3"
                  transform="rotate(30 50 50)"
                />
                <ellipse
                  cx="50"
                  cy="50"
                  rx="42"
                  ry="16"
                  fill="none"
                  stroke="#F5B301"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                  transform="rotate(-30 50 50)"
                />
                <ellipse
                  cx="50"
                  cy="50"
                  rx="42"
                  ry="16"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="1.8"
                  transform="rotate(90 50 50)"
                />
              </svg>

              {/* Central Greek Psi Symbol (Ψ) */}
              <div className="relative z-10 flex items-center justify-center font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-[#38BDF8] drop-shadow-[0_2px_12px_rgba(56,189,248,0.8)]">
                <span>Ψ</span>
              </div>

              {/* Quantum Particle Spark */}
              <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#F5B301] shadow-[0_0_10px_#F5B301] animate-pulse" />

              {/* Subtle Metallic Light Sweep across badge */}
              <div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3.5s_infinite]"
                style={{ animationDelay: '0.5s' }}
              />
            </div>
          </div>

          {/* Typography: WiKi-PHYSICS */}
          <div className="flex flex-col items-center space-y-1.5 sm:space-y-2">
            <h1
              dir="ltr"
              className="text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.16em] text-white drop-shadow-[0_4px_30px_rgba(56,189,248,0.5)]"
            >
              WiKi-PHYSICS
            </h1>

            {/* Typography: مع أستاذ أحمد صلاح */}
            <p className="text-base sm:text-xl md:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-blue-200">
              مع أستاذ أحمد صلاح
            </p>

            <span className="text-[11px] sm:text-xs font-semibold text-cyan-300/70 tracking-widest pt-0.5">
              المنصة الأولى لفيزياء الثانوية العامة
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          UX: DISCREET SKIP BUTTON (Appears strictly after 2.0s as requested)
         ===================================================================== */}
      <div
        className={`
          absolute z-30 flex items-center transition-all duration-700 ease-out
          ${
            showSkipButton
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }
        `}
        style={{
          top: 'max(1.25rem, env(safe-area-inset-top))',
          left: 'max(1.25rem, env(safe-area-inset-left))'
        }}
      >
        <button
          type="button"
          onClick={handleSkipNow}
          aria-label="تخطي المقدمة والدخول فوراً للموقع"
          className="group inline-flex items-center gap-1.5 rounded-full bg-[#050D24]/65 hover:bg-[#0A183E]/85 border border-white/10 hover:border-cyan-400/40 px-3.5 py-1.5 text-xs font-medium text-white/65 hover:text-white transition-all duration-200 cursor-pointer shadow-lg focus-visible:outline-2 focus-visible:outline-cyan-400"
          style={{ WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)' }}
        >
          <span>تخطي</span>
          <svg
            className="h-3 w-3 text-cyan-300/70 transition-transform duration-200 group-hover:-translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* =====================================================================
          HAIRLINE BLUE ENERGY PROGRESS LINE AT BOTTOM
         ===================================================================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[2px] bg-white/10">
        <div
          className="h-full origin-right bg-gradient-to-l from-cyan-400 via-[#1E4FD8] to-[#F5B301] transition-transform duration-100 ease-linear"
          style={{
            transform: `scaleX(${Math.min(elapsedSec / totalDuration, 1)})`,
            willChange: 'transform'
          }}
        />
      </div>
    </div>
  );
};
