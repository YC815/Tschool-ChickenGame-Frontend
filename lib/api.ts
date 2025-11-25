/**
 * API Client
 * 使用 Fetch API 與後端通訊
 */

import { API_BASE_URL } from "./constants";
import type {
  RoomCreate,
  RoomResponse,
  RoomStatusResponse,
  PlayerJoin,
  PlayerResponse,
  RoundCurrentResponse,
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
    const text = await response.text();
    throw new APIError(response.status, text || response.statusText);
  }
  return response.json();
}

// ============================================
// Room APIs
// ============================================

export async function createRoom(data: RoomCreate = {}): Promise<RoomResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<RoomResponse>(response);
}

export async function getRoomStatus(
  code: string,
): Promise<RoomStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${code}`);
  return handleResponse<RoomStatusResponse>(response);
}

export async function startGame(roomId: string): Promise<ActionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/start`, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function nextRound(roomId: string): Promise<ActionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/next`,
    {
      method: "POST",
    },
  );
  return handleResponse<ActionResponse>(response);
}

export async function endGame(roomId: string): Promise<ActionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/end`, {
    method: "POST",
  });
  return handleResponse<ActionResponse>(response);
}

export async function getGameSummary(
  roomId: string,
): Promise<GameSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/summary`);
  return handleResponse<GameSummaryResponse>(response);
}

// ============================================
// Player APIs
// ============================================

export async function joinRoom(
  code: string,
  data: PlayerJoin,
): Promise<PlayerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${code}/join`, {
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
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/current`,
  );
  return handleResponse<RoundCurrentResponse>(response);
}

export async function getPlayerPair(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<PairResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/pair?player_id=${playerId}`,
  );
  return handleResponse<PairResponse>(response);
}

export async function submitAction(
  roomId: string,
  roundNumber: number,
  data: ActionSubmit,
): Promise<ActionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/action`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  return handleResponse<ActionResponse>(response);
}

export async function getRoundResult(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<RoundResultResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/result?player_id=${playerId}`,
  );
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
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/message`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  return handleResponse<ActionResponse>(response);
}

export async function getMessage(
  roomId: string,
  roundNumber: number,
  playerId: string,
): Promise<MessageResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/rounds/${roundNumber}/message?player_id=${playerId}`,
  );
  return handleResponse<MessageResponse>(response);
}

// ============================================
// Indicator APIs
// ============================================

export async function assignIndicators(
  roomId: string,
): Promise<ActionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/indicators/assign`,
    {
      method: "POST",
    },
  );
  return handleResponse<ActionResponse>(response);
}

export async function getPlayerIndicator(
  roomId: string,
  playerId: string,
): Promise<IndicatorResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/rooms/${roomId}/indicator?player_id=${playerId}`,
  );
  return handleResponse<IndicatorResponse>(response);
}
