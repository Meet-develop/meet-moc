"use client";

import { NotesScroll } from "@/components/features/notes/notes-scroll";
import { EventFeed } from "@/components/features/events/event-card";
import type { Event, Note } from "@/lib/mock-data";
import { useRelationship } from "@/contexts/relationship-context";
import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { isBlocked, isHot } = useRelationship();
  const [events, setEvents] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [eventsResponse, notesResponse] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/notes"),
        ]);

        if (!eventsResponse.ok || !notesResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const [eventsData, notesData] = await Promise.all([
          eventsResponse.json(),
          notesResponse.json(),
        ]);

        if (!isMounted) return;

        setEvents(eventsData);
        setNotes(notesData);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 好感度に基づいてイベントをフィルタリング・ソート
  const filteredEvents = useMemo(() => {
    // BLOCKされたユーザーのイベントを除外
    const unblockedEvents = events.filter(
      (event) => !isBlocked(event.organizerId)
    );

    // HOTなユーザーのイベントを優先
    return unblockedEvents.sort((a, b) => {
      const aIsHot = isHot(a.organizerId);
      const bIsHot = isHot(b.organizerId);
      if (aIsHot && !bIsHot) return -1;
      if (!aIsHot && bIsHot) return 1;
      return 0;
    });
  }, [events, isBlocked, isHot]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] bg-clip-text text-transparent">
            Meet & Moc
          </h1>
          <button
            onClick={() => router.push("/invitations")}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell size={24} className="text-gray-700" />
            <span className="absolute top-1 right-1 w-3 h-3 bg-[#FF6B6B] rounded-full border-2 border-white" />
          </button>
        </div>
      </header>

      {/* Instagram風ノート */}
      <NotesScroll notes={notes} />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            あなたにオススメのイベント
          </h2>
          <p className="text-sm text-gray-600">
            カードをスワイプして興味のあるイベントを探そう！
          </p>
        </div>

        {hasError && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            データの取得に失敗しました。時間をおいて再読み込みしてください。
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-500">読み込み中...</div>
        ) : filteredEvents.length > 0 ? (
          <EventFeed events={filteredEvents} />
        ) : (
          <div className="text-center text-gray-500">
            現在表示できるイベントがありません。
          </div>
        )}
      </main>
    </div>
  );
}
