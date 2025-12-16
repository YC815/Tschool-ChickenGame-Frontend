interface IndicatorReminderProps {
  indicatorSymbol: string;
  onClick: () => void;
}

export function IndicatorReminder({
  indicatorSymbol,
  onClick,
}: IndicatorReminderProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full relative overflow-hidden bg-black/30 backdrop-blur-md border border-amber-500/30 rounded-2xl p-3 transition-all hover:bg-black/40 active:scale-[0.98] text-left"
    >
      {/* 背景動態光影 (Sweep Effect) */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-200/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>

      <div className="flex items-center gap-4 relative z-10">
        
        {/* 圖示容器 (Slot) */}
        <div className="relative flex-shrink-0">
          {/* 背後呼吸燈光暈 */}
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-20 animate-pulse"></div>
          
          {/* 圖示外框 */}
          <div className="relative w-14 h-14 bg-gradient-to-br from-amber-500/10 to-amber-900/40 border border-amber-500/50 rounded-full flex items-center justify-center shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]">
            <span className="text-3xl filter drop-shadow-md transform transition-transform group-hover:scale-110 duration-300">
              {indicatorSymbol}
            </span>
            {/* 角落的小裝飾點 */}
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_rgba(251,191,36,0.8)]"></div>
          </div>
        </div>

        {/* 文字資訊區 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold bg-amber-500 text-amber-950 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider shadow-sm">
              物品
            </span>
            <p className="text-sm font-bold text-amber-50 tracking-wide">
              特殊身份指示物
            </p>
          </div>
        </div>

      </div>
    </button>
  );
}