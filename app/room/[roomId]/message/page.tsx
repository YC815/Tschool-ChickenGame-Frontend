"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getCurrentRound, getMessage, sendMessage } from "@/lib/api";
import { loadPlayerContext } from "@/lib/utils";

/**
 * 留言階段頁面（Round 5-6）
 */
export default function MessagePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const [receivedMessage, setReceivedMessage] = useState<string>("");
  const [myMessage, setMyMessage] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);

  const playerContext = loadPlayerContext();

  useEffect(() => {
    if (!playerContext) {
      router.push("/join");
      return;
    }

    const fetchData = async () => {
      try {
        const round = await getCurrentRound(roomId);

        // 拉取對手留給我的訊息
        try {
          const msg = await getMessage(
            roomId,
            round.round_number,
            playerContext.player_id,
          );
          setReceivedMessage(msg.content);
        } catch {
          // 沒有訊息時忽略
        }
      } catch (err) {
        console.error("Failed to fetch message:", err);
      }
    };

    fetchData();
  }, [roomId, playerContext, router]);

  const handleSendMessage = async () => {
    if (!playerContext || !myMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const round = await getCurrentRound(roomId);
      await sendMessage(roomId, round.round_number, {
        sender_id: playerContext.player_id,
        content: myMessage.trim(),
      });
      setHasSent(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "發送訊息失敗");
    } finally {
      setIsSending(false);
    }
  };

  const handleContinue = () => {
    router.push(`/room/${roomId}/round`);
  };

  if (!playerContext) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            留言階段
          </h1>
          <p className="text-gray-600 text-center mb-8">
            你可以給本輪對手留下一句話（匿名）
          </p>

          {/* 收到的訊息 */}
          {receivedMessage && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                對手給你的訊息：
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-gray-800">{receivedMessage}</p>
              </div>
            </div>
          )}

          {!receivedMessage && (
            <div className="mb-8 text-center text-gray-500">
              <p>對手沒有留言</p>
            </div>
          )}

          {/* 發送訊息 */}
          {!hasSent && (
            <div className="mb-6">
              <label
                htmlFor="message"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                留言給對手（可選）
              </label>
              <textarea
                id="message"
                value={myMessage}
                onChange={(e) => setMyMessage(e.target.value)}
                placeholder="輸入你想說的話..."
                maxLength={100}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition resize-none"
                disabled={isSending}
              />
              <p className="text-sm text-gray-500 mt-1">
                {myMessage.length} / 100 字
              </p>

              <div className="mt-4 space-y-3">
                <button
                  onClick={handleSendMessage}
                  disabled={!myMessage.trim() || isSending}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition shadow-md disabled:shadow-none"
                >
                  {isSending ? "發送中..." : "發送訊息"}
                </button>

                <button
                  onClick={handleContinue}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
                >
                  跳過，繼續遊戲
                </button>
              </div>
            </div>
          )}

          {/* 已發送 */}
          {hasSent && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
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
              <p className="text-gray-800 font-semibold mb-4">
                訊息已發送！
              </p>
              <button
                onClick={handleContinue}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition shadow-md"
              >
                繼續遊戲
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
