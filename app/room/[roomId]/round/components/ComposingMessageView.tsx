interface ComposingMessageViewProps {
  messageDraft: string;
  messageError: string;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}

export function ComposingMessageView({
  messageDraft,
  messageError,
  onMessageChange,
  onSubmit,
}: ComposingMessageViewProps) {
  const charCount = Array.from(messageDraft.trim()).length;
  // 判斷是否符合 1~3 個字的規則
  const isValidLength = charCount >= 1 && charCount <= 3;
  
  return (
    <div className="flex flex-col h-full items-center justify-center space-y-8 py-4">
      
      {/* 標題區塊 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
            通訊開放
          </span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide">
          發送訊息
        </h2>
        <p className="text-sm text-indigo-200/80">
          請輸入 <span className="text-white font-bold mx-1">1 ~ 3</span> 個 Emoji
        </p>
      </div>

      {/* 輸入區塊 */}
      <div className="w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        
        <div className="relative bg-slate-900 border-2 border-amber-500/30 rounded-xl overflow-hidden shadow-inner shadow-black/50">
          {/* 輸入框 */}
          <input
            type="text"
            value={messageDraft}
            onChange={(e) => onMessageChange(e.target.value)}
            // 限制稍微多一點防止卡住，但驗證還是擋 3 個
            maxLength={10} 
            className="w-full h-24 bg-transparent text-center text-5xl font-black text-white placeholder-white/10 focus:outline-none focus:bg-white/5 transition-colors"
            placeholder="🦐"
            autoComplete="off"
          />
          
          {/* 底部狀態列 */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-t border-white/5">
            <div className={`flex items-center gap-2 text-xs font-mono font-bold ${charCount > 3 ? "text-red-500" : "text-amber-500"}`}>
              <span>字數:</span>
              <span className="bg-white/10 px-2 py-0.5 rounded">
                {charCount} / 3
              </span>
            </div>
          </div>
        </div>

        {/* 錯誤提示 (浮動) */}
        {messageError && (
          <div className="absolute -bottom-8 left-0 w-full text-center animate-bounce">
            <span className="text-xs font-bold text-red-400 bg-red-900/50 px-3 py-1 rounded-full border border-red-500/50">
              ⚠️ {messageError}
            </span>
          </div>
        )}
      </div>

      {/* 發送按鈕 */}
      <button
        onClick={onSubmit}
        disabled={!isValidLength}
        className="group relative w-full h-16 mt-4 touch-manipulation"
      >
        {/* 按鈕陰影層 */}
        <div className={`absolute inset-0 bg-amber-800 rounded-xl transition-transform ${isValidLength ? 'translate-y-2 group-active:translate-y-0' : 'translate-y-0 opacity-50'}`}></div>
        
        {/* 按鈕本體 */}
        <div className={`
          absolute inset-0 flex items-center justify-center rounded-xl transition-transform border-b-4 
          ${isValidLength 
            ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-800 cursor-pointer group-active:translate-y-2 group-active:border-b-0 hover:brightness-110' 
            : 'bg-slate-700 border-slate-800 cursor-not-allowed opacity-80'
          }
        `}>
          <span className={`text-lg font-black tracking-widest uppercase flex items-center gap-2 ${isValidLength ? 'text-amber-950 drop-shadow-sm' : 'text-slate-400'}`}>
            {!messageDraft.trim() ? (
              "等待輸入..."
            ) : charCount > 3 ? (
              "字數過多"
            ) : (
              <>
                <span>🚀</span> 傳送訊息
              </>
            )}
          </span>
        </div>
      </button>

      {/* 裝飾性文字 */}
      <div className="text-[10px] text-indigo-300/30 font-mono text-center tracking-[0.2em]">
        已建立安全連線
      </div>
    </div>
  );
}