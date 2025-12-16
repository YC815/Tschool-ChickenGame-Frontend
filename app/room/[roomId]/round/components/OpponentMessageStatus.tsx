export type OpponentMessageStatus = "typing" | "sent" | "none";

interface OpponentMessageStatusProps {
  status: OpponentMessageStatus;
  message: string | null;
}

export function OpponentMessageStatusView({
  status,
  message,
}: OpponentMessageStatusProps) {
  if (status === "none") return null;

  // 1. 對方正在輸入 (偵測到訊號)
  if (status === "typing") {
    return (
      <div className="relative overflow-hidden bg-sky-900/30 backdrop-blur-md border border-sky-500/30 rounded-xl p-4 mb-4 animate-pulse">
        
        {/* 背景掃描線效果 */}
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,transparent_50%,rgba(14,165,233,0.1)_50%)] bg-[length:100%_4px]"></div>

        <div className="flex items-center gap-3 relative z-10">
          {/* 動態波形圖示 */}
          <div className="flex items-end gap-1 h-4">
            <span className="w-1 bg-sky-400 rounded-sm animate-[bounce_1s_infinite] h-2"></span>
            <span className="w-1 bg-sky-400 rounded-sm animate-[bounce_1s_infinite_0.2s] h-3"></span>
            <span className="w-1 bg-sky-400 rounded-sm animate-[bounce_1s_infinite_0.4s] h-4"></span>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-sky-300 uppercase tracking-widest leading-none mb-1">
              狀態:
            </p>
            <p className="text-sm font-bold text-white tracking-wide">
              對方正在輸入中...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. 對方已發送 (收到訊息)
  if (status === "sent" && message) {
    return (
      <div className="relative group">
        {/* 發光外框效果 */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
        
        <div className="relative bg-slate-900 border border-sky-500/50 rounded-xl p-4 mb-4 shadow-lg">
          {/* 標題欄 */}
          <div className="flex items-center justify-between mb-2 border-b border-sky-500/20 pb-2">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              收到的訊息
            </span>
            <span className="text-[10px] text-sky-600 font-mono">
              來自: 對面的好夥伴
            </span>
          </div>

          {/* 訊息內容 */}
          <div className="py-2">
             <p className="text-4xl text-center filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)] animate-in zoom-in-50 duration-300">
               {message}
             </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}