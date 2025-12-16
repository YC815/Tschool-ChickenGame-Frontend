import type { RoomStateData } from "@/lib/types";

interface SubmissionProgressProps {
  roomState: RoomStateData;
}

export function SubmissionProgress({ roomState }: SubmissionProgressProps) {
  const submittedCount = roomState.round.submitted_actions;
  const totalCount = roomState.round.total_players;
  const percentage = (submittedCount / totalCount) * 100;
  
  // 判斷是否全體完成
  const isComplete = percentage === 100;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* 頂部標籤與數字 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {/* 狀態燈 */}
          <div className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
            {isComplete ? "準備公布" : "等待玩家"}
          </span>
        </div>
        <span className="text-xs font-black font-mono text-white tracking-wider">
          {submittedCount.toString().padStart(2, '0')} 
          <span className="text-white/40 mx-1">/</span> 
          {totalCount.toString().padStart(2, '0')}
        </span>
      </div>

      {/* 進度條容器 */}
      <div className="relative h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
        
        {/* 背景裝飾：斜線條紋 (工程風格) */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_25%,rgba(255,255,255,0.5)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.5)_75%,rgba(255,255,255,0.5)_100%)] bg-[length:8px_8px]"></div>

        {/* 實際進度條 */}
        <div
          className={`h-full relative transition-all duration-700 ease-out flex items-center justify-end
            ${isComplete 
              ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]' 
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
            }
          `}
          style={{ width: `${percentage}%` }}
        >
          {/* 只有在未完成時，顯示進度條末端的亮光特效 */}
          {!isComplete && (
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[1px] shadow-[0_0_5px_white]"></div>
          )}
        </div>
      </div>
    </div>
  );
}