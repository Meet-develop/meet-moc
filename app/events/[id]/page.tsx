"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AvatarName } from "@/components/ui/avatar-name";

type EventDetail = {
  id: string;
  purpose: string;
  visibility: "public" | "limited" | "private";
  capacity: number;
  status: "open" | "confirmed" | "completed" | "cancelled";
  scheduleMode: "fixed" | "candidate";
  fixedStartTime?: string | null;
  fixedEndTime?: string | null;
  fixedPlaceId?: string | null;
  fixedPlaceName?: string | null;
  fixedPlaceAddress?: string | null;
  owner: { userId: string; displayName: string; avatarIcon?: string | null };
  participants: {
    userId: string;
    displayName: string;
    avatarIcon?: string | null;
    status: string;
    role: string;
  }[];
  timeCandidates: {
    id: string;
    startTime: string;
    endTime: string;
    score: number;
    source: "system" | "proposal";
    proposedBy?: string | null;
    availableVotes: number;
  }[];
  placeCandidates: {
    id: string;
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    priceLevel?: number | null;
    score: number;
    source: "system" | "proposal";
    proposedBy?: string | null;
  }[];
};

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel?: number;
};

const formatStart = (start?: string | null) => {
  if (!start) return "未確定";
  const startDate = new Date(start);
  return `${startDate.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })} ${startDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? null);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const data = (await response.json()) as EventDetail;
      setEvent(data);
      setIsLoading(false);
    };

    loadEvent();
  }, [eventId]);

  const participantStatus = useMemo(() => {
    if (!event || !userId) return null;
    const participant = event.participants.find((item) => item.userId === userId);
    return participant?.status ?? null;
  }, [event, userId]);

  const isOwner = event?.owner.userId === userId;

  const handleJoin = async () => {
    if (!userId) return;
    await fetch(`/api/events/${eventId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const response = await fetch(`/api/events/${eventId}`);
    const data = (await response.json()) as EventDetail;
    setEvent(data);
  };

  const handleTimeVote = async (candidateId: string) => {
    if (!userId) return;
    await fetch(`/api/events/${eventId}/votes/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, candidateId, isAvailable: true }),
    });
    const response = await fetch(`/api/events/${eventId}`);
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  const handlePlaceVote = async (candidateId: string, score: number) => {
    if (!userId) return;
    await fetch(`/api/events/${eventId}/votes/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, candidateId, score }),
    });
    const response = await fetch(`/api/events/${eventId}`);
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  const handleTimeProposal = async (startTime: string) => {
    if (!userId) return;
    await fetch(`/api/events/${eventId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type: "time", startTime }),
    });
    const response = await fetch(`/api/events/${eventId}`);
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  const handlePlaceSearch = async () => {
    if (!placeQuery.trim()) return;
    const response = await fetch(`/api/places/search?query=${encodeURIComponent(placeQuery)}`);
    if (!response.ok) return;
    const data = (await response.json()) as { places: PlaceResult[] };
    setPlaceResults(data.places ?? []);
  };

  const handlePlaceProposal = async (place: PlaceResult) => {
    if (!userId) return;
    await fetch(`/api/events/${eventId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type: "place", place }),
    });
    const response = await fetch(`/api/events/${eventId}`);
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-20 text-center text-sm text-[var(--muted)]">
        読み込み中...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen px-6 py-20 text-center text-sm text-[var(--muted)]">
        イベントが見つかりません。
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-4 py-4 sm:max-w-5xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
            ← フィードに戻る
          </Link>
          {isOwner && (
            <Link
              href={`/events/${event.id}/manage`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white sm:w-auto"
            >
              <span className="material-symbols-rounded">settings</span>
              オーナー管理
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-5xl sm:px-6 sm:py-10">
        {!userId && (
          <div className="mb-6 rounded-3xl bg-white/80 p-4 text-sm text-[var(--muted)] shadow-sm">
            参加や投票にはログインが必要です。
            <Link href="/onboarding" className="ml-2 text-[var(--accent)]">
              ログインはこちら
            </Link>
          </div>
        )}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                {event.visibility}
              </p>
              <h1 className="text-3xl font-semibold">{event.purpose}</h1>
              <div className="mt-3 text-sm text-[var(--muted)]">
                <AvatarName displayName={event.owner.displayName} avatarIcon={event.owner.avatarIcon} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--muted)]">状態</p>
              <p className="text-lg font-semibold text-[var(--accent)]">{event.status}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-orange-100 pt-4 md:grid-cols-2">
            <div className="p-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                日程
              </p>
              <p className="mt-2 text-sm font-semibold">
                {formatStart(event.fixedStartTime)}
              </p>
            </div>
            <div className="p-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                お店
              </p>
              <p className="mt-2 text-sm font-semibold">
                {event.fixedPlaceName ?? "候補から決定"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {event.fixedPlaceAddress ?? ""}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
              参加 {event.participants.filter((p) => p.status === "approved").length}/{event.capacity}
            </span>
            {participantStatus ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {participantStatus}
              </span>
            ) : (
              <button
                onClick={handleJoin}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white sm:w-auto"
              >
                <span className="material-symbols-rounded">send</span>
                参加希望を送る
              </button>
            )}
          </div>
        </section>

        {event.scheduleMode === "candidate" && (
          <section className="mt-8 grid gap-6 border-t border-orange-100 pt-6 md:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                日程候補
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-sky-700">
                  <span className="material-symbols-rounded text-sm">auto_awesome</span>
                  AI推測 TOP3
                </span>
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                {event.timeCandidates.map((candidate) => (
                  <li key={candidate.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="font-semibold text-[var(--foreground)]">
                      {formatStart(candidate.startTime)}
                    </p>
                    <p className="text-xs">スコア: {candidate.score}</p>
                    <button
                      onClick={() => handleTimeVote(candidate.id)}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent)] shadow-sm sm:w-auto"
                    >
                      <span className="material-symbols-rounded">thumb_up</span>
                      参加可能に投票
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs text-[var(--muted)]">別日程の提案</p>
                <TimeProposalForm onSubmit={handleTimeProposal} />
              </div>
            </div>

            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                お店候補
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-amber-700">
                  <span className="material-symbols-rounded text-sm">auto_awesome</span>
                  AI推測 TOP3
                </span>
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                {event.placeCandidates.map((candidate) => (
                  <li key={candidate.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="font-semibold text-[var(--foreground)]">{candidate.name}</p>
                    <p className="text-xs">{candidate.address}</p>
                    <div className="mt-2">
                      <span className="text-xs">好み:</span>
                      <div className="mt-2 grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            onClick={() => handlePlaceVote(candidate.id, score)}
                            className="rounded-full bg-white px-2 py-1 text-xs shadow-sm"
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs text-[var(--muted)]">お店の提案</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={placeQuery}
                    onChange={(event) => setPlaceQuery(event.target.value)}
                    placeholder="例: 恵比寿 イタリアン"
                    className="flex-1 rounded-full bg-white px-4 py-2 text-xs shadow-sm"
                  />
                  <button
                    onClick={handlePlaceSearch}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-2)] px-4 py-2 text-xs font-semibold text-white sm:w-auto"
                  >
                    <span className="material-symbols-rounded">search</span>
                    検索
                  </button>
                </div>
                {placeResults.length > 0 && (
                  <ul className="mt-3 space-y-2 text-xs">
                    {placeResults.map((place) => (
                      <li key={place.placeId} className="flex flex-col gap-2 rounded-xl bg-white px-2 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <span>{place.name}</span>
                        <button
                          onClick={() => handlePlaceProposal(place)}
                          className="flex w-full items-center justify-center gap-1 rounded-full bg-white px-3 py-1 text-xs shadow-sm sm:w-auto"
                        >
                          <span className="material-symbols-rounded">add_circle</span>
                          提案
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mt-8 border-t border-orange-100 pt-6">
          <h2 className="text-lg font-semibold">参加者</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {event.participants.map((participant) => (
              <li key={participant.userId} className="rounded-2xl bg-white p-4 shadow-sm">
                <AvatarName displayName={participant.displayName} avatarIcon={participant.avatarIcon} />
                <p className="text-xs text-[var(--muted)]">{participant.status}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function TimeProposalForm({ onSubmit }: { onSubmit: (start: string) => void }) {
  const [start, setStart] = useState("");

  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        type="datetime-local"
        value={start}
        onChange={(event) => setStart(event.target.value)}
        className="rounded-full bg-white px-4 py-2 text-xs shadow-sm"
      />
      <button
        onClick={() => onSubmit(start)}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
      >
        <span className="material-symbols-rounded">event</span>
        日程を提案
      </button>
    </div>
  );
}
