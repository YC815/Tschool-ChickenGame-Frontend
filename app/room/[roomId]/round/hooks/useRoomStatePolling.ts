"use client";

import { useEffect, useRef, useState } from "react";
import { getRoomState } from "@/lib/api";
import {
  STATE_POLL_IDLE_MS,
  STATE_POLL_INTERVAL_MS,
} from "@/lib/constants";
import type { RoomStateData } from "@/lib/types";

/**
 * 短輪詢房間狀態，自動處理版本控制與錯誤重試
 */
export function useRoomStatePolling(roomId: string, playerId: string | null) {
  const [roomState, setRoomState] = useState<RoomStateData | null>(null);
  const [pollError, setPollError] = useState("");
  const versionRef = useRef(0);

  useEffect(() => {
    if (!playerId) return;

    let cancelled = false;
    let timer: NodeJS.Timeout;

    versionRef.current = 0;

    const pollState = async () => {
      if (cancelled) return;

      try {
        const state = await getRoomState(
          roomId,
          versionRef.current,
          playerId
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
        setPollError(
          err instanceof Error ? err.message : "無法取得遊戲狀態，請稍後再試"
        );
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
  }, [roomId, playerId]);

  const resetPolling = () => {
    versionRef.current = 0;
    setRoomState(null);
    setPollError("");
  };

  return { roomState, pollError, resetPolling };
}
