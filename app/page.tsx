"use client";

import { NotesScroll } from "@/components/features/notes/notes-scroll";
import { EventFeed } from "@/components/features/events/event-card";
import { mockNotes, mockEvents } from "@/lib/mock-data";
import { useRelationship } from "@/contexts/relationship-context";
import { useMemo } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
  const { isBlocked, isHot } = useRelationship();

  // 好感度に基づいてイベントをフィルタリング・ソート
  const filteredEvents = useMemo(() => {
    // BLOCKされたユーザーのイベントを除外
    const unblockedEvents = mockEvents.filter(
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
  }, [isBlocked, isHot]);

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
      <NotesScroll notes={mockNotes} />

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

        {/* Tinder風イベントフィード */}
        <EventFeed events={filteredEvents} />
      </main>
    </div>
  );
}
