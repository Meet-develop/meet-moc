"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AvatarName } from "@/components/ui/avatar-name";

type Friend = { userId: string; displayName: string; avatarIcon?: string | null };

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel?: number;
};

const visibilityOptions: Array<{ value: "public" | "limited" | "private"; label: string }> = [
  { value: "public", label: "公開" },
  { value: "limited", label: "限定公開" },
  { value: "private", label: "プライベート" },
];

const scheduleModeOptions: Array<{ value: "candidate" | "fixed"; label: string; caption: string }> = [
  { value: "candidate", label: "候補から決定", caption: "みんなの投票で決定" },
  { value: "fixed", label: "固定", caption: "開始時刻とお店を最初に確定" },
];

export default function EventCreatePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [visibility, setVisibility] = useState<"public" | "limited" | "private">("public");
  const [capacity, setCapacity] = useState(6);
  const [scheduleMode, setScheduleMode] = useState<"fixed" | "candidate">("candidate");
  const [fixedStart, setFixedStart] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [candidatePlaces, setCandidatePlaces] = useState<PlaceResult[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);

      if (currentUserId) {
        const response = await fetch(`/api/friends?userId=${currentUserId}`);
        if (response.ok) {
          const data = (await response.json()) as Friend[];
          setFriends(data);
        }
      }
    };

    loadUser();
  }, []);

  const handleSearchPlaces = async () => {
    if (!placeQuery.trim()) {
      setSearchMessage("エリアやジャンルを入力して検索してください。");
      return;
    }

    setIsSearching(true);
    setSearchMessage(null);
    const response = await fetch(`/api/places/search?query=${encodeURIComponent(placeQuery)}&limit=8`);
    if (!response.ok) {
      setSearchMessage("検索に失敗しました。時間をおいて再度お試しください。");
      setIsSearching(false);
      return;
    }

    const data = (await response.json()) as { places: PlaceResult[] };
    const nextResults = data.places ?? [];
    setPlaceResults(nextResults);
    setIsSearching(false);
    if (nextResults.length === 0) {
      setSearchMessage("検索結果がありませんでした。別のキーワードでお試しください。");
    }
  };

  const toggleInvite = (friendId: string) => {
    setSelectedInvites((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const toggleCandidatePlace = (place: PlaceResult) => {
    setCandidatePlaces((prev) => {
      if (prev.some((item) => item.placeId === place.placeId)) {
        return prev.filter((item) => item.placeId !== place.placeId);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, place];
    });
  };

  const isFixedValid = scheduleMode === "fixed" && fixedStart && selectedPlace;

  const handleSubmit = async () => {
    if (!userId || !purpose) return;

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: userId,
        purpose,
        visibility,
        capacity,
        scheduleMode,
        fixedStartTime: scheduleMode === "fixed" ? fixedStart : undefined,
        fixedPlace:
          scheduleMode === "fixed" && selectedPlace
            ? {
                placeId: selectedPlace.placeId,
                name: selectedPlace.name,
                address: selectedPlace.address,
              }
            : undefined,
        placeQuery: scheduleMode === "candidate" ? placeQuery : undefined,
        candidatePlaces: scheduleMode === "candidate" ? candidatePlaces : undefined,
        inviteeIds: selectedInvites,
      }),
    });

    if (!response.ok) return;
    const data = (await response.json()) as { id: string };
    router.push(`/events/${data.id}/manage`);
  };

  const helperText = useMemo(() => {
    if (scheduleMode === "fixed") {
      return "開始時刻とお店を固定して作成します。";
    }
    if (candidatePlaces.length > 0) {
      return `選択した ${candidatePlaces.length} 店を候補としてイベントを作成します。`;
    }
    return "日程とお店は候補から決定されます。";
  }, [scheduleMode, candidatePlaces.length]);

  return (
    <div className="min-h-screen pb-4">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4 sm:max-w-5xl sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
            ← フィード
          </Link>
          <span className="text-xs font-semibold tracking-[0.18em] text-[#b08b66]">CREATE EVENT</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 sm:max-w-4xl sm:px-6 sm:py-10">
        {!userId && (
          <div className="mb-6 rounded-3xl bg-white/80 p-5 text-sm text-[var(--muted)] shadow-sm">
            イベント作成にはログインが必要です。
            <Link href="/onboarding" className="ml-2 text-[var(--accent)]">
              ログインはこちら
            </Link>
          </div>
        )}

        <div className="pt-2">
          <h1 className="text-2xl font-semibold">イベントをつくる</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{helperText}</p>

          <div className="mt-6 space-y-5">
            <section className="border-t border-orange-100 py-4">
              <label className="flex flex-col gap-2 text-sm">
                イベントの目的
                <input
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  placeholder="例: 週末飲み会"
                  className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                />
              </label>

              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">公開範囲</p>
                <div className="flex flex-wrap gap-2">
                  {visibilityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setVisibility(option.value)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${
                        visibility === option.value
                          ? "bg-[var(--accent)] text-white"
                          : "bg-white text-[var(--muted)] shadow-sm"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block text-sm">
                上限人数: <span className="font-semibold text-[var(--accent)]">{capacity} 人</span>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={capacity}
                  onChange={(event) => setCapacity(Number(event.target.value))}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
              </label>
            </section>

            <section className="border-t border-orange-100 py-4">
              <p className="mb-2 text-sm font-medium">日程/お店の決定方法</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {scheduleModeOptions.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setScheduleMode(mode.value)}
                    className={`rounded-2xl px-4 py-3 text-left ${
                      scheduleMode === mode.value
                        ? "bg-white shadow-md"
                        : "bg-white/70 shadow-sm"
                    }`}
                  >
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p className="text-xs text-[var(--muted)]">{mode.caption}</p>
                  </button>
                ))}
              </div>

              {scheduleMode === "fixed" && (
                <div className="mt-4">
                  <label className="flex flex-col gap-2 text-sm">
                    開始日時
                    <input
                      type="datetime-local"
                      value={fixedStart}
                      onChange={(event) => setFixedStart(event.target.value)}
                      className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                    />
                  </label>
                </div>
              )}
            </section>

            <section className="border-t border-orange-100 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">お店を追加</h2>
                <span className="text-xs text-[var(--muted)]">候補として追加できます</span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={placeQuery}
                  onChange={(event) => setPlaceQuery(event.target.value)}
                  placeholder="例: 恵比寿 イタリアン"
                  className="flex-1 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
                />
                <button
                  onClick={handleSearchPlaces}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white sm:w-auto"
                >
                  <span className="material-symbols-rounded">search</span>
                  検索
                </button>
              </div>

              {searchMessage && <p className="mt-2 text-xs text-[var(--muted)]">{searchMessage}</p>}

              {isSearching && <p className="mt-3 text-xs text-[var(--muted)]">検索中...</p>}

              {!isSearching && placeResults.length > 0 && (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {placeResults.map((place) => {
                    const selectedInFixed = selectedPlace?.placeId === place.placeId;
                    const selectedInCandidate = candidatePlaces.some((item) => item.placeId === place.placeId);
                    const selected = scheduleMode === "fixed" ? selectedInFixed : selectedInCandidate;

                    return (
                      <div
                        key={place.placeId}
                        className={`rounded-2xl px-4 py-3 ${
                          selected ? "bg-orange-50 shadow-md" : "bg-white shadow-sm"
                        }`}
                      >
                        <p className="text-sm font-semibold">{place.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{place.address}</p>
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              scheduleMode === "fixed"
                                ? setSelectedPlace(place)
                                : toggleCandidatePlace(place)
                            }
                            className="w-full rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold text-[var(--accent)]"
                          >
                            {selected ? "選択中" : scheduleMode === "fixed" ? "この店で固定" : "候補に追加"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {scheduleMode === "candidate" && candidatePlaces.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-[var(--muted)]">追加済み候補 ({candidatePlaces.length}/5)</p>
                  <div className="flex flex-wrap gap-2">
                    {candidatePlaces.map((place) => (
                      <button
                        key={place.placeId}
                        onClick={() => toggleCandidatePlace(place)}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--accent)] shadow-sm"
                      >
                        {place.name} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scheduleMode === "fixed" && selectedPlace && (
                <div className="mt-4 rounded-2xl bg-orange-50 p-3 shadow-sm">
                  <p className="text-xs text-[var(--muted)]">固定するお店</p>
                  <p className="text-sm font-semibold">{selectedPlace.name}</p>
                  <p className="text-xs text-[var(--muted)]">{selectedPlace.address}</p>
                </div>
              )}
            </section>

            <section className="border-t border-orange-100 py-4">
              <h2 className="text-sm font-semibold">招待するフレンド</h2>
              {friends.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--muted)]">フレンドがまだ登録されていません。</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.userId}
                      onClick={() => toggleInvite(friend.userId)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 ${
                        selectedInvites.includes(friend.userId)
                          ? "bg-orange-50 shadow-md"
                          : "bg-white shadow-sm"
                      }`}
                    >
                      <AvatarName displayName={friend.displayName} avatarIcon={friend.avatarIcon} />
                      <span className="text-xs font-semibold text-[var(--muted)]">
                        {selectedInvites.includes(friend.userId) ? "招待予定" : "未選択"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!userId || (scheduleMode === "fixed" && !isFixedValid)}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-rounded">rocket_launch</span>
            作成する
          </button>
        </div>
      </main>
    </div>
  );
}
