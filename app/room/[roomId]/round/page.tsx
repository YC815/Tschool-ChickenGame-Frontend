"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createWebSocket } from "@/lib/websocket";
import {
  getCurrentRound,
  getPlayerPair,
  submitAction,
  getRoundResult,
  getRoomStatus,
  getMessage,
  sendMessage,
  getPlayerIndicator,
  APIError,
} from "@/lib/api";
import {
  loadPlayerContext,
  getRoundPhaseDescription,
  shouldShowMessagePrompt,
  shouldShowCooperationHint,
} from "@/lib/utils";
import { CHOICE_LABELS, CHOICE_COLORS } from "@/lib/constants";
import type {
  Choice,
  RoomStatusResponse,
  RoundCurrentResponse,
  PairResponse,
  RoundResultResponse,
} from "@/lib/types";

type GameState =
  | "waiting_game_start" // 加入房間後，等待 Host 開始遊戲
  | "waiting_round"       // 遊戲進行中，等待下一輪
  | "choosing_action"
  | "waiting_result"
  | "showing_result";

/**
 * 回合遊戲頁面（Round 1-10 共用，整合 Message 和 Indicator 功能）
 */
export default function RoundPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>("waiting_game_start");
  const [roomInfo, setRoomInfo] = useState<RoomStatusResponse | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundCurrentResponse | null>(null);
  const [opponent, setOpponent] = useState<PairResponse | null>(null);
  const [result, setResult] = useState<RoundResultResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Message 相關狀態
  const [showMessage, setShowMessage] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [myMessage, setMyMessage] = useState<string>("");
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Indicator 相關狀態
  const [indicator, setIndicator] = useState<string>("");
  const [showIndicator, setShowIndicator] = useState(false);

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

  // 發送留言
  const handleSendMessage = async () => {
    if (!playerContext || !currentRound || !myMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await sendMessage(roomId, currentRound.round_number, {
        sender_id: playerContext.player_id,
        content: myMessage.trim(),
      });
      setHasSentMessage(true);
      setShowMessage(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "發送訊息失敗");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 拉取當前回合資訊
  const fetchRound = useCallback(async () => {
    if (!playerContext) return;

    try {
      // 先檢查房間狀態
      const roomStatus = await getRoomStatus(playerContext.room_code);
      console.log(
        `[Player] Room status: ${roomStatus.status}, current_round: ${roomStatus.current_round}, player_count: ${roomStatus.player_count}`,
      );

      // 房間還在 WAITING 階段（遊戲尚未開始）
      if (roomStatus.status === "WAITING") {
        console.log(
          `[Player] → State: waiting_game_start (player_count: ${roomStatus.player_count})`,
        );
        setGameState("waiting_game_start");
        setRoomInfo(roomStatus);
        return;
      }

      // 遊戲已開始，但 current_round = 0（不應發生，但防禦性處理）
      if (roomStatus.current_round === 0) {
        console.warn(
          `[Player] Room status is PLAYING but current_round = 0, waiting...`,
        );
        setGameState("waiting_round");
        setCurrentRound(null);
        return;
      }

      // 確認有活躍的 round，安全呼叫 getCurrentRound()
      const round = await getCurrentRound(roomId);
      console.log(
        `[Player] Round ${round.round_number}: phase=${round.phase}, status=${round.status}`,
      );
      setCurrentRound(round);

      if (round.status === "WAITING_ACTIONS") {
        console.log(`[Player] → State: choosing_action`);
        setGameState("choosing_action");

        // 拉取對手資訊
        const pair = await getPlayerPair(
          roomId,
          round.round_number,
          playerContext.player_id,
        );
        console.log(
          `[Player] Opponent: ${pair.opponent_display_name} (${pair.opponent_id})`,
        );
        setOpponent(pair);

        // 檢查是否為留言回合 (Round 5-6)
        if (shouldShowMessagePrompt(round.round_number) && !hasSentMessage) {
          try {
            const msg = await getMessage(
              roomId,
              round.round_number,
              playerContext.player_id,
            );
            console.log(
              `[Player] Received message from opponent: "${msg.content}"`,
            );
            setReceivedMessage(msg.content);
          } catch {
            console.log(`[Player] No message from opponent yet`);
            setReceivedMessage("");
          }
        }
      } else if (round.status === "COMPLETED") {
        console.log(`[Player] → State: showing_result`);
        setGameState("showing_result");

        // 拉取結果
        const res = await getRoundResult(
          roomId,
          round.round_number,
          playerContext.player_id,
        );
        console.log(
          `[Player] Round ${round.round_number} result: your_choice=${res.your_choice}, opponent_choice=${res.opponent_choice}, your_payoff=${res.your_payoff}`,
        );
        setResult(res);
      }
    } catch (err) {
      // 404 代表回合還沒開始，這是正常情況
      if (err instanceof APIError && err.status === 404) {
        console.log(`[Player] Round not started yet (404), → State: waiting_round`);
        setGameState("waiting_round");
        setCurrentRound(null);
      } else {
        console.error("[Player] Failed to fetch round info:", err);
      }
    }
  }, [roomId, playerContext, hasSentMessage]);

  // WebSocket 事件處理與初始載入
  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
      return;
    }

    const websocket = createWebSocket(roomId);

    websocket.on("ROUND_STARTED", (data: unknown) => {
      const eventData = data as { round_number?: number };
      console.log(`[Player] 📢 Event: ROUND_STARTED`, eventData);
      setGameState("waiting_round");
      setOpponent(null);
      setResult(null);
      setIsSubmitting(false);
      setShowMessage(false);
      setReceivedMessage("");
      setMyMessage("");
      setHasSentMessage(false);
      setShowIndicator(false);
      fetchRound();
    });

    websocket.on("ROUND_READY", (data: unknown) => {
      console.log(
        "[Player] 📢 Event: ROUND_READY (all players submitted, waiting for host to publish)",
        data,
      );
      // Host 準備公布結果，玩家等待
    });

    websocket.on("ROUND_ENDED", (data: unknown) => {
      console.log("[Player] 📢 Event: ROUND_ENDED (results published)", data);
      fetchRound();
    });

    websocket.on("MESSAGE_PHASE", (data: unknown) => {
      console.log("[Player] 📢 Event: MESSAGE_PHASE", data);
      // Message 是回合內的可選功能，不跳轉頁面
      if (currentRound && shouldShowMessagePrompt(currentRound.round_number)) {
        setShowMessage(true);
      }
    });

    websocket.on("INDICATORS_ASSIGNED", async (data: unknown) => {
      console.log("[Player] 📢 Event: INDICATORS_ASSIGNED", data);
      try {
        const indicatorData = await getPlayerIndicator(roomId, playerContext.player_id);
        console.log(`[Player] ✅ Your indicator: ${indicatorData.symbol}`);
        setIndicator(indicatorData.symbol);
        setShowIndicator(true);
      } catch (err) {
        console.error("[Player] ❌ Failed to fetch indicator:", err);
      }
    });

    websocket.on("GAME_ENDED", (data: unknown) => {
      console.log("[Player] 📢 Event: GAME_ENDED", data);
      router.push(`/room/${roomId}/summary`);
    });

    websocket.connect();

    // 初始載入回合資訊
    fetchRound();

    return () => {
      websocket.disconnect();
    };
  }, [roomId, playerContext, router, fetchRound, currentRound]);

  // 只有真正缺少 playerContext 才顯示「載入中」
  if (!playerContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  // 等待遊戲開始：顯示房間資訊
  if (gameState === "waiting_game_start" && roomInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            等待遊戲開始
          </h1>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">房間代碼</p>
              <p className="text-4xl font-mono font-bold text-blue-600 text-center tracking-widest">
                {roomInfo.code}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">目前玩家數</p>
              <p className="text-3xl font-bold text-gray-800 text-center">
                {roomInfo.player_count}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">你的暱稱</p>
              <p className="text-xl font-semibold text-green-600 text-center">
                {playerContext.display_name}
              </p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 text-center">
              請等待老師開始遊戲...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 如果沒有 currentRound，且不是 waiting_game_start 狀態，顯示載入中
  if (!currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  const roundNumber = currentRound.round_number;
  const phaseDesc = getRoundPhaseDescription(roundNumber);
  const showCoopHint = shouldShowCooperationHint(roundNumber);
  const canSendMessage = shouldShowMessagePrompt(roundNumber) && !hasSentMessage;

  // Indicator 彈窗
  if (showIndicator && indicator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">你的指示物</h1>

          <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-12 mb-6">
            <div className="text-9xl animate-pulse">{indicator}</div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
            <h2 className="font-semibold text-gray-800 mb-3">📌 接下來該怎麼做？</h2>
            <ol className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-pink-500 mr-2 font-bold">1.</span>
                <span>
                  在教室中找到和你有<span className="font-bold">相同指示物</span>的同學
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-2 font-bold">2.</span>
                <span>從 Round 7 開始，你們可以一起討論策略</span>
              </li>
              <li className="flex items-start">
                <span className="text-pink-500 mr-2 font-bold">3.</span>
                <span>討論後，仍然各自在手機上作答</span>
              </li>
            </ol>
          </div>

          <button
            onClick={() => setShowIndicator(false)}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 rounded-lg transition shadow-lg hover:shadow-xl text-lg"
          >
            知道了，繼續遊戲
          </button>
        </div>
      </div>
    );
  }

  // Message 彈窗
  if (showMessage && canSendMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              留言階段
            </h1>
            <p className="text-gray-600 text-center mb-8">
              你可以給本輪對手留下一句話（匿名）
            </p>

            {receivedMessage && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  對手給你的訊息：
                </h2>
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                  <p className="text-gray-800">{receivedMessage}</p>
                </div>
              </div>
            )}

            {!receivedMessage && (
              <div className="mb-8 text-center text-gray-500">
                <p>對手沒有留言</p>
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                留言給對手（可選）
              </label>
              <textarea
                id="message"
                value={myMessage}
                onChange={(e) => setMyMessage(e.target.value)}
                placeholder="輸入你想說的話..."
                maxLength={100}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition resize-none"
                disabled={isSendingMessage}
              />
              <p className="text-sm text-gray-500 mt-1">
                {myMessage.length} / 100 字
              </p>

              <div className="mt-4 space-y-3">
                <button
                  onClick={handleSendMessage}
                  disabled={!myMessage.trim() || isSendingMessage}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:shadow-none"
                >
                  {isSendingMessage ? "發送中..." : "發送訊息"}
                </button>

                <button
                  onClick={() => setShowMessage(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
                >
                  跳過，繼續遊戲
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {indicator && (
                <p className="text-3xl mt-1" title="你的指示物">
                  {indicator}
                </p>
              )}
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

          {/* 留言提示 */}
          {canSendMessage && gameState === "choosing_action" && (
            <div className="mt-4">
              <button
                onClick={() => setShowMessage(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition shadow-md"
              >
                💬 給對手留言（可選）
              </button>
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
                    onClick={() => handleChoice("ACCELERATE")}
                    disabled={isSubmitting}
                    className={`${CHOICE_COLORS.ACCELERATE} text-white font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">🚗</div>
                    <div className="text-xl">{CHOICE_LABELS.ACCELERATE}</div>
                  </button>
                  <button
                    onClick={() => handleChoice("TURN")}
                    disabled={isSubmitting}
                    className={`${CHOICE_COLORS.TURN} text-white font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">↩️</div>
                    <div className="text-xl">{CHOICE_LABELS.TURN}</div>
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
                    {result.your_choice === "ACCELERATE" ? "🚗" : "↩️"}
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
                    {result.opponent_choice === "ACCELERATE" ? "🚗" : "↩️"}
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
                <p className="text-gray-600">等待老師開始下一輪...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
