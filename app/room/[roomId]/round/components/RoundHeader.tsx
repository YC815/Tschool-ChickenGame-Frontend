import type { RoomStateData } from "@/lib/types";

interface RoundHeaderProps {
  roomState: RoomStateData;
  indicatorSymbol: string | null;
  onIndicatorClick: () => void;
}

export function RoundHeader({
  roomState,
  indicatorSymbol,
  onIndicatorClick,
}: RoundHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      
      {/* 左側：回合資訊 */}
      <div className="flex flex-col">
        {/* 房間代碼標籤 */}
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-indigo-500/20 border border-indigo-400/30 rounded px-2 py-0.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></div>
            <span className="text-[10px] font-mono font-bold text-indigo-300 tracking-wider">
              ID: {roomState.room.code}
            </span>
          </div>
        </div>

        {/* 回合數大標題 */}
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">
            第
          </span>
          <span className="text-5xl font-black text-white leading-none drop-shadow-lg">
            {roomState.round.round_number.toString().padStart(2, '0')}
          </span>
          <span className="text-sm font-bold text-indigo-200 uppercase tracking-widest">
            輪
          </span>
        </div>
      </div>

      {/* 右側：指示物 (Status Item) */}
      {indicatorSymbol && (
        <button
          onClick={onIndicatorClick}
          className="relative group outline-none"
          title="查看狀態"
        >
          {/* 背景光暈 (Idle Animation) */}
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-20 group-hover:opacity-40 animate-pulse transition-opacity"></div>
          
          {/* 道具外框 */}
          <div className="relative w-16 h-16 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-transform duration-100 overflow-hidden">
            
            {/* 內部光澤 */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-full"></div>
            
            {/* 符號 */}
            <span className="text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] z-10 group-hover:scale-110 transition-transform">
              {indicatorSymbol}
            </span>

            {/* 小角標 (Info) */}
            <div className="absolute bottom-1 right-1/2 translate-x-1/2 w-4 h-1 bg-amber-500/50 rounded-full blur-[1px]"></div>
          </div>
        </button>
      )}
    </div>
  );
}