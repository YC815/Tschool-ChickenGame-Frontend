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

// --- 輔助組件：背景特效 ---
function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
      {/* 網格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(15,23,42,0.5)_2px,transparent_2px)] bg-[size:40px_40px] opacity-20"></div>
      {/* 掃描線 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-30"></div>
      {/* 光暈點綴 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px]"></div>
    </div>
  );
}

// --- 輔助組件：全螢幕按鈕 ---
function FullScreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
}

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

  // 短輪詢邏輯 (保持不變)
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
        const delay = state.has_update ? STATE_POLL_INTERVAL_MS : STATE_POLL_IDLE_MS;
        timer = setTimeout(pollState, delay);
      } catch (err) {
        setPollError(err instanceof Error ? err.message : "Error");
        timer = setTimeout(pollState, STATE_POLL_IDLE_MS);
      }
    };
    pollState();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hostContext, roomId]);

  // Summary logic (保持不變)
  useEffect(() => {
    if (!roomState) return;
    if (roomState.room.status !== "FINISHED" || summary) return;
    const fetchSummary = async () => {
      try {
        const data = await getGameSummary(roomId);
        setSummary(data);
      } catch (err) { console.error(err); }
    };
    fetchSummary();
  }, [roomId, roomState, summary]);

  // 操作處理函數 (保持不變)
  const handleStartGame = async () => {
    setIsProcessing(true);
    try { await startGame(roomId); await fetchLatestState(); } 
    catch (err) { alert("Error"); } finally { setIsProcessing(false); }
  };
  const handlePublishResults = async () => {
    if (!roomState) return;
    setIsProcessing(true);
    try { await publishRoundResults(roomId, roomState.round.round_number); await fetchLatestState(); }
    catch (err) { alert("Error"); } finally { setIsProcessing(false); }
  };
  const handleNextRound = async () => {
    setIsProcessing(true);
    try { await nextRound(roomId); await fetchLatestState(); }
    catch (err) { alert("Error"); } finally { setIsProcessing(false); }
  };
  const handleAssignIndicators = async () => {
    setIsProcessing(true);
    try { await assignIndicators(roomId); await fetchLatestState(); alert("指示物已發放！"); }
    catch (err) { alert("Error"); } finally { setIsProcessing(false); }
  };
  const handleEndGame = async () => {
    if (!confirm("確定要結束遊戲嗎？")) return;
    setIsProcessing(true);
    try { await endGame(roomId); await fetchLatestState(); }
    catch (err) { alert("Error"); } finally { setIsProcessing(false); }
  };

  // 數據處理
  const isRoundActive = useMemo(() => {
    if (!roomState?.round || roomState.round.status !== "waiting_actions") return false;
    return roomState.round.submitted_actions < roomState.round.total_players;
  }, [roomState?.round]);

  const processedPlayers = useMemo(() => {
    if (!roomState) return [];
    const submissionMap = new Map(
      roomState.round?.player_submissions?.map((s) => [s.player_id, s.submitted]) ?? []
    );
    const playersWithStatus = roomState.players
      .filter((p) => !p.is_host)
      .map((p) => ({ ...p, submitted: submissionMap.get(p.player_id) ?? null }));

    // 遊戲中依狀態排序
    if (!isRoundActive) return playersWithStatus;
    return [...playersWithStatus].sort((a, b) => {
      const aSubmitted = a.submitted ?? true;
      const bSubmitted = b.submitted ?? true;
      if (aSubmitted === bSubmitted) return 0;
      return aSubmitted ? 1 : -1;
    });
  }, [roomState, isRoundActive]);

  if (!hostContext || !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="tracking-widest animate-pulse">系統初始化中…</p>
        </div>
      </div>
    );
  }

  const isWaiting = roomState.room.status === "WAITING";
  const isPlaying = roomState.room.status === "PLAYING";
  const isFinished = roomState.room.status === "FINISHED";
  const round = roomState.round;

  // 狀態變數
  const canStartGame = isWaiting && roomState.room.player_count >= 2 && roomState.room.player_count % 2 === 0;
  const canPublishResults = isPlaying && round?.status === "ready_to_publish";
  const canNextRound = isPlaying && round?.status === "completed" && round.round_number < TOTAL_ROUNDS;
  const canAssignIndicators = isPlaying && round?.status === "completed" && round.round_number === INDICATOR_ASSIGNMENT_AFTER_ROUND && !roomState.indicators_assigned;
  const submissionPercent = round ? Math.min((round.submitted_actions / Math.max(round.total_players, 1)) * 100, 100) : 0;

  return (
    <div className="relative min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30">
      <BackgroundEffects />

      {/* === 頂部 HUD 資訊列 === */}
      <header className="relative z-20 flex items-center justify-between px-8 py-4 bg-slate-900/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-6">
          {/* 房間代碼 */}
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">房號</span>
            <span className="text-4xl font-black font-mono text-cyan-400 tracking-wider drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              {roomState.room.code}
            </span>
          </div>
          
          {/* 玩家人數 */}
          <div className="h-10 w-[1px] bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">玩家數</span>
            <span className="text-2xl font-bold text-white flex items-center gap-2">
              {roomState.room.player_count}
              <span className={`w-2 h-2 rounded-full ${isWaiting && roomState.room.player_count % 2 !== 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
            </span>
          </div>
        </div>

        {/* 中央狀態標題 */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {isWaiting && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 px-6 py-2 rounded-full">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
              <span className="text-amber-400 font-bold tracking-widest uppercase">大廳開放中</span>
            </div>
          )}
          {isPlaying && (
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black italic text-white drop-shadow-lg leading-none">
                {round?.round_number.toString().padStart(2, '0')}
                <span className="text-lg text-white/30 not-italic ml-2">/ {TOTAL_ROUNDS}</span>
              </span>
            </div>
          )}
          {isFinished && (
             <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 px-6 py-2 rounded-full">
              <span className="text-purple-400 font-bold tracking-widest uppercase">遊戲結束</span>
            </div>
          )}
        </div>

        {/* 右側：狀態指示 */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">目前狀態</span>
          <span className="text-lg font-bold text-white/90">
             {round?.status === "waiting_actions" && "等待選擇..."}
             {round?.status === "ready_to_publish" && "準備揭曉"}
             {round?.status === "completed" && "回合結束"}
             {isWaiting && "等待開始"}
             {isFinished && "結算完成"}
          </span>
        </div>
      </header>

      {/* === 主要內容區 (Main Stage) === */}
      <main className="relative z-10 p-8 pb-32 w-full max-w-[1920px] mx-auto min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        
        {/* Waiting: 大廳 QR Code */}
        {isWaiting && (
          <div className="flex flex-col lg:flex-row items-center gap-16 animate-in zoom-in-95 duration-700">
            {/* 左側：QR Code */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
              <div className="relative bg-white p-6 rounded-2xl shadow-2xl">
                <QRCodeSVG
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}?code=${roomState.room.code}`}
                  size={350}
                  level="H"
                />
              </div>
            </div>

            {/* 右側：引導文字 */}
            <div className="flex flex-col gap-6 text-center lg:text-left">
              <div>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
                  加入戰局
                </h1>
                <p className="text-2xl text-cyan-200 font-light">
                  掃描 QR Code 或輸入代碼
                </p>
              </div>
              
              <div className="bg-slate-900/80 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                 <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">連結</p>
                 <p className="text-xl font-mono text-white/80 break-all">
                    {`${typeof window !== "undefined" ? window.location.origin : ""}?code=${roomState.room.code}`}
                 </p>
              </div>

              {roomState.room.player_count < 2 ? (
                 <div className="flex items-center gap-3 text-amber-400 bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-500/20">
                    <span className="animate-bounce">⚠️</span>
                    等待更多玩家 (至少 2 人)...
                 </div>
              ) : roomState.room.player_count % 2 !== 0 ? (
                 <div className="flex items-center gap-3 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20">
                    <span className="animate-bounce">⚠️</span>
                    人數必須為偶數
                 </div>
              ) : (
                <div className="flex items-center gap-3 text-green-400 bg-green-900/20 px-4 py-2 rounded-lg border border-green-500/20">
                    <span className="animate-bounce">✅</span>
                    人員就緒，準備開始
                 </div>
              )}
            </div>
          </div>
        )}

        {/* Playing: 玩家矩陣 */}
        {isPlaying && (
          <div className="w-full">
            {/* 進度條 */}
            <div className="w-full max-w-4xl mx-auto mb-10">
              <div className="flex justify-between text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
                <span>選擇進度</span>
                <span>{round?.submitted_actions} / {round?.total_players}</span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-500 ease-out"
                  style={{ width: `${submissionPercent}%` }}
                >
                  <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[size:1rem_1rem]"></div>
                </div>
              </div>
            </div>

            {/* 玩家 Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
              {processedPlayers.map((player) => {
                const isSubmitted = player.submitted === true;
                const isPending = player.submitted === false || player.submitted === null;
                
                return (
                  <div 
                    key={player.player_id}
                    className={`
                      relative overflow-hidden rounded-xl border-2 transition-all duration-300
                      ${isSubmitted 
                        ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'bg-slate-800/40 border-slate-700'
                      }
                    `}
                  >
                    {/* 背景掃描 */}
                    {isPending && <div className="absolute inset-0 bg-white/5 animate-pulse"></div>}
                    
                    <div className="p-4 flex flex-col items-center justify-center h-28 relative z-10">
                      <div className={`
                        w-3 h-3 rounded-full mb-3
                        ${isSubmitted ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-600'}
                      `}></div>
                      
                      <p className={`font-bold truncate w-full text-center ${isSubmitted ? 'text-white' : 'text-slate-400'}`}>
                        {player.display_name}
                      </p>
                      
                      <p className="text-[10px] uppercase tracking-wider mt-1 font-mono">
                        {isSubmitted ? <span className="text-emerald-400">已選擇</span> : <span className="text-slate-500">努力思考中...</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Finished: 結算畫面 */}
        {isFinished && summary && (
          <div className="flex flex-col w-full max-w-6xl gap-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
            {/* 統計大數據 */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                <h3 className="text-red-300 font-bold uppercase tracking-widest mb-2 z-10">不道歉比例</h3>
                <div className="text-7xl font-black text-white z-10 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                  {(summary.stats.accelerate_ratio * 100).toFixed(0)}<span className="text-4xl">%</span>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                <h3 className="text-blue-300 font-bold uppercase tracking-widest mb-2 z-10">道歉比例</h3>
                <div className="text-7xl font-black text-white z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  {(summary.stats.turn_ratio * 100).toFixed(0)}<span className="text-4xl">%</span>
                </div>
              </div>
            </div>

            {/* 排行榜 */}
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <span>🏆</span> 排行榜
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.players.map((player, index) => (
                  <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white'}`}>
                        {index + 1}
                      </div>
                      <span className="font-bold text-lg">{player.display_name}</span>
                    </div>
                    <span className={`font-mono font-black text-xl ${player.total_payoff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {player.total_payoff > 0 ? "+" : ""}{player.total_payoff}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* === 底部指揮官控制台 (Command Deck) === */}
      <footer className="fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* 左側資訊 */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono">
             <div className={`w-2 h-2 rounded-full ${pollError ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
             系統狀態: {pollError ? "CONNECTION ERROR" : "ONLINE"}
          </div>

          {/* 中央控制按鈕群 */}
          <div className="flex items-center gap-4 mx-auto">
            {isWaiting && (
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || isProcessing}
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-3 px-8 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] transition-all transform hover:-translate-y-1 active:scale-95 border-b-4 border-green-800 active:border-b-0 active:translate-y-0"
              >
                開始遊戲
              </button>
            )}

            {isPlaying && canPublishResults && (
              <button
                onClick={handlePublishResults}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform hover:-translate-y-1 border-b-4 border-purple-800 active:border-b-0 active:translate-y-0"
              >
                公布結果
              </button>
            )}

            {isPlaying && canNextRound && (
              <button
                onClick={handleNextRound}
                disabled={isProcessing}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all transform hover:-translate-y-1 border-b-4 border-cyan-800 active:border-b-0 active:translate-y-0"
              >
                下一回合
              </button>
            )}

            {isPlaying && canAssignIndicators && (
              <button
                onClick={handleAssignIndicators}
                disabled={isProcessing}
                className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(202,138,4,0.4)] transition-all transform hover:-translate-y-1 border-b-4 border-yellow-800 active:border-b-0 active:translate-y-0 animate-bounce"
              >
                掉落物品
              </button>
            )}
          </div>

          {/* 右側：危險操作區 */}
          <div className="flex items-center gap-2">
            {isPlaying && (
              <button
                onClick={handleEndGame}
                disabled={isProcessing}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded font-bold text-xs uppercase tracking-widest border border-transparent hover:border-red-500/30 transition-all"
              >
                結束遊戲
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}