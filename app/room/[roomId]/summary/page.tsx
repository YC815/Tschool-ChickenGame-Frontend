"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getGameSummary } from "@/lib/api";
import { loadPlayerContext, clearPlayerContext } from "@/lib/utils";
import type { GameSummaryResponse } from "@/lib/types";

/**
 * 遊戲結束摘要頁面
 */
export default function SummaryPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [summary, setSummary] = useState<GameSummaryResponse | null>(null);
  // 增加一個載入動畫狀態，讓數字有跳動感
  const [animateReveal, setAnimateReveal] = useState(false);

  const playerContext = loadPlayerContext();

  useEffect(() => {
    if (!playerContext) {
      router.push("");
      return;
    }

    const fetchSummary = async () => {
      try {
        const data = await getGameSummary(roomId, playerContext.player_id);
        setSummary(data);
        // 資料載入後，延遲一點點觸發動畫
        setTimeout(() => setAnimateReveal(true), 100);
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };

    fetchSummary();
  }, [roomId, playerContext, router]);

  const handleExit = () => {
    clearPlayerContext();
    router.push("");
  };

  if (!playerContext || !summary) {
    // 載入畫面：保持手遊風格的 Loading
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-bold tracking-widest animate-pulse">不要等了直接關掉，沒有彩蛋！</p>
        </div>
      </div>
    );
  }

  // 找到自己的排名
  const myRank = summary.players.findIndex(
    (p) => p.display_name === playerContext.display_name,
  );
  const myScore =
    summary.player_total_payoff ??
    summary.players[myRank]?.total_payoff ??
    0;

  const payoffHistory = summary.player_history ?? [];

  // 根據排名決定徽章顏色
  const getRankColor = (rank: number) => {
    if (rank === 0) return "bg-yellow-400 border-yellow-200 text-yellow-900"; // 金
    if (rank === 1) return "bg-slate-300 border-slate-100 text-slate-800"; // 銀
    if (rank === 2) return "bg-orange-400 border-orange-200 text-orange-900"; // 銅
    return "bg-indigo-500 border-indigo-400 text-white"; // 其他
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 text-white overflow-x-hidden">
      
      {/* 背景裝飾光暈 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] bg-purple-500 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[40%] bg-blue-500 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto p-6 pb-24">
        
        {/* 頭部標題 */}
        <div className="text-center mb-8 animate-in slide-in-from-top-4 duration-700">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-widest uppercase mb-2 backdrop-blur-md">
            {playerContext.room_code}
          </span>
          <h1 className="text-4xl font-black italic tracking-tighter drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
            賽局結束
          </h1>
        </div>

        {/* --- 主要成績卡片 (Hero Card) --- */}
        <div className={`transform transition-all duration-700 ${animateReveal ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            
            {/* 卡片背景光效 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex flex-col items-center justify-center relative z-10">
              <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-4">最終排名</p>
              
              {/* 排名徽章 */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(255,255,255,0.3)] mb-4 ${getRankColor(myRank)}`}>
                <span className="text-6xl font-black">
                  {myRank + 1}
                </span>
              </div>

              {/* 分數 */}
              <div className="text-center">
                <p className="text-indigo-200 text-xs uppercase font-bold mb-1">總分</p>
                <p className={`text-5xl font-black tabular-nums tracking-tight drop-shadow-md ${myScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {myScore > 0 ? "+" : ""}
                  {myScore}
                </p>
              </div>

              <div className="mt-6 bg-black/20 rounded-full px-6 py-2">
                <p className="text-sm font-medium text-white/80">
                  玩家: <span className="text-white font-bold">{playerContext.display_name}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- 統計數據與圖表區 --- */}
        <div className={`mt-6 grid grid-cols-2 gap-4 transition-all duration-700 delay-150 ${animateReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* 不道歉比例 */}
          <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">🫵</div>
            <p className="text-xs text-red-200 font-bold uppercase">不道歉比例</p>
            <p className="text-2xl font-black text-white">
              {(summary.stats.accelerate_ratio * 100).toFixed(0)}<span className="text-sm">%</span>
            </p>
            {/* 進度條 */}
            <div className="w-full h-1.5 bg-black/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${summary.stats.accelerate_ratio * 100}%` }}></div>
            </div>
          </div>

          {/* 轉彎比例 */}
          <div className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">👍</div>
            <p className="text-xs text-blue-200 font-bold uppercase">道歉比例</p>
            <p className="text-2xl font-black text-white">
              {(summary.stats.turn_ratio * 100).toFixed(0)}<span className="text-sm">%</span>
            </p>
            {/* 進度條 */}
            <div className="w-full h-1.5 bg-black/30 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-400" style={{ width: `${summary.stats.turn_ratio * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* --- 詳細記錄區塊 (Tab Style) --- */}
        <div className={`mt-8 space-y-6 transition-all duration-700 delay-300 ${animateReveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* 1. 你的收益明細 */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-1">
             <div className="bg-indigo-900/50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📊</span> 分數紀錄
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {payoffHistory.length === 0 ? (
                    <p className="text-white/40 text-center py-4 text-sm">沒有找到記錄</p>
                  ) : (
                    payoffHistory.map((record) => {
                      const payoff = record.your_payoff ?? 0;
                      const positive = payoff >= 0;
                      const className =
                        payoff > 0
                          ? "text-green-400"
                          : payoff < 0
                            ? "text-red-400"
                            : "text-gray-400";
                      return (
                      <div
                        key={record.round_number}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-indigo-200 text-xs font-bold">第 {record.round_number} 輪</span>
                        <span
                          className={`font-black font-mono ${className}`}
                        >
                          {positive && payoff > 0 ? "+" : ""}
                          {payoff}
                        </span>
                      </div>
                      );
                    })
                  )}
                </div>
             </div>
          </div>

          {/* 2. 排行榜 */}
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-1">
             <div className="bg-indigo-900/50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>🏆</span> 排行榜
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {summary.players.slice(0, 10).map((player, index) => {
                    const isMe = player.display_name === playerContext.display_name;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isMe
                            ? "bg-indigo-600/60 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] scale-[1.02]"
                            : "bg-white/5 border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                            index < 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-white/10 text-white/50'
                          }`}>
                            {index + 1}
                          </div>
                          <div className={`font-bold text-sm ${isMe ? "text-white" : "text-indigo-100"}`}>
                            {player.display_name}
                            {isMe && <span className="ml-2 text-[10px] bg-indigo-400 text-white px-1.5 py-0.5 rounded">你</span>}
                          </div>
                        </div>
                        <div className={`font-black font-mono ${isMe ? "text-white" : "text-indigo-200"}`}>
                          {player.total_payoff}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>
        </div>

        {/* --- 離開按鈕 (底部固定) --- */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-indigo-900 via-indigo-900/90 to-transparent z-50">
          <button
            onClick={handleExit}
            className="group relative w-full h-14 touch-manipulation"
          >
            {/* 按鈕陰影層 */}
            <div className="absolute inset-0 bg-slate-700 rounded-xl transition-transform translate-y-1 group-active:translate-y-0"></div>
            
            {/* 按鈕本體 */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-600 rounded-xl transition-transform border-b-4 border-slate-800 group-active:translate-y-1 group-active:border-b-0 hover:bg-slate-500">
              <span className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                <span>🚪</span> 離開賽局
              </span>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
