"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AvatarName } from "@/components/ui/avatar-name";

type EventDetail = {
  id: string;
  purpose: string;
  status: "open" | "confirmed" | "completed" | "cancelled";
  fixedStartTime?: string | null;
  fixedPlaceName?: string | null;
  owner: { userId: string; displayName: string; avatarIcon?: string | null };
  participants: { userId: string; displayName: string; avatarIcon?: string | null; status: string; role: string }[];
  timeCandidates: { id: string; startTime: string; endTime: string; score: number }[];
  placeCandidates: { id: string; name: string; address: string; score: number }[];
};

const formatStart = (start: string) => {
  const startDate = new Date(start);
  return `${startDate.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })} ${startDate.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function EventManagePage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [timeCandidateId, setTimeCandidateId] = useState<string | null>(null);
  const [placeCandidateId, setPlaceCandidateId] = useState<string | null>(null);

  const refreshEvent = async () => {
    const response = await fetch(`/api/events/${eventId}`);
    if (!response.ok) return;
    const data = (await response.json()) as EventDetail;
    setEvent(data);
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setOwnerId(data.session?.user?.id ?? null);
    };

    loadUser();
  }, []);

  useEffect(() => {
    let active = true;

    const loadEvent = async () => {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok || !active) return;
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    };

    loadEvent();

    return () => {
      active = false;
    };
  }, [eventId]);

  const pendingParticipants = useMemo(
    () => event?.participants.filter((participant) => participant.status === "requested") ?? [],
    [event]
  );

  const requiresTimeSelection =
    (event?.fixedStartTime == null) && (event?.timeCandidates.length ?? 0) > 0;
  const requiresPlaceSelection =
    (event?.fixedPlaceName == null) && (event?.placeCandidates.length ?? 0) > 0;

  const handleApprove = async (userId: string) => {
    if (!ownerId) return;
    await fetch(`/api/events/${eventId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, userId }),
    });
    refreshEvent();
  };

  const handleConfirm = async () => {
    if (!ownerId) return;
    await fetch(`/api/events/${eventId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, timeCandidateId, placeCandidateId }),
    });
    refreshEvent();
  };

  if (!event) {
    return (
      <div className="min-h-screen px-6 py-20 text-center text-sm text-[var(--muted)]">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:max-w-5xl sm:px-6">
          <Link
            href={`/events/${event.id}`}
            aria-label="イベント詳細へ戻る"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm"
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </Link>
          <h1 className="text-lg font-semibold">イベント管理</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-5xl sm:px-6 sm:py-10">
        {ownerId && event.owner.userId !== ownerId && (
          <div className="mb-6 rounded-3xl bg-white/80 p-4 text-sm text-[var(--muted)] shadow-sm">
            このページはオーナー専用です。
          </div>
        )}
        <section>
          <h2 className="text-lg font-semibold">参加リクエスト</h2>
          {pendingParticipants.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">承認待ちはありません。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pendingParticipants.map((participant) => (
                <li key={participant.userId} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <AvatarName displayName={participant.displayName} avatarIcon={participant.avatarIcon} />
                  <button
                    onClick={() => handleApprove(participant.userId)}
                    className="flex w-full items-center justify-center gap-1 rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white sm:w-auto sm:py-1"
                  >
                    <span className="material-symbols-rounded">check_circle</span>
                    承認
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 grid gap-6 pt-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">日程候補</h2>
            {event.fixedStartTime ? (
              <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm shadow-sm">
                <p className="text-xs text-[var(--muted)]">固定済み</p>
                <p className="font-semibold text-[var(--foreground)]">{formatStart(event.fixedStartTime)}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {event.timeCandidates.map((candidate) => (
                  <li
                    key={candidate.id}
                    className={`rounded-2xl p-4 text-sm shadow-sm ${
                      timeCandidateId === candidate.id
                        ? "bg-orange-50"
                        : "bg-white"
                    }`}
                  >
                    <p className="font-semibold text-[var(--foreground)]">
                      {formatStart(candidate.startTime)}
                    </p>
                    <p className="text-xs text-[var(--muted)]">スコア: {candidate.score}</p>
                    <button
                      onClick={() => setTimeCandidateId(candidate.id)}
                      className="mt-2 w-full rounded-full bg-white px-3 py-2 text-xs shadow-sm"
                    >
                      選択
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">お店候補</h2>
            {event.fixedPlaceName ? (
              <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-sm shadow-sm">
                <p className="text-xs text-[var(--muted)]">固定済み</p>
                <p className="font-semibold text-[var(--foreground)]">{event.fixedPlaceName}</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {event.placeCandidates.map((candidate) => (
                  <li
                    key={candidate.id}
                    className={`rounded-2xl p-4 text-sm shadow-sm ${
                      placeCandidateId === candidate.id
                        ? "bg-orange-50"
                        : "bg-white"
                    }`}
                  >
                    <p className="font-semibold text-[var(--foreground)]">{candidate.name}</p>
                    <p className="text-xs text-[var(--muted)]">{candidate.address}</p>
                    <p className="text-xs text-[var(--muted)]">スコア: {candidate.score}</p>
                    <button
                      onClick={() => setPlaceCandidateId(candidate.id)}
                      className="mt-2 w-full rounded-full bg-white px-3 py-2 text-xs shadow-sm"
                    >
                      選択
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="mt-8">
          <button
            onClick={handleConfirm}
            disabled={
              !ownerId ||
              event.owner.userId !== ownerId ||
              (requiresTimeSelection && !timeCandidateId) ||
              (requiresPlaceSelection && !placeCandidateId)
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-rounded">verified</span>
            最終確定
          </button>
        </div>
      </main>
    </div>
  );
}
