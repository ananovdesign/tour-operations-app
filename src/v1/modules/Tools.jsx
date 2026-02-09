import React, { useState } from 'react';
import { 
  FileText, CheckCircle, FileSignature, 
  Megaphone, Ticket, ExternalLink, Bus, ArrowLeft 
} from 'lucide-react';

const Tools = ({ lang = 'bg' }) => {
  // Състояние за следене на активния инструмент (ако е null, показваме списъка)
  const [activeTool, setActiveTool] = useState(null);
  
  const t = {
    bg: {
      title: "Бързи Инструменти",
      subtitle: "Достъп до външни приложения и генератори",
      back: "Назад към инструменти",
      tools: [
        { id: 'ccontract', name: "Генератор Договори", desc: "ccontract.html", file: "/ccontract.html", icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
        { id: 'transport', name: "Договор Транспорт", desc: "transportcontract.html", file: "/transportcontract.html", icon: Bus, color: "text-indigo-600", bg: "bg-indigo-50" },
        { id: 'confirmation', name: "Потвърждение", desc: "confirmation.html", file: "/confirmation.html", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: 'invoice', name: "Фактури (Legacy)", desc: "createinvoice.html", file: "/createinvoice.html", icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
    
        { id: 'voucher', name: "Ваучер (Legacy)", desc: "voucher.html", file: "/voucher.html", icon: Ticket, color: "text-purple-600", bg: "bg-purple-50" },
      ]
    },
    en: {
      title: "Quick Tools",
      subtitle: "Access to external apps and generators",
      back: "Back to tools",
      tools: [
        { id: 'ccontract', name: "Contract Generator", desc: "ccontract.html", file: "/ccontract.html", icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
        { id: 'transport', name: "Transport Contract", desc: "transportcontract.html", file: "/transportcontract.html", icon: Bus, color: "text-indigo-600", bg: "bg-indigo-50" },
        { id: 'confirmation', name: "Confirmation", desc: "confirmation.html", file: "/confirmation.html", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: 'invoice', name: "Invoices (Legacy)", desc: "createinvoice.html", file: "/createinvoice.html", icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
        { id: 'offer', name: "Offer", desc: "offer.html", file: "/offer.html", icon: Megaphone, color: "text-orange-600", bg: "bg-orange-50" },
        { id: 'voucher', name: "Voucher (Legacy)", desc: "voucher.html", file: "/voucher.html", icon: Ticket, color: "text-purple-600", bg: "bg-purple-50" },
      ]
    }
  }[lang] || lang.bg;

  // Функция за отваряне на инструмент в текущия изглед
  const handleOpenTool = (tool) => {
    setActiveTool(tool);
    // Скролваме леко нагоре, за да се види началото на формата
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Ако има избран инструмент, показваме Iframe изглед
  if (activeTool) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 pb-20 font-sans">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm sticky top-4 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-bold text-sm"
            >
              <ArrowLeft size={18} />
              {t.back}
            </button>
            <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            <h2 className="hidden md:flex items-center gap-2 text-lg font-black text-slate-800 dark:text-white">
              <activeTool.icon size={20} className={activeTool.color} />
              {activeTool.name}
            </h2>
          </div>
          
          {/* Option to open in new tab if iframe is too cramped */}
          <a 
            href={activeTool.file} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
            title="Отвори в нов прозорец"
          >
            <ExternalLink size={20} />
          </a>
        </div>

        {/* Iframe Container */}
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200 h-[85vh]">
          <iframe 
            src={activeTool.file}
            title={activeTool.name}
            className="w-full h-full border-0"
            style={{ display: 'block' }} 
          />
        </div>
      </div>
    );
  }

  // Стандартен Grid изглед (Меню)
  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans relative pb-20">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">
            {t.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t.subtitle}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {t.tools.map((tool) => {
            const Icon = tool.icon;
            return (
                <div 
                    key={tool.id}
                    onClick={() => handleOpenTool(tool)}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                >
                    <div className="flex items-start justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${tool.bg} ${tool.color}`}>
                            <Icon size={32} />
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 group-hover:text-blue-500 transition-colors">
                            <ExternalLink size={20} />
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">
                        {tool.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {tool.desc}
                    </p>
                </div>
            );
        })}
      </div>

    </div>
  );
};

export default Tools;
