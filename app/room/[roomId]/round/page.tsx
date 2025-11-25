"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createWebSocket } from "@/lib/websocket";
import {
  getCurrentRound,
  getPlayerPair,
  submitAction,
  getRoundResult,
} from "@/lib/api";
import {
  loadPlayerContext,
  getRoundPhaseDescription,
  shouldShowCooperationHint,
} from "@/lib/utils";
import { CHOICE_LABELS, CHOICE_COLORS } from "@/lib/constants";
import type {
  Choice,
  RoundCurrentResponse,
  PairResponse,
  RoundResultResponse,
} from "@/lib/types";

type GameState =
  | "waiting_round"
  | "choosing_action"
  | "waiting_result"
  | "showing_result";

/**
 * 回合遊戲頁面（Round 1-10 共用）
 */
export default function RoundPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("waiting_round");
  const [currentRound, setCurrentRound] = useState<RoundCurrentResponse | null>(null);
  const [opponent, setOpponent] = useState<PairResponse | null>(null);
  const [result, setResult] = useState<RoundResultResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const playerContext = loadPlayerContext();

  // 提交選擇
  const handleChoice = async (choice: Choice) => {
    if (!playerContext || !currentRound || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await submitAction(roomId, currentRound.round_number, {
        player_id: playerContext.player_id,
        choice,
      });

      setGameState("waiting_result");
    } catch (err) {
      console.error("Failed to submit action:", err);
      alert("提交失敗，請重試");
      setIsSubmitting(false);
    }
  };

  // 拉取當前回合資訊
  const fetchRound = useCallback(async () => {
    if (!playerContext) return;

    try {
      const round = await getCurrentRound(roomId);
      setCurrentRound(round);

      if (round.status === "waiting_actions") {
        setGameState("choosing_action");

        // 拉取對手資訊
        const pair = await getPlayerPair(
          roomId,
          round.round_number,
          playerContext.player_id,
        );
        setOpponent(pair);
      } else if (round.status === "completed") {
        setGameState("showing_result");

        // 拉取結果
        const res = await getRoundResult(
          roomId,
          round.round_number,
          playerContext.player_id,
        );
        setResult(res);
      }
    } catch (err) {
      console.error("Failed to fetch round info:", err);
    }
  }, [roomId, playerContext]);

  // WebSocket 事件處理與初始載入
  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
      return;
    }

    const websocket = createWebSocket(roomId);

    websocket.on("ROUND_STARTED", () => {
      console.log("[Player] Round started");
      setGameState("waiting_round");
      setOpponent(null);
      setResult(null);
      setIsSubmitting(false);
      fetchRound();
    });

    websocket.on("ROUND_ENDED", () => {
      console.log("[Player] Round ended");
      fetchRound();
    });

    websocket.on("MESSAGE_PHASE", () => {
      console.log("[Player] Message phase");
      router.push(`/room/${roomId}/message`);
    });

    websocket.on("INDICATORS_ASSIGNED", () => {
      console.log("[Player] Indicators assigned");
      router.push(`/room/${roomId}/indicator`);
    });

    websocket.on("GAME_ENDED", () => {
      console.log("[Player] Game ended");
      router.push(`/room/${roomId}/summary`);
    });

    websocket.connect();

    // 初始載入回合資訊
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRound();

    return () => {
      websocket.disconnect();
    };
  }, [roomId, playerContext, router, fetchRound]);

  if (!playerContext || !currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  const roundNumber = currentRound.round_number;
  const phaseDesc = getRoundPhaseDescription(roundNumber);
  const showCoopHint = shouldShowCooperationHint(roundNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 頂部資訊 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                第 {roundNumber} 輪
              </h1>
              <p className="text-sm text-gray-500">{phaseDesc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">你是</p>
              <p className="text-lg font-semibold text-blue-600">
                {playerContext.display_name}
              </p>
            </div>
          </div>

          {/* 協作提示 */}
          {showCoopHint && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                💡 你現在可以跟擁有相同指示物的同學討論，再自行作答
              </p>
            </div>
          )}
        </div>

        {/* 遊戲區域 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 等待回合開始 */}
          {gameState === "waiting_round" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">等待老師開始本輪...</p>
            </div>
          )}

          {/* 選擇策略 */}
          {gameState === "choosing_action" && opponent && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">你的對手是</p>
                <p className="text-2xl font-bold text-gray-800">
                  {opponent.opponent_display_name}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-center text-gray-700 mb-6 font-medium">
                  選擇你的策略：
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleChoice("accelerate")}
                    disabled={isSubmitting}
                    className={`${CHOICE_COLORS.accelerate} text-white font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">🚗</div>
                    <div className="text-xl">{CHOICE_LABELS.accelerate}</div>
                  </button>
                  <button
                    onClick={() => handleChoice("turn")}
                    disabled={isSubmitting}
                    className={`${CHOICE_COLORS.turn} text-white font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">↩️</div>
                    <div className="text-xl">{CHOICE_LABELS.turn}</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 等待結果 */}
          {gameState === "waiting_result" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">已提交，等待結果...</p>
            </div>
          )}

          {/* 顯示結果 */}
          {gameState === "showing_result" && result && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  本輪結果
                </h2>
                <p className="text-gray-600">
                  你的對手：{result.opponent_display_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 你的選擇 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">你的選擇</p>
                  <p className="text-3xl mb-2">
                    {result.your_choice === "accelerate" ? "🚗" : "↩️"}
                  </p>
                  <p className="font-semibold text-gray-800 mb-3">
                    {CHOICE_LABELS[result.your_choice]}
                  </p>
                  <div className="text-3xl font-bold text-blue-600">
                    {result.your_payoff > 0 ? "+" : ""}
                    {result.your_payoff}
                  </div>
                </div>

                {/* 對手的選擇 */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">對手的選擇</p>
                  <p className="text-3xl mb-2">
                    {result.opponent_choice === "accelerate" ? "🚗" : "↩️"}
                  </p>
                  <p className="font-semibold text-gray-800 mb-3">
                    {CHOICE_LABELS[result.opponent_choice]}
                  </p>
                  <div className="text-3xl font-bold text-gray-600">
                    {result.opponent_payoff > 0 ? "+" : ""}
                    {result.opponent_payoff}
                  </div>
                </div>
              </div>

              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  等待老師開始下一輪...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
