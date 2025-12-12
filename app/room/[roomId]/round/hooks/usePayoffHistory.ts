"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  loadPayoffHistory,
  savePayoffRecord,
  getTotalPayoff,
} from "@/lib/utils";

/**
 * 管理玩家收益歷史記錄
 */
export function usePayoffHistory(
  roomId: string,
  playerId: string | null,
  currentPayoff: number | null,
  currentRound: number | null
) {
  const savedRoundRef = useRef<number | null>(null);

  // 儲存新收益記錄
  useEffect(() => {
    if (
      !playerId ||
      currentPayoff === null ||
      currentRound === null ||
      savedRoundRef.current === currentRound
    )
      return;

    savePayoffRecord(roomId, playerId, currentRound, currentPayoff);
    savedRoundRef.current = currentRound;
  }, [currentPayoff, currentRound, roomId, playerId]);

  const payoffHistory = useMemo(
    () => (playerId ? loadPayoffHistory(roomId, playerId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, playerId, currentRound]
  );

  const totalPayoff = useMemo(
    () => (playerId ? getTotalPayoff(roomId, playerId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roomId, playerId, currentRound]
  );

  return { payoffHistory, totalPayoff };
}
