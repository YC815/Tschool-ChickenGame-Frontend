"use client";

import { useEffect, useMemo, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getRoomState, submitAction, sendMessage, getRoundResult } from "@/lib/api";
import {
  getRoundPhaseDescription,
  loadPlayerContext,
  shouldShowCooperationHint,
  shouldShowMessagePrompt,
  savePayoffRecord,
  loadPayoffHistory,
  getTotalPayoff,
} from "@/lib/utils";
import {
  CHOICE_COLORS,
  CHOICE_LABELS,
  STATE_POLL_IDLE_MS,
  STATE_POLL_INTERVAL_MS,
} from "@/lib/constants";
import type { Choice, RoomStateData, RoundResultResponse, PayoffRecord } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function normalizeRoomMessage(
  message: RoomStateData["message"],
): {
  text: string;
  fromPlayerId: string | null;
  fromDisplayName: string | null;
} {
  if (!message) {
    return {
      text: "",
      fromPlayerId: null,
      fromDisplayName: null,
    };
  }
  if (typeof message === "string") {
    return {
      text: message,
      fromPlayerId: null,
      fromDisplayName: null,
    };
  }
  return {
    text: message.content,
    fromPlayerId: message.from_player_id,
    fromDisplayName: message.from_display_name,
  };
}

type GameState =
  | "waiting_game_start"
  | "waiting_round"
  | "composing_message"
  | "choosing_action"
  | "waiting_result"
  | "showing_result";

export default function RoundPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();
  const [playerContext] = useState(() => loadPlayerContext());

  const [roomState, setRoomState] = useState<RoomStateData | null>(null);
  const versionRef = useRef(0);
  const roundRef = useRef<number | null>(null);

  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RoundResultResponse | null>(null);
  const [resultRound, setResultRound] = useState<number | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [pollError, setPollError] = useState("");
  const [indicatorSymbol, setIndicatorSymbol] = useState<string | null>(null);
  const [payoffHistory, setPayoffHistory] = useState<PayoffRecord[]>([]);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [hasSeenIndicator, setHasSeenIndicator] = useState(false);

  // 引導沒有 player context 的使用者回到加入頁
  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
    }
  }, [playerContext, router]);

  // 載入收益歷史
  useEffect(() => {
    if (!playerContext) return;
    const history = loadPayoffHistory(roomId, playerContext.player_id);
    setPayoffHistory(history);
  }, [roomId, playerContext]);

  // 檢查是否已看過指示物
  useEffect(() => {
    if (!playerContext) return;
    const seen = localStorage.getItem(`indicator_seen_${roomId}_${playerContext.player_id}`);
    setHasSeenIndicator(seen === 'true');
  }, [roomId, playerContext]);

  // 短輪詢 /state
  useEffect(() => {
    if (!playerContext) return;

    let cancelled = false;
    let timer: NodeJS.Timeout;

    versionRef.current = 0;

    const pollState = async () => {
      if (cancelled) return;

      try {
        const state = await getRoomState(
          roomId,
          versionRef.current,
          playerContext.player_id,
        );

        if (cancelled) return;

        if (state.has_update && state.data) {
          versionRef.current = state.version;
          setRoomState(state.data);
          setPollError("");
        }

        const delay = state.has_update
          ? STATE_POLL_INTERVAL_MS
          : STATE_POLL_IDLE_MS;
        timer = setTimeout(pollState, delay);
      } catch (err) {
        console.error("[Player] Polling state failed:", err);
        setPollError(err instanceof Error ? err.message : "無法取得遊戲狀態，請稍後再試");
        timer = setTimeout(pollState, STATE_POLL_IDLE_MS);
      }
    };

    pollState();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [roomId, playerContext]);

  // 狀態更新時處理本地快取
  useEffect(() => {
    if (!roomState) return;

    if (!roomState.round) return;

    const { text: messageText, fromPlayerId } = normalizeRoomMessage(roomState.message);
    setReceivedMessage(messageText);
    if (
      playerContext &&
      fromPlayerId &&
      fromPlayerId === playerContext.player_id
    ) {
      setHasSentMessage(true);
    }
    setIndicatorSymbol(
      roomState.indicators_assigned ? roomState.indicator_symbol ?? null : null,
    );

    if (roundRef.current !== roomState.round.round_number) {
      roundRef.current = roomState.round.round_number;
      setPendingChoice(null);
      setIsSubmitting(false);
      setResult(null);
      setResultRound(null);
      setHasSentMessage(false);
      setMessageDraft("");
      setMessageError("");
    }
  }, [playerContext, roomState]);

  // 轉跳 summary
  useEffect(() => {
    if (roomState?.room.status === "FINISHED") {
      router.push(`/room/${roomId}/summary`);
    }
  }, [roomId, roomState, router]);

  // 完成時取結果
  useEffect(() => {
    if (!playerContext || !roomState?.round) return;
    if (roomState.round.status !== "completed") return;

    const roundNumber = roomState.round.round_number;
    if (resultRound === roundNumber && result) return;

    let cancelled = false;

    const fetchResult = async () => {
      try {
        const data = await getRoundResult(
          roomId,
          roundNumber,
          playerContext.player_id,
        );
        if (!cancelled) {
          setResult(data);
          setResultRound(roundNumber);
        }
      } catch (err) {
        console.error("[Player] Failed to fetch result:", err);
      }
    };

    fetchResult();

    return () => {
      cancelled = true;
    };
  }, [playerContext, result, resultRound, roomId, roomState]);

  // 儲存收益記錄
  useEffect(() => {
    if (!playerContext || !result || !resultRound) return;

    savePayoffRecord(
      roomId,
      playerContext.player_id,
      resultRound,
      result.your_payoff,
    );

    // 更新 UI
    const updated = loadPayoffHistory(roomId, playerContext.player_id);
    setPayoffHistory(updated);
  }, [result, resultRound, roomId, playerContext]);

  // 當指示物首次出現時顯示彈出視窗
  useEffect(() => {
    if (indicatorSymbol && !hasSeenIndicator) {
      setShowIndicatorDialog(true);
    }
  }, [indicatorSymbol, hasSeenIndicator]);

  const hasSubmitted = useMemo(() => {
    if (pendingChoice) return true;
    if (!roomState || !roomState.round) return false;
    return roomState.round.your_choice !== undefined && roomState.round.your_choice !== null;
  }, [pendingChoice, roomState]);

  const derivedGameState: GameState = useMemo(() => {
    if (!roomState || !roomState.round) return "waiting_game_start";
    if (roomState.room.status === "WAITING") return "waiting_game_start";

    const roundStatus = roomState.round.status;
    if (roundStatus === "waiting_actions") {
      // 優先檢查是否需要留言階段
      if (shouldShowMessagePrompt(roomState.round.round_number) && !hasSentMessage) {
        return "composing_message";
      }
      return hasSubmitted ? "waiting_result" : "choosing_action";
    }
    if (roundStatus === "ready_to_publish") return "waiting_result";
    if (roundStatus === "completed") {
      return result && resultRound === roomState.round.round_number
        ? "showing_result"
        : "waiting_result";
    }
    return "waiting_round";
  }, [hasSubmitted, hasSentMessage, result, resultRound, roomState]);

  const roundPhaseDesc = roomState?.round
    ? getRoundPhaseDescription(roomState.round.round_number)
    : "";
  const showCoopHint = roomState?.round
    ? shouldShowCooperationHint(roomState.round.round_number)
    : false;
  const choiceToShow = roomState?.round?.your_choice ?? pendingChoice;
  const submissionProgress = roomState?.round
    ? {
        submitted: roomState.round.submitted_actions,
        total: roomState.round.total_players,
      }
    : { submitted: 0, total: 0 };

  const handleChoice = async (choice: Choice) => {
    if (!playerContext || !roomState || !roomState.round || hasSubmitted || isSubmitting) return;

    setIsSubmitting(true);
    setPollError("");
    try {
      await submitAction(roomId, roomState.round.round_number, {
        player_id: playerContext.player_id,
        choice,
      });
      setPendingChoice(choice);
    } catch (err) {
      console.error("Failed to submit action:", err);
      setPollError(err instanceof Error ? err.message : "提交失敗，請重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!playerContext || !roomState?.round || !messageDraft.trim()) return;

    setMessageError("");
    try {
      await sendMessage(roomId, roomState.round.round_number, {
        sender_id: playerContext.player_id,
        content: messageDraft.trim(),
      });
      setHasSentMessage(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "發送訊息失敗";
      setMessageError(msg);
    }
  };

  const handleCloseIndicatorDialog = () => {
    if (!playerContext) return;
    setShowIndicatorDialog(false);
    setHasSeenIndicator(true);
    localStorage.setItem(`indicator_seen_${roomId}_${playerContext.player_id}`, 'true');
  };

  if (!playerContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  if (!roomState || !roomState.round) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            已加入，正在同步房間
          </h1>
          <p className="text-gray-600">
            請稍候，正在取得房間狀態。如果停留太久，可重試或返回加入頁。
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-gray-500 mb-1">房間代碼</p>
              <p className="text-xl font-mono font-bold text-blue-600">
                {playerContext.room_code}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-gray-500 mb-1">你的暱稱</p>
              <p className="text-xl font-semibold text-green-700">
                {playerContext.display_name}
              </p>
            </div>
          </div>

          {pollError && (
            <p className="text-sm text-red-600">{pollError}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                versionRef.current = 0;
                setRoomState(null);
                setPollError("");
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition shadow-md"
            >
              重新嘗試同步
            </button>
            <button
              onClick={() => router.push("/join")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
            >
              返回加入頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (derivedGameState === "waiting_game_start") {
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
                {roomState.room.code}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">目前玩家數</p>
              <p className="text-3xl font-bold text-gray-800 text-center">
                {roomState.room.player_count}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      {/* 指示物彈出視窗 */}
      <Dialog open={showIndicatorDialog} onOpenChange={handleCloseIndicatorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">你的指示物已發放！</DialogTitle>
            <DialogDescription className="text-center text-lg font-semibold text-orange-600">
              尋找對手！找到跟自己相同指示物的人配對
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="text-9xl animate-bounce">{indicatorSymbol}</div>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-center text-gray-800 font-medium">
                請找到與你相同指示物的同學，從第 7 輪開始可討論後各自作答。
              </p>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <button
              onClick={handleCloseIndicatorDialog}
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
            >
              我知道了
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                第 {roomState.round.round_number} 輪
              </h1>
              <p className="text-sm text-gray-500">{roundPhaseDesc}</p>
              {showCoopHint && (
                <p className="mt-2 text-sm text-yellow-700">
                  💡 你可以與相同指示物的同學討論後作答
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">你是</p>
              <p className="text-lg font-semibold text-blue-600">
                {playerContext.display_name}
              </p>
              {indicatorSymbol && (
                <p className="inline-flex items-center gap-2 mt-2 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                  <span className="text-xl">{indicatorSymbol}</span>
                  <span>你的指示物</span>
                </p>
              )}
            </div>
          </div>

          {/* 進度條 */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>已提交</span>
              <span>
                {submissionProgress.submitted} / {submissionProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  hasSubmitted ? "bg-green-500" : "bg-purple-500"
                }`}
                style={{
                  width: `${Math.min(
                    (submissionProgress.submitted / Math.max(submissionProgress.total, 1)) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>

          {pollError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {pollError}
            </div>
          )}
        </div>

        {/* 對方留言卡片 - 只在留言輪的決策階段顯示 */}
        {roomState?.round &&
         shouldShowMessagePrompt(roomState.round.round_number) &&
         (derivedGameState === "choosing_action" || derivedGameState === "waiting_result") && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">對方的留言</h3>
            {receivedMessage ? (
              <p className="text-gray-800">{receivedMessage}</p>
            ) : (
              <p className="text-gray-500">等待對方輸入中...</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {derivedGameState === "composing_message" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">給對方留言</h2>
              <p className="text-sm text-gray-600 text-center mb-6">
                你可以留言給對方（可選），留言後才能進入決策階段
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-2">
                留言內容（最多 100 字）
              </label>
              <textarea
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                maxLength={100}
                rows={4}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition resize-none bg-white"
                placeholder="寫下一句話..."
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{messageDraft.length} / 100</span>
              </div>

              {messageError && (
                <p className="text-sm text-red-600">{messageError}</p>
              )}

              <button
                onClick={handleSendMessage}
                disabled={!messageDraft.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:shadow-none"
              >
                送出留言
              </button>
            </div>
          )}

          {derivedGameState === "waiting_round" && (
            <div className="text-center py-10">
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

          {derivedGameState === "choosing_action" && (
            <div className="space-y-6">
              <div>
                <p className="text-center text-gray-700 mb-6 font-medium">
                  選擇你的策略：
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleChoice("ACCELERATE")}
                    disabled={isSubmitting || hasSubmitted}
                    className={`${CHOICE_COLORS.ACCELERATE} text-white font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">🚗</div>
                    <div className="text-xl">{CHOICE_LABELS.ACCELERATE}</div>
                  </button>
                  <button
                    onClick={() => handleChoice("TURN")}
                    disabled={isSubmitting || hasSubmitted}
                    className={`${CHOICE_COLORS.TURN} text-white font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="text-4xl mb-2">↩️</div>
                    <div className="text-xl">{CHOICE_LABELS.TURN}</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {derivedGameState === "waiting_result" && (
            <div className="text-center py-6">
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
              <p className="text-gray-700 font-medium">
                {roomState.round.status === "waiting_actions" && "已提交，等待其他玩家..."}
                {roomState.round.status === "ready_to_publish" && "所有玩家已提交，等待老師公布結果..."}
                {roomState.round.status === "completed" && "取得結果中..."}
              </p>
              {choiceToShow && (
                <p className="text-sm text-gray-500 mt-2">
                  你的選擇：{CHOICE_LABELS[choiceToShow]}
                </p>
              )}
            </div>
          )}

          {derivedGameState === "showing_result" && result && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  本輪結果
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

        {/* 收益記錄 - 永遠可見 */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>你的累積收益</span>
          </h3>

          <div className="bg-white rounded-xl p-6 mb-4 text-center">
            <p className="text-sm text-gray-600 mb-2">總收益</p>
            <p className="text-5xl font-bold text-green-600">
              {getTotalPayoff(roomId, playerContext.player_id)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">歷史記錄</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {payoffHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">尚無記錄</p>
              ) : (
                payoffHistory.map((record) => (
                  <div
                    key={record.round_number}
                    className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-600">第 {record.round_number} 輪</span>
                    <span
                      className={`font-bold ${
                        record.payoff > 0
                          ? "text-green-600"
                          : record.payoff < 0
                            ? "text-red-600"
                            : "text-gray-600"
                      }`}
                    >
                      {record.payoff > 0 ? "+" : ""}
                      {record.payoff}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {indicatorSymbol && (
          <div className="mt-6 bg-pink-50 border border-pink-200 rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3">指示物提醒</h2>
            <div className="flex items-center gap-4">
              <div className="text-6xl">{indicatorSymbol}</div>
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-orange-600 mb-1">
                  尋找對手！找到跟自己相同指示物的人配對
                </p>
                <p>從第 7 輪開始可與配對同學討論後再各自作答。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
