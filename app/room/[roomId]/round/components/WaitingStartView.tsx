import type { PlayerContext, RoomStateData } from "@/lib/types";

interface WaitingStartViewProps {
  roomState: RoomStateData;
  playerContext: PlayerContext;
}

export function WaitingStartView({
  roomState,
  playerContext,
}: WaitingStartViewProps) {
  return (
    <div className="w-full max-w-md flex flex-col gap-6 p-4">
      
      {/* 頂部狀態燈 */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
            連線到大廳
          </span>
        </div>
      </div>

      {/* 房間代碼顯示器 (主要視覺) */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-slate-900 border border-indigo-500/30 rounded-xl p-8 flex flex-col items-center justify-center shadow-2xl">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em] mb-2">
            房間
          </p>
          <div className="text-6xl font-black font-mono text-white tracking-widest drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {roomState.room.code}
          </div>
          <div className="mt-4 flex items-center gap-2 text-indigo-200/50 text-xs">
            <span>📡</span>
            <span>等待老師開始</span>
          </div>
        </div>
      </div>

      {/* 資訊卡片網格 */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* 玩家人數計數器 */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
          </div>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">
            玩家
          </p>
          <p className="text-3xl font-bold text-white">
            {roomState.room.player_count}
          </p>
        </div>

        {/* 玩家身份卡 */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-10">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
          </div>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">
            暱稱
          </p>
          <p className="text-lg font-bold text-emerald-400 truncate max-w-full">
            {playerContext.display_name}
          </p>
        </div>

      </div>

      {/* 底部等待雷達動畫 */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-t-4 border-indigo-400 rounded-full animate-spin"></div>
          <div className="absolute inset-4 bg-indigo-500/20 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-indigo-200 animate-pulse">
          等待遊戲開始...
        </p>
      </div>

    </div>
  );
}