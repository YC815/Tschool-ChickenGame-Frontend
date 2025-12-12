import Link from "next/link";

/**
 * 首頁 - 導航到玩家端或 Host 端
 */
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-secondary p-4">
      <div className="w-full max-w-4xl">
        {/* 標題 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            膽小鬼賽局（社交版）
          </h1>
          <p className="text-xl text-muted-foreground">
            多人互動賽局教學系統
          </p>
          <p className="text-muted-foreground mt-2">
            Game Theory Teaching Platform
          </p>
        </div>

        {/* 選項卡 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 玩家端 */}
          <Link href="/join">
            <div className="bg-card rounded-2xl shadow-xl p-8 hover:shadow-2xl transition cursor-pointer group">
              <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg
                  className="w-8 h-8 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-card-foreground text-center mb-3">
                學生端
              </h2>
              <p className="text-muted-foreground text-center mb-4">
                使用手機加入遊戲房間
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ 掃描 QR Code 或輸入房號</li>
                <li>✓ 參與 10 輪賽局</li>
                <li>✓ 與同學互動與討論</li>
              </ul>
            </div>
          </Link>

          {/* Host 端 */}
          <Link href="/host">
            <div className="bg-card rounded-2xl shadow-xl p-8 hover:shadow-2xl transition cursor-pointer group">
              <div className="w-16 h-16 bg-accent rounded-full mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <svg
                  className="w-8 h-8 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-card-foreground text-center mb-3">
                教師端
              </h2>
              <p className="text-muted-foreground text-center mb-4">
                在大螢幕控制遊戲流程
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ 建立房間與生成代碼</li>
                <li>✓ 控制回合進行</li>
                <li>✓ 查看即時統計與結果</li>
              </ul>
            </div>
          </Link>
        </div>

        {/* 底部資訊 */}
        <div className="mt-12 text-center">
          <div className="bg-card/80 backdrop-blur rounded-lg p-6 inline-block">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">
              關於此遊戲
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              社交版膽小鬼賽局模擬「吵架後誰先道歉」的情境：道歉可修補關係但有點失勢，不道歉則可能雙輸。
              本系統讓學生透過實際參與，體驗策略選擇、信號傳遞與團隊協作，
              從遊戲中學習經濟學與決策理論。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
