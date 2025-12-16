import { CHOICE_LABELS } from "@/lib/constants";
import type { Choice } from "@/lib/types";
import type { OpponentMessageStatus } from "../hooks/useGamePhase";
import { OpponentMessageStatusView } from "./OpponentMessageStatus";

interface ChoosingActionViewProps {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  onChoice: (choice: Choice) => void;
  // Round 5-6 專用
  isMessageRound?: boolean;
  myMessage?: string | null;
  opponentMessageStatus?: OpponentMessageStatus;
  opponentMessage?: string | null;
}

export function ChoosingActionView({
  isSubmitting,
  hasSubmitted,
  onChoice,
  isMessageRound = false,
  myMessage = null,
  opponentMessageStatus = "none",
  opponentMessage = null,
}: ChoosingActionViewProps) {
  
  // 定義按鈕樣式配置 (不使用原本的 CHOICE_COLORS，改用更精緻的手遊風格)
  const buttonStyles = {
    ACCELERATE: {
      gradient: "bg-gradient-to-b from-rose-500 to-red-600",
      border: "border-red-800",
      shadow: "shadow-red-900/50",
      icon: "⚡️", // 更換為更有衝擊感的圖示，或沿用原本的
      bgActive: "active:translate-y-2 active:border-b-0",
      text: "text-red-50"
    },
    TURN: {
      gradient: "bg-gradient-to-b from-blue-400 to-blue-600",
      border: "border-blue-800",
      shadow: "shadow-blue-900/50",
      icon: "🕊️", // 或沿用原本的 🙏
      bgActive: "active:translate-y-2 active:border-b-0",
      text: "text-blue-50"
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Round 5-6: 顯示通訊區塊 */}
      {isMessageRound && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          
          {/* 對手訊息 (假設 OpponentMessageStatusView 內部已適配，這裡只處理容器) */}
          <div className="relative z-10">
             <OpponentMessageStatusView
              status={opponentMessageStatus}
              message={opponentMessage}
            />
          </div>

          {/* 你的留言 (改為發送訊號樣式) */}
          {myMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 relative overflow-hidden group">
              {/* 掃描線動畫背景 */}
              <div className="absolute top-0 left-0 w-full h-full bg-emerald-400/5 translate-y-full group-hover:translate-y-0 transition-transform duration-1000"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    您的留言已發送
                  </span>
                  <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                    {myMessage}
                  </span>
                </div>
                <div className="text-emerald-500 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 策略選擇區 (置底或填充剩餘空間) */}
      <div className="mt-auto">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-80">
          <div className="h-[1px] w-8 bg-white/30"></div>
          <p className="text-center text-indigo-100 text-xs font-bold tracking-[0.2em] uppercase">
            請選擇
          </p>
          <div className="h-[1px] w-8 bg-white/30"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* 直衝按鈕 (Accelerate) */}
          <button
            onClick={() => onChoice("ACCELERATE")}
            disabled={isSubmitting || hasSubmitted}
            className={`
              group relative w-full h-32 rounded-2xl transition-all duration-100 touch-manipulation
              ${hasSubmitted ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}
            `}
          >
            {/* 按鈕陰影/厚度層 */}
            <div className={`absolute inset-0 rounded-2xl bg-red-900 translate-y-2 ${!hasSubmitted && 'group-active:translate-y-0'}`}></div>
            
            {/* 按鈕本體 */}
            <div className={`
              absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-b-4 border-red-800
              bg-gradient-to-b from-rose-500 via-red-500 to-red-600
              ${!hasSubmitted ? 'group-active:translate-y-2 group-active:border-b-0' : ''}
              shadow-lg shadow-red-900/30
            `}>
              <div className="text-5xl mb-2 drop-shadow-md filter transition-transform group-hover:scale-110">
                🙅
              </div>
              <div className="text-lg font-black text-white tracking-wider uppercase drop-shadow-sm">
                {CHOICE_LABELS.ACCELERATE}
              </div>
            </div>
          </button>

          {/* 轉彎按鈕 (Turn) */}
          <button
            onClick={() => onChoice("TURN")}
            disabled={isSubmitting || hasSubmitted}
            className={`
              group relative w-full h-32 rounded-2xl transition-all duration-100 touch-manipulation
              ${hasSubmitted ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}
            `}
          >
            {/* 按鈕陰影/厚度層 */}
            <div className={`absolute inset-0 rounded-2xl bg-blue-900 translate-y-2 ${!hasSubmitted && 'group-active:translate-y-0'}`}></div>
            
            {/* 按鈕本體 */}
            <div className={`
              absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-b-4 border-blue-800
              bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600
              ${!hasSubmitted ? 'group-active:translate-y-2 group-active:border-b-0' : ''}
              shadow-lg shadow-blue-900/30
            `}>
              <div className="text-5xl mb-2 drop-shadow-md filter transition-transform group-hover:scale-110">
                🙏
              </div>
              <div className="text-lg font-black text-white tracking-wider uppercase drop-shadow-sm">
                {CHOICE_LABELS.TURN}
              </div>
            </div>
          </button>
        </div>

        {/* 狀態文字 */}
        {hasSubmitted && (
          <div className="mt-4 text-center animate-pulse">
            <span className="text-xs font-bold text-white/60 bg-black/20 px-3 py-1 rounded-full">
              留言已發送，等待對手...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}