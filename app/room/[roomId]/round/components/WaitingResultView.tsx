import { CHOICE_LABELS } from "@/lib/constants";
import type { Choice, RoomStateData } from "@/lib/types";

interface WaitingResultViewProps {
  roomState: RoomStateData;
  choiceToShow: Choice | null;
}

export function WaitingResultView({
  roomState,
  choiceToShow,
}: WaitingResultViewProps) {
  const getMessage = () => {
    if (roomState.round.status === "waiting_actions") {
      return "已提交,等待其他玩家...";
    }
    if (roomState.round.status === "ready_to_publish") {
      return "所有玩家已提交,等待老師公布結果...";
    }
    if (roomState.round.status === "completed") {
      return "取得結果中...";
    }
    return "等待中...";
  };

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 bg-primary rounded-full mx-auto flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-primary-foreground animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-foreground font-medium">{getMessage()}</p>
      {choiceToShow && (
        <p className="text-sm text-muted-foreground mt-2">
          你的選擇：{CHOICE_LABELS[choiceToShow]}
        </p>
      )}
    </div>
  );
}
