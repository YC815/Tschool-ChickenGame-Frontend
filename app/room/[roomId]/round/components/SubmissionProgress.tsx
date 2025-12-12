import type { RoomStateData } from "@/lib/types";

interface SubmissionProgressProps {
  roomState: RoomStateData;
}

export function SubmissionProgress({ roomState }: SubmissionProgressProps) {
  const submittedCount = roomState.round.submitted_actions;
  const totalCount = roomState.round.total_players;
  const percentage = (submittedCount / totalCount) * 100;

  return (
    <div className="bg-muted border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          提交進度
        </span>
        <span className="text-sm font-bold text-foreground">
          {submittedCount} / {totalCount}
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
