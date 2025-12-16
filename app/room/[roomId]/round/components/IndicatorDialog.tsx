'use client';

interface IndicatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorSymbol: string;
}

export function IndicatorDialog({
  isOpen,
  onClose,
  indicatorSymbol,
}: IndicatorDialogProps) {
  if (!isOpen) return null;

  return (
    // 背景遮罩：深色模糊
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      
      {/* 彈窗本體 */}
      <div className="relative bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        {/* 背景裝飾光效 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-indigo-500/20 to-transparent"></div>
        
        <div className="relative p-8 flex flex-col items-center">
          
          {/* 符號展示區 (神聖光芒效果) */}
          <div className="relative mb-8 group">
            {/* 旋轉光芒背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/30 to-yellow-400/0 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent)] animate-[spin_4s_linear_infinite]"></div>
            
            {/* 符號本體 */}
            <div className="relative text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transform transition-transform group-hover:scale-110 duration-300">
              {indicatorSymbol}
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-wide text-center">
            你獲得了指示物！
          </h2>
          <p className="text-indigo-200 text-sm text-left font-medium leading-relaxed mb-6">
            在弘道基地的未來教室裡，你只是想找個安靜的位置完成 60 份康乃爾筆記。<br/>
            天花板掉下指示物，請你找到你的夥伴，跟你一起完成任務吧！<br/><br/>
            主線任務：目前賽局；支線任務：跟校長說「校長您好帥」。
          </p>


          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-md">
            <div className="flex gap-3">
              <div className="text-xl">💡</div>
              <p className="text-xs text-indigo-100/80 leading-5 text-left">
                指示物將常駐於畫面<span className="text-white font-bold">右上角</span>。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
}