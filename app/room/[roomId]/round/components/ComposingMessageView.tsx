interface ComposingMessageViewProps {
  messageDraft: string;
  messageError: string;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}

export function ComposingMessageView({
  messageDraft,
  messageError,
  onMessageChange,
  onSubmit,
}: ComposingMessageViewProps) {
  const charCount = Array.from(messageDraft.trim()).length;
  const canSubmit = charCount >= 1 && charCount <= 3;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground text-center mb-4">
        給對方送出 1~3 個 emoji
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        輸入 1~3 個 emoji 來表達你的想法（不可略過）
      </p>

      <label className="block text-sm font-semibold text-foreground mb-2">
        Emoji 輸入
      </label>
      <input
        type="text"
        value={messageDraft}
        onChange={(e) => onMessageChange(e.target.value)}
        maxLength={10}
        className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:ring focus:ring-amber-200 transition bg-card text-3xl text-center"
        placeholder="😀🎉👍"
      />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{charCount} / 3</span>
        {charCount > 3 && (
          <span className="text-red-600">最多 3 個字元</span>
        )}
      </div>

      {messageError && <p className="text-sm text-red-600">{messageError}</p>}

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold py-3 rounded-lg transition shadow-md disabled:shadow-none disabled:cursor-not-allowed"
      >
        {!messageDraft.trim()
          ? "請輸入至少 1 個字元"
          : charCount > 3
            ? "超過字數限制"
            : "送出 emoji"}
      </button>
    </div>
  );
}
