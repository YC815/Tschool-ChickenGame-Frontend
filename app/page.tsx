"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { joinRoom } from "@/lib/api";
import { savePlayerContext } from "@/lib/utils";

// ----------------------------------------------------------------------
// 開場動畫元件：6張照片滑落
// ----------------------------------------------------------------------
function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(false);

  // ▼▼▼ 修改這裡：填入你的圖片路徑 ▼▼▼
  const cards = [
    // src: 填入圖片路徑 (例如 "/avatars/1.png" 或 "https://example.com/1.jpg")
    { src: "/avatars/1.png", rotate: "-rotate-6", left: "10%" },
    { src: "/avatars/2.png", rotate: "rotate-12", left: "60%" },
    { src: "/avatars/3.png", rotate: "-rotate-3", left: "30%" },
    { src: "/avatars/4.png", rotate: "rotate-6", left: "70%" },
    { src: "/avatars/5.png", rotate: "-rotate-12", left: "20%" },
    { src: "/avatars/6.png", rotate: "rotate-3", left: "50%" },
  ];

  useEffect(() => {
    // 觸發掉落動畫
    const timer = setTimeout(() => setMounted(true), 100);
    
    // 動畫總時長後通知父元件結束 (例如 2.5秒)
    const endTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-900 overflow-hidden pointer-events-none">
      <h2 className={`text-white text-2xl font-bold mb-8 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        最蝦趴的賽局正在載入...
      </h2>
      
      <div className="relative w-full max-w-sm h-96">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`absolute top-0 w-24 h-32 bg-white border-4 border-white shadow-xl rounded-lg ${card.rotate} transition-all duration-700 ease-out overflow-hidden`}
            style={{
              left: card.left,
              transform: mounted 
                ? `translateY(${10 + index * 15}px) translateX(-50%)` 
                : `translateY(-120vh) translateX(-50%)`,
              transitionDelay: `${index * 300}ms`,
              opacity: mounted ? 1 : 0
            }}
          >
            {/* ▼▼▼ 修改這裡：顯示圖片 ▼▼▼ */}
            <img 
              src={card.src} 
              alt={`Character ${index + 1}`}
              className="w-full h-full object-cover"
            />
             {/* ▲▲▲ 修改結束 ▲▲▲ */}
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 表單元件
// ----------------------------------------------------------------------
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

    // 震動反饋 (若裝置支援)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    setIsJoining(true);
    setError("");

    try {
      const response = await joinRoom(roomCode.trim(), {
        nickname: nickname.trim(),
      });

      savePlayerContext({
        player_id: response.player_id,
        room_id: response.room_id,
        display_name: response.display_name,
        room_code: roomCode.trim(),
        state: "waiting_room",
      });

      router.push(`/room/${response.room_id}/round`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入房間失敗");
      setIsJoining(false);
      // 錯誤震動
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* 房號輸入 */}
      <div className="relative group">
        <label
          htmlFor="roomCode"
          className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-indigo-600 rounded-full shadow-sm z-10"
        >
          房號
        </label>
        <input
          id="roomCode"
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="000000"
          maxLength={6}
          inputMode="text"
          autoComplete="off"
          className="w-full h-16 text-3xl text-center font-black tracking-[0.5em] text-indigo-900 border-4 border-indigo-100 rounded-2xl bg-white shadow-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:outline-none transition-all placeholder:text-gray-200 uppercase"
          disabled={isJoining}
        />
      </div>

      {/* 暱稱輸入 */}
      <div className="relative group">
        <label
          htmlFor="nickname"
          className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-indigo-600 rounded-full shadow-sm z-10"
        >
          暱稱
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="燃燒吧！小宇宙"
          maxLength={10}
          className="w-full h-14 px-6 text-xl font-bold text-gray-700 border-4 border-indigo-100 rounded-2xl bg-white shadow-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 focus:outline-none transition-all placeholder:text-gray-300"
          disabled={isJoining}
        />
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="bg-red-500/10 border-2 border-red-500 text-red-600 px-4 py-3 rounded-xl text-sm font-bold text-center animate-bounce">
          {error}
        </div>
      )}

      {/* 加入按鈕 - 遊戲風格按鈕 */}
      <button
        onClick={handleJoin}
        disabled={isJoining || !roomCode.trim() || !nickname.trim()}
        className="group relative w-full h-16 mt-4 touch-manipulation"
      >
        <div className={`absolute inset-0 bg-indigo-600 rounded-2xl transition-transform ${!isJoining && roomCode && nickname ? 'translate-y-2 group-active:translate-y-0' : 'translate-y-0 opacity-50'}`}></div>
        <div className={`absolute inset-0 flex items-center justify-center bg-indigo-500 rounded-2xl transition-transform border-b-4 border-indigo-700 ${!isJoining && roomCode && nickname ? 'group-active:translate-y-2 group-active:border-b-0' : 'cursor-not-allowed opacity-80'}`}>
          <span className="text-xl font-black text-white tracking-wider uppercase drop-shadow-md">
            {isJoining ? "連線中..." : "等不及了！開始"}
          </span>
        </div>
      </button>
    </div>
  );
}

// ----------------------------------------------------------------------
// 主頁面
// ----------------------------------------------------------------------
export default function JoinPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const handleIntroComplete = () => {
    // 漸漸隱藏動畫層，顯示表單層
    setShowIntro(false);
    setTimeout(() => setShowForm(true), 300); // 稍微延遲讓淡出更自然
  };

  return (
    // 使用 min-h-[100dvh] 確保在手機瀏覽器上高度正確 (避免網址列遮擋)
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 裝飾背景：動態光暈 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[30%] bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[30%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* 開場動畫層 */}
      {showIntro && (
        <div className={`absolute inset-0 z-50 transition-opacity duration-500 ${showForm ? 'opacity-0' : 'opacity-100'}`}>
          <IntroAnimation onComplete={handleIntroComplete} />
        </div>
      )}

      {/* 主要內容容器 */}
      <div className={`w-full max-w-sm px-6 relative z-10 transition-all duration-700 transform ${showForm ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Logo / 標題區 */}
        <div className="text-center mb-10">
          <div className="inline-block bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1 mb-4 shadow-lg">
            <span className="text-xs font-bold text-white tracking-widest uppercase">因為經濟學的好，所以才能請千億大畫家</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-sm leading-tight">
            膽小鬼<br/>賽局
          </h1>
        </div>

        {/* 卡片容器 */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-900/50 p-6 md:p-8 border border-white/50">
          <Suspense fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-16 bg-indigo-100/50 rounded-2xl"></div>
              <div className="h-14 bg-indigo-100/50 rounded-2xl"></div>
              <div className="h-16 bg-indigo-200/50 rounded-2xl mt-4"></div>
            </div>
          }>
            <JoinFormWithParams />
          </Suspense>
        </div>

        {/* 底部輔助文字 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-indigo-200 font-medium opacity-80">
            請掃描大螢幕 QR Code 獲取代碼
          </p>
        </div>
      </div>
    </div>
  );
}