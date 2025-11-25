"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createWebSocket } from "@/lib/websocket";
import { getRoomStatus } from "@/lib/api";
import { loadPlayerContext } from "@/lib/utils";

/**
 * 等待室頁面
 * 玩家加入後等待 Host 開始遊戲
 */
export default function WaitingRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [playerCount, setPlayerCount] = useState(0);
  const [roomCode, setRoomCode] = useState("");

  // 載入玩家資訊
  const playerContext = loadPlayerContext();

  // 建立 WebSocket 連線
  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
      return;
    }

    const websocket = createWebSocket(roomId);

    // 監聽「遊戲開始」事件
    websocket.on("ROOM_STARTED", () => {
      console.log("[Player] Game started, redirecting...");
      router.push(`/room/${roomId}/round`);
    });

    websocket.connect();

    return () => {
      websocket.disconnect();
    };
  }, [roomId, playerContext, router]);

  // 定期更新房間狀態（輕量輪詢）
  useEffect(() => {
    if (!playerContext) return;

    const fetchStatus = async () => {
      try {
        const status = await getRoomStatus(playerContext.room_code);
        setRoomCode(status.code);
        setPlayerCount(status.player_count);
      } catch (err) {
        console.error("Failed to fetch room status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [playerContext]);

  if (!playerContext) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            成功加入房間！
          </h1>
          <p className="text-gray-600">
            等待老師開始遊戲...
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">房間代碼</p>
            <p className="text-3xl font-mono font-bold text-gray-800 tracking-widest">
              {roomCode || "載入中..."}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-1">你的顯示名稱</p>
            <p className="text-xl font-semibold text-blue-600">
              {playerContext.display_name}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-1">目前玩家數</p>
            <p className="text-3xl font-bold text-gray-800">
              {playerCount}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm">連線中</p>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          請保持此頁面開啟，遊戲即將開始
        </p>
      </div>
    </div>
  );
}
