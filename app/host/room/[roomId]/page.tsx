"use client";

import { useCallback, useEffect, useMemo, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  assignIndicators,
  endGame,
  getGameSummary,
  getRoomState,
  nextRound,
  publishRoundResults,
  startGame,
} from "@/lib/api";
import {
  INDICATOR_ASSIGNMENT_AFTER_ROUND,
  STATE_POLL_IDLE_MS,
  STATE_POLL_INTERVAL_MS,
  TOTAL_ROUNDS,
} from "@/lib/constants";
import { loadHostContext } from "@/lib/utils";
import type { GameSummaryResponse, RoomStateData } from "@/lib/types";

export default function HostRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const router = useRouter();

  const hostContext = loadHostContext();
  const [roomState, setRoomState] = useState<RoomStateData | null>(null);
  const [summary, setSummary] = useState<GameSummaryResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollError, setPollError] = useState("");
  const [isJoinSectionExpanded, setIsJoinSectionExpanded] = useState(true);
  const versionRef = useRef(0);

  useEffect(() => {
    if (!hostContext) {
      router.push("/host");
    }
  }, [hostContext, router]);

  const fetchLatestState = useCallback(async () => {
    try {
      const state = await getRoomState(roomId, 0);
      if (state.data) {
        versionRef.current = state.version;
        setRoomState(state.data);
        setPollError("");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "無法取得房間狀態";
      setPollError(msg);
    }
  }, [roomId]);

  // 短輪詢 /state
  useEffect(() => {
    if (!hostContext) return;

    let cancelled = false;
    let timer: NodeJS.Timeout;
    versionRef.current = 0;

    const pollState = async () => {
      if (cancelled) return;
      try {
        const state = await getRoomState(roomId, versionRef.current);
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
        const msg = err instanceof Error ? err.message : "無法取得房間狀態";
        setPollError(msg);
        timer = setTimeout(pollState, STATE_POLL_IDLE_MS);
      }
    };

    pollState();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hostContext, roomId]);

  // 取得 summary
  useEffect(() => {
    if (!roomState) return;
    if (roomState.room.status !== "FINISHED" || summary) return;

    const fetchSummary = async () => {
      try {
        const data = await getGameSummary(roomId);
        setSummary(data);
      } catch (err) {
        console.error("Failed to fetch summary:", err);
      }
    };

    fetchSummary();
  }, [roomId, roomState, summary]);

  const handleStartGame = async () => {
    setIsProcessing(true);
    try {
      await startGame(roomId);
      await fetchLatestState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "開始遊戲失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishResults = async () => {
    if (!roomState) return;
    setIsProcessing(true);
    try {
      await publishRoundResults(roomId, roomState.round.round_number);
      await fetchLatestState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "公布結果失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextRound = async () => {
    setIsProcessing(true);
    try {
      await nextRound(roomId);
      await fetchLatestState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "開始下一輪失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignIndicators = async () => {
    setIsProcessing(true);
    try {
      await assignIndicators(roomId);
      await fetchLatestState();
      alert("指示物已發放！請通知學生查看手機");
    } catch (err) {
      alert(err instanceof Error ? err.message : "發放指示物失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndGame = async () => {
    if (!confirm("確定要結束遊戲嗎？")) return;
    setIsProcessing(true);
    try {
      await endGame(roomId);
      await fetchLatestState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "結束遊戲失敗");
    } finally {
      setIsProcessing(false);
    }
  };

  // 判斷是否在回合中（等待玩家提交）
  const isRoundActive = useMemo(() => {
    if (!roomState?.round || roomState.round.status !== "waiting_actions") return false;
    return roomState.round.submitted_actions < roomState.round.total_players;
  }, [roomState?.round]);

  // 處理玩家資料：過濾 Host、加入提交狀態、排序
  const processedPlayers = useMemo(() => {
    if (!roomState) return [];

    // 建立提交狀態查詢表
    const submissionMap = new Map(
      roomState.round?.player_submissions?.map((s) => [s.player_id, s.submitted]) ?? []
    );

    // 過濾 Host + 加入提交狀態
    const playersWithStatus = roomState.players
      .filter((p) => !p.is_host)
      .map((p) => ({
        ...p,
        submitted: submissionMap.get(p.player_id) ?? null,
      }));

    // 排序：回合中時未提交置頂
    if (!isRoundActive) return playersWithStatus;

    return [...playersWithStatus].sort((a, b) => {
      const aSubmitted = a.submitted ?? true;
      const bSubmitted = b.submitted ?? true;
      if (aSubmitted === bSubmitted) return 0;
      return aSubmitted ? 1 : -1;
    });
  }, [roomState, isRoundActive]);

  // 顏色計算函數
  const getCardStyle = (submitted: boolean | null) => {
    if (!isRoundActive) return "bg-white border-gray-200";
    if (submitted === null) return "bg-white border-gray-200";
    return submitted
      ? "bg-green-50 border-green-300"
      : "bg-red-50 border-red-400";
  };

  if (!hostContext || !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  const isWaiting = roomState.room.status === "WAITING";
  const isPlaying = roomState.room.status === "PLAYING";
  const isFinished = roomState.room.status === "FINISHED";
  const round = roomState.round;

  const canStartGame =
    isWaiting &&
    roomState.room.player_count >= 2 &&
    roomState.room.player_count % 2 === 0;
  const canPublishResults = isPlaying && round?.status === "ready_to_publish";
  const canNextRound =
    isPlaying &&
    round?.status === "completed" &&
    round.round_number < TOTAL_ROUNDS;
  const canAssignIndicators =
    isPlaying &&
    round?.status === "completed" &&
    round.round_number === INDICATOR_ASSIGNMENT_AFTER_ROUND &&
    !roomState.indicators_assigned;

  const submissionPercent = round
    ? Math.min(
        (round.submitted_actions / Math.max(round.total_players, 1)) * 100,
        100,
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">房間代碼</p>
              <p className="text-5xl font-mono font-bold text-indigo-600 tracking-widest">
                {roomState.room.code}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">目前玩家數</p>
              <p className="text-5xl font-bold text-gray-800">
                {roomState.room.player_count}
              </p>
              {isWaiting && roomState.room.player_count % 2 !== 0 && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ 玩家數必須為偶數
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">狀態</p>
              <div className="text-2xl font-semibold">
                {isWaiting && <span className="text-blue-600">等待中</span>}
                {isPlaying && (
                  <span className="text-green-600">
                    第 {round?.round_number ?? roomState.room.current_round} 輪
                  </span>
                )}
                {isFinished && <span className="text-gray-600">已結束</span>}
              </div>
              {isPlaying && round && (
                <p className="text-sm text-gray-500 mt-2">
                  狀態:{" "}
                  {round.status === "waiting_actions" && "等待玩家提交"}
                  {round.status === "ready_to_publish" && "準備公布結果"}
                  {round.status === "completed" && "已完成"}
                </p>
              )}
            </div>
          </div>

          {pollError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {pollError}
            </div>
          )}
        </div>

        {isWaiting && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              onClick={() => setIsJoinSectionExpanded(!isJoinSectionExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-bold text-gray-800">
                學生加入方式
              </h2>
              <svg
                className={`w-6 h-6 text-gray-600 transition-transform ${isJoinSectionExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isJoinSectionExpanded && (
              <div className="mt-4 text-center">
                <div className="bg-gray-100 rounded-lg p-8 inline-block">
                  {typeof window !== "undefined" && (
                    <>
                      <div className="mb-6">
                        <QRCodeSVG
                          value={`${window.location.origin}/join?code=${roomState.room.code}`}
                          size={256}
                          level="H"
                          includeMargin={true}
                          className="mx-auto bg-white p-4 rounded-lg"
                        />
                      </div>
                      <p className="text-gray-600 mb-2">或直接輸入房間代碼：</p>
                      <p className="text-4xl font-mono font-bold text-indigo-600 tracking-widest mb-4">
                        {roomState.room.code}
                      </p>
                      <p className="text-sm text-gray-500 font-mono break-all">
                        {`${window.location.origin}/join?code=${roomState.room.code}`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isPlaying && round && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              玩家提交進度
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${submissionPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {round.submitted_actions} / {round.total_players}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">控制面板</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isWaiting && (
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || isProcessing}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition shadow-md disabled:shadow-none"
              >
                開始遊戲
              </button>
            )}

            {isPlaying && canPublishResults && (
              <button
                onClick={handlePublishResults}
                disabled={isProcessing}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition shadow-md disabled:shadow-none"
              >
                公布結果
              </button>
            )}

            {isPlaying && (
              <button
                onClick={handleNextRound}
                disabled={!canNextRound || isProcessing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition shadow-md disabled:shadow-none"
              >
                {canNextRound
                  ? "開始下一輪"
                  : round && round.round_number >= TOTAL_ROUNDS
                    ? "已是最後一輪"
                    : "等待完成本輪"}
              </button>
            )}

            {isPlaying && canAssignIndicators && (
              <button
                onClick={handleAssignIndicators}
                disabled={isProcessing}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition shadow-md disabled:shadow-none"
              >
                發放指示物
              </button>
            )}

            {isPlaying && (
              <button
                onClick={handleEndGame}
                disabled={isProcessing}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-4 rounded-lg transition shadow-md disabled:shadow-none"
              >
                結束遊戲
              </button>
            )}
          </div>

          {isWaiting && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 等待學生加入房間。玩家數必須為偶數才能開始遊戲。
              </p>
            </div>
          )}

          {isPlaying && round && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ 遊戲進行中 - 第 {round.round_number} 輪 / 共 {TOTAL_ROUNDS} 輪
              </p>
              {round.status === "waiting_actions" && (
                <p className="text-sm text-gray-700 mt-2">
                  ⏳ 等待所有玩家提交選擇...
                </p>
              )}
              {round.status === "ready_to_publish" && (
                <p className="text-sm text-purple-800 mt-2">
                  🎯 所有玩家已提交！請點擊「公布結果」按鈕
                </p>
              )}
              {round.round_number === INDICATOR_ASSIGNMENT_AFTER_ROUND &&
                round.status === "completed" &&
                !roomState.indicators_assigned && (
                  <p className="text-sm text-yellow-800 mt-2">
                    ⚠️ 本輪結束後，請點擊「發放指示物」讓學生找到隊友
                  </p>
                )}
              {roomState.indicators_assigned && (
                <p className="text-sm text-yellow-800 mt-2">
                  ✅ 指示物已發放
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">玩家列表</h2>
          {processedPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">尚無玩家加入</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {processedPlayers.map((player) => (
                <div
                  key={player.player_id}
                  className={`border-2 rounded-lg p-4 transition-colors ${getCardStyle(player.submitted)}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">
                      {player.display_name}
                    </p>
                    {isRoundActive && player.submitted !== null && (
                      <span className="text-lg">
                        {player.submitted ? "✅" : "⏳"}
                      </span>
                    )}
                  </div>
                  {isRoundActive && player.submitted !== null && (
                    <p className="text-xs mt-1 text-gray-600">
                      {player.submitted ? "已提交" : "等待中"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isFinished && summary && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">遊戲結果</h2>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">加速比例</p>
                <p className="text-3xl font-bold text-red-600">
                  {(summary.stats.accelerate_ratio * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">轉彎比例</p>
                <p className="text-3xl font-bold text-blue-600">
                  {(summary.stats.turn_ratio * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              玩家排名（依總分）
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {summary.players.map((player, index) => (
                <div
                  key={player.display_name}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-gray-400">
                      #{index + 1}
                    </div>
                    <div className="font-semibold text-gray-800">
                      {player.display_name}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {player.total_payoff > 0 ? "+" : ""}
                    {player.total_payoff}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
