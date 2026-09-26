import React, { useEffect, useRef, useState, useCallback } from 'react';

interface CinematicIntro3DProps {
  onFinish: () => void;
}

const TOTAL_INTRO_DURATION_MS = 18500; // 18.5 seconds (within 15-20s target)
const REDUCED_MOTION_DURATION_MS = 3500;

export const CinematicIntro3D: React.FC<CinematicIntro3DProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef<boolean>(false);

  const [prefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  // Master timeline state in seconds (0.0 -> 18.5)
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [videoReady, setVideoReady] = useState<boolean>(false);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [isDissolvingOut, setIsDissolvingOut] = useState<boolean>(false);

  const totalDurationMs = prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : TOTAL_INTRO_DURATION_MS;

  // Immediate skip when user clicks "تخطي المقدمة" or presses Escape
  const handleSkipNow = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Ignore pause errors
      }
    }
    onFinish();
  }, [onFinish]);

  // Smooth cinematic dissolve into homepage when the film concludes
  const handleFilmEnded = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsDissolvingOut(true);
    window.setTimeout(() => {
      onFinish();
    }, 800);
  }, [onFinish]);

  // Escape key skips immediately
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkipNow();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkipNow]);

  // Synchronized master clock
  useEffect(() => {
    let rafId = 0;
    const startPerf = performance.now();

    const vid = videoRef.current;
    if (vid && !prefersReducedMotion) {
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setVideoFailed(true);
        });
      }
    }

    const updateClock = (now: number) => {
      const wallElapsedMs = now - startPerf;

      if (prefersReducedMotion) {
        const mappedSec = 16.0 + Math.min(wallElapsedMs / totalDurationMs, 1) * 2.5;
        setElapsedSec(mappedSec);
        if (wallElapsedMs >= totalDurationMs) {
          handleFilmEnded();
          return;
        }
        rafId = window.requestAnimationFrame(updateClock);
        return;
      }

      let currentSec = wallElapsedMs / 1000;
      if (vid && !vid.paused && !vid.ended && vid.currentTime > 0.1 && !videoFailed) {
        currentSec = vid.currentTime;
      }

      setElapsedSec(Math.min(currentSec, 18.5));

      if (wallElapsedMs >= TOTAL_INTRO_DURATION_MS) {
        handleFilmEnded();
      } else {
        rafId = window.requestAnimationFrame(updateClock);
      }
    };

    rafId = window.requestAnimationFrame(updateClock);
    return () => window.cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, totalDurationMs, videoFailed, handleFilmEnded]);

  // =========================================================================
  // 5-SCENE CINEMATIC TIMELINE (0.0s -> 18.5s)
  // =========================================================================
  // Scene 1: 0.0s - 3.6s (بداية هادئة — Dark 3D physics world, slow camera, natural equations)
  // Scene 2: 3.6s - 7.8s (اكتشاف الفيزياء — "الفيزياء مش حفظ..." -> "دي فهم... وتفكير... وتطبيق.")
  // Scene 3: 7.8s - 13.2s (دخول عالم المنصة — 5 sequential in-scene elements, one at a time)
  // Scene 4: 13.2s - 16.0s (رحلة الطالب — "اتعلم." -> "طبّق." -> "طوّر مستواك.")
  // Scene 5: 16.0s - 18.5s (النهاية — "WiKi-PHYSICS" -> "رحلتك في الفيزياء تبدأ من هنا.")
  const sceneIndex =
    elapsedSec < 3.6
      ? 1
      : elapsedSec < 7.8
      ? 2
      : elapsedSec < 13.2
      ? 3
      : elapsedSec < 16.0
      ? 4
      : 5;

  // Scene 2 sub-beats (slow, calm transitions)
  const scene2ShowFirst = elapsedSec >= 3.9;
  const scene2ShowSecond = elapsedSec >= 5.7;

  // Scene 3 sequential 5 elements (never shown all at once; each appears as part of the 3D scene):
  // 1 (7.8s - 8.88s): درس فيديو
  // 2 (8.88s - 9.96s): سؤال تفاعلي
  // 3 (9.96s - 11.04s): امتحان إلكتروني
  // 4 (11.04s - 12.12s): نتيجة الطالب
  // 5 (12.12s - 13.2s): متابعة مستوى الطالب
  const scene3Step =
    elapsedSec < 8.88
      ? 1
      : elapsedSec < 9.96
      ? 2
      : elapsedSec < 11.04
      ? 3
      : elapsedSec < 12.12
      ? 4
      : 5;

  // Scene 4 sequential words ("اتعلم." -> "طبّق." -> "طوّر مستواك.")
  const scene4Step = elapsedSec < 14.1 ? 1 : elapsedSec < 15.0 ? 2 : 3;

  // Scene 5 sequential reveal ("WiKi-PHYSICS" -> "رحلتك في الفيزياء تبدأ من هنا.")
  const scene5ShowSubtitle = elapsedSec >= 16.8;

  const progressRatio = Math.min(Math.max(elapsedSec / 18.5, 0), 1);

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="المقدمة السينمائية لمنصة ويكي فيزياء"
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#02050E] select-none transition-opacity duration-700 ease-out ${
        isDissolvingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* =====================================================================
          LAYER 1: REAL WEB-OPTIMIZED CINEMATIC 3D VIDEO + FALLBACK 3D PLATES
         ===================================================================== */}
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-[#02050E]">
        {/* Photorealistic 3D WebP Fallback & Base Camera Plates (Instant first frame, zero white screen) */}
        <img
          src="/intro-scene1.webp"
          alt=""
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[2200ms] ease-out ${
            sceneIndex === 1 ? 'opacity-90 scale-105' : 'opacity-0 scale-110'
          }`}
        />
        <img
          src="/intro-scene2.webp"
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[2200ms] ease-out ${
            sceneIndex === 2 ? 'opacity-90 scale-105' : 'opacity-0 scale-110'
          }`}
        />
        <img
          src="/intro-scene3.webp"
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[2200ms] ease-out ${
            sceneIndex === 3 || sceneIndex === 4 ? 'opacity-85 scale-105' : 'opacity-0 scale-110'
          }`}
        />
        <img
          src="/intro-scene5.webp"
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[2200ms] ease-out ${
            sceneIndex === 5 ? 'opacity-95 scale-105' : 'opacity-0 scale-110'
          }`}
        />

        {/* Web-Optimized HTML5 Cinematic Video Layer (preload="metadata", fast WebP poster) */}
        {!prefersReducedMotion && !videoFailed && (
          <video
            ref={videoRef}
            preload="metadata"
            poster="/intro-poster.webp"
            muted
            playsInline
            autoPlay
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoReady ? 'opacity-95' : 'opacity-0'
            }`}
          >
            {!isMobile && <source src="/intro-cinematic.webm" type="video/webm" />}
            <source
              src={isMobile ? '/intro-cinematic-mobile.mp4' : '/intro-cinematic.mp4'}
              type="video/mp4"
            />
          </video>
        )}

        {/* Measured Volumetric Lighting & Depth-of-Field Vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#02050E]/80 via-[#030918]/45 to-[#02050E]/90"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,5,14,0.82)_100%)]"
        />
      </div>

      {/* =====================================================================
          LAYER 2: SMALL, ELEGANT SKIP BUTTON (Top-Left, Instant 0ms Action)
         ===================================================================== */}
      <div
        className="relative z-30 flex items-center justify-end px-5 sm:px-10"
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={handleSkipNow}
          aria-label="تخطي المقدمة والدخول إلى الصفحة الرئيسية فوراً"
          className="group inline-flex items-center gap-2 rounded-full bg-[#060E22]/60 hover:bg-[#0D1D3E]/85 border border-white/15 hover:border-cyan-400/45 px-4 py-2 text-xs font-medium text-white/75 hover:text-white transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
        >
          <span>تخطي المقدمة</span>
          <svg
            className="h-3.5 w-3.5 text-cyan-300/80 transition-transform duration-200 group-hover:-translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* =====================================================================
          LAYER 3: 5-SCENE CINEMATIC STORYTELLING STAGE
         ===================================================================== */}
      <div className="relative z-20 flex h-[calc(100%-5rem)] w-full items-center justify-center px-6 sm:px-12">
        {/* -----------------------------------------------------------------
            SCENE 1 (0.0s – 3.6s): بداية هادئة
            Quiet dark 3D physics world, slow camera movement, natural equations in background
           ----------------------------------------------------------------- */}
        <div
          aria-hidden={sceneIndex !== 1}
          className={`
            pointer-events-none absolute inset-0 flex flex-col items-center justify-center
            transition-all duration-[1600ms] ease-out
            ${sceneIndex === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
          `}
        >
          <div className="relative h-80 w-full max-w-5xl">
            <span
              dir="ltr"
              className="
                absolute top-8 right-[14%] font-mono text-xs sm:text-sm tracking-[0.2em]
                text-cyan-200/25 blur-[0.4px]
              "
              style={{
                transform: `translate3d(0, -${elapsedSec * 3.5}px, 0)`,
                transition: 'transform 400ms linear',
              }}
            >
              ψ(r, t) = A · exp(i(k·r − ωt))
            </span>
            <span
              dir="ltr"
              className="
                absolute bottom-10 left-[15%] font-mono text-xs sm:text-sm tracking-[0.2em]
                text-amber-100/20 blur-[0.5px]
              "
              style={{
                transform: `translate3d(0, -${elapsedSec * 2.5}px, 0)`,
                transition: 'transform 400ms linear',
              }}
            >
              ∇ × B = μ₀ J + μ₀ ε₀ ∂E/∂t
            </span>
            <span
              dir="ltr"
              className="
                absolute top-1/2 left-[20%] font-mono text-xs tracking-[0.25em]
                text-blue-200/20 blur-[0.5px] hidden sm:inline
              "
            >
              E = h · ν
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            SCENE 2 (3.6s – 7.8s): اكتشاف الفيزياء
            "الفيزياء مش حفظ..." -> smooth transition -> "دي فهم... وتفكير... وتطبيق."
           ----------------------------------------------------------------- */}
        <div
          aria-hidden={sceneIndex !== 2}
          className={`
            pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center
            transition-all duration-[1500ms] ease-out
            ${sceneIndex === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        >
          <div className="relative flex min-h-[180px] max-w-3xl flex-col items-center justify-center">
            <p
              className={`
                text-2xl sm:text-4xl md:text-5xl font-bold tracking-wide text-white/95
                transition-all duration-[1400ms] ease-out
                ${
                  sceneIndex === 2 && scene2ShowFirst && !scene2ShowSecond
                    ? 'opacity-100 translate-y-0 blur-0'
                    : sceneIndex === 2 && scene2ShowSecond
                    ? 'opacity-40 -translate-y-4 scale-95 blur-[0.5px]'
                    : 'opacity-0 translate-y-5 blur-sm'
                }
              `}
            >
              الفيزياء مش حفظ...
            </p>

            <p
              className={`
                mt-5 text-2xl sm:text-4xl md:text-5xl font-black tracking-wide
                text-transparent bg-clip-text bg-gradient-to-l from-white via-cyan-100 to-amber-200
                transition-all duration-[1400ms] ease-out
                ${
                  sceneIndex === 2 && scene2ShowSecond
                    ? 'opacity-100 translate-y-0 blur-0'
                    : 'opacity-0 translate-y-6 blur-sm'
                }
              `}
            >
              دي فهم... وتفكير... وتطبيق.
            </p>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            SCENE 3 (7.8s – 13.2s): دخول عالم المنصة
            Camera enters the 3D optical world of WiKi-PHYSICS.
            Each of the 5 platform capabilities materializes sequentially one by one
            as part of the 3D optical scene (NOT as separate cards):
            1) درس فيديو
            2) سؤال تفاعلي
            3) امتحان إلكتروني
            4) نتيجة الطالب
            5) متابعة مستوى الطالب
           ----------------------------------------------------------------- */}
        <div
          aria-hidden={sceneIndex !== 3}
          className={`
            pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6
            transition-all duration-[1400ms] ease-out
            ${sceneIndex === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
          `}
          style={{ perspective: '1200px' }}
        >
          {/* Frameless 3D Optical Plane integrated directly into the scene with floor reflection */}
          <div
            className="relative flex w-full max-w-2xl flex-col items-center justify-center text-center transition-transform duration-[1200ms] ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: `translateZ(${scene3Step * 6}px)`,
            }}
          >
            {/* 1. درس فيديو */}
            {scene3Step === 1 && (
              <div className="flex flex-col items-center space-y-5 animate-[fadeIn_800ms_ease-out]">
                <div className="relative flex h-28 sm:h-32 w-full max-w-lg items-center justify-center">
                  <svg className="h-24 w-full stroke-cyan-400/70" viewBox="0 0 600 120" fill="none">
                    <path d="M 0 60 Q 75 12, 150 60 T 300 60 T 450 60 T 600 60" strokeWidth="2" />
                    <path
                      d="M 0 60 Q 75 108, 150 60 T 300 60 T 450 60 T 600 60"
                      stroke="rgba(245,179,1,0.45)"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="absolute flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-400/10 text-white shadow-[0_0_40px_rgba(56,189,248,0.4)]">
                    <svg className="h-6 w-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium tracking-wider text-cyan-300/80">
                    داخل عالم WiKi-PHYSICS
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    درس فيديو تفاعلي
                  </h3>
                  <p className="text-sm sm:text-base text-white/65">
                    شروحات بصرية تربط المعادلة الفيزيائية بالتجربة الواقعية
                  </p>
                </div>
              </div>
            )}

            {/* 2. سؤال تفاعلي */}
            {scene3Step === 2 && (
              <div className="flex flex-col items-center space-y-5 animate-[fadeIn_800ms_ease-out]">
                <div
                  dir="ltr"
                  className="font-mono text-2xl sm:text-4xl font-bold tracking-widest text-cyan-300 drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]"
                >
                  Eₖ = h·ν − φ₀
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium tracking-wider text-amber-300/85">
                    تطبيق فوري بعد كل مفهوم
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    سؤال تفاعلي ذكي
                  </h3>
                  <p className="text-sm sm:text-base text-white/65">
                    أسئلة متدرجة تقيس الفهم العميق وتفسّر خطوات الحل
                  </p>
                </div>
              </div>
            )}

            {/* 3. امتحان إلكتروني */}
            {scene3Step === 3 && (
              <div className="flex flex-col items-center space-y-5 animate-[fadeIn_800ms_ease-out]">
                <div className="relative flex h-24 w-64 items-center justify-center">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                  <div className="absolute rounded-full border border-cyan-300/40 bg-[#051026]/90 px-5 py-2 font-mono text-lg sm:text-xl font-bold text-white shadow-[0_0_30px_rgba(56,189,248,0.3)]">
                    00 : 45 : 00
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium tracking-wider text-cyan-300/85">
                    تقييم بمعايير قياسية
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    امتحان إلكتروني شامل
                  </h3>
                  <p className="text-sm sm:text-base text-white/65">
                    بيئة اختبار دقيقة تحاكي نظام الامتحانات النهائية
                  </p>
                </div>
              </div>
            )}

            {/* 4. نتيجة الطالب */}
            {scene3Step === 4 && (
              <div className="flex flex-col items-center space-y-5 animate-[fadeIn_800ms_ease-out]">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <svg className="h-full w-full -rotate-90 drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset="14"
                    />
                  </svg>
                  <span className="absolute font-mono text-2xl font-black text-white tabular-nums">
                    96%
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium tracking-wider text-amber-300/85">
                    تصحيح وتحليل لحظي
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    نتيجة الطالب الفورية
                  </h3>
                  <p className="text-sm sm:text-base text-white/65">
                    رصد دقيق للدرجات وتفصيل كامل لكل إجابة فور إنهاء الاختبار
                  </p>
                </div>
              </div>
            )}

            {/* 5. متابعة مستوى الطالب */}
            {scene3Step === 5 && (
              <div className="flex flex-col items-center space-y-5 animate-[fadeIn_800ms_ease-out]">
                <div className="relative flex h-24 w-64 items-end justify-center">
                  <svg className="h-20 w-full overflow-visible" viewBox="0 0 240 80" fill="none">
                    <path
                      d="M 10 68 C 65 64, 95 45, 145 32 C 180 22, 205 14, 230 6"
                      stroke="#F5B301"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="230" cy="6" r="5" fill="#F5B301" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium tracking-wider text-cyan-300/85">
                    مسار ارتقاء مستمر
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black text-white">
                    متابعة مستوى الطالب
                  </h3>
                  <p className="text-sm sm:text-base text-white/65">
                    مؤشرات أداء ذكية تضمن تطور استيعابك من أول درس حتى القمة
                  </p>
                </div>
              </div>
            )}

            {/* Realistic optical floor reflection glow */}
            <div
              aria-hidden="true"
              className="mt-8 h-px w-56 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent blur-[1px]"
            />
          </div>
        </div>

        {/* -----------------------------------------------------------------
            SCENE 4 (13.2s – 16.0s): رحلة الطالب
            "اتعلم." -> "طبّق." -> "طوّر مستواك."
           ----------------------------------------------------------------- */}
        <div
          aria-hidden={sceneIndex !== 4}
          className={`
            pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center
            transition-all duration-[1300ms] ease-out
            ${sceneIndex === 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        >
          <div className="max-w-4xl w-full space-y-10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-14">
              <span
                className={`
                  text-3xl sm:text-5xl md:text-6xl font-black tracking-tight
                  transition-all duration-[1100ms] ease-out
                  ${
                    sceneIndex === 4 && scene4Step >= 1
                      ? 'opacity-100 translate-y-0 blur-0 text-white'
                      : 'opacity-0 translate-y-5 blur-sm text-white/40'
                  }
                `}
              >
                اتعلم.
              </span>

              <span
                className={`
                  text-3xl sm:text-5xl md:text-6xl font-black tracking-tight
                  transition-all duration-[1100ms] ease-out
                  ${
                    sceneIndex === 4 && scene4Step >= 2
                      ? 'opacity-100 translate-y-0 blur-0 text-cyan-300'
                      : 'opacity-0 translate-y-5 blur-sm text-cyan-300/40'
                  }
                `}
              >
                طبّق.
              </span>

              <span
                className={`
                  text-3xl sm:text-5xl md:text-6xl font-black tracking-tight
                  transition-all duration-[1100ms] ease-out
                  ${
                    sceneIndex === 4 && scene4Step >= 3
                      ? 'opacity-100 translate-y-0 blur-0 text-amber-300'
                      : 'opacity-0 translate-y-5 blur-sm text-amber-300/40'
                  }
                `}
              >
                طوّر مستواك.
              </span>
            </div>

            {/* Connected optical journey line: درس -> حل الأسئلة -> امتحان -> تطور المستوى */}
            <div className="mx-auto max-w-xl">
              <div className="relative h-px w-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-cyan-400 via-blue-400 to-amber-400 transition-all duration-1000 ease-out"
                  style={{ width: `${scene4Step === 1 ? 33 : scene4Step === 2 ? 66 : 100}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs sm:text-sm font-medium text-white/60">
                <span className={scene4Step >= 1 ? 'text-white' : ''}>درس</span>
                <span className={scene4Step >= 2 ? 'text-cyan-200' : ''}>حل الأسئلة</span>
                <span className={scene4Step >= 2 ? 'text-cyan-200' : ''}>امتحان</span>
                <span className={scene4Step >= 3 ? 'text-amber-300 font-bold' : ''}>تطور في المستوى</span>
              </div>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------
            SCENE 5 (16.0s – 18.5s): النهاية
            Visual elements converge into WiKi-PHYSICS logo & closing statement
           ----------------------------------------------------------------- */}
        <div
          aria-hidden={sceneIndex !== 5}
          className={`
            pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center
            transition-all duration-[1500ms] ease-out
            ${sceneIndex === 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        >
          <div className="flex flex-col items-center space-y-6">
            {/* Converged 3D Quantum Emblem */}
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl border border-amber-300/45 bg-[#08132E]/85 shadow-[0_0_70px_rgba(56,189,248,0.4)]">
              <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-amber-300">
                Ψ
              </span>
            </div>

            {/* Brand Title: WiKi-PHYSICS */}
            <h1
              dir="ltr"
              className="text-3xl sm:text-6xl md:text-7xl font-black tracking-[0.14em] text-white drop-shadow-[0_4px_35px_rgba(56,189,248,0.4)]"
            >
              WiKi-PHYSICS
            </h1>

            {/* Closing Tagline: "رحلتك في الفيزياء تبدأ من هنا." */}
            <p
              className={`
                text-lg sm:text-2xl md:text-3xl font-bold text-cyan-100/90 tracking-wide
                transition-all duration-[1200ms] ease-out
                ${scene5ShowSubtitle ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'}
              `}
            >
              رحلتك في الفيزياء تبدأ من هنا.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          LAYER 4: SUBTLE HAIRLINE PROGRESS LINE AT BOTTOM EDGE
         ===================================================================== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[2px] bg-white/10">
        <div
          className="h-full origin-right bg-gradient-to-l from-cyan-400 via-blue-500 to-amber-400 transition-transform duration-150 ease-linear"
          style={{
            transform: `scaleX(${progressRatio})`,
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
};
