"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinRoom } from "@/lib/api";
import { savePlayerContext } from "@/lib/utils";

/**
 * 處理 URL 參數的內部元件
 */
function JoinFormWithParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code") || "";

  const [roomCode, setRoomCode] = useState(urlCode);
  const [nickname, setNickname] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    if (!roomCode.trim() || !nickname.trim()) {
      setError("請輸入房號和暱稱");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const response = await joinRoom(roomCode.trim(), {
        nickname: nickname.trim(),
      });

      // 保存玩家資訊到 localStorage
      savePlayerContext({
        player_id: response.player_id,
        room_id: response.room_id,
        display_name: response.display_name,
        room_code: roomCode.trim(),
        state: "waiting_room",
      });

      // 跳轉到遊戲頁面
      router.push(`/room/${response.room_id}/round`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入房間失敗");
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 房號輸入 */}
      <div>
        <label
          htmlFor="roomCode"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          房間代碼
        </label>
        <input
          id="roomCode"
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="輸入 6 位代碼"
          maxLength={6}
          className="w-full px-4 py-3 text-lg text-center font-mono tracking-widest border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition uppercase"
          disabled={isJoining}
        />
      </div>

      {/* 暱稱輸入 */}
      <div>
        <label
          htmlFor="nickname"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          你的暱稱
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="輸入暱稱"
          maxLength={50}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
          disabled={isJoining}
        />
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 加入按鈕 */}
      <button
        onClick={handleJoin}
        disabled={isJoining || !roomCode.trim() || !nickname.trim()}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:shadow-none"
      >
        {isJoining ? "加入中..." : "加入房間"}
      </button>
    </div>
  );
}

/**
 * 玩家加入房間頁面
 * 路徑：/join?code=XXXXXX（可選）
 */
export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          膽小鬼賽局
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          加入遊戲房間
        </p>

        <Suspense fallback={
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        }>
          <JoinFormWithParams />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            沒有房號？請向老師索取 QR Code 或房間代碼
          </p>
        </div>
      </div>
    </div>
  );
}
