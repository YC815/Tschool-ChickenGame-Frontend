import type { RoomStateData } from "@/lib/types";

interface RoundHeaderProps {
  roomState: RoomStateData;
  indicatorSymbol: string | null;
  onIndicatorClick: () => void;
}

export function RoundHeader({
  roomState,
  indicatorSymbol,
  onIndicatorClick,
}: RoundHeaderProps) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">
            第 {roomState.round.round_number} 輪
          </h2>
          <p className="text-sm text-muted-foreground">
            房間代碼: {roomState.room.code}
          </p>
        </div>
        {indicatorSymbol && (
          <button
            onClick={onIndicatorClick}
            className="text-6xl hover:scale-110 transition-transform cursor-pointer"
            title="點擊查看指示物說明"
          >
            {indicatorSymbol}
          </button>
        )}
      </div>
    </div>
  );
}
