import { useRouter } from "next/navigation";
import type { PlayerContext } from "@/lib/types";

interface LoadingViewProps {
  playerContext: PlayerContext;
  pollError: string;
  onRetry: () => void;
}

export function LoadingView({
  playerContext,
  pollError,
  onRetry,
}: LoadingViewProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-card-foreground">
          已加入,正在同步房間
        </h1>
        <p className="text-muted-foreground">
          請稍候,正在取得房間狀態。如果停留太久,可重試或返回加入頁。
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-muted-foreground mb-1">房間代碼</p>
            <p className="text-xl font-mono font-bold text-primary">
              {playerContext.room_code}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-muted-foreground mb-1">你的暱稱</p>
            <p className="text-xl font-semibold text-green-700">
              {playerContext.display_name}
            </p>
          </div>
        </div>

        {pollError && <p className="text-sm text-red-600">{pollError}</p>}

        <div className="flex flex-col gap-2">
          <button
            onClick={onRetry}
            className="w-full bg-primary hover:bg-blue-600 text-primary-foreground font-semibold py-3 rounded-lg transition shadow-md"
          >
            重新嘗試同步
          </button>
          <button
            onClick={() => router.push("/join")}
            className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-lg transition"
          >
            返回加入頁
          </button>
        </div>
      </div>
    </div>
  );
}
