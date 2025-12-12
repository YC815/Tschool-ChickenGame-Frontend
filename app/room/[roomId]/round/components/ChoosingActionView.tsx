import { CHOICE_COLORS, CHOICE_LABELS } from "@/lib/constants";
import type { Choice } from "@/lib/types";
import type { OpponentMessageStatus } from "../hooks/useGamePhase";
import { OpponentMessageStatusView } from "./OpponentMessageStatus";

interface ChoosingActionViewProps {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  onChoice: (choice: Choice) => void;
  // Round 5-6 專用
  isMessageRound?: boolean;
  myMessage?: string | null;
  opponentMessageStatus?: OpponentMessageStatus;
  opponentMessage?: string | null;
}

export function ChoosingActionView({
  isSubmitting,
  hasSubmitted,
  onChoice,
  isMessageRound = false,
  myMessage = null,
  opponentMessageStatus = "none",
  opponentMessage = null,
}: ChoosingActionViewProps) {
  return (
    <div className="space-y-6">
      {/* Round 5-6: 顯示留言區塊 */}
      {isMessageRound && (
        <div className="space-y-4">
          {myMessage && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">
                你的留言（已送出）
              </p>
              <p className="text-3xl text-center">{myMessage}</p>
            </div>
          )}

          <OpponentMessageStatusView
            status={opponentMessageStatus}
            message={opponentMessage}
          />
        </div>
      )}

      {/* 策略選擇 */}
      <div>
        <p className="text-center text-foreground mb-6 font-medium">
          選擇你的策略：
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChoice("ACCELERATE")}
            disabled={isSubmitting || hasSubmitted}
            className={`${CHOICE_COLORS.ACCELERATE} text-primary-foreground font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-4xl mb-2">🙅</div>
            <div className="text-xl">{CHOICE_LABELS.ACCELERATE}</div>
          </button>
          <button
            onClick={() => onChoice("TURN")}
            disabled={isSubmitting || hasSubmitted}
            className={`${CHOICE_COLORS.TURN} text-primary-foreground font-bold py-8 rounded-xl transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-4xl mb-2">🙏</div>
            <div className="text-xl">{CHOICE_LABELS.TURN}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
