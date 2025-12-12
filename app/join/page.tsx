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
          className="block text-sm font-medium text-card-foreground mb-2"
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
          className="w-full px-4 py-3 text-lg text-center font-mono tracking-widest border-2 border-input rounded-lg focus:border-primary focus:ring focus:ring-primary/20 transition uppercase"
          disabled={isJoining}
        />
      </div>

      {/* 暱稱輸入 */}
      <div>
        <label
          htmlFor="nickname"
          className="block text-sm font-medium text-card-foreground mb-2"
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
          className="w-full px-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:ring focus:ring-primary/20 transition"
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
        className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-semibold py-3 rounded-lg transition shadow-md disabled:shadow-none"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-card-foreground mb-2 text-center">
          膽小鬼賽局（社交版）
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          加入遊戲房間
        </p>

        <Suspense fallback={
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-2"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        }>
          <JoinFormWithParams />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            沒有房號？請向老師索取 QR Code 或房間代碼
          </p>
        </div>
      </div>
    </div>
  );
}
