# Frontend Plan（Next.js + Tailwind）— _新版：Round 7–10 僅隊友相認 + 討論_

## 1. 目標與角色

Frontend 的角色：

- 提供 **兩個主要視角**：

  1. **Host View**（大螢幕／老師用）
  2. **Player View**（手機／學生用）

- 與 Backend 透過：

  - REST API（GET / POST）
  - WebSocket（收事件）

- 專注在：

  - 使用流程設計
  - UI/UX
  - 狀態機（state machine）控制畫面切換
  - 不實作任何 heavy realtime，只做「事件 + 拉資料」

> 💡 重點差異：
> Round 7–10 不再有「team vs team payoff」，前端只需要：
>
> - 顯示「指示物」讓玩家在線下找到同組
> - 提醒「你現在可以跟隊友討論」，但作答流程完全跟 Round 1–4 相同

---

## 2. 技術選型

- Framework：Next.js（建議 app router）
- Styling：Tailwind CSS
- State Management：React hooks + Context（暫不需要 Redux）
- WebSocket：原生 WebSocket 或簡單封裝
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

  - **所有回合（1–10）共用的主遊戲畫面**
  - 根據「後端 round 狀態」顯示不同內容：

    - 回合資訊：當前 round 編號、這是「Baseline / 留言 / 協作」哪個階段
    - 對手代號
    - 選項按鈕：加速 / 轉彎
    - 結果區：本輪雙方選擇＋ payoff
    - Round 7–10 時，額外顯示一個 banner / 提示：

      > 你現在可以跟擁有相同指示物的同學討論，再自行作答 😀

- `/room/[roomId]/message`

  - **Round 5–6 專用：留言階段**
  - 功能：

    - 顯示上一輪對手留給自己的匿名訊息（如果有）
    - 提供一個輸入框，讓玩家可以留下「給上一輪對手的匿名一句話」（可選）

- `/room/[roomId]/indicator`

  - 第 6 輪結束後：顯示個人指示物（符號 / 顏色 / emoji 等）
  - UI 內容：

    - 大字顯示自己的指示物
    - 簡短說明：

      > 請在教室中找到和你有相同指示物的同學，
      > 從 Round 7 開始，你們可以討論後再各自作答。

    - 按鈕「知道了」→ 回到 `/room/[roomId]/waiting` 或直接進下一輪

- `/room/[roomId]/summary`

  - 遊戲結束畫面
  - 顯示：

    - 個人總分（累積 payoff）
    - 每輪自己的選擇與結果簡表
    - 簡單班級統計（例如：整體加速/轉彎比例概覽）

  - ⚠️ 不再顯示「隊伍總分 / 隊伍排名」，因為隊伍只是線下討論單位，沒有 server-side 算分

> ✅ 與舊版差異：
>
> - 移除 `/room/[roomId]/team`（不再需要專門顯示「隊伍 vs 隊伍」資訊的畫面）
> - 協作階段的提示直接融入 `/round` 主畫面（用 banner + 文案）

---

### 3.2 Host 端路由（大螢幕用）

- `/host`

  - 建立新房間按鈕（`POST /rooms`）
  - （可選）顯示目前可用房間列表

- `/host/room/[roomId]`

  - Host 控制面板 + 大螢幕顯示
  - 主要區塊：

    1. **房間資訊區**

       - 房號（Room Code）
       - QR Code（加入連結）
       - 目前玩家數 / 已加入玩家列表（暱稱＋簡單代號）

    2. **控制按鈕**

       - 「開始遊戲」：從 waiting → Round 1
       - 「下一輪」：推進 round number，廣播 `ROUND_STARTED`
       - 「發送指示物」：在 Round 6 結束後使用，廣播 `INDICATORS_ASSIGNED`
       - 「顯示總結」：遊戲結束後，顯示 Summary 畫面供全班討論

       > ⚠️ 已移除「揭示隊伍 / 顯示隊伍」按鈕，因為不再需要 team vs team 資訊

    3. **統計顯示區**

       - 每輪加速 / 轉彎比例（條狀圖或簡易圓餅）
       - 平均 payoff
       - 簡易個人排行榜（可選）

       > 不需要顯示「隊伍總分」，只做個人層級與整體趨勢

    4. **階段提示區**

       - 清楚顯示目前狀態：

         - 等待玩家加入
         - 第 X 輪作答中
         - 第 X 輪結果
         - 正在發放指示物（請同學看手機）
         - 遊戲結束／總結討論中

---

## 4. 前端狀態管理與資料流

### 4.1 Player View 狀態（state machine）

每個 Player client 的狀態可以整理為：

- `idle`：尚未加入房間
- `joining`：送出 join request 中
- `waiting_room`：已加入房間，等待 Host 開始
- `waiting_round`：遊戲中，但尚未開始本輪
- `choosing_action`：顯示選項按鈕（加速／轉彎）
- `waiting_result`：已送出選擇，等待結果
- `showing_result`：顯示本輪結果
- `message_phase`：Round 5–6 留言階段
- `indicator_phase`：Round 6 結束後顯示指示物畫面
- `game_summary`：顯示遊戲結束資訊

> ✅ 與舊版差異：
>
> - 移除 `team_phase`／`discussion_team` 這種需要 server 給 team 結構的狀態
> - Round 7–10 只是正常的 `choosing_action` 流程，只是在 UI 文案上提醒「你可以與同指示物的同學討論」

### 4.2 Host View 狀態

Host 端狀態：

- `room_waiting`：房間建立，等待玩家加入
- `pre_game`：人數確認，尚未按「開始遊戲」
- `in_game`：

  - `round_running`：本輪作答中
  - `round_result`：顯示本輪結果與統計（Host 決定什麼時候按下一輪）

- `indicator_phase`：Round 6 結束後，按下「發送指示物」，畫面提醒學生看手機、去找隊友
- `game_summary`：顯示總結畫面供課堂討論

> ✅ 差異：不再有 `team_phase` / `teams_revealed`，因為隊伍討論是線下發生，前端只提供提示即可。

---

## 5. 前端如何使用 Backend 端口

> host / player 共用的 API base 用環境變數：
>
> - `NEXT_PUBLIC_API_BASE_URL`
> - `NEXT_PUBLIC_WS_BASE_URL`

### 5.1 REST API（保持簡單）

#### 加入房間（Player）

```ts
// POST /api/rooms/{room_code}/join
const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nickname }),
});
const data = await res.json();
// 保存 room_id, player_id, display_name
```

#### 取得當前 round 狀態

```ts
// GET /api/rooms/{room_id}/rounds/current
const res = await fetch(`${API_BASE}/rooms/${roomId}/rounds/current`);
const round = await res.json();
// round 會包含：round_number, phase（normal/message/cooperation 之類）, opponent_code 等
```

#### 提交選擇

```ts
// POST /api/rooms/{room_id}/rounds/{round_number}/action
await fetch(`${API_BASE}/rooms/${roomId}/rounds/${roundNumber}/action`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ player_id, choice }), // choice: "accelerate" | "turn"
});
```

#### 取得本輪結果（Player）

```ts
// GET /api/rooms/{room_id}/rounds/{round_number}/result?player_id=...
const res = await fetch(
  `${API_BASE}/rooms/${roomId}/rounds/${roundNumber}/result?player_id=${playerId}`
);
const result = await res.json();
// result: { opponent_code, your_choice, opponent_choice, your_payoff, opponent_payoff }
```

#### 取得指示物（Round 6 後）

```ts
// GET /api/rooms/{room_id}/indicator?player_id=...
const res = await fetch(
  `${API_BASE}/rooms/${roomId}/indicator?player_id=${playerId}`
);
const data = await res.json();
// data: { indicator_symbol: "🍋" } 等
```

> ✅ 不再需要任何 `/teams` / `/team_result` 類 API，因為不做 server-side team 邏輯。

---

### 5.2 WebSocket 使用方式（Player & Host）

```ts
const ws = new WebSocket(`${WS_BASE}/ws/rooms/${roomId}?player_id=${playerId}`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case "ROOM_STARTED":
      // 從 waiting_room → waiting_round 或直接進 Round 1
      break;
    case "ROUND_STARTED":
      // 切到 choosing_action，並 GET /rounds/current
      break;
    case "ROUND_ENDED":
      // 切到 waiting_result，然後 GET 本輪結果
      break;
    case "MESSAGE_PHASE":
      // Round 5–6 message 階段
      break;
    case "INDICATORS_ASSIGNED":
      // Round 6 結束後：切到 indicator_phase → GET 自己的指示物
      break;
    case "GAME_ENDED":
      // 切到 summary → GET summary stats
      break;
  }
};
```

> ✅ 「隊伍」相關事件（例如 `TEAMS_REVEALED`）已不需要。
> 協作是完全 offline，因此 WebSocket 只需要管：
>
> - 回合開始 / 結束
> - 留言階段開始
> - 指示物發送
> - 遊戲結束

---

## 6. UI 操作邏輯（玩家端）

以完整流程看一次（串起 Round 1–10）：

1. 玩家進入 `/join` → 輸入房號＋暱稱 → `POST /join`
2. 成功後跳轉 `/room/[roomId]/waiting`，並建立 WebSocket 連線
3. 收到 `ROOM_STARTED` → 跳 `/room/[roomId]/round`，顯示「第 1 輪即將開始」
4. 收到 `ROUND_STARTED` → `GET /rounds/current`，顯示對手代碼與選項按鈕
5. 玩家選擇「加速 / 轉彎」→ `POST /action`，UI 切到「等待結果」
6. 收到 `ROUND_ENDED` → `GET /rounds/{n}/result`，顯示本輪結果
7. Round 5–6 完成後，Backend 廣播 `MESSAGE_PHASE`：

   - 玩家被導向 `/room/[roomId]/message`
   - 看對手留給自己的訊息（上一輪），可以選擇是否回覆一句話

8. Round 6 結束後，Host 觸發指示物發放 → Backend 廣播 `INDICATORS_ASSIGNED`：

   - 玩家跳到 `/room/[roomId]/indicator`，看到指示物
   - 線下去找到同指示物同學 → 按「知道了」回到等待下一輪／round 畫面

9. Round 7–10：

   - 技術流程跟 Round 1–4 完全相同（收到 `ROUND_STARTED` → `/round` → 作答 → 看結果）
   - 差別在於 `/round` 頁面的 banner 說明：

     > 你可以與擁有相同指示物的同學討論後，再各自作答。

10. 遊戲結束 → 收到 `GAME_ENDED` → `/room/[roomId]/summary` 顯示個人總結

---

## 7. UI 操作邏輯（Host 端）

1. 進入 `/host` → 按「建立房間」→ `POST /rooms`
2. 自動導到 `/host/room/[roomId]`，顯示：

   - 房號、QR Code、當前玩家數

3. 人數 OK（最好偶數）→ 按「開始遊戲」→ `POST /rooms/{id}/start`
4. 畫面切到「第 1 輪作答中」，並顯示即時作答進度（可選）
5. Backend 根據截止時間或全員作答，廣播 `ROUND_ENDED`
   Host 端自動 `GET round stats`，顯示本輪統計與討論用視覺化
6. 老師視情況按「下一輪」→ 重複 4–5
7. Round 6 結束後，在 Host 面板按「發送指示物」：

   - Backend 計算分配指示物、寫 DB，廣播 `INDICATORS_ASSIGNED`
   - Host 端畫面顯示說明：

     > 已發放指示物，請同學看手機並找到有相同符號的同學，一起討論。

8. Round 7–10 流程同前，只是老師可以口頭引導線下討論
9. 結束後按「顯示總結」→ 顯示：

   - 全班加速/轉彎比例變化
   - 個人／整體平均 payoff 分布（可匿名）
   - 幾張分析圖，當作賽局理論教學素材

---

## 8. UI/UX 大方向

- **色彩**

  - 加速 / 轉彎按鈕顏色區隔明顯（例如紅 / 藍），但整體畫面乾淨、教學友好

- **資訊層次**

  - 玩家端：始終只看到「自己 + 當輪對手」資訊，以及簡單說明
  - Host 端：顯示 aggregate 資料，用來帶討論

- **互動節奏**

  - 每一階段都要有清楚文字提示：

    - 「等待老師開始下一輪」
    - 「請選擇你的策略」
    - 「結果出來了，請看看你和對手的 payoff」
    - 「現在是留言時間」
    - 「請看手機指示物，去找到你的隊友」

- **錯誤與斷線處理**

  - API 出錯或 WebSocket 斷線時，顯示：

    > 連線異常，請重新整理頁面（如果問題持續，請舉手告訴老師）

  - 可以簡單實作「自動重試幾次 + fallback 提示」
