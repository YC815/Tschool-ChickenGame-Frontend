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

  const playerContext = loadPlayerContext();

  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
      return;
    }

    const fetchSummary = async () => {
      try {
        const data = await getGameSummary(roomId);
        setSummary(data);
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };

    fetchSummary();
  }, [roomId, playerContext, router]);

  const handleExit = () => {
    clearPlayerContext();
    router.push("/join");
  };

  if (!playerContext || !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  // 找到自己的排名
  const myRank = summary.players.findIndex(
    (p) => p.display_name === playerContext.display_name,
  );
  const myScore = summary.players[myRank]?.total_payoff || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* 標題 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            遊戲結束！
          </h1>
          <p className="text-gray-600">
            感謝參與膽小鬼賽局
          </p>
        </div>

        {/* 個人成績 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            你的成績
          </h2>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">你的排名</p>
              <p className="text-5xl font-bold text-emerald-600">
                #{myRank + 1}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">總分</p>
              <p className="text-5xl font-bold text-gray-800">
                {myScore > 0 ? "+" : ""}
                {myScore}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 text-center">
              你是 <span className="font-semibold text-emerald-600">{playerContext.display_name}</span>
            </p>
          </div>
        </div>

        {/* 整體統計 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            全班統計
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">加速比例</p>
              <p className="text-3xl font-bold text-red-600">
                {(summary.stats.accelerate_ratio * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">轉彎比例</p>
              <p className="text-3xl font-bold text-blue-600">
                {(summary.stats.turn_ratio * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* 排行榜（顯示前 10 名）*/}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">排行榜</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {summary.players.slice(0, 10).map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    player.display_name === playerContext.display_name
                      ? "bg-emerald-100 border-2 border-emerald-400"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`text-lg font-bold ${
                        player.display_name === playerContext.display_name
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div
                      className={`font-semibold ${
                        player.display_name === playerContext.display_name
                          ? "text-emerald-700"
                          : "text-gray-700"
                      }`}
                    >
                      {player.display_name}
                    </div>
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      player.display_name === playerContext.display_name
                        ? "text-emerald-600"
                        : "text-gray-600"
                    }`}
                  >
                    {player.total_payoff > 0 ? "+" : ""}
                    {player.total_payoff}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 離開按鈕 */}
        <div className="text-center">
          <button
            onClick={handleExit}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-12 py-4 rounded-lg transition shadow-lg hover:shadow-xl"
          >
            離開遊戲
          </button>
        </div>
      </div>
    </div>
  );
}
