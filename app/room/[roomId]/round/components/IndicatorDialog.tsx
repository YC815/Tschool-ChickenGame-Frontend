'use client';

interface IndicatorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorSymbol: string;
}

export function IndicatorDialog({
  isOpen,
  onClose,
  indicatorSymbol,
}: IndicatorDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-border">
        <div className="text-center mb-6">
          <div className="text-8xl mb-4">{indicatorSymbol}</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            你獲得了一個指示物！
          </h2>
          <p className="text-muted-foreground">
            這個指示物代表你在遊戲中的特殊身份或狀態
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            指示物會顯示在畫面右上角，你可以隨時點擊查看說明
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition shadow-md"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
