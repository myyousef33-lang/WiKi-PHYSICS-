import React, { useState } from 'react';
import { TrendingUp, AlertCircle, Calendar, Award, ArrowUpRight } from 'lucide-react';
import { ExamAttempt } from '../../types';

interface PerformanceLineChartProps {
  attempts: ExamAttempt[];
  onTakeExam?: () => void;
}

export const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({
  attempts,
  onTakeExam
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort chronologically ascending for the timeline
  const sortedAttempts = [...attempts].sort((a, b) => {
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  if (sortedAttempts.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-xs flex flex-col items-center justify-center min-h-[280px]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#1E4FD8] mb-3">
          <TrendingUp className="h-7 w-7" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-[#0D1B3E]">
          تطور مستواك في الامتحانات
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-[#6B7280] max-w-md leading-relaxed">
          لم تقم بأداء أي امتحانات بعد. بمجرد حل أول اختبار، سيظهر رسم بياني دقيق يوضح مسار درجاتك وتطورك بمرور الوقت.
        </p>
        {onTakeExam && (
          <button
            onClick={onTakeExam}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1E4FD8] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#163cb5] transition-all cursor-pointer shadow-xs"
          >
            <span>ابدأ أول اختبار الآن</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Calculate coordinates for SVG line
  const paddingX = 40;
  const paddingY = 30;
  const width = 600;
  const height = 240;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = sortedAttempts.map((attempt, index) => {
    const x = sortedAttempts.length === 1 
      ? width / 2 
      : paddingX + (index / (sortedAttempts.length - 1)) * chartWidth;
    // Y scale from 0 to 100% (where 100% is at top, paddingY)
    const percentage = Math.min(100, Math.max(0, attempt.percentage || 0));
    const y = paddingY + chartHeight - (percentage / 100) * chartHeight;
    return { x, y, attempt, percentage };
  });

  // SVG path definition
  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Fill area under path
  const areaD = points.length > 1 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  // Average score
  const avgScore = Math.round(
    sortedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / sortedAttempts.length
  );
  const latestScore = sortedAttempts[sortedAttempts.length - 1]?.percentage || 0;
  const isImproving = sortedAttempts.length > 1 
    ? latestScore >= sortedAttempts[0].percentage 
    : true;

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#1E4FD8] border border-blue-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0D1B3E]">
              تطور مستواك
            </h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {sortedAttempts.length} اختبار{sortedAttempts.length > 1 ? 'ات' : ''}
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            تتبع درجات الامتحانات والواجبات بمرور الوقت بناءً على نتائجك الحقيقية
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1 text-center">
            <span className="text-[10px] text-[#6B7280] block font-medium">المتوسط العام</span>
            <span className="font-mono font-black text-[#1E4FD8] text-sm">{avgScore}%</span>
          </div>
          <div className={`rounded-xl border px-3 py-1 text-center ${
            latestScore >= 85 
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : latestScore >= 65
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            <span className="text-[10px] block opacity-80 font-medium">آخر امتحان</span>
            <span className="font-mono font-black text-sm">{latestScore}%</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E4FD8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E4FD8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1E4FD8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[100, 75, 50, 25, 0].map((val) => {
            const y = paddingY + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={val === 50 ? '4 4' : undefined}
                  strokeWidth={val === 50 ? 1.5 : 1}
                />
                <text
                  x={width - paddingX + 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#94A3B8"
                  textAnchor="start"
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Average Reference Line */}
          {sortedAttempts.length > 1 && (
            <line
              x1={paddingX}
              y1={paddingY + chartHeight - (avgScore / 100) * chartHeight}
              x2={width - paddingX}
              y2={paddingY + chartHeight - (avgScore / 100) * chartHeight}
              stroke="#F5B301"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
          )}

          {/* Area under curve */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#areaGrad)"
            />
          )}

          {/* Main Line */}
          {points.length > 1 ? (
            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <circle
              cx={points[0].x}
              cy={points[0].y}
              r={6}
              fill="#1E4FD8"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            const isPassed = p.attempt.passed;
            return (
              <g
                key={idx}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit target */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="transparent"
                />
                {/* Outer halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 8 : 5}
                  fill="#FFFFFF"
                  stroke={isPassed ? '#1E4FD8' : '#F5B301'}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
                {/* Center dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4 : 2.5}
                  fill={isPassed ? '#1E4FD8' : '#F5B301'}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Attempt Details Box */}
      {activePoint && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0D1B3E] text-sm">
                {activePoint.attempt.examTitle}
              </span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                activePoint.attempt.passed 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {activePoint.attempt.passed ? 'ناجح' : 'يحتاج مراجعة'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#6B7280] text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(activePoint.attempt.submittedAt).toLocaleDateString('ar-EG')}</span>
              </span>
              <span>•</span>
              <span>الدرجة: {activePoint.attempt.score} من {activePoint.attempt.maxScore}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black font-mono text-[#1E4FD8] bg-white px-3 py-1 rounded-xl border border-blue-200">
              {activePoint.percentage}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
