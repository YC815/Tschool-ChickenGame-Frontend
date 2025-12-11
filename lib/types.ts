/**
 * 核心類型定義
 * 基於 Backend OpenAPI spec
 */

// ============================================
// Enums（與後端完全對應）
// ============================================

export type Choice = "ACCELERATE" | "TURN";

export type RoomStatus = "WAITING" | "PLAYING" | "FINISHED";

export type RoundPhase = "NORMAL" | "MESSAGE" | "INDICATOR";

export type RoundStatus = "waiting_actions" | "ready_to_publish" | "completed";

// ============================================
// API Request Types
// ============================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RoomCreate {
  // 空 body，後端自動生成
}

export interface PlayerJoin {
  nickname: string; // 1-50 chars
}

export interface ActionSubmit {
  player_id: string; // UUID
  choice: Choice;
}

export interface MessageSubmit {
  sender_id: string; // UUID
  content: string; // 1-100 chars
}

// ============================================
// API Response Types
// ============================================

export interface RoomResponse {
  room_id: string; // UUID
  code: string; // 6-digit code
  host_player_id: string; // UUID
}

export interface RoomStatusResponse {
  room_id: string;
  code: string;
  status: RoomStatus;
  current_round: number; // 0-10
  player_count: number;
}

export interface PlayerResponse {
  player_id: string;
  room_id: string;
  display_name: string; // e.g., "狐狸 1"
}

export interface RoundCurrentResponse {
  round_number: number;
  phase: RoundPhase;
  status: RoundStatus;
}

export interface PairResponse {
  opponent_id: string;
  opponent_display_name: string;
}

export interface RoundResultResponse {
  opponent_display_name: string;
  your_choice: Choice;
  opponent_choice: Choice;
  your_payoff: number;
  opponent_payoff: number;
}

export interface MessageResponse {
  content: string;
  from_opponent: boolean; // always true
}

export interface IndicatorResponse {
  indicator_symbol: string | null; // e.g., "🍋"
}

export interface PlayerSummary {
  display_name: string;
  total_payoff: number;
}

export interface GameStats {
  accelerate_ratio: number;
  turn_ratio: number;
}

export interface GameSummaryResponse {
  players: PlayerSummary[];
  stats: GameStats;
}

export interface RoomListItem {
  room_id: string;
  code: string;
  status: RoomStatus;
  player_count: number;
  created_at?: string;
}

export interface ActionResponse {
  status: "ok";
}

// ============================================
// Polling State API
// ============================================

export interface RoomStateMessage {
  round_number: number;
  content: string;
  from_player_id: string;
  from_display_name: string;
}

export interface RoomStateRound {
  round_number: number;
  phase: RoundPhase;
  status: RoundStatus;
  submitted_actions: number;
  total_players: number;
  // 個人化欄位（只有帶 player_id 時才會有）
  your_choice?: Choice | null;
  opponent_choice?: Choice | null;
  opponent_display_name?: string | null;
  your_payoff?: number | null;
  opponent_payoff?: number | null;
  // 玩家提交狀態（用於監控誰還沒提交）
  player_submissions?: Array<{
    player_id: string;
    display_name: string;
    submitted: boolean;
  }>;
}

export interface RoomStateData {
  room: {
    room_id: string;
    code: string;
    status: RoomStatus;
    current_round: number;
    player_count: number; // 不含 host
  };
  players: Array<{
    player_id: string;
    display_name: string;
    is_host: boolean;
  }>;
  round: RoomStateRound;
  message?: string | RoomStateMessage | null;
  indicator_symbol?: string | null;
  indicators_assigned: boolean;
}

export interface RoomStateResponse {
  version: number;
  has_update: boolean;
  data?: RoomStateData;
}

// ============================================
// Frontend State Types
// ============================================

/**
 * Player 端狀態機
 */
export type PlayerState =
  | "idle" // 尚未加入
  | "joining" // 加入中
  | "waiting_room" // 等待 Host 開始
  | "waiting_round" // 遊戲中，等待本輪開始
  | "choosing_action" // 選擇策略
  | "waiting_result" // 等待結果
  | "showing_result" // 顯示結果
  | "message_phase" // Round 5-6 留言
  | "indicator_phase" // Round 6 後顯示指示物
  | "game_summary"; // 遊戲結束

/**
 * Host 端狀態機
 */
export type HostState =
  | "room_waiting" // 等待玩家加入
  | "pre_game" // 人數確認
  | "round_running" // 回合進行中
  | "round_result" // 顯示回合結果
  | "indicator_phase" // 發送指示物
  | "game_summary"; // 顯示總結

/**
 * Player Context（在 client 端保存）
 */
export interface PlayerContext {
  player_id: string;
  room_id: string;
  display_name: string;
  room_code: string;
  state: PlayerState;
}

/**
 * Host Context
 */
export interface HostContext {
  room_id: string;
  room_code: string;
  host_player_id: string;
  state: HostState;
}

// ============================================
// Payoff History Types
// ============================================

/**
 * 單輪收益記錄
 */
export interface PayoffRecord {
  round_number: number;
  payoff: number;
  timestamp: number; // 用於除錯
}
