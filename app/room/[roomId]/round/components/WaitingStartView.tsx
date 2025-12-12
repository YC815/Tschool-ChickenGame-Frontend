import type { PlayerContext, RoomStateData } from "@/lib/types";

interface WaitingStartViewProps {
  roomState: RoomStateData;
  playerContext: PlayerContext;
}

export function WaitingStartView({
  roomState,
  playerContext,
}: WaitingStartViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">
          等待遊戲開始
        </h1>

        <div className="space-y-4">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">房間代碼</p>
            <p className="text-4xl font-mono font-bold text-primary text-center tracking-widest">
              {roomState.room.code}
            </p>
          </div>

          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">目前玩家數</p>
            <p className="text-3xl font-bold text-foreground text-center">
              {roomState.room.player_count}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">你的暱稱</p>
            <p className="text-xl font-semibold text-green-600 text-center">
              {playerContext.display_name}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 text-center">
            請等待老師開始遊戲...
          </p>
        </div>
      </div>
    </div>
  );
}
