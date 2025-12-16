import { CHOICE_LABELS } from "@/lib/constants";
import type { RoundResultResponse } from "@/lib/types";
import type { Choice } from "@/lib/types";

interface ShowingResultViewProps {
  result: RoundResultResponse;
}

export function ShowingResultView({ result }: ShowingResultViewProps) {
  
  // 根據結果情境決定標題樣式與文字
  const getOutcomeConfig = () => {
    const myChoice = result.your_choice;
    const opChoice = result.opponent_choice;

    if (myChoice === "ACCELERATE" && opChoice === "ACCELERATE") {
      return {
        text: "💥 正面衝突！",
        subtext: "雙方都選擇了不道歉",
        style: "from-red-500 to-orange-600",
        bg: "bg-red-500/10 border-red-500/30"
      };
    }
    if (myChoice === "TURN" && opChoice === "TURN") {
      return {
        text: "🤝 和平迴避",
        subtext: "雙方都選擇了道歉",
        style: "from-blue-400 to-indigo-500",
        bg: "bg-blue-500/10 border-blue-500/30"
      };
    }
    if (myChoice === "TURN" && opChoice === "ACCELERATE") {
      return {
        text: "🥲 你人好好！但輸了...",
        subtext: "你道歉，而對方不道歉",
        style: "from-gray-400 to-slate-500",
        bg: "bg-slate-500/10 border-slate-500/30"
      };
    }
    // You Accelerate, Opponent Turn
    return {
      text: "👑 膽小鬼博弈勝出！",
      subtext: "你不道歉，對方道歉了",
      style: "from-amber-300 to-yellow-500",
      bg: "bg-amber-500/10 border-amber-500/30"
    };
  };

  // 取得選擇的視覺樣式 (3D 按鈕縮小版)
  const getChoiceStyle = (choice: Choice) => {
    if (choice === "ACCELERATE") {
      return "bg-gradient-to-b from-rose-500 to-red-600 border-red-800 shadow-red-900/30";
    }
    return "bg-gradient-to-b from-blue-400 to-blue-600 border-blue-800 shadow-blue-900/30";
  };

  const outcome = getOutcomeConfig();

  return (
    <div className="space-y-6 w-full">
      
      {/* 1. 結果大標題 */}
      <div className={`text-center rounded-2xl p-6 border backdrop-blur-md relative overflow-hidden ${outcome.bg} animate-in zoom-in-95 duration-500`}>
        {/* 背景光效 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-white/10 blur-2xl rounded-full"></div>
        
        <h3 className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br ${outcome.style} mb-2 drop-shadow-sm`}>
          {outcome.text}
        </h3>
        <p className="text-white/70 text-sm font-medium">
          {outcome.subtext}
        </p>
      </div>

      {/* 2. 對戰結果卡片 (VS Layout) */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* 左側：你 (YOU) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3">
            你
          </p>
          
          {/* 選擇展示 (Mini 3D Button) */}
          <div className={`
            w-full py-2 rounded-lg border-b-4 flex items-center justify-center gap-2 mb-4
            ${getChoiceStyle(result.your_choice)}
          `}>
            <span className="text-xl filter drop-shadow">
              {result.your_choice === "ACCELERATE" ? "🙅" : "🙏"}
            </span>
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {CHOICE_LABELS[result.your_choice]}
            </span>
          </div>

          {/* 收益展示 */}
          <div className="text-center">
            <p className="text-[10px] text-white/40 mb-1">PAYOFF</p>
            <p className={`text-4xl font-black tabular-nums tracking-tighter ${result.your_payoff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {result.your_payoff > 0 ? "+" : ""}
              {result.your_payoff}
            </p>
          </div>
        </div>

        {/* 右側：對手 (OPPONENT) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-slate-500"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            對手
          </p>
          
          {/* 選擇展示 */}
          <div className={`
            w-full py-2 rounded-lg border-b-4 flex items-center justify-center gap-2 mb-4 opacity-90
            ${getChoiceStyle(result.opponent_choice)}
          `}>
            <span className="text-xl filter drop-shadow">
              {result.opponent_choice === "ACCELERATE" ? "🙅" : "🙏"}
            </span>
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {CHOICE_LABELS[result.opponent_choice]}
            </span>
          </div>

          {/* 收益展示 */}
          <div className="text-center">
            <p className="text-[10px] text-white/40 mb-1">收益</p>
            <p className={`text-4xl font-black tabular-nums tracking-tighter ${result.opponent_payoff >= 0 ? "text-emerald-400/80" : "text-red-400/80"}`}>
              {result.opponent_payoff > 0 ? "+" : ""}
              {result.opponent_payoff}
            </p>
          </div>
        </div>

      </div>

      {/* 3. 底部狀態條 */}
      <div className="flex items-center justify-center gap-2 py-4 animate-pulse">
        <div className="w-2 h-2 bg-white rounded-full"></div>
        <div className="w-2 h-2 bg-white rounded-full opacity-50"></div>
        <div className="w-2 h-2 bg-white rounded-full opacity-25"></div>
        <p className="text-xs font-bold text-white/80 tracking-widest uppercase ml-2">
          即將進入下一回合
        </p>
      </div>
    </div>
  );
}