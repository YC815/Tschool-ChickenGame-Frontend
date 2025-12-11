/**
 * API Client
 * 使用 Fetch API 與後端通訊
 */

import { API_BASE_URL } from "./constants";
import type {
  RoomCreate,
  RoomResponse,
  RoomStatusResponse,
  RoomListItem,
  PlayerJoin,
  PlayerResponse,
  RoundCurrentResponse,
  RoomStateResponse,
  PairResponse,
  ActionSubmit,
  ActionResponse,
  RoundResultResponse,
  MessageSubmit,
  MessageResponse,
  IndicatorResponse,
  GameSummaryResponse,
} from "./types";

// ============================================
// Error Handling
// ============================================

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = response.statusText;
    try {
      const json = await response.json();
      message = json.detail || JSON.stringify(json);
    } catch {
      // 不是 JSON，使用原始 statusText
    }
    console.error(`[API RECV] ❌ ${response.status} ${response.url}`, message);
    throw new APIError(response.status, message);
  }
  console.log(`[API RECV] ✅ ${response.status} ${response.url}`);
  return response.json();
}

// ============================================
// Room APIs
// ============================================

export async function createRoom(data: RoomCreate = {}): Promise<RoomResponse> {
  const url = `${API_BASE_URL}/api/rooms`;
  console.log(`[API SEND] POST ${url}`, data);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<RoomResponse>(response);
}

export async function getRoomStatus(
  code: string,
): Promise<RoomStatusResponse> {
  const url = `${API_BASE_URL}/api/rooms/${code}`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<RoomStatusResponse>(response);
}

export async function getRoomState(
  roomId: string,
  version = 0,
  playerId?: string,
): Promise<RoomStateResponse> {
  const params = new URLSearchParams({ version: String(version) });
  if (playerId) {
    params.set("player_id", playerId);
  }
  const url = `${API_BASE_URL}/api/rooms/${roomId}/state?${params.toString()}`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<RoomStateResponse>(response);
}

export async function startGame(roomId: string): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/start`;
  console.log(`[API SEND] POST ${url}`);
  const response = await fetch(url, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function nextRound(roomId: string): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/next`;
  console.log(`[API SEND] POST ${url}`);
  const response = await fetch(url, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function endGame(roomId: string): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/end`;
  console.log(`[API SEND] POST ${url}`);
  const response = await fetch(url, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function getGameSummary(
  roomId: string,
): Promise<GameSummaryResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/summary`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<GameSummaryResponse>(response);
}

export async function getAllRooms(): Promise<RoomListItem[]> {
  const url = `${API_BASE_URL}/api/rooms`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<RoomListItem[]>(response);
}

export async function deleteRoom(roomId: string): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}`;
  console.log(`[API SEND] DELETE ${url}`);
  const response = await fetch(url, {
    method: "DELETE",
  });
  return handleResponse<ActionResponse>(response);
}

// ============================================
// Player APIs
// ============================================

export async function joinRoom(
  code: string,
  data: PlayerJoin,
): Promise<PlayerResponse> {
  const url = `${API_BASE_URL}/api/rooms/${code}/join`;
  console.log(`[API SEND] POST ${url}`, data);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<PlayerResponse>(response);
}

// ============================================
// Round APIs
// ============================================

export async function getCurrentRound(
  roomId: string,
): Promise<RoundCurrentResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/current`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<RoundCurrentResponse>(response);
}

export async function getPlayerPair(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<PairResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/pair?player_id=${playerId}`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<PairResponse>(response);
}

export async function submitAction(
  roomId: string,
  roundNumber: number,
  data: ActionSubmit,
): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/action`;
  console.log(`[API SEND] POST ${url}`, data);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ActionResponse>(response);
}

export async function publishRoundResults(
  roomId: string,
  roundNumber: number,
): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/publish`;
  console.log(`[API SEND] POST ${url}`);
  const response = await fetch(url, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function getRoundResult(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<RoundResultResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/result?player_id=${playerId}`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<RoundResultResponse>(response);
}

// ============================================
// Message APIs
// ============================================

export async function sendMessage(
  roomId: string,
  roundNumber: number,
  data: MessageSubmit,
): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/message`;
  console.log(`[API SEND] POST ${url}`, data);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<ActionResponse>(response);
}

export async function getMessage(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<MessageResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/message?player_id=${playerId}`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<MessageResponse>(response);
}

// ============================================
// Indicator APIs
// ============================================

export async function assignIndicators(
  roomId: string,
): Promise<ActionResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/indicators/assign`;
  console.log(`[API SEND] POST ${url}`);
  const response = await fetch(url, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function getPlayerIndicator(
  roomId: string,
  playerId: string,
): Promise<IndicatorResponse> {
  const url = `${API_BASE_URL}/api/rooms/${roomId}/indicator?player_id=${playerId}`;
  console.log(`[API SEND] GET ${url}`);
  const response = await fetch(url);
  return handleResponse<IndicatorResponse>(response);
}
