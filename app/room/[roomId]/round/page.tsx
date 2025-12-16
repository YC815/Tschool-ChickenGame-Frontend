"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitAction, sendMessage } from "@/lib/api";
import { shouldShowCooperationHint, shouldShowMessagePrompt } from "@/lib/utils";
import type { Choice } from "@/lib/types";

// Hooks
import { usePlayerContext } from "./hooks/usePlayerContext";
import { useRoomStatePolling } from "./hooks/useRoomStatePolling";
import { useGamePhase } from "./hooks/useGamePhase";
import { usePayoffHistory } from "./hooks/usePayoffHistory";
import { useIndicatorDialog } from "./hooks/useIndicatorDialog";

// Components
import { LoadingView } from "./components/LoadingView";
import { WaitingStartView } from "./components/WaitingStartView";
import { ComposingMessageView } from "./components/ComposingMessageView";
import { ChoosingActionView } from "./components/ChoosingActionView";
import { WaitingResultView } from "./components/WaitingResultView";
import { ShowingResultView } from "./components/ShowingResultView";
import { RoundHeader } from "./components/RoundHeader";
import { SubmissionProgress } from "./components/SubmissionProgress";
import { PayoffSummary } from "./components/PayoffSummary";
import { IndicatorDialog } from "./components/IndicatorDialog";
import { IndicatorReminder } from "./components/IndicatorReminder";

export default function RoundPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const playerContext = usePlayerContext();
  const { roomState, pollError, resetPolling } = useRoomStatePolling(
    roomId,
    playerContext?.player_id ?? null
  );

  const gamePhase = useGamePhase(
    roomState,
    roomId,
    playerContext?.player_id ?? null
  );

  const { payoffHistory, totalPayoff } = usePayoffHistory(
    roomId,
    playerContext?.player_id ?? null,
    gamePhase.result?.your_payoff ?? null,
    gamePhase.result ? roomState?.round.round_number ?? null : null
  );

  const indicatorSymbol = roomState?.indicators_assigned
    ? roomState.indicator_symbol ?? null
    : null;

  const { showDialog, closeDialog } = useIndicatorDialog(
    roomId,
    playerContext?.player_id ?? null,
    indicatorSymbol
  );

  // 遊戲結束時跳轉
  useEffect(() => {
    if (roomState?.room.status === "FINISHED") {
      router.push(`/room/${roomId}/summary`);
    }
  }, [roomId, roomState, router]);

  // 提交策略選擇
  const handleChoiceSubmit = async (choice: Choice) => {
    if (!playerContext || gamePhase.isSubmitting || !roomState?.round) return;

    gamePhase.setIsSubmitting(true);
    gamePhase.setPendingChoice(choice);

    try {
      await submitAction(roomId, roomState.round.round_number, {
        player_id: playerContext.player_id,
        choice,
      });
    } catch (err) {
      console.error("[Player] Submit action failed:", err);
      gamePhase.setPendingChoice(null);
    } finally {
      gamePhase.setIsSubmitting(false);
    }
  };

  // 提交訊息
  const handleMessageSubmit = async () => {
    if (!playerContext || !gamePhase.messageDraft.trim() || !roomState?.round)
      return;

    const emojiArray = Array.from(gamePhase.messageDraft.trim());
    if (emojiArray.length === 0 || emojiArray.length > 3) {
      gamePhase.setMessageError("請輸入 1~3 個 Emoji");
      return;
    }

    try {
      await sendMessage(roomId, roomState.round.round_number, {
        sender_id: playerContext.player_id,
        content: gamePhase.messageDraft.trim(),
      });
      gamePhase.setHasSentMessage(true);
      gamePhase.setMessageError("");
    } catch (err) {
      console.error("[Player] Send message failed:", err);
      gamePhase.setMessageError(
        err instanceof Error ? err.message : "傳送失敗，請重試"
      );
    }
  };

  // === 渲染邏輯 ===

  // 1. 尚未取得玩家資訊
  if (!playerContext) return null;

  // 2. 載入中 / 錯誤狀態 (套用手遊風格背景)
  if (!roomState) {
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl w-full max-w-md">
          <LoadingView
            playerContext={playerContext}
            pollError={pollError}
            onRetry={resetPolling}
          />
        </div>
      </div>
    );
  }

  // 3. 等待遊戲開始 (Lobby)
  if (gamePhase.phase === "waiting_game_start") {
    return (
      <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4 flex flex-col items-center justify-center">
        <WaitingStartView
          roomState={roomState}
          playerContext={playerContext}
        />
      </div>
    );
  }

  // 計算邏輯
  const choiceToShow =
    gamePhase.pendingChoice ?? roomState.round.your_choice ?? null;
  const showCoopHint =
    roomState.round.round_number &&
    shouldShowCooperationHint(roomState.round.round_number);
  const isMessageRound = shouldShowMessagePrompt(
    roomState.round.round_number
  );

  // 4. 主要遊戲畫面
  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white overflow-x-hidden relative">
      
      {/* 背景動態裝飾 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[30%] bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[30%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto flex flex-col min-h-[100dvh] p-4 gap-4">
        
        {/* === 頂部 HUD (狀態欄) === */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-lg">
          <RoundHeader
            roomState={roomState}
            indicatorSymbol={indicatorSymbol}
            onIndicatorClick={() =>
              indicatorSymbol && closeDialog && closeDialog()
            }
          />
          <div className="mt-3">
             <SubmissionProgress roomState={roomState} />
          </div>
        </div>

        {/* === 浮動提示區 === */}
        {indicatorSymbol && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-500">
             <IndicatorReminder
                indicatorSymbol={indicatorSymbol}
                onClick={() => closeDialog && closeDialog()}
              />
          </div>
        )}

        {/* === 提示訊息 (如：合作提示) === */}
        {showCoopHint && (
          <div className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur-sm border border-purple-400/50 rounded-xl p-3 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse">
            <p className="text-sm font-bold text-white text-center flex items-center justify-center gap-2">
              <span>💡</span>
              <span className="tracking-wide text-shadow">提示：合作可能帶來更好的結果</span>
            </p>
          </div>
        )}

        {/* === 主要操作面板 (Game Console) === */}
        {/* flex-1 確保它佔據中間主要空間 */}
        <div className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-center">
            
            {/* 面板內部光影 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

            {/* 根據狀態顯示不同視圖 */}
            {gamePhase.phase === "composing_message" && (
              <div className="animate-in zoom-in-95 duration-300">
                <ComposingMessageView
                  messageDraft={gamePhase.messageDraft}
                  messageError={gamePhase.messageError}
                  onMessageChange={gamePhase.setMessageDraft}
                  onSubmit={handleMessageSubmit}
                />
              </div>
            )}

            {gamePhase.phase === "choosing_action" && (
              <div className="animate-in zoom-in-95 duration-300">
                <ChoosingActionView
                  isSubmitting={gamePhase.isSubmitting}
                  hasSubmitted={
                    gamePhase.pendingChoice !== null ||
                    roomState.round.your_choice !== null
                  }
                  onChoice={handleChoiceSubmit}
                  isMessageRound={isMessageRound}
                  myMessage={gamePhase.messageDraft || null}
                  opponentMessageStatus={gamePhase.opponentMessageStatus}
                  opponentMessage={gamePhase.opponentMessage}
                />
              </div>
            )}

            {gamePhase.phase === "waiting_result" && (
              <div className="animate-in fade-in duration-500">
                <WaitingResultView
                  roomState={roomState}
                  choiceToShow={choiceToShow}
                />
              </div>
            )}

            {gamePhase.phase === "showing_result" && gamePhase.result && (
              <div className="animate-in zoom-in-95 duration-300">
                <ShowingResultView result={gamePhase.result} />
              </div>
            )}

            {gamePhase.phase === "waiting_round" && (
              <div className="text-center py-10 animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-indigo-200 text-lg font-bold tracking-widest">
                  準備下一回合...
                </p>
              </div>
            )}
        </div>

        {/* === 底部狀態欄 (Player Stats) === */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg mt-auto">
           <PayoffSummary
            payoffHistory={payoffHistory}
            totalPayoff={totalPayoff}
          />
        </div>

        {/* === 彈出視窗 (Dialog) === */}
        {indicatorSymbol && (
          <IndicatorDialog
            isOpen={showDialog}
            onClose={closeDialog}
            indicatorSymbol={indicatorSymbol}
          />
        )}
      </div>
    </div>
  );
}