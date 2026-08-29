import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Award, 
  Star, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  Users,
  Target,
  Shield,
  Medal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StorageService } from '../services/storage';
import { LeaderboardEntry, WeeklyChallenge, WeeklyChallengeQuestion } from '../types';

interface LeaderboardViewProps {
  onNavigate: (view: string, params?: any) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onNavigate }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(StorageService.getLeaderboard());
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>(StorageService.getWeeklyChallenges());
  const student = StorageService.getCurrentStudent();

  // Active challenge state
  const activeChallenge = challenges[0];
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedChallenge, setSubmittedChallenge] = useState(false);
  const [challengeScore, setChallengeScore] = useState(0);

  useEffect(() => {
    setLeaderboard(StorageService.getLeaderboard());
    setChallenges(StorageService.getWeeklyChallenges());
  }, []);

  const handleSelectOption = (questionId: string, optIdx: number) => {
    if (submittedChallenge) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optIdx }));
  };

  const handleSubmitChallenge = () => {
    if (!activeChallenge) return;
    let earned = 0;
    activeChallenge.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        earned += q.points;
      }
    });

    setChallengeScore(earned);
    setSubmittedChallenge(true);

    if (earned > 0) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-black text-amber-300">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>لوحة الشرف والتنافس الأسبوعي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              أوائل الفيزياء وقائمة المتفوقين 🌟
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              تنافس مع زملائك على مستوى الجمهورية، واجمع النقاط من خلال حل الامتحانات والواجبات والمشاركة في تحدي الأسبوع لتحصل على أوسمة الشرف!
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 border border-amber-500/20 rounded-2xl p-4 shrink-0 shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Medal className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400">نقاط الطالب الحالي</span>
              <p className="text-xl font-black text-amber-400">
                {student ? (leaderboard.find(l => l.studentId === student.id)?.points || 50) : 0} نقطة
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Top Leaderboard Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
              <h2 className="text-lg font-black text-white">ترتيب الطلاب الأوائل</h2>
            </div>
            <span className="text-xs text-slate-400 font-bold">تحديث دوري ومباشر</span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/60">
              {leaderboard.slice(0, 10).map((entry, idx) => {
                const isCurrent = student && entry.studentId === student.id;
                const rankNum = idx + 1;

                return (
                  <div
                    key={entry.studentId}
                    className={`flex items-center justify-between p-4 sm:p-5 transition-colors ${
                      isCurrent 
                        ? 'bg-amber-500/10 border-r-4 border-amber-500' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Rank Badge */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                        rankNum === 1 
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                          : rankNum === 2 
                          ? 'bg-slate-300 text-slate-950' 
                          : rankNum === 3 
                          ? 'bg-amber-700 text-white' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : rankNum}
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{entry.studentName}</h3>
                          {isCurrent && (
                            <span className="rounded bg-amber-500/20 text-amber-400 px-1.5 py-0.2 text-[10px] font-bold">
                              أنت
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {entry.grade} • {entry.governorate || 'مصر'}
                        </p>
                      </div>
                    </div>

                    {/* Badges & Score */}
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-1.5">
                        {entry.badges?.slice(0, 2).map((b) => (
                          <span
                            key={b.id}
                            title={b.description}
                            className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700"
                          >
                            <span>{b.icon}</span>
                            <span>{b.title}</span>
                          </span>
                        ))}
                      </div>

                      <div className="text-left">
                        <span className="text-base font-black text-amber-400">{entry.points}</span>
                        <span className="text-[10px] text-slate-400 block">نقطة تميز</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Challenge & Badges (1 col) */}
        <div className="space-y-6">
          
          {/* Weekly Challenge Card */}
          {activeChallenge && (
            <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-black text-white">تحدي الأسبوع الفيزيائي</h3>
                </div>
                <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                  +{activeChallenge.bonusPoints} نقطة
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-purple-200">{activeChallenge.title}</h4>
                <p className="text-[11px] text-slate-400">{activeChallenge.description}</p>
              </div>

              {/* Challenge Questions */}
              <div className="space-y-4 pt-2">
                {activeChallenge.questions.map((q, qIdx) => (
                  <div key={q.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5 text-xs">
                    <p className="font-bold text-white leading-relaxed">
                      س{qIdx + 1}: {q.text}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[q.id] === optIdx;
                        const isCorrect = q.correctOptionIndex === optIdx;
                        
                        let btnStyle = 'border-slate-800 bg-slate-900 text-slate-300 hover:border-purple-500/40';
                        if (submittedChallenge) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                          }
                        } else if (isSelected) {
                          btnStyle = 'border-purple-500 bg-purple-500/20 text-purple-200 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-right rounded-xl border p-2.5 text-xs transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {submittedChallenge ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-center text-xs text-emerald-300 font-bold">
                  🎉 حصلت على {challengeScore} من {activeChallenge.bonusPoints} نقطة في التحدي!
                </div>
              ) : (
                <button
                  onClick={handleSubmitChallenge}
                  disabled={Object.keys(selectedAnswers).length < activeChallenge.questions.length}
                  className="w-full rounded-2xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-40 transition-colors shadow-md shadow-purple-600/30"
                >
                  تسليم إجابات التحدي وحصد النقاط
                </button>
              )}
            </div>
          )}

          {/* Badges Collection Showcase */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>أوسمة الشرف الفيزيائية المتاحة</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="font-bold text-white">بداية بطل</h4>
                  <p className="text-[11px] text-slate-400">يُمنح عند اجتياز أول اختبار بنجاح</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-bold text-white">فيزيائي متميز</h4>
                  <p className="text-[11px] text-slate-400">يُمنح عند اجتياز 5 اختبارات بنسبة تفوق</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                <span className="text-2xl">🌟</span>
                <div>
                  <h4 className="font-bold text-white">نادي المئة (Centurion)</h4>
                  <p className="text-[11px] text-slate-400">يُمنح عند جمع أكثر من 100 نقطة تميز</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
