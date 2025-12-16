"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getRoundResult } from "@/lib/api";
import { shouldShowMessagePrompt } from "@/lib/utils";
import type {
  Choice,
  RoomStateData,
  RoundResultResponse,
} from "@/lib/types";

export type GamePhase =
  | "waiting_game_start"
  | "waiting_round"
  | "composing_message"
  | "choosing_action"
  | "waiting_result"
  | "showing_result";

export type OpponentMessageStatus = "typing" | "sent" | "none";

interface GamePhaseState {
  phase: GamePhase;
  pendingChoice: Choice | null;
  isSubmitting: boolean;
  result: RoundResultResponse | null;
  resultRound: number | null;
  hasSentMessage: boolean;
  messageDraft: string;
  messageError: string;
  opponentMessageStatus: OpponentMessageStatus;
  opponentMessage: string | null;
  setPendingChoice: (choice: Choice | null) => void;
  setIsSubmitting: (value: boolean) => void;
  setHasSentMessage: (value: boolean) => void;
  setMessageDraft: (value: string) => void;
  setMessageError: (value: string) => void;
}

/**
 * 管理遊戲階段推導與相關狀態
 */
export function useGamePhase(
  roomState: RoomStateData | null,
  roomId: string,
  playerId: string | null
): GamePhaseState {
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RoundResultResponse | null>(null);
  const [resultRound, setResultRound] = useState<number | null>(null);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageError, setMessageError] = useState("");
  const roundRef = useRef<number | null>(null);

  // 重置狀態當輪次變化時
  // Note: React 會自動 batch 這些 setState，不會造成多次渲染
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!roomState?.round) return;
    const newRound = roomState.round.round_number;

    if (roundRef.current === newRound) return;
    roundRef.current = newRound;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingChoice(null);
    setIsSubmitting(false);
    setResult(null);
    setResultRound(null);
    setHasSentMessage(false);
    setMessageDraft("");
    setMessageError("");
  }, [roomState?.round?.round_number]);

  // 取得輪次結果
  useEffect(() => {
    if (!playerId || !roomState?.round) return;
    if (roomState.round.status !== "completed") return;

    const roundNumber = roomState.round.round_number;
    if (resultRound === roundNumber && result) return;

    let cancelled = false;

    const fetchResult = async () => {
      try {
        const data = await getRoundResult(roomId, roundNumber, playerId);
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
  }, [playerId, result, resultRound, roomId, roomState]);

  const hasSubmitted = useMemo(() => {
    if (pendingChoice) return true;
    if (!roomState?.round) return false;
    return (
      roomState.round.your_choice !== undefined &&
      roomState.round.your_choice !== null
    );
  }, [pendingChoice, roomState]);

  const phase: GamePhase = useMemo(() => {
    if (!roomState?.round) return "waiting_game_start";
    if (roomState.room.status === "WAITING") return "waiting_game_start";

    const roundStatus = roomState.round.status;
    if (roundStatus === "waiting_actions") {
      if (
        shouldShowMessagePrompt(roomState.round.round_number) &&
        !hasSentMessage
      ) {
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

  // 推導對方留言狀態（僅 Round 5-6 的決策階段）
  const opponentMessageStatus: OpponentMessageStatus = useMemo(() => {
    if (!roomState?.round) return "none";
    if (!shouldShowMessagePrompt(roomState.round.round_number)) return "none";
    if (phase !== "choosing_action") return "none";

    const message = roomState.message;
    if (!message) return "typing";

    if (typeof message === "string") return "none";

    return message.from_player_id !== playerId ? "sent" : "none";
  }, [phase, playerId, roomState]);

  const opponentMessage: string | null = useMemo(() => {
    if (opponentMessageStatus !== "sent") return null;
    if (!roomState?.message) return null;
    if (typeof roomState.message === "string") return null;
    return roomState.message.content;
  }, [opponentMessageStatus, roomState?.message]);

  return {
    phase,
    pendingChoice,
    isSubmitting,
    result,
    resultRound,
    hasSentMessage,
    messageDraft,
    messageError,
    opponentMessageStatus,
    opponentMessage,
    setPendingChoice,
    setIsSubmitting,
    setHasSentMessage,
    setMessageDraft,
    setMessageError,
  };
}
