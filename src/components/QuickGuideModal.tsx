import React, { useState } from 'react';
import { X, BookOpen, Users, UserPlus, FileSpreadsheet, FileText, CheckCircle2, RotateCcw, Eye, ArrowRight } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Guruh yaratish",
      icon: Users,
      desc: "Ustoz boshqaruv panelida 'Guruhlar' bo'limiga o'ting. 'Yangi guruh' tugmasini bosing, sinf yoki kurs nomini kiriting (masalan: '7-B' yoki 'IELTS Intensive') va saqlang.",
      tip: "Guruhlar orqali testlarni faqat kerakli sinf yoki kurs o'quvchilariga cheklash mumkin."
    },
    {
      title: "2. O‘quvchi qo‘shish",
      icon: UserPlus,
      desc: "Guruh kartasidagi 'O'quvchilar' bo'limini oching. 'O'quvchi qo'shish' tugmasi orqali ro'yxatdan o'tgan o'quvchilarni guruhga biriktiring. O'quvchi bir nechta guruhga ham a'zo bo'lishi mumkin.",
      tip: "O'quvchilar +998 telefon raqamlari orqali avtomatik aniqlanadi."
    },
    {
      title: "3. Test yaratish",
      icon: FileText,
      desc: "'Testlar' bo'limidan 'Yangi test yaratish'ni tanlang. Test sarlavhasi, fani, vaqt chegarasi (masalan: 30 daqiqa), o'tish foizi (masalan: 60%) va qaysi guruhga ochilishini belgilang.",
      tip: "Savollarni va variantlarni aralashtirish (randomize) funksiyasini yoqish tavsiya etiladi."
    },
    {
      title: "4. DOCX orqali savol yuklash",
      icon: BookOpen,
      desc: "'Savollarni import qilish' oynasida Word (.docx) faylini sudrab tashlang yoki matnni nusxalab joylashtiring. Tizim avtomatik tahlil qiladi va oldindan ko'rish (preview) jadvalida xatoliklarni ajratib ko'rsatadi.",
      tip: "To'g'ri variant oldiga * yulduzcha qo'yiladi (masalan: *B) To'g'ri javob)."
    },
    {
      title: "5. Testni guruhga ochish",
      icon: CheckCircle2,
      desc: "Test sozlamalarida ochilish va yopilish sanalarini belgilang va 'Faol' tugmachasini yoqing. Test avtomatik ravishda tanlangan guruh o'quvchilarining profilida paydo bo'ladi.",
      tip: "Server belgilangan vaqt kelguncha testni boshlashga ruxsat bermaydi."
    },
    {
      title: "6. Natijalarni ko‘rish",
      icon: Eye,
      desc: "'Natijalar' bo'limida barcha topshirilgan ishlarni real vaqt rejimida kuzatib boring. Har bir o'quvchining to'plagan bali, foizi, sarflagan vaqti va test vaqtida oynadan chiqishlar soni ko'rinadi.",
      tip: "Oynadan chiqishlar soni talabaning diqqati va halolligini baholashga yordam beradi."
    },
    {
      title: "7. Excel yuklab olish",
      icon: FileSpreadsheet,
      desc: "'Excel yuklab olish' tugmasini bosing. Siz umumiy jadvalni yoki har bir savol bo'yicha o'quvchilarning aniq bergan javoblari bilan batafsil .xlsx faylni olasiz.",
      tip: "Excel fayl guruh, test va sana filtrlari asosida avtomatik shakllanadi."
    },
    {
      title: "8. Qayta topshirishga ruxsat berish",
      icon: RotateCcw,
      desc: "Agar o'quvchining internetida jiddiy muammo yuz bergan bo'lsa yoki ustoz qayta sinov o'tkazmoqchi bo'lsa, 'Qayta topshirish' tugmasi orqali ruxsat berish mumkin. Sababi audit jurnalida saqlanadi.",
      tip: "Urinish qayta ochilganda o'quvchi testni yana boshidan topshira oladi."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Ustoz uchun Qisqa Qo‘llanma</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">8 qadamda tizimdan to‘liq professional foydalanish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar px-3 py-2 bg-slate-50/50 dark:bg-slate-900/50 gap-1">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeStep === idx
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>{idx + 1}</span>
            </button>
          ))}
        </div>

        {/* Active Step Details */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {(() => {
            const current = steps[activeStep];
            const StepIcon = current.icon;
            return (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">Qadam {activeStep + 1} / 8</span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{current.title}</h4>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                  {current.desc}
                </p>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-sm">
                  <strong className="font-semibold">Foydali maslahat: </strong>
                  {current.tip}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Oldingisi
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(prev => prev + 1)}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              Keyingisi <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              Tushundim, rahmat!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
