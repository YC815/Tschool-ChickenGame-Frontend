import { CHOICE_LABELS } from "@/lib/constants";
import type { Choice, RoomStateData } from "@/lib/types";

interface WaitingResultViewProps {
  roomState: RoomStateData;
  choiceToShow: Choice | null;
}

export function WaitingResultView({
  roomState,
  choiceToShow,
}: WaitingResultViewProps) {
  
  // 取得狀態對應的顯示文字與動畫狀態
  const getStatusConfig = () => {
    const status = roomState.round.status;
    
    if (status === "waiting_actions") {
      return {
        text: "WAITING FOR PLAYERS...",
        subtext: "您已選擇，等待其他玩家",
        color: "text-indigo-300"
      };
    }
    if (status === "ready_to_publish") {
      return {
        text: "PROCESSING RESULTS...",
        subtext: "全員已鎖定，等待公布結果",
        color: "text-emerald-300"
      };
    }
    if (status === "completed") {
      return {
        text: "DOWNLOADING DATA...",
        subtext: "正在取得賽局結果",
        color: "text-white"
      };
    }
    return { text: "STANDBY...", subtext: "等待中...", color: "text-gray-400" };
  };

  const statusConfig = getStatusConfig();

  // 取得選擇對應的顏色樣式
  const choiceStyle = choiceToShow === "ACCELERATE" 
    ? "from-rose-500 to-red-600 border-red-500/50 shadow-red-900/40"
    : "from-blue-400 to-indigo-600 border-blue-500/50 shadow-blue-900/40";

  const choiceIcon = choiceToShow === "ACCELERATE" ? "🙅" : "🙏";

  return (
    <div className="flex flex-col items-center justify-center py-8 w-full">
      
      {/* 1. 科技感 Loading 動畫 */}
      <div className="relative w-24 h-24 mb-8">
        {/* 外圈旋轉 */}
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
        
        {/* 內圈反向旋轉 */}
        <div className="absolute inset-4 border-4 border-purple-500/20 rounded-full"></div>
        <div className="absolute inset-4 border-4 border-b-purple-400 border-t-transparent border-l-transparent border-r-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
        
        {/* 中心圖示 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>
      </div>

      {/* 2. 狀態文字 */}
      <div className="text-center mb-8 space-y-1">
        <p className={`text-sm font-bold font-mono tracking-widest uppercase animate-pulse ${statusConfig.color}`}>
          {statusConfig.text}
        </p>
        <p className="text-white/50 text-xs font-medium">
          {statusConfig.subtext}
        </p>
      </div>

      {/* 3. 已鎖定的指令卡片 (Locked Command) */}
      {choiceToShow && (
        <div className="w-full max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-700">
          <div className="relative bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-1 overflow-hidden">
            
            {/* 掃描線特效 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-[translate-y_2s_linear_infinite]"></div>

            <div className={`
              relative rounded-xl bg-gradient-to-br ${choiceStyle} border p-4
              flex items-center justify-between gap-4
            `}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-xl">
                  {choiceIcon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    您的選擇已鎖定
                  </span>
                  <span className="text-lg font-black text-white uppercase tracking-wide">
                    {CHOICE_LABELS[choiceToShow]}
                  </span>
                </div>
              </div>

              {/* 鎖頭圖示 */}
              <div className="text-white/80 text-xl">
                🔒
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/30 mt-2 font-mono">
            ID: {Date.now().toString().slice(-6)}
          </p>
        </div>
      )}
    </div>
  );
}