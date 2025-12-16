import { useRouter } from "next/navigation";
import type { PlayerContext } from "@/lib/types";

interface LoadingViewProps {
  playerContext: PlayerContext;
  pollError: string;
  onRetry: () => void;
}

export function LoadingView({
  playerContext,
  pollError,
  onRetry,
}: LoadingViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px]">
      
      {/* Loading 動畫 */}
      <div className="relative mb-8">
        <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-2xl animate-pulse">📡</span>
        </div>
      </div>

      <h1 className="text-2xl font-black text-white mb-2 tracking-wide">
        正在同步資料...
      </h1>
      <p className="text-indigo-200/70 text-sm mb-8 px-4 text-center">
        正在與遊戲主機建立連線，請稍候...
      </p>

      {/* 玩家資訊卡 (Data Cards) */}
      <div className="w-full grid grid-cols-2 gap-4 mb-8">
        {/* 房間代碼 */}
        <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-4 flex flex-col items-center">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">
            房間
          </p>
          <p className="text-2xl font-mono font-black text-white tracking-wider">
            {playerContext.room_code}
          </p>
        </div>
        
        {/* 玩家暱稱 */}
        <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-xl p-4 flex flex-col items-center">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">
            玩家
          </p>
          <p className="text-xl font-bold text-white truncate max-w-full">
            {playerContext.display_name}
          </p>
        </div>
      </div>

      {pollError && (
        <div className="w-full bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6 text-center animate-pulse">
          <p className="text-red-200 text-xs font-bold">⚠️ 連線錯誤: {pollError}</p>
        </div>
      )}

      {/* 按鈕區 */}
      <div className="w-full space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-indigo-900/50 border border-indigo-400/20 active:scale-[0.98]"
        >
          重新連線
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-transparent hover:bg-white/5 text-indigo-200 font-semibold py-3.5 rounded-xl transition border border-white/10 active:scale-[0.98]"
        >
          返回大廳
        </button>
      </div>
    </div>
  );
}