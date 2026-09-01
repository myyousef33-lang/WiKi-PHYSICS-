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
      <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-black text-[#1E4FD8]">
              <Trophy className="h-4 w-4 text-[#F5B301]" />
              <span>لوحة الشرف والتنافس الأسبوعي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0D1B3E]">
              أوائل الفيزياء وقائمة المتفوقين
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] max-w-xl">
              تنافس مع زملائك على مستوى الجمهورية، واجمع النقاط من خلال حل الامتحانات والواجبات والمشاركة في تحدي الأسبوع لتحصل على أوسمة الشرف!
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#F5F7FA] border border-slate-200 rounded-2xl p-4 shrink-0 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-[#1E4FD8]">
              <Medal className="h-7 w-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6B7280]">نقاط الطالب الحالي</span>
              <p className="text-xl font-black text-[#1E4FD8]">
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
              <Flame className="h-5 w-5 text-amber-500 fill-amber-400" />
              <h2 className="text-lg font-black text-[#0D1B3E]">ترتيب الطلاب الأوائل</h2>
            </div>
            <span className="text-xs text-[#6B7280] font-bold">تحديث دوري ومباشر</span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {leaderboard.slice(0, 10).map((entry, idx) => {
                const isCurrent = student && entry.studentId === student.id;
                const rankNum = idx + 1;

                return (
                  <div
                    key={entry.studentId}
                    className={`flex items-center justify-between p-4 sm:p-5 transition-colors ${
                      isCurrent 
                        ? 'bg-blue-50/60 border-r-4 border-[#1E4FD8]' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Rank Badge */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                        rankNum === 1 
                          ? 'bg-[#F5B301] text-[#0D1B3E] shadow-xs' 
                          : rankNum === 2 
                          ? 'bg-slate-200 text-[#0D1B3E]' 
                          : rankNum === 3 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-[#F5F7FA] text-[#6B7280] border border-slate-200'
                      }`}>
                        {rankNum <= 3 ? <Trophy className={`h-4 w-4 ${rankNum === 1 ? 'text-[#0D1B3E]' : rankNum === 2 ? 'text-slate-700' : 'text-amber-800'}`} /> : rankNum}
                      </div>

                      {/* Student Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#0D1B3E]">{entry.studentName}</h3>
                          {isCurrent && (
                            <span className="rounded bg-blue-100 text-[#1E4FD8] px-1.5 py-0.5 text-[10px] font-bold">
                              أنت
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B7280]">
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
                            className="flex items-center gap-1 rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-bold text-[#0D1B3E] border border-slate-200"
                          >
                            <Medal className="h-3 w-3 text-[#1E4FD8]" />
                            <span>{b.title}</span>
                          </span>
                        ))}
                      </div>

                      <div className="text-left">
                        <span className="text-base font-black text-[#1E4FD8]">{entry.points}</span>
                        <span className="text-[10px] text-[#6B7280] block">نقطة تميز</span>
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
            <div className="rounded-3xl border border-blue-100 bg-white p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#1E4FD8]" />
                  <h3 className="text-sm font-black text-[#0D1B3E]">تحدي الأسبوع الفيزيائي</h3>
                </div>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                  +{activeChallenge.bonusPoints} نقطة
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black text-[#0D1B3E]">{activeChallenge.title}</h4>
                <p className="text-[11px] text-[#6B7280]">{activeChallenge.description}</p>
              </div>

              {/* Challenge Questions */}
              <div className="space-y-4 pt-2">
                {activeChallenge.questions.map((q, qIdx) => (
                  <div key={q.id} className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3.5 space-y-2.5 text-xs">
                    <p className="font-bold text-[#0D1B3E] leading-relaxed">
                      س{qIdx + 1}: {q.text}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[q.id] === optIdx;
                        const isCorrect = q.correctOptionIndex === optIdx;
                        
                        let btnStyle = 'border-slate-200 bg-white text-[#0D1B3E] hover:border-blue-300';
                        if (submittedChallenge) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'border-rose-300 bg-rose-50 text-rose-800';
                          }
                        } else if (isSelected) {
                          btnStyle = 'border-[#1E4FD8] bg-blue-50 text-[#1E4FD8] font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-right rounded-xl border p-2.5 text-xs transition-all shadow-xs ${btnStyle}`}
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
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>حصلت على {challengeScore} من {activeChallenge.bonusPoints} نقطة في التحدي!</span>
                </div>
              ) : (
                <button
                  onClick={handleSubmitChallenge}
                  disabled={Object.keys(selectedAnswers).length < activeChallenge.questions.length}
                  className="w-full rounded-2xl bg-[#F5B301] py-2.5 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] disabled:opacity-40 transition-colors shadow-xs"
                >
                  تسليم إجابات التحدي وحصد النقاط
                </button>
              )}
            </div>
          )}

          {/* Badges Collection Showcase */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-[#0D1B3E] flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F5B301]" />
              <span>أوسمة الشرف الفيزيائية المتاحة</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0D1B3E]">بداية بطل</h4>
                  <p className="text-[11px] text-[#6B7280]">يُمنح عند اجتياز أول اختبار بنجاح</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E4FD8] border border-blue-200">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0D1B3E]">فيزيائي متميز</h4>
                  <p className="text-[11px] text-[#6B7280]">يُمنح عند اجتياز 5 اختبارات بنسبة تفوق</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#F5B301] border border-amber-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0D1B3E]">نادي المئة (Centurion)</h4>
                  <p className="text-[11px] text-[#6B7280]">يُمنح عند جمع أكثر من 100 نقطة تميز</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
