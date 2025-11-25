# 前端實作完成報告

## ✅ 完成項目

### 1. 核心架構
- ✅ 類型定義（`lib/types.ts`）- 與後端 API 完全對應
- ✅ 常數定義（`lib/constants.ts`）- 遊戲規則、UI 配置
- ✅ 工具函式（`lib/utils.ts`）- LocalStorage、回合輔助函式

### 2. 通訊層
- ✅ REST API Client（`lib/api.ts`）- 完整實作所有 API 端點
- ✅ WebSocket Manager（`lib/websocket.ts`）- 事件驅動、自動重連

### 3. Player 端頁面（學生用）
- ✅ `/join` - 加入房間頁面
- ✅ `/room/[roomId]/waiting` - 等待室
- ✅ `/room/[roomId]/round` - **核心遊戲頁面（Round 1-10 共用）**
- ✅ `/room/[roomId]/message` - 留言階段（Round 5-6）
- ✅ `/room/[roomId]/indicator` - 指示物顯示（Round 6 後）
- ✅ `/room/[roomId]/summary` - 遊戲結束摘要

### 4. Host 端頁面（教師用）
- ✅ `/host` - 建立房間
- ✅ `/host/room/[roomId]` - **控制面板（大螢幕顯示）**

### 5. 品質保證
- ✅ ESLint 檢查通過（0 errors, 0 warnings）
- ✅ TypeScript 類型檢查通過
- ✅ React Hooks 最佳實踐

---

## 📁 專案結構

```
front_end/
├── app/
│   ├── page.tsx                          # 首頁（導航）
│   ├── join/
│   │   └── page.tsx                      # 玩家加入房間
│   ├── room/[roomId]/
│   │   ├── waiting/page.tsx              # 等待室
│   │   ├── round/page.tsx                # 核心遊戲頁面 ⭐
│   │   ├── message/page.tsx              # 留言階段
│   │   ├── indicator/page.tsx            # 指示物顯示
│   │   └── summary/page.tsx              # 遊戲摘要
│   └── host/
│       ├── page.tsx                      # Host 首頁
│       └── room/[roomId]/page.tsx        # Host 控制面板 ⭐
├── lib/
│   ├── types.ts                          # 類型定義
│   ├── constants.ts                      # 常數
│   ├── api.ts                            # API Client
│   ├── websocket.ts                      # WebSocket Manager
│   └── utils.ts                          # 工具函式
└── docs/
    ├── game_plan.md                      # 遊戲規劃
    ├── forntend_plan.md                  # 前端規劃
    └── openapi (1).json                  # API Spec
```

---

## 🎯 核心設計原則

### 1. **消除特殊情況**
- Round 1-10 共用同一個 `/room/[roomId]/round` 頁面
- 透過後端 API 的 `phase` 和 `round_number` 決定 UI 行為
- 不需要複雜的條件判斷，狀態機清晰

### 2. **資料流清晰**
```
WebSocket 事件 → 觸發 API 拉取 → 更新 UI
     ↓
ROUND_STARTED → getCurrentRound() → 顯示選項
     ↓
ROUND_ENDED → getRoundResult() → 顯示結果
```

### 3. **最小複雜度**
- WebSocket 只做**事件通知**（"有事發生"）
- 實際資料透過 **REST API 拉取**（"拉最新狀態"）
- 避免 WebSocket 傳遞大量資料

### 4. **錯誤處理**
- API 錯誤：顯示 alert 給用戶
- WebSocket 斷線：自動重連（最多 5 次）
- 狀態不同步：定期輪詢 + WebSocket 雙保險

---

## 🔧 環境變數配置

建立 `.env.local`（根目錄）：

```bash
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# WebSocket
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

---

## 🚀 本地開發

```bash
# 安裝依賴
npm install

# 開發模式（禁止使用！改用 build）
# npm run dev

# 檢查程式碼品質
npm run lint

# TypeScript 類型檢查
npx tsc --noEmit

# 建置（用於檢查）
npm run build
```

---

## 📋 使用流程

### Host（教師）
1. 進入 `/host` → 建立房間
2. 系統產生房間代碼（例如：`ABC123`）
3. 等待學生加入（玩家數必須為偶數）
4. 按「開始遊戲」
5. 控制每一輪：
   - 按「開始下一輪」推進
   - Round 6 後按「發放指示物」
   - 最後按「結束遊戲」
6. 查看全班統計與排名

### Player（學生）
1. 進入 `/join` → 輸入房號和暱稱
2. 等待老師開始遊戲
3. Round 1-4：選擇「加速」或「轉彎」
4. Round 5-6：可留言給對手
5. Round 6 後：看到指示物，找到同組同學
6. Round 7-10：與隊友討論後各自作答
7. 遊戲結束：查看個人成績與排名

---

## 🎨 UI/UX 特色

### 色彩系統
- **首頁**：紫藍粉漸層（多彩）
- **玩家加入**：藍色系（友善）
- **等待室**：綠色系（等待）
- **遊戲中**：紫色系（專注）
- **留言**：琥珀色系（溫暖）
- **指示物**：粉色系（強調）
- **摘要**：翠綠色系（完成）
- **Host**：深灰靛色（專業）

### 互動反饋
- ✅ 按鈕有明確的 hover 效果
- ✅ Loading 狀態顯示（載入中、提交中）
- ✅ 錯誤訊息清晰（紅色背景）
- ✅ 成功提示明確（綠色勾勾）
- ✅ 所有狀態都有文字說明

---

## 🔒 資料持久化

使用 **LocalStorage** 保存：
- Player Context（玩家 ID、房間 ID、顯示名稱）
- Host Context（房間 ID、房間代碼、Host ID）

→ **優點**：重新整理不會掉狀態
→ **限制**：換裝置需重新加入

---

## 🐛 已知限制與未來改進

### 當前實作
- ✅ 完整的遊戲流程（10 輪）
- ✅ WebSocket 實時通知
- ✅ 狀態管理清晰
- ✅ 類型安全

### 未實作功能（Phase 2）
- ⏳ QR Code 生成與掃描（可整合 `qrcode.react`）
- ⏳ 音效與動畫（勝負、倒數計時）
- ⏳ 回合倒數計時器（後端驅動）
- ⏳ 即時作答進度條（Host 端顯示 X/Y 人已作答）
- ⏳ 歷史資料匯出（CSV、PDF）

### 可優化項目
- ⏳ WebSocket 斷線後的 event 補發機制（`/events/since/{id}`）
- ⏳ 更精細的錯誤處理（網路離線偵測）
- ⏳ 可配置的遊戲規則（不同 payoff matrix）

---

## 📊 技術棧

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State**: React Hooks (useState, useEffect, useCallback)
- **Communication**:
  - REST API (Fetch)
  - WebSocket (native WebSocket API)
- **Linting**: ESLint 9 + Next.js Config

---

## ✨ Linus 式評價

### 🟢 好品味的地方
1. **消除特殊情況**：Round 1-10 共用同一個頁面，沒有 if-else 地獄
2. **資料結構清晰**：API types 直接對應後端，零轉換成本
3. **簡潔明確**：WebSocket 只做通知，資料用 GET API 拉
4. **冪等性考量**：可以重複呼叫 GET API，不會出錯

### 🟡 可接受但不完美
1. **LocalStorage 使用**：簡單但不夠 robust（換裝置會掉）
   - 改進方向：加入 session token，伺服器驗證
2. **輪詢機制**：3 秒輪詢房間狀態
   - 改進方向：純 WebSocket 驅動，減少輪詢

### 🔴 需要注意的風險
- **並發問題**：多個 Player 同時提交時，後端需要處理（已在後端設計中考慮）
- **WebSocket 斷線**：目前有重連機制，但沒有補發遺漏事件（`/events/since` API 存在但未使用）

---

## 🎓 教學價值

這個實作展示了：
1. **前後端分離**的正確做法
2. **WebSocket + REST API** 的混合策略
3. **狀態機**設計在 React 中的應用
4. **類型安全**如何避免 runtime 錯誤
5. **Linus 式思維**：消除特殊情況、簡化資料結構

---

## 📝 總結

✅ **MLP（Minimum Lovable Product）完成**

- 所有核心功能已實作
- 程式碼品質良好（lint + tsc 通過）
- UI/UX 清晰友善
- 可直接與後端整合測試

**下一步：與後端聯調，實際測試 20-60 人的教室場景**
