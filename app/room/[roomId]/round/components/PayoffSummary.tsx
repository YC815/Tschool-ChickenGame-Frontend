import type { PlayerRoundHistoryEntry } from "@/lib/types";

interface PayoffSummaryProps {
  payoffHistory: PlayerRoundHistoryEntry[];
  totalPayoff: number;
}

export function PayoffSummary({
  payoffHistory,
  totalPayoff,
}: PayoffSummaryProps) {
  // 判斷分數顏色
  const isPositive = totalPayoff >= 0;
  const scoreColor = isPositive ? "text-emerald-400" : "text-red-400";
  const scoreBorder = isPositive ? "border-emerald-500/30" : "border-red-500/30";
  const scoreBg = isPositive ? "bg-emerald-500/10" : "bg-red-500/10";

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full">
      
      {/* 標題欄 */}
      <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
          <span>📊</span> 統計
        </h3>
        <span className="text-[10px] text-indigo-400/50 font-mono">
          紀錄 ID: {payoffHistory.length}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* 總分儀表板 */}
        <div className={`relative ${scoreBg} border ${scoreBorder} rounded-xl p-4 flex items-center justify-between shadow-lg`}>
          {/* 背景裝飾線 */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:10px_10px]"></div>
          
          <div className="relative z-10">
            <p className="text-[10px] text-white/60 font-bold uppercase mb-1">總分</p>
            <p className="text-xs text-white/40">累計收益點數</p>
          </div>
          
          <div className={`relative z-10 text-4xl font-black font-mono tracking-tighter ${scoreColor} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
            {totalPayoff > 0 ? "+" : ""}
            {totalPayoff}
          </div>
        </div>

        {/* 歷史紀錄 (Log) */}
        {payoffHistory.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-indigo-300/50 uppercase font-bold px-2">
              <span>回合順序</span>
              <span>結果</span>
            </div>
            
            <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {payoffHistory.map((record, index) => (
                <div
                  key={record.round_number}
                  className="group flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-200/50 font-mono">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm text-indigo-100 font-medium">
                      第 {record.round_number} 輪
                    </span>
                  </div>
                  
                  {(() => {
                    const payoff = record.your_payoff ?? 0;
                    const positive = payoff >= 0;
                    return (
                      <span
                        className={`font-bold font-mono text-sm ${
                          positive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {positive && payoff > 0 ? "+" : ""}
                        {payoff}
                      </span>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl">
            <p className="text-xs text-white/30 font-mono">暫無數據</p>
          </div>
        )}
      </div>
    </div>
  );
}
