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
      gamePhase.setMessageError("請輸入 1~3 個 emoji");
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
        err instanceof Error ? err.message : "送出失敗，請重試"
      );
    }
  };

  // === 渲染邏輯 ===

  if (!playerContext) return null;

  if (!roomState) {
    return (
      <LoadingView
        playerContext={playerContext}
        pollError={pollError}
        onRetry={resetPolling}
      />
    );
  }

  if (gamePhase.phase === "waiting_game_start") {
    return (
      <WaitingStartView
        roomState={roomState}
        playerContext={playerContext}
      />
    );
  }

  const choiceToShow =
    gamePhase.pendingChoice ?? roomState.round.your_choice ?? null;
  const showCoopHint =
    roomState.round.round_number &&
    shouldShowCooperationHint(roomState.round.round_number);
  const isMessageRound = shouldShowMessagePrompt(
    roomState.round.round_number
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <RoundHeader
          roomState={roomState}
          indicatorSymbol={indicatorSymbol}
          onIndicatorClick={() =>
            indicatorSymbol && closeDialog && closeDialog()
          }
        />

        <SubmissionProgress roomState={roomState} />

        {indicatorSymbol && (
          <IndicatorReminder
            indicatorSymbol={indicatorSymbol}
            onClick={() => closeDialog && closeDialog()}
          />
        )}

        <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-lg">
          {gamePhase.phase === "composing_message" && (
            <ComposingMessageView
              messageDraft={gamePhase.messageDraft}
              messageError={gamePhase.messageError}
              onMessageChange={gamePhase.setMessageDraft}
              onSubmit={handleMessageSubmit}
            />
          )}

          {gamePhase.phase === "choosing_action" && (
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
          )}

          {gamePhase.phase === "waiting_result" && (
            <WaitingResultView
              roomState={roomState}
              choiceToShow={choiceToShow}
            />
          )}

          {gamePhase.phase === "showing_result" && gamePhase.result && (
            <ShowingResultView result={gamePhase.result} />
          )}

          {gamePhase.phase === "waiting_round" && (
            <div className="text-center py-6">
              <p className="text-muted-foreground">等待下一輪開始...</p>
            </div>
          )}
        </div>

        {showCoopHint && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4">
            <p className="text-sm text-purple-800 text-center">
              💡 提示：合作可能帶來更好的結果
            </p>
          </div>
        )}

        <PayoffSummary
          payoffHistory={payoffHistory}
          totalPayoff={totalPayoff}
        />

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
