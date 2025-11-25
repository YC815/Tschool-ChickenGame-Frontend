"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/api";
import { saveHostContext } from "@/lib/utils";

/**
 * Host 首頁 - 建立房間
 */
export default function HostPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setError("");

    try {
      const response = await createRoom({});

      // 保存 Host 資訊
      saveHostContext({
        room_id: response.room_id,
        room_code: response.code,
        host_player_id: response.host_player_id,
        state: "room_waiting",
      });

      // 跳轉到 Host 控制面板
      router.push(`/host/room/${response.room_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立房間失敗");
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-500 rounded-full mx-auto flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Host 控制台
          </h1>
          <p className="text-gray-600">
            膽小鬼賽局教學系統
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition shadow-lg hover:shadow-xl disabled:shadow-none text-lg"
          >
            {isCreating ? "建立中..." : "建立新房間"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            使用說明
          </h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">1.</span>
              <span>建立房間後，系統會生成房間代碼與 QR Code</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">2.</span>
              <span>學生掃描 QR Code 或輸入房號加入</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">3.</span>
              <span>確認人數後，按「開始遊戲」</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">4.</span>
              <span>控制每一輪的進行與討論</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
