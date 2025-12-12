interface IndicatorReminderProps {
  indicatorSymbol: string;
  onClick: () => void;
}

export function IndicatorReminder({
  indicatorSymbol,
  onClick,
}: IndicatorReminderProps) {
  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onClick}
          className="text-5xl hover:scale-110 transition-transform cursor-pointer"
          title="點擊查看指示物說明"
        >
          {indicatorSymbol}
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            你獲得了指示物
          </p>
          <p className="text-xs text-amber-700">點擊圖示查看說明</p>
        </div>
      </div>
    </div>
  );
}
