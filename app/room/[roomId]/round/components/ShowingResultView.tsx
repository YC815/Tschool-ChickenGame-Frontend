import { CHOICE_COLORS, CHOICE_LABELS } from "@/lib/constants";
import type { RoundResultResponse } from "@/lib/types";

interface ShowingResultViewProps {
  result: RoundResultResponse;
}

export function ShowingResultView({ result }: ShowingResultViewProps) {
  const getOutcomeMessage = () => {
    if (
      result.your_choice === "ACCELERATE" &&
      result.opponent_choice === "ACCELERATE"
    )
      return "💥 雙方都加速！";
    if (result.your_choice === "TURN" && result.opponent_choice === "TURN")
      return "🤝 雙方都轉向！";
    if (
      result.your_choice === "TURN" &&
      result.opponent_choice === "ACCELERATE"
    )
      return "🙏 你轉向了，對方加速";
    return "🙅 你加速了，對方轉向";
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-6 text-center">
        <h3 className="text-2xl font-bold text-purple-900 mb-4">
          {getOutcomeMessage()}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">你的選擇</p>
            <div
              className={`${CHOICE_COLORS[result.your_choice]} text-primary-foreground font-bold py-3 px-4 rounded-lg mb-3`}
            >
              {CHOICE_LABELS[result.your_choice]}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">你的收益</p>
              <p
                className={`text-3xl font-bold ${
                  result.your_payoff >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {result.your_payoff >= 0 ? "+" : ""}
                {result.your_payoff}
              </p>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-2">對方選擇</p>
            <div
              className={`${CHOICE_COLORS[result.opponent_choice]} text-primary-foreground font-bold py-3 px-4 rounded-lg mb-3`}
            >
              {CHOICE_LABELS[result.opponent_choice]}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">對方收益</p>
              <p
                className={`text-3xl font-bold ${
                  result.opponent_payoff >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {result.opponent_payoff >= 0 ? "+" : ""}
                {result.opponent_payoff}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800">等待下一輪開始...</p>
      </div>
    </div>
  );
}
