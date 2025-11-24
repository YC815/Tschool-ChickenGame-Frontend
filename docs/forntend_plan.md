# Frontend Plan（Next.js + Tailwind）

## 1. 目標與角色

Frontend 的角色：

- 提供 **兩個主要視角**：
  1. Host View（大螢幕／老師用）
  2. Player View（手機／學生用）
- 與 Backend 透過：
  - REST API（GET / POST）
  - WebSocket（收事件）
- 專注在：
  - 使用流程設計
  - UI/UX
  - 狀態機（state machine）控制畫面切換

---

## 2. 技術選型

- Framework：Next.js（app router or pages router 均可，建議 app router）
- Styling：Tailwind CSS
- State Management：React hooks + context（不一定需要重型 Redux）
- WebSocket：原生 WebSocket 或輕量 wrapper
- 部署：Vercel

---

## 3. 前端路由規劃

### 3.1 Player 端路由

- `/join`

  - 輸入房號 + 暱稱
  - 掃 QR code 後可直接帶 `room_code` query

- `/room/[roomId]/waiting`

  - 已加入房間、等待 Host 開始遊戲
  - 顯示：房號、目前玩家數（可選）

- `/room/[roomId]/round`

  - 遊戲進行畫面（依 state 顯示不同 UI）：
    - 顯示：當前 round、對手代號、選項按鈕
    - 點選：加速 / 轉彎
    - 顯示結果：本輪 payoff

- `/room/[roomId]/message`

  - Round 5–6：留言輸入頁面
  - 顯示上一輪對手留給自己的訊息（如果有）

- `/room/[roomId]/indicator`

  - 第 6 輪後：顯示個人指示物（符號 / 顏色 / emoji 等）
  - 提示玩家：請在教室中找到同樣符號的人

- `/room/[roomId]/team`

  - Round 7–10：顯示隊伍資訊
  - 列出隊友代號、隊伍名稱／顏色
  - 提示：請與隊友一起討論策略後按下選項

- `/room/[roomId]/summary`
  - 遊戲結束畫面
  - 顯示：個人總分、隊伍總分、簡單統計

---

### 3.2 Host 端路由（大螢幕用）

- `/host`

  - 建立新房間按鈕
  - 顯示目前房間列表（可選）

- `/host/room/[roomId]`
  - Host 控制面板 + 大螢幕顯示
  - 區塊：
    - 房號與玩家數
    - 控制按鈕：
      - 「開始遊戲」
      - 「下一輪」
      - 「發送指示物」（Round 6 後）
      - 「揭示隊伍」（可選）
      - 「顯示總結」
    - 圖表區（每輪統計）：
      - 加速 / 轉彎比例
      - 平均 payoff
      - 簡易排行榜

---

## 4. 前端狀態管理與資料流

### 4.1 Player View 狀態（state machine）

每個 Player client 有一個簡單 state machine：

- `idle`：尚未加入房間
- `joining`：正在送出 join request
- `waiting_room`：已加入房間，等待 Host 開始
- `waiting_round`：遊戲中但尚未開始本輪
- `choosing_action`：顯示選項按鈕（加速／轉彎）
- `waiting_result`：已送出選擇，等待結果
- `showing_result`：顯示本輪結果
- `message_phase`：顯示/送出留言（Round 5–6）
- `indicator_phase`：顯示指示物（Round 6 後）
- `team_phase`：顯示隊伍與隊友（Round 7–10）
- `game_summary`：顯示遊戲結束資訊

### 4.2 Host View 狀態

Host 的主要狀態：

- `room_waiting`：房間建立，等待玩家加入
- `pre_game`：人數確認，尚未按「開始遊戲」
- `in_game`：
  - `round_running`：本輪作答中
  - `round_result`：顯示本輪結果、統計
- `indicator_phase`：指示物發送與說明
- `team_phase`：隊伍揭示與說明
- `game_summary`：遊戲結束 Summary

---

## 5. 前端如何使用 Backend 端口

> 所有網址與端口透過環境變數設定：
>
> - `NEXT_PUBLIC_API_BASE_URL`
> - `NEXT_PUBLIC_WS_BASE_URL`

### 5.1 REST API 使用方式

#### 加入房間（Player）

```ts
// POST /api/rooms/{room_code}/join
const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nickname }),
});
const data = await res.json();
// 保存 room_id, player_id, display_name 到 local state / localStorage
```

#### 取得當前 round state

```ts
// GET /api/rooms/{room_id}/rounds/current
const res = await fetch(`${API_BASE}/rooms/${roomId}/rounds/current`);
const round = await res.json();
```

#### 提交選擇

```ts
// POST /api/rooms/{room_id}/rounds/{round_number}/action
await fetch(`${API_BASE}/rooms/${roomId}/rounds/${roundNumber}/action`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ player_id, choice }),
});
```

#### 取得本輪結果（Player）

```ts
// GET /api/rooms/{room_id}/rounds/{round_number}/result?player_id=...
const res = await fetch(
  `${API_BASE}/rooms/${roomId}/rounds/${roundNumber}/result?player_id=${playerId}`
);
const result = await res.json();
// result 中包含：對手名稱、雙方策略、payoff
```

Host 則會呼叫同一個 API 但取 aggregate 結果（後端可以根據是否為 Host 決定回傳內容）。

---

### 5.2 WebSocket 使用方式（Player & Host）

```ts
const ws = new WebSocket(`${WS_BASE}/ws/rooms/${roomId}?player_id=${playerId}`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case "ROOM_STARTED":
      // 切到 waiting_round 或 first round
      break;
    case "ROUND_STARTED":
      // 切到 choosing_action
      break;
    case "ROUND_ENDED":
      // 切到 waiting_result → GET result
      break;
    case "INDICATORS_ASSIGNED":
      // 切到 indicator_phase → GET indicator
      break;
    case "TEAMS_REVEALED":
      // 切到 team_phase → GET team info
      break;
    case "GAME_ENDED":
      // 切到 summary → GET summary stats
      break;
  }
};
```

---

## 6. UI 操作邏輯（玩家端）

以 Round 1–4 為例：

1. 玩家進入 `/join`，輸入房號＋暱稱 → `POST /join`
2. 成功後跳轉 `/room/[roomId]/waiting`，同時建立 WebSocket 連線
3. 收到 `ROOM_STARTED` → 跳轉 `/room/[roomId]/round`，顯示「第 1 輪即將開始」
4. 收到 `ROUND_STARTED` → 呼叫 `GET /rounds/current`，顯示對手代碼與選項按鈕
5. 玩家按「加速 / 轉彎」→ `POST /action`，UI 切換到「等待結果」
6. 收到 `ROUND_ENDED` → `GET /rounds/{n}/result?player_id`，顯示本輪結果
7. Host 按下一輪 → 重複 3–6

留言與分組的 UI 只是多加幾個「phase UI」。

---

## 7. UI 操作邏輯（Host 端）

1. 進入 `/host`，按「建立房間」→ `POST /rooms`
2. 顯示房號、QR Code、玩家列表與人數
3. 人數 OK（偶數）→ 按「開始遊戲」 → `POST /rooms/{id}/start`
4. 大螢幕顯示「第 1 輪開始」，等待玩家作答
5. 等待 Backend 廣播 `ROUND_ENDED`，自動 GET 統計並顯示
6. Host 按「下一輪」，重複流程
7. 適當時機按「發送指示物」與「顯示隊伍」
8. 最後按「顯示總結」，讓全班看到排行榜與統計圖表

---

## 8. UI/UX 大方向

- **色彩**：清楚區分「加速 / 轉彎」按鈕（例如紅 / 綠），但整體風格不要太吵，因為是教學環境。
- **資訊層次**：

  - 玩家端：只顯示「自己和本輪對手的資訊」
  - Host 端：顯示 aggregate 統計與教學用資訊

- **互動節奏**：

  - 每個階段畫面應有清楚的狀態文案（例如：「等待老師開始下一輪」、「等待對手選擇」、「查看結果」、「尋找你的隊友」）

- **錯誤處理**：

  - 若 API 失敗或 WebSocket 斷線，要顯示簡單提示「連線異常，請重新整理」＋自動重試機制
