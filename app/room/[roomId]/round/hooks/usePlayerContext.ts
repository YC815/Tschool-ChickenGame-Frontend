"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPlayerContext } from "@/lib/utils";
import type { PlayerContext } from "@/lib/types";

/**
 * 管理玩家上下文，未載入時自動導向 /join
 */
export function usePlayerContext() {
  const router = useRouter();
  const [playerContext] = useState<PlayerContext | null>(() =>
    loadPlayerContext()
  );

  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
    }
  }, [playerContext, router]);

  return playerContext;
}
