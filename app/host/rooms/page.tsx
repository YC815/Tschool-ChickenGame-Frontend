"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllRooms, deleteRoom } from "@/lib/api";
import type { RoomListItem } from "@/lib/types";

export default function RoomsManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRooms = async () => {
    try {
      const data = await getAllRooms();
      console.log("[DEBUG] getAllRooms response:", data);

      // 處理可能的回傳格式：直接陣列 或 { rooms: [...] }
      const roomsList = Array.isArray(data) ? data : (data as { rooms?: RoomListItem[] }).rooms || [];

      setRooms(roomsList);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "無法取得房間列表");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (room: RoomListItem) => {
    const msg = `確定要刪除房間 ${room.code} 嗎？\n狀態：${room.status}\n玩家數：${room.player_count}`;
    if (!confirm(msg)) return;

    try {
      await deleteRoom(room.room_id);
      await fetchRooms();
    } catch (err) {
      alert(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const handleDeleteAll = async () => {
    if (rooms.length === 0) return;

    const msg = `確定要刪除全部 ${rooms.length} 個房間嗎？\n此操作無法復原！`;
    if (!confirm(msg)) return;

    try {
      await Promise.all(rooms.map((room) => deleteRoom(room.room_id)));
      await fetchRooms();
    } catch (err) {
      alert(err instanceof Error ? err.message : "批量刪除失敗");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-gray-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">房間管理</h1>
          <div className="flex gap-3">
            {rooms.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
              >
                刪除全部 ({rooms.length})
              </button>
            )}
            <button
              onClick={() => router.push("/host")}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
            >
              返回
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {rooms.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              目前沒有任何房間
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    房間代碼
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    玩家數
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rooms.map((room) => (
                  <tr key={room.room_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-lg font-semibold text-gray-800">
                      {room.code}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          room.status === "WAITING"
                            ? "bg-blue-100 text-blue-700"
                            : room.status === "PLAYING"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {room.player_count}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(room)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            這是班級內部工具，任何人都可以刪除房間。請小心操作。
          </p>
        </div>
      </div>
    </div>
  );
}
