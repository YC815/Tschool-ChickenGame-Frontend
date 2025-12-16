"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadPlayerContext } from "@/lib/utils";
import type { PlayerContext } from "@/lib/types";

export function usePlayerContext() {
  const router = useRouter();
  const [playerContext] = useState<PlayerContext | null>(() =>
    loadPlayerContext()
  );

  useEffect(() => {
    if (!playerContext) {
      router.push("/");
    }
  }, [playerContext, router]);

  return playerContext;
}
