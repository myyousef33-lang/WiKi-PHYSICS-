import React, { useState } from 'react';
import { RotateCw, CheckCircle2, AlertCircle, HelpCircle, BookOpen, ChevronRight, ChevronLeft, Sparkles, Layers } from 'lucide-react';
import { Student } from '../types';
import { StorageService } from '../services/storage';
import { triggerOrangeConfetti } from '../utils/confetti';

interface Flashcard {
  id: string;
  unit: string;
  frontTitle: string;
  frontConcept: string;
  backAnswer: string;
  formula?: string;
  unitId?: string;
}

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    unit: 'الكهربية وقانون أوم',
    frontTitle: 'قانون أوم للدائرة المغلقة',
    frontConcept: 'ما هو نص العلاقة الرياضية التي تربط بين شدة التيار الكلي والقوة الدافعة الكهربية للبطارية؟',
    backAnswer: 'شدة التيار الكلي (I) تساوي القوة الدافعة (VB) مقسومة على المقاومة المكافئة الخارجية (R) مضافاً إليها المقاومة الداخلية للبطارية (r).',
    formula: 'I = V_B / (R_eq + r)'
  },
  {
    id: 'fc-2',
    unit: 'الكهربية وقانون أوم',
    frontTitle: 'فرق الجهد بين طرفي البطارية',
    frontConcept: 'متى يكون فرق الجهد بين قطبي البطارية (V) أكبر من القوة الدافعة الكهربية (VB)؟',
    backAnswer: 'في حالة شحن البطارية (عند توصيلها بمصدر آخر أعلى منها قوة دافعة)، حيث تكون المعادلة: V = VB + I.r',
    formula: 'V = V_B + I · r'
  },
  {
    id: 'fc-3',
    unit: 'قوانين كيرشوف',
    frontTitle: 'قانون كيرشوف الأول (قانون الشحنة)',
    frontConcept: 'ما هي الفكرة الفيزيائية التي يعتمد عليها قانون كيرشوف الأول؟',
    backAnswer: 'مبدأ بقاء الشحنة الكهربية: مجموع التيارات الداخلة إلى أي نقطة تفرع يساوي مجموع التيارات الخارجة منها.',
    formula: 'Σ I_in = Σ I_out'
  },
  {
    id: 'fc-4',
    unit: 'التحث الكهرومغناطيسي',
    frontTitle: 'قاعدة لينز (Lenz\'s Law)',
    frontConcept: 'ما هو نص قاعدة لينز وكيف نحدد اتجاه التيار المستحث؟',
    backAnswer: 'يكون اتجاه التيار المستحث بحيث يعاكس التغير في الفيظ المغناطيسي المسبب له (تطبيقا لقانون بقاء الطاقة).',
    formula: 'e.m.f = - N · (ΔΦ_m / Δt)'
  },
  {
    id: 'fc-5',
    unit: 'الفيزياء الحديثة',
    frontTitle: 'الظاهرة الكهروضوئية وأنبوية كوليدج',
    frontConcept: 'ما شرط انبعاث الإلكترونات الكهروضوئية من سطح معدن؟',
    backAnswer: 'أن يكون تردد الضوء الساقط (ν) أعلى من التردد الحرج للمعدن (ν_c)، أو طاقته أكبر من دالة الشغل (E > E_w).',
    formula: 'E_k = h·ν - E_w'
  },
  {
    id: 'fc-6',
    unit: 'الفيزياء الحديثة',
    frontTitle: 'معادلة دي برولي (طبيعة الجسيمات الموجية)',
    frontConcept: 'كيف نحسب الطول الموجي المصاحب لحركة جسم كتلته m وسرعته v؟',
    backAnswer: 'الطول الموجي (λ) يتناسب عكسيا مع كمية التحرك (P_L = m.v) وثابت بلانك (h).',
    formula: 'λ = h / (m · v)'
  }
];

interface FlashcardsViewProps {
  student: Student;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ student }) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [onlyNeedsReview, setOnlyNeedsReview] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const progress = student.flashcardProgress || {};

  // Units list
  const units = Array.from(new Set(DEFAULT_FLASHCARDS.map(f => f.unit)));

  // Filtered Cards
  const filteredCards = DEFAULT_FLASHCARDS.filter(card => {
    if (selectedUnit !== 'all' && card.unit !== selectedUnit) return false;
    if (onlyNeedsReview && progress[card.id] !== 'needs_review') return false;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  const handleStatusUpdate = (status: 'understood' | 'needs_review') => {
    if (!currentCard) return;

    // Save status
    StorageService.updateFlashcardProgress(student.id, currentCard.id, status);

    if (status === 'understood') {
      triggerOrangeConfetti();
    }

    // Move to next card
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < filteredCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 200);
  };

  return (
    <div className="space-y-6 font-sans text-right">
      
      {/* Header */}
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1E4FD8] mb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>بطاقات المراجعة الفيزيائية السريعة</span>
          </div>
          <h2 className="text-2xl font-black text-[#0D1B3E]">بطاقات المراجعة التفاعلية (Flashcards)</h2>
          <p className="text-xs text-[#6B7280] mt-1">
            اضغط على البطاقة لقلبها وقراءة الإجابة، ثم حدد مستواك لتصفية البطاقات وحفظ تقدمك!
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#F5F7FA] p-2 rounded-2xl border border-slate-200">
          <select
            value={selectedUnit}
            onChange={(e) => {
              setSelectedUnit(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0D1B3E] focus:border-[#1E4FD8] focus:outline-none shadow-xs"
          >
            <option value="all">جميع الفصول والوحدات</option>
            {units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setOnlyNeedsReview(!onlyNeedsReview);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
              onlyNeedsReview
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-[#6B7280] border-slate-200 hover:text-[#0D1B3E]'
            }`}
          >
            {onlyNeedsReview ? 'محتاج مراجعة فقط' : 'عرض الكل'}
          </button>
        </div>
      </div>

      {/* Main Flashcard Arena */}
      {filteredCards.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-[#0D1B3E]">لا توجد بطاقات مراجعة مطابقة للتصفية الحالية</h4>
          <button
            onClick={() => {
              setSelectedUnit('all');
              setOnlyNeedsReview(false);
            }}
            className="rounded-xl bg-[#F5B301] px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-[#e0a401] transition-all shadow-xs"
          >
            إعادة إظهار كل البطاقات
          </button>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-5">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-[#6B7280] px-2 font-bold">
            <span>الوحدة: <strong className="text-[#1E4FD8]">{currentCard.unit}</strong></span>
            <span>البطاقة <strong className="text-[#0D1B3E]">{currentIndex + 1}</strong> من <strong className="text-[#0D1B3E]">{filteredCards.length}</strong></span>
          </div>

          {/* Interactive Flip Card Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative h-80 w-full cursor-pointer perspective-1000 group"
          >
            <div className={`relative h-full w-full rounded-3xl border transition-all duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180 border-blue-300 bg-white' : 'border-slate-200 bg-white'
            } shadow-sm p-6 flex flex-col justify-between`}>
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-[#1E4FD8] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#F5B301]" />
                  {currentCard.frontTitle}
                </span>
                <span className="text-[11px] font-bold text-[#6B7280] flex items-center gap-1">
                  <RotateCw className="h-3.5 w-3.5 text-[#1E4FD8] group-hover:rotate-180 transition-transform duration-500" />
                  انقر لقلب البطاقة
                </span>
              </div>

              {/* Card Body (Front or Back) */}
              <div className="my-auto text-center space-y-3">
                {!isFlipped ? (
                  <div className="space-y-3 animate-fadeIn">
                    <p className="text-base md:text-lg font-black text-[#0D1B3E] leading-relaxed">
                      {currentCard.frontConcept}
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-[#1E4FD8]">
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>السؤال / المفهوم الفيزيائي</span>
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fadeIn">
                    <p className="text-sm md:text-base font-bold text-[#0D1B3E] leading-relaxed">
                      {currentCard.backAnswer}
                    </p>
                    {currentCard.formula && (
                      <div className="rounded-xl bg-[#F5F7FA] border border-blue-200 p-2.5 font-mono text-xs font-bold text-[#1E4FD8]">
                        {currentCard.formula}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Status indicator */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px]">
                <span className="text-[#6B7280] font-bold">الحالة الحالية:</span>
                {progress[currentCard.id] === 'understood' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> فاهمها ومتقنها
                  </span>
                ) : progress[currentCard.id] === 'needs_review' ? (
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" /> محتاجة مراجعة
                  </span>
                ) : (
                  <span className="text-slate-400">لم تُحدد بعد</span>
                )}
              </div>

            </div>
          </div>

          {/* Action Buttons (Understood vs Needs Review) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleStatusUpdate('needs_review')}
              className="rounded-2xl border border-rose-200 bg-rose-50 py-3 px-4 text-xs font-black text-rose-700 hover:bg-rose-100 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>محتاج مراجعة (تكرار)</span>
            </button>

            <button
              onClick={() => handleStatusUpdate('understood')}
              className="rounded-2xl bg-[#1E4FD8] py-3 px-4 text-xs font-black text-white hover:bg-[#163cb5] transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>فاهمها ومتقنها!</span>
            </button>
          </div>

          {/* Previous / Next Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(prev => (prev > 0 ? prev - 1 : filteredCards.length - 1));
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-xs"
            >
              <ChevronRight className="h-4 w-4" />
              <span>البطاقة السابقة</span>
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(prev => (prev < filteredCards.length - 1 ? prev + 1 : 0));
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0D1B3E] hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>البطاقة التالية</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
