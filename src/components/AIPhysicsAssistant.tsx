import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  X, 
  Bot, 
  User, 
  RefreshCw, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  Lightbulb, 
  Maximize2, 
  Minimize2,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { AIChatMessage } from '../types';

interface AIPhysicsAssistantProps {
  currentLessonId?: string;
  currentCourseId?: string;
  lessonTitle?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

export const AIPhysicsAssistant: React.FC<AIPhysicsAssistantProps> = ({
  currentLessonId,
  currentCourseId,
  lessonTitle,
  isFloating = false,
  onClose
}) => {
  const student = StorageService.getCurrentStudent();
  const studentId = student?.id || 'guest-student';
  const studentName = student?.name || 'طالب منصة ويكيفزياء';

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const history = StorageService.getAIChatHistory(studentId, currentLessonId);
    if (history && history.length > 0) {
      setMessages(history);
    } else {
      // Welcome message
      const initialWelcome: AIChatMessage = {
        id: 'msg-welcome-' + Date.now(),
        role: 'assistant',
        text: `أهلاً بك يا ${studentName}! أنا مساعدك الذكي في مادة الفيزياء للثانوية العامة.\n\nيمكنك أن تسألني عن أي مسألة، قانون، استنتاج، أو ترفع صورة لمسألة صعبة وسأقوم بحلها وشرح خطواتها لك خطوة بخطوة. ${lessonTitle ? `\n(أنا جاهز لمساعدتك في درس: "${lessonTitle}")` : ''}`,
        timestamp: new Date().toISOString()
      };
      setMessages([initialWelcome]);
    }
  }, [studentId, currentLessonId, lessonTitle, studentName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 5 ميجابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend && !selectedImage) return;

    const userMsg: AIChatMessage = {
      id: 'msg-u-' + Date.now(),
      role: 'user',
      text: textToSend,
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toISOString(),
      lessonId: currentLessonId,
      courseId: currentCourseId
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    StorageService.saveAIChatMessage(studentId, userMsg, currentLessonId);
    setInputText('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Prepare history for API
      const historyPayload = messages
        .filter(m => m.id !== 'msg-welcome')
        .slice(-8)
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text
        }));

      const res = await fetch('/api/gemini/physics-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          imageBase64: currentImg || undefined,
          chatHistory: historyPayload,
          lessonTitle: lessonTitle || undefined
        })
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.success && data.reply) {
        const aiMsg: AIChatMessage = {
          id: 'msg-ai-' + Date.now(),
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toISOString(),
          lessonId: currentLessonId,
          courseId: currentCourseId
        };
        setMessages(prev => [...prev, aiMsg]);
        StorageService.saveAIChatMessage(studentId, aiMsg, currentLessonId);
      } else {
        const errorMsg: AIChatMessage = {
          id: 'msg-ai-err-' + Date.now(),
          role: 'assistant',
          text: 'عذرًا، حدث خطأ في معالجة الرد. يرجى التأكد من كتابة السؤال بوضوح وإعادة المحاولة.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      setIsLoading(false);
      const errorMsg: AIChatMessage = {
        id: 'msg-ai-net-err-' + Date.now(),
        role: 'assistant',
        text: 'تعذر الاتصال بخادم الذكاء الاصطناعي حالياً. يرجى التحقق من اتصال الإنترنت.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleClearChat = () => {
    if (confirm('هل تريد مسح سجل المحادثة مع المساعد الذكي؟')) {
      StorageService.clearAIChatHistory(studentId, currentLessonId);
      setMessages([
        {
          id: 'msg-welcome-' + Date.now(),
          role: 'assistant',
          text: `تم مسح السجل. أهلاً بك يا ${studentName}! اسألني أي سؤال في الفيزياء وسأشرحه لك فوراً.`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const quickPrompts = [
    'اشرح لي قانون فاراداي للحث الكهرومغناطيسي',
    'ما هي شروط حدوث الرنين في دوائر التيار المتردد؟',
    'كيف أميز بين التوصيل على التوالي والتوازي للمقاومات؟',
    'لخص لي أهم قوانين الفصل الأول (التيار وقانون أوم)'
  ];

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden transition-all duration-300 ${
      isFloating 
        ? isExpanded 
          ? 'fixed inset-4 sm:inset-10 z-50 shadow-2xl' 
          : 'fixed bottom-6 left-6 z-50 w-[92vw] sm:w-[420px] h-[580px] shadow-xl'
        : 'w-full h-[650px]'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 shadow-xs">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#0D1B3E]">المساعد الفيزيائي الذكي</h3>
              <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-[#6B7280]">حل المسائل وشرح القوانين على مدار 24 ساعة</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            title="مسح المحادثة"
            className="rounded-xl p-2 text-[#6B7280] hover:text-rose-600 hover:bg-slate-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          {isFloating && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'تصغير' : 'تكبير'}
              className="rounded-xl p-2 text-[#6B7280] hover:text-[#0D1B3E] hover:bg-slate-100 transition-colors"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="إغلاق"
              className="rounded-xl p-2 text-[#6B7280] hover:text-[#0D1B3E] hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F7FA]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-[#F5B301] text-[#0D1B3E]'
                : 'bg-purple-100 border border-purple-200 text-purple-700'
            }`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={`max-w-[82%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#F5B301] text-[#0D1B3E] font-medium rounded-tr-none shadow-xs'
                  : 'bg-white border border-slate-200 text-[#0D1B3E] rounded-tl-none shadow-xs'
              }`}>
                {msg.text}
                
                {msg.imageUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-200 max-w-xs bg-white p-1">
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded question" 
                      className="w-full h-auto object-cover max-h-48 rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#6B7280] block px-1">
                {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-center text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-2xl p-3.5 w-fit">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
            <span>المساعد الفيزيائي يحلل المسألة ويكتب الإجابة النموذجية...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="shrink-0 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>
      )}

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={selectedImage} alt="Selected" className="h-10 w-10 object-cover rounded-lg border border-purple-300" />
            <span className="text-xs text-purple-700 font-bold">تم إرفاق صورة المسألة</span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 text-[#6B7280] hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="رفع صورة لمسألة من كتاب أو امتحان"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-[#F5F7FA] text-[#6B7280] hover:text-purple-600 hover:border-purple-300 transition-all"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب سؤالك الفيزيائي أو ارفع صورة للمسألة..."
          className="flex-1 rounded-2xl border border-slate-200 bg-[#F5F7FA] px-4 py-2.5 text-xs sm:text-sm text-[#0D1B3E] placeholder:text-[#9CA3AF] focus:border-purple-500 focus:bg-white focus:outline-none transition-all"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedImage) || isLoading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition-all shadow-xs"
        >
          <Send className="h-5 w-5 -rotate-90" />
        </button>
      </form>

    </div>
  );
};
