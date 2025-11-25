"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getPlayerIndicator } from "@/lib/api";
import { loadPlayerContext } from "@/lib/utils";

/**
 * 指示物顯示頁面（Round 6 後）
 */
export default function IndicatorPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [indicator, setIndicator] = useState<string>("");

  const playerContext = loadPlayerContext();

  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
      return;
    }

    const fetchIndicator = async () => {
      try {
        const data = await getPlayerIndicator(roomId, playerContext.player_id);
        setIndicator(data.symbol);
      } catch (err) {
        console.error("Failed to fetch indicator:", err);
      }
    };

    fetchIndicator();
  }, [roomId, playerContext, router]);

  const handleContinue = () => {
    router.push(`/room/${roomId}/round`);
  };

  if (!playerContext || !indicator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          你的指示物
        </h1>

        {/* 大圖示 */}
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl p-12 mb-6">
          <div className="text-9xl animate-pulse">
            {indicator}
          </div>
        </div>

        {/* 說明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 text-left">
          <h2 className="font-semibold text-gray-800 mb-3">
            📌 接下來該怎麼做？
          </h2>
          <ol className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start">
              <span className="text-pink-500 mr-2 font-bold">1.</span>
              <span>
                在教室中找到和你有<span className="font-bold">相同指示物</span>的同學
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2 font-bold">2.</span>
              <span>
                從 Round 7 開始，你們可以一起討論策略
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2 font-bold">3.</span>
              <span>
                討論後，仍然各自在手機上作答
              </span>
            </li>
          </ol>
        </div>

        {/* 繼續按鈕 */}
        <button
          onClick={handleContinue}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 rounded-lg transition shadow-lg hover:shadow-xl text-lg"
        >
          知道了，繼續遊戲
        </button>

        <p className="text-xs text-gray-500 mt-4">
          請保持此頁面開啟，等待老師開始下一輪
        </p>
      </div>
    </div>
  );
}
