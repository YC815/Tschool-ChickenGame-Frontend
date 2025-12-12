import type { PayoffRecord } from "@/lib/types";

interface PayoffSummaryProps {
  payoffHistory: PayoffRecord[];
  totalPayoff: number;
}

export function PayoffSummary({
  payoffHistory,
  totalPayoff,
}: PayoffSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
      <h3 className="text-lg font-bold text-green-800 mb-4 text-center">
        收益統計
      </h3>
      <div className="bg-card rounded-lg p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-1 text-center">
          累計總收益
        </p>
        <p className="text-4xl font-bold text-green-600 text-center">
          {totalPayoff >= 0 ? "+" : ""}
          {totalPayoff}
        </p>
        <p className="text-xs text-muted-foreground mt-1 text-center">分</p>
      </div>

      {payoffHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">歷史記錄</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {payoffHistory.map((record) => (
              <div
                key={record.round_number}
                className="flex justify-between items-center bg-card rounded px-3 py-2 text-sm border border-border"
              >
                <span className="text-muted-foreground">
                  第 {record.round_number} 輪
                </span>
                <span
                  className={`font-bold ${
                    record.payoff >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {record.payoff >= 0 ? "+" : ""}
                  {record.payoff}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
