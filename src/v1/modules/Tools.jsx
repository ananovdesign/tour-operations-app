import React from 'react';
import { 
  FileText, CheckCircle, FileSignature, 
  Megaphone, Ticket, ExternalLink 
} from 'lucide-react';

const Tools = ({ lang = 'bg' }) => {
  
  const t = {
    bg: {
      title: "Бързи Инструменти",
      subtitle: "Достъп до външни приложения и генератори",
      open: "Отвори",
      tools: [
        { id: 'ccontract', name: "Генератор Договори", desc: "ccontract.html", file: "/ccontract.html", icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
        { id: 'confirmation', name: "Потвърждение", desc: "confirmation.html", file: "/confirmation.html", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: 'invoice', name: "Фактури (Legacy)", desc: "createinvoice.html", file: "/createinvoice.html", icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
        { id: 'offer', name: "Оферта", desc: "offer.html", file: "/offer.html", icon: Megaphone, color: "text-orange-600", bg: "bg-orange-50" },
        { id: 'voucher', name: "Ваучер (Legacy)", desc: "voucher.html", file: "/voucher.html", icon: Ticket, color: "text-purple-600", bg: "bg-purple-50" },
      ]
    },
    en: {
      title: "Quick Tools",
      subtitle: "Access to external apps and generators",
      open: "Open",
      tools: [
        { id: 'ccontract', name: "Contract Generator", desc: "ccontract.html", file: "/ccontract.html", icon: FileSignature, color: "text-blue-600", bg: "bg-blue-50" },
        { id: 'confirmation', name: "Confirmation", desc: "confirmation.html", file: "/confirmation.html", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: 'invoice', name: "Invoices (Legacy)", desc: "createinvoice.html", file: "/createinvoice.html", icon: FileText, color: "text-slate-600", bg: "bg-slate-50" },
        { id: 'offer', name: "Offer", desc: "offer.html", file: "/offer.html", icon: Megaphone, color: "text-orange-600", bg: "bg-orange-50" },
        { id: 'voucher', name: "Voucher (Legacy)", desc: "voucher.html", file: "/voucher.html", icon: Ticket, color: "text-purple-600", bg: "bg-purple-50" },
      ]
    }
  }[lang] || lang.bg;

  const handleOpenTool = (file) => {
    // Отваря файла в нов таб. Файловете трябва да са в папка /public
    window.open(file, '_blank');
  };

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
                    onClick={() => handleOpenTool(tool.file)}
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
