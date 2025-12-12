export type OpponentMessageStatus = "typing" | "sent" | "none";

interface OpponentMessageStatusProps {
  status: OpponentMessageStatus;
  message: string | null;
}

export function OpponentMessageStatusView({
  status,
  message,
}: OpponentMessageStatusProps) {
  if (status === "none") return null;

  if (status === "typing") {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
            <span
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
            <span
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
          <p className="text-sm text-amber-800 font-medium">
            對方正在輸入留言中...
          </p>
        </div>
      </div>
    );
  }

  if (status === "sent" && message) {
    return (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-2">對方的留言</p>
        <p className="text-3xl text-center">{message}</p>
      </div>
    );
  }

  return null;
}
