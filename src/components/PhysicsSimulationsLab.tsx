import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, Sparkles, Activity, Layers, HelpCircle, Gauge, Settings, Rocket, Microscope } from 'lucide-react';

export const PhysicsSimulationsLab: React.FC = () => {
  const [activeSim, setActiveSim] = useState<'projectile' | 'circuit' | 'newton'>('projectile');
  const [isRunning, setIsRunning] = useState(true);

  // --- Projectile Motion State ---
  const [projAngle, setProjAngle] = useState(45); // degrees
  const [projSpeed, setProjSpeed] = useState(40); // m/s
  const [projGravity, setProjGravity] = useState(9.8); // m/s2
  const [projTime, setProjTime] = useState(0);
  const projCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Ohm's Law Circuit State ---
  const [voltage, setVoltage] = useState(12); // Volts
  const [resistance, setResistance] = useState(6); // Ohms
  const [internalRes, setInternalRes] = useState(1); // Ohms
  const circuitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [electronOffset, setElectronOffset] = useState(0);

  // --- Newton's 2nd Law State ---
  const [mass, setMass] = useState(10); // kg
  const [force, setForce] = useState(50); // N
  const [friction, setFriction] = useState(0.2); // friction coefficient
  const [boxPosX, setBoxPosX] = useState(50);
  const [boxVelX, setBoxVelX] = useState(0);
  const newtonCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset animations on tab switch
  useEffect(() => {
    setIsRunning(true);
    setProjTime(0);
    setBoxPosX(50);
    setBoxVelX(0);
  }, [activeSim]);

  // -----------------------------------------------------------------
  // 1. PROJECTILE MOTION SIMULATION CANVAS
  // -----------------------------------------------------------------
  useEffect(() => {
    if (activeSim !== 'projectile') return;
    const canvas = projCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const rad = (projAngle * Math.PI) / 180;
    const vx0 = projSpeed * Math.cos(rad);
    const vy0 = projSpeed * Math.sin(rad);
    const tTotal = (2 * vy0) / projGravity;
    const maxH = (vy0 * vy0) / (2 * projGravity);
    const range = (projSpeed * projSpeed * Math.sin(2 * rad)) / projGravity;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Ground
      const groundY = canvas.height - 40;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundY, canvas.width, 40);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Launch cannon/base
      const startX = 50;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(startX, groundY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Cannon barrel pointing along angle
      ctx.save();
      ctx.translate(startX, groundY);
      ctx.rotate(-rad);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, -5, 25, 10);
      ctx.restore();

      // Draw Full Trajectory Path (Dotted)
      const scaleX = (canvas.width - 100) / Math.max(range * 1.2, 50);
      const scaleY = (canvas.height - 100) / Math.max(maxH * 1.5, 30);

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      for (let t = 0; t <= tTotal; t += tTotal / 100) {
        const px = startX + vx0 * t * scaleX;
        const py = groundY - (vy0 * t - 0.5 * projGravity * t * t) * scaleY;
        if (t === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Animated Projectile
      if (isRunning) {
        setProjTime(prev => {
          let next = prev + 0.05;
          if (next > tTotal) next = 0;
          return next;
        });
      }

      const currX = startX + vx0 * projTime * scaleX;
      const currY = groundY - (vy0 * projTime - 0.5 * projGravity * projTime * projTime) * scaleY;

      // Projectile glow & sphere
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(currX, Math.min(currY, groundY), 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Velocity Vectors
      const currVy = vy0 - projGravity * projTime;
      ctx.strokeStyle = '#22c55e'; // Vx
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(currX + vx0 * 0.8, currY);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444'; // Vy
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(currX, currY - currVy * 0.8);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeSim, projAngle, projSpeed, projGravity, isRunning, projTime]);

  // -----------------------------------------------------------------
  // 2. OHM'S LAW ELECTRIC CIRCUIT CANVAS
  // -----------------------------------------------------------------
  useEffect(() => {
    if (activeSim !== 'circuit') return;
    const canvas = circuitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const totalR = resistance + internalRes;
    const currentI = voltage / totalR; // Amperes
    const power = currentI * currentI * resistance; // Watts

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const left = 80;
      const right = canvas.width - 80;
      const top = 60;
      const bottom = canvas.height - 60;

      // Main Wires
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(left, top, right - left, bottom - top);

      // Battery at Left Wire
      const batY = (top + bottom) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(left - 20, batY - 30, 40, 60);
      ctx.strokeStyle = '#f97316';
      ctx.strokeRect(left - 20, batY - 30, 40, 60);

      // Battery Plates
      ctx.fillStyle = '#f97316';
      ctx.fillRect(left - 15, batY - 15, 30, 4); // + plate
      ctx.fillStyle = '#64748b';
      ctx.fillRect(left - 10, batY + 10, 20, 3); // - plate
      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`+ ${voltage}V -`, left - 25, batY + 45);

      // Resistor Zig-Zag at Top Wire
      const midX = (left + right) / 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(midX - 40, top - 15, 80, 30);
      ctx.strokeStyle = '#eab308';
      ctx.strokeRect(midX - 40, top - 15, 80, 30);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`R = ${resistance} Ω`, midX - 25, top - 22);

      // Light Bulb at Right Wire
      const bulbY = (top + bottom) / 2;
      const bulbGlow = Math.min(power * 3, 50);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = bulbGlow;
      ctx.fillStyle = power > 0.5 ? '#facc15' : '#475569';
      ctx.beginPath();
      ctx.arc(right, bulbY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      // Filament
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(right - 8, bulbY + 5);
      ctx.lineTo(right, bulbY - 8);
      ctx.lineTo(right + 8, bulbY + 5);
      ctx.stroke();

      // Ammeter at Bottom Wire
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(midX, bottom, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.stroke();
      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`A: ${currentI.toFixed(2)}A`, midX - 22, bottom + 35);

      // Electrons Motion
      if (isRunning) {
        setElectronOffset(prev => (prev + currentI * 1.5) % 30);
      }

      ctx.fillStyle = '#38bdf8';
      const perimeter = 2 * (right - left) + 2 * (bottom - top);
      for (let d = electronOffset; d < perimeter; d += 30) {
        let ex = left, ey = top;
        if (d < right - left) {
          ex = left + d;
          ey = top;
        } else if (d < (right - left) + (bottom - top)) {
          ex = right;
          ey = top + (d - (right - left));
        } else if (d < 2 * (right - left) + (bottom - top)) {
          ex = right - (d - ((right - left) + (bottom - top)));
          ey = bottom;
        } else {
          ex = left;
          ey = bottom - (d - (2 * (right - left) + (bottom - top)));
        }

        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeSim, voltage, resistance, internalRes, isRunning, electronOffset]);

  // -----------------------------------------------------------------
  // 3. NEWTON'S SECOND LAW CANVAS (F = m * a)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (activeSim !== 'newton') return;
    const canvas = newtonCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const g = 9.8;
    const maxFriction = friction * mass * g;
    const netForce = Math.max(0, force - maxFriction);
    const accel = netForce / mass;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const groundY = canvas.height - 50;

      // Ground & Surface
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, groundY, canvas.width, 50);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Update position
      if (isRunning && force > 0) {
        setBoxVelX(v => {
          let nv = v + accel * 0.04;
          if (force <= maxFriction) nv = Math.max(0, nv - 0.5);
          return nv;
        });
        setBoxPosX(p => {
          let np = p + boxVelX * 0.1;
          if (np > canvas.width - 90) np = 40;
          return np;
        });
      }

      const boxSize = Math.min(30 + mass * 0.8, 70);
      const boxY = groundY - boxSize;

      // Sliding Box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(boxPosX, boxY, boxSize, boxSize);
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxPosX, boxY, boxSize, boxSize);

      ctx.fillStyle = '#fb923c';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`m = ${mass}kg`, boxPosX + 8, boxY + boxSize / 2);

      // Applied Force Arrow (Orange -> Right)
      if (force > 0) {
        const arrowLen = Math.min(force * 0.8, 120);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(boxPosX + boxSize, boxY + boxSize / 2);
        ctx.lineTo(boxPosX + boxSize + arrowLen, boxY + boxSize / 2);
        ctx.stroke();

        // Arrow tip
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(boxPosX + boxSize + arrowLen + 8, boxY + boxSize / 2);
        ctx.lineTo(boxPosX + boxSize + arrowLen, boxY + boxSize / 2 - 6);
        ctx.lineTo(boxPosX + boxSize + arrowLen, boxY + boxSize / 2 + 6);
        ctx.fill();
        ctx.fillText(`F = ${force}N`, boxPosX + boxSize + 10, boxY + boxSize / 2 - 10);
      }

      // Friction Arrow (Red <- Left)
      if (maxFriction > 0) {
        const frictLen = Math.min(maxFriction * 0.8, 80);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(boxPosX, boxY + boxSize - 5);
        ctx.lineTo(boxPosX - frictLen, boxY + boxSize - 5);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillText(`f = ${maxFriction.toFixed(1)}N`, boxPosX - frictLen - 10, boxY + boxSize - 12);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeSim, mass, force, friction, isRunning, boxPosX, boxVelX]);

  // Derived Projectile Calculations
  const rad = (projAngle * Math.PI) / 180;
  const vy0 = projSpeed * Math.sin(rad);
  const maxH = (vy0 * vy0) / (2 * projGravity);
  const range = (projSpeed * projSpeed * Math.sin(2 * rad)) / projGravity;
  const tTotal = (2 * vy0) / projGravity;

  // Derived Circuit Calculations
  const totalR = resistance + internalRes;
  const currentI = voltage / totalR;
  const powerWatts = currentI * currentI * resistance;

  // Derived Newton Calculations
  const maxFriction = friction * mass * 9.8;
  const netForce = Math.max(0, force - maxFriction);
  const accel = netForce / mass;

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* Top Banner */}
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1E4FD8] mb-2">
              <Microscope className="h-3.5 w-3.5" />
              <span>المعمل الفيزيائي التفاعلي الحديث</span>
            </div>
            <h2 className="text-2xl font-black text-[#0D1B3E]">محاكاة التجارب الفيزيائية التفاعلية</h2>
            <p className="text-xs text-[#6B7280] mt-1 max-w-xl">
              غير المتغيرات (السرعة، المقاومة، القوة...) وشاهد النتائج تتغير بصرياً في الوقت الفعلي مع حسابات القوانين!
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F7FA] p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                isRunning ? 'bg-amber-50 text-amber-800 border border-amber-300' : 'bg-[#1E4FD8] text-white'
              }`}
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isRunning ? 'إيقاف مؤقت' : 'تشغيل المحاكاة'}</span>
            </button>
            <button
              onClick={() => {
                setProjTime(0);
                setBoxPosX(50);
                setBoxVelX(0);
              }}
              className="rounded-xl border border-slate-200 bg-white p-2 text-[#0D1B3E] hover:bg-slate-100 transition-colors shadow-xs"
              title="إعادة التعيين"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSim('projectile')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 rounded-2xl p-3.5 text-xs font-black transition-all border ${
            activeSim === 'projectile'
              ? 'bg-[#1E4FD8] text-white border-[#1E4FD8] shadow-xs'
              : 'bg-white text-[#6B7280] border-slate-200 hover:border-blue-200 hover:text-[#0D1B3E]'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>1. الحركة المقذوفة</span>
        </button>

        <button
          onClick={() => setActiveSim('circuit')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 rounded-2xl p-3.5 text-xs font-black transition-all border ${
            activeSim === 'circuit'
              ? 'bg-[#F5B301] text-[#0D1B3E] border-[#F5B301] shadow-xs'
              : 'bg-white text-[#6B7280] border-slate-200 hover:border-blue-200 hover:text-[#0D1B3E]'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>2. الدوائر وقانون أوم</span>
        </button>

        <button
          onClick={() => setActiveSim('newton')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 rounded-2xl p-3.5 text-xs font-black transition-all border ${
            activeSim === 'newton'
              ? 'bg-[#1E4FD8] text-white border-[#1E4FD8] shadow-xs'
              : 'bg-white text-[#6B7280] border-slate-200 hover:border-blue-200 hover:text-[#0D1B3E]'
          }`}
        >
          <Gauge className="h-4 w-4" />
          <span>3. نيوتن الثاني (F = m.a)</span>
        </button>
      </div>

      {/* Main Simulation View & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Canvas Display Area (2 Cols on Large) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-[#6B7280] flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#1E4FD8]" />
              منصة العرض البصري الحية
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              60 FPS Active
            </span>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[320px]">
            {activeSim === 'projectile' && (
              <canvas
                ref={projCanvasRef}
                width={700}
                height={350}
                className="w-full h-auto max-h-[360px]"
              />
            )}

            {activeSim === 'circuit' && (
              <canvas
                ref={circuitCanvasRef}
                width={700}
                height={350}
                className="w-full h-auto max-h-[360px]"
              />
            )}

            {activeSim === 'newton' && (
              <canvas
                ref={newtonCanvasRef}
                width={700}
                height={350}
                className="w-full h-auto max-h-[360px]"
              />
            )}
          </div>
        </div>

        {/* Controls & Metrics Panel (1 Col) */}
        <div className="space-y-4">

          {/* SIMULATION 1: PROJECTILE MOTION */}
          {activeSim === 'projectile' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h3 className="text-sm font-black text-[#0D1B3E] border-b border-slate-100 pb-2 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-[#1E4FD8]" />
                <span>متغيرات إطلاق المقذوف</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>زاوية الإطلاق (θ):</span>
                    <span className="font-mono text-[#1E4FD8]">{projAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={85}
                    value={projAngle}
                    onChange={(e) => setProjAngle(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>السرعة الابتدائية (v₀):</span>
                    <span className="font-mono text-[#1E4FD8]">{projSpeed} m/s</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={projSpeed}
                    onChange={(e) => setProjSpeed(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>عجلة الجاذبية (g):</span>
                    <span className="font-mono text-[#1E4FD8]">{projGravity} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={0.1}
                    value={projGravity}
                    onChange={(e) => setProjGravity(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>
              </div>

              {/* Real-time Math Outputs */}
              <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>أقصى ارتفاع (H_max):</span>
                  <span className="font-bold font-mono text-emerald-600">{maxH.toFixed(2)} متر</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>المدى الأفقي (R):</span>
                  <span className="font-bold font-mono text-[#1E4FD8]">{range.toFixed(2)} متر</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>زمن التحليق الكلي (T):</span>
                  <span className="font-bold font-mono text-amber-600">{tTotal.toFixed(2)} ثانية</span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 2: OHM'S LAW */}
          {activeSim === 'circuit' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h3 className="text-sm font-black text-[#0D1B3E] border-b border-slate-100 pb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#F5B301]" />
                <span>عناصر الدائرة الكهربية</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>القوة الدافعة (V):</span>
                    <span className="font-mono text-[#1E4FD8]">{voltage} فولت</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={36}
                    value={voltage}
                    onChange={(e) => setVoltage(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>المقاومة الخارجية (R):</span>
                    <span className="font-mono text-[#1E4FD8]">{resistance} أوم</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={resistance}
                    onChange={(e) => setResistance(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>المقاومة الداخلية (r):</span>
                    <span className="font-mono text-[#1E4FD8]">{internalRes} أوم</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={internalRes}
                    onChange={(e) => setInternalRes(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>
              </div>

              {/* Circuit Math Outputs */}
              <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>شدة التيار الكلي (I = V/R_eq):</span>
                  <span className="font-bold font-mono text-amber-700">{currentI.toFixed(2)} أمبير</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>القدرة المستهلكة (P = I²R):</span>
                  <span className="font-bold font-mono text-[#1E4FD8]">{powerWatts.toFixed(2)} واط</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>فرق الجهد بين طرفي البطارية:</span>
                  <span className="font-bold font-mono text-emerald-600">{(voltage - currentI * internalRes).toFixed(2)} فولت</span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 3: NEWTON'S SECOND LAW */}
          {activeSim === 'newton' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h3 className="text-sm font-black text-[#0D1B3E] border-b border-slate-100 pb-2 flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#1E4FD8]" />
                <span>قوة السحب واحتكاك السطح</span>
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>القوة المؤثرة (F):</span>
                    <span className="font-mono text-[#1E4FD8]">{force} نيوتن</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={force}
                    onChange={(e) => setForce(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>كتلة الجسم (m):</span>
                    <span className="font-mono text-[#1E4FD8]">{mass} كجم</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={mass}
                    onChange={(e) => setMass(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#0D1B3E]">
                    <span>معامل الاحتكاك (μ):</span>
                    <span className="font-mono text-[#1E4FD8]">{friction}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.05}
                    value={friction}
                    onChange={(e) => setFriction(Number(e.target.value))}
                    className="w-full accent-[#1E4FD8]"
                  />
                </div>
              </div>

              {/* Newton Math Outputs */}
              <div className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>قوة الاحتكاك القصوى (f = μmg):</span>
                  <span className="font-bold font-mono text-rose-600">{maxFriction.toFixed(1)} N</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>محصلة القوة (F_net):</span>
                  <span className="font-bold font-mono text-[#1E4FD8]">{netForce.toFixed(1)} N</span>
                </div>
                <div className="flex justify-between text-[#6B7280]">
                  <span>العجلة الناتجة (a = F/m):</span>
                  <span className="font-bold font-mono text-emerald-600">{accel.toFixed(2)} m/s²</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
