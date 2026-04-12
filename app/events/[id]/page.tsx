"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AvatarName } from "@/components/ui/avatar-name";
import { AuthOverlay } from "@/components/features/auth/auth-overlay";
import {
  formatEventStartLabel,
  toIsoUtcStringFromLocalDateTime,
} from "@/lib/datetime";

type EventDetail = {
  id: string;
  updatedAt: string;
  purpose: string;
  comment?: string | null;
  area?: string | null;
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
    invitedBy?: {
      userId: string;
      displayName: string;
      avatarIcon?: string | null;
    } | null;
  }[];
  invitedUsers?: {
    userId: string;
    displayName: string;
    avatarIcon?: string | null;
    status: string;
    role: string;
    invitedBy?: {
      userId: string;
      displayName: string;
      avatarIcon?: string | null;
    } | null;
  }[];
  timeCandidates: {
    id: string;
    startTime: string;
    endTime: string;
    score: number;
    source: "system" | "proposal";
    proposedBy?: string | null;
    availableVotes: number;
    myAvailability: boolean | null;
  }[];
  placeCandidates: {
    id: string;
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    photoUrl?: string | null;
    mapsUrl?: string;
    priceLevel?: number | null;
    score: number;
    source: "system" | "proposal";
    proposedBy?: string | null;
    myScore: number | null;
  }[];
};

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel?: number;
  photoUrl?: string;
};

const plusButtonClass =
  "grid h-7 w-7 place-items-center rounded-full border border-dashed border-gray-400 bg-gray-50 text-gray-500";

const formatStart = (start?: string | null) => {
  if (!start) return "未確定";
  return formatEventStartLabel(start, true);
};

const getCandidateDeadline = (event: EventDetail, nowTs: number) => {
  const candidateStarts = event.timeCandidates
    .map((candidate) => new Date(candidate.startTime).getTime())
    .filter((timestamp) => Number.isFinite(timestamp));

  const firstStart =
    event.fixedStartTime != null
      ? new Date(event.fixedStartTime).getTime()
      : candidateStarts.length > 0
        ? Math.min(...candidateStarts)
        : nowTs + 7 * 24 * 60 * 60 * 1000;

  const deadline = new Date(firstStart);
  deadline.setDate(deadline.getDate() - 1);
  return deadline;
};

const isCandidateDeadlineExpired = (event: EventDetail, nowTs: number) =>
  event.status === "open" &&
  event.scheduleMode === "candidate" &&
  nowTs > getCandidateDeadline(event, nowTs).getTime();

const truncateWithEllipsis = (text: string, maxLength: number) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const visibilityMeta: Record<
  EventDetail["visibility"],
  { label: string; icon: string }
> = {
  public: { label: "公開イベント", icon: "public" },
  limited: { label: "限定公開", icon: "group" },
  private: { label: "プライベート", icon: "lock" },
};

const participantStatusJa: Record<string, string> = {
  approved: "参加",
  requested: "検討中",
  declined: "辞退",
  cancelled: "キャンセル",
};

const participantBadgeMeta: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  approved: {
    label: "参加",
    icon: "check_circle",
    className: "bg-emerald-100 text-emerald-700",
  },
  requested: {
    label: "検討中",
    icon: "help",
    className: "bg-amber-100 text-amber-700",
  },
  declined: {
    label: "辞退",
    icon: "close",
    className: "bg-rose-100 text-rose-700",
  },
  cancelled: {
    label: "キャンセル",
    icon: "block",
    className: "bg-gray-100 text-gray-600",
  },
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const returnToPath = `/events/${eventId}`;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const latestEventRequestRef = useRef(0);
  const [friends, setFriends] = useState<
    Array<{
      userId: string;
      displayName: string;
      avatarIcon?: string | null;
      area?: string | null;
      isFavorite?: boolean;
    }>
  >([]);
  const [inviteSearch, setInviteSearch] = useState("");
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [showInviteOverlay, setShowInviteOverlay] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [recreateMessage, setRecreateMessage] = useState<string | null>(null);
  const [recreateMode, setRecreateMode] = useState<
    "same_members_new_place" | "same_place_new_members" | null
  >(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCreatingInviteLink, setIsCreatingInviteLink] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [showTimeOverlay, setShowTimeOverlay] = useState(false);
  const [showPlaceOverlay, setShowPlaceOverlay] = useState(false);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<EventDetail["placeCandidates"][number] | null>(null);
  const [proposalStart, setProposalStart] = useState("");
  const [timeVoteSelection, setTimeVoteSelection] = useState<Record<string, boolean | undefined>>({});
  const [placeVoteSelection, setPlaceVoteSelection] = useState<Record<string, "good" | "bad" | undefined>>({});
  const [calendarRegistrationVersion, setCalendarRegistrationVersion] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => new Date().getTime());
  const [isAuthOverlayOpen, setIsAuthOverlayOpen] = useState(false);
  const [authOverlayMode, setAuthOverlayMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUserId(data.session?.user?.id ?? null);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        return;
      }

      // Guard against transient null sessions on slower devices.
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUserId(data.session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      const requestId = latestEventRequestRef.current + 1;
      latestEventRequestRef.current = requestId;
      setIsLoading(true);
      const query = userId ? `?viewerId=${userId}` : "";
      const response = await fetch(`/api/events/${eventId}${query}`, {
        cache: "no-store",
      });
      if (requestId !== latestEventRequestRef.current) {
        return;
      }
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      const data = (await response.json()) as EventDetail;
      setEvent(data);
      setIsLoading(false);
    };

    loadEvent();
  }, [eventId, userId]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowTs(new Date().getTime());
    }, 60_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadFriends = async () => {
      const query = event?.area
        ? `/api/friends?userId=${encodeURIComponent(userId)}&eventArea=${encodeURIComponent(event.area)}`
        : `/api/friends?userId=${encodeURIComponent(userId)}`;
      const response = await fetch(query, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as Array<{
        userId: string;
        displayName: string;
        avatarIcon?: string | null;
        area?: string | null;
        isFavorite?: boolean;
      }>;
      setFriends(data);
    };

    loadFriends();
  }, [event?.area, userId]);

  const calendarRegistrationStorageKey =
    event && userId ? `calendar-registration:${event.id}:${userId}` : null;

  useEffect(() => {
    if (!calendarRegistrationStorageKey || !event) {
      setCalendarRegistrationVersion(null);
      return;
    }

    try {
      setCalendarRegistrationVersion(
        window.localStorage.getItem(calendarRegistrationStorageKey)
      );
    } catch {
      setCalendarRegistrationVersion(null);
    }
  }, [calendarRegistrationStorageKey, event?.updatedAt]);

  const participantStatus = useMemo(() => {
    if (!event || !userId) return null;
    const participant = event.participants.find((item) => item.userId === userId);
    return participant?.status ?? null;
  }, [event, userId]);

  const invitedOrParticipantIds = useMemo(() => {
    if (!event) return new Set<string>();
    const ids = new Set<string>();
    event.participants.forEach((participant) => {
      if (participant.status !== "declined" && participant.status !== "cancelled") {
        ids.add(participant.userId);
      }
    });
    (event.invitedUsers ?? []).forEach((invitee) => {
      ids.add(invitee.userId);
    });
    return ids;
  }, [event]);

  const filteredInviteFriends = useMemo(() => {
    const candidateFriends = friends.filter((friend) => !invitedOrParticipantIds.has(friend.userId));
    const keyword = inviteSearch.trim().toLowerCase();
    if (!keyword) return candidateFriends;

    return candidateFriends.filter((friend) => {
      const area = friend.area ?? "";
      return (
        friend.displayName.toLowerCase().includes(keyword) ||
        area.toLowerCase().includes(keyword)
      );
    });
  }, [friends, inviteSearch, invitedOrParticipantIds]);

  const isOwner = event?.owner.userId === userId;
  const isOpenCandidateEvent = event?.status === "open" && event?.scheduleMode === "candidate";
  const hasCandidateDeadlinePassed = Boolean(
    event && isCandidateDeadlineExpired(event, nowTs)
  );
  const needsTimeCandidates = Boolean(isOpenCandidateEvent && !event?.fixedStartTime);
  const needsPlaceCandidates = Boolean(
    isOpenCandidateEvent &&
      !event?.fixedPlaceId &&
      (event?.placeCandidates.length ?? 0) > 0
  );
  const canDownloadCalendar = event?.status === "confirmed";
  const hasRegisteredCalendar = Boolean(
    canDownloadCalendar &&
      calendarRegistrationVersion &&
      event &&
      calendarRegistrationVersion === event.updatedAt
  );
  const candidateActionsDisabled = Boolean(
    isOpenCandidateEvent && hasCandidateDeadlinePassed
  );
  const canAccessParticipantActions = Boolean(
    event && userId && (isOwner || participantStatus === "approved")
  );
  const participantActionNotice = !userId
    ? "ログイン後に利用できます。"
    : participantStatus === "requested"
      ? "オーナー承認後に利用できます。"
      : "参加登録後に利用できます。";

  const openInviteOverlay = () => {
    if (!userId) {
      setAuthOverlayMode("login");
      setIsAuthOverlayOpen(true);
      return;
    }

    if (!canAccessParticipantActions) {
      setInviteMessage(participantActionNotice);
      return;
    }

    setInviteMessage(null);
    setInviteLink(null);
    setInviteSearch("");
    setShowInviteOverlay(true);
  };

  const openTimeProposalOverlay = () => {
    if (!userId) {
      setAuthOverlayMode("login");
      setIsAuthOverlayOpen(true);
      return;
    }
    if (!canAccessParticipantActions) {
      setInviteMessage(participantActionNotice);
      return;
    }
    setShowTimeOverlay(true);
  };

  const openPlaceProposalOverlay = () => {
    if (!userId) {
      setAuthOverlayMode("login");
      setIsAuthOverlayOpen(true);
      return;
    }
    if (!canAccessParticipantActions) {
      setInviteMessage(participantActionNotice);
      return;
    }
    setShowPlaceOverlay(true);
  };

  const statusMeta = useMemo(() => {
    if (!event) {
      return { icon: "schedule", label: "未設定" };
    }

    if (event.status === "open") {
      const deadline = getCandidateDeadline(event, nowTs);

      if (isCandidateDeadlineExpired(event, nowTs)) {
        return { icon: "event_busy", label: "募集終了" };
      }

      return {
        icon: "schedule",
        label: `募集中 ・ ${deadline.toLocaleDateString("ja-JP", {
          month: "numeric",
          day: "numeric",
        })}まで`,
      };
    }

    if (event.status === "confirmed") {
      return { icon: "event_available", label: "開催確定" };
    }
    if (event.status === "completed") {
      return { icon: "task_alt", label: "実施済み" };
    }
    return { icon: "cancel", label: "中止" };
  }, [event, nowTs]);

  const handleJoin = async () => {
    if (!userId) {
      setAuthOverlayMode("login");
      setIsAuthOverlayOpen(true);
      return;
    }
    await fetch(`/api/events/${eventId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const query = userId ? `?viewerId=${userId}` : "";
    const response = await fetch(`/api/events/${eventId}${query}`, { cache: "no-store" });
    const data = (await response.json()) as EventDetail;
    setEvent(data);
  };

  const handleLeave = async () => {
    if (!userId) {
      setAuthOverlayMode("login");
      setIsAuthOverlayOpen(true);
      return;
    }

    await fetch(`/api/events/${eventId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const query = userId ? `?viewerId=${userId}` : "";
    const response = await fetch(`/api/events/${eventId}${query}`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  const handleRecreateFromCompleted = async (
    mode: "same_members_new_place" | "same_place_new_members"
  ) => {
    if (!userId || !event) return;

    setRecreateMessage(null);
    setRecreateMode(mode);

    const inviteeIds =
      mode === "same_members_new_place"
        ? event.participants
            .filter(
              (participant) =>
                participant.status === "approved" && participant.userId !== userId
            )
            .map((participant) => participant.userId)
        : [];

    const fixedPlaceCandidate =
      mode === "same_place_new_members" &&
      event.fixedPlaceId &&
      event.fixedPlaceName &&
      event.fixedPlaceAddress
        ? {
            placeId: event.fixedPlaceId,
            name: event.fixedPlaceName,
            address: event.fixedPlaceAddress,
          }
        : undefined;

    if (mode === "same_place_new_members" && !fixedPlaceCandidate) {
      setRecreateMode(null);
      setRecreateMessage("このイベントはお店が未確定のため、この作成方法は利用できません。");
      return;
    }

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: userId,
        purpose: event.purpose,
        eventArea: event.area ?? undefined,
        visibility: event.visibility,
        capacity: event.capacity,
        scheduleMode: "candidate",
        timeSetting: "auto",
        placeSetting: fixedPlaceCandidate ? "manual" : "auto",
        fixedPlace: fixedPlaceCandidate,
        placeQuery:
          mode === "same_members_new_place"
            ? `${event.area ?? ""} ${event.purpose}`.trim() || event.purpose
            : undefined,
        inviteeIds,
      }),
    });

    setRecreateMode(null);

    if (!response.ok) {
      setRecreateMessage("イベントの作成に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) {
      setRecreateMessage("イベントIDの取得に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    router.push(`/events/${data.id}`);
  };

  const handleTimeVote = async (candidateId: string, isAvailable: boolean) => {
    const currentTs = new Date().getTime();
    if (
      !userId ||
      !event ||
      !canAccessParticipantActions ||
      isCandidateDeadlineExpired(event, currentTs)
    ) {
      return;
    }
    setTimeVoteSelection((prev) => ({ ...prev, [candidateId]: isAvailable }));
    await fetch(`/api/events/${eventId}/votes/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, candidateId, isAvailable }),
    });
    const query = userId ? `?viewerId=${userId}` : "";
    const response = await fetch(`/api/events/${eventId}${query}`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  const handlePlaceVote = async (candidateId: string, kind: "good" | "bad") => {
    const currentTs = new Date().getTime();
    if (
      !userId ||
      !event ||
      !canAccessParticipantActions ||
      isCandidateDeadlineExpired(event, currentTs)
    ) {
      return;
    }
    const score = kind === "good" ? 5 : 1;
    setPlaceVoteSelection((prev) => ({ ...prev, [candidateId]: kind }));
    await fetch(`/api/events/${eventId}/votes/place`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, candidateId, score }),
    });
    const query = userId ? `?viewerId=${userId}` : "";
    const response = await fetch(`/api/events/${eventId}${query}`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
    }
  };

  const handleTimeProposal = async (startTime: string) => {
    if (
      !userId ||
      !event ||
      !canAccessParticipantActions ||
      isCandidateDeadlineExpired(event, Date.now())
    ) {
      return;
    }

    const normalizedStartTime = toIsoUtcStringFromLocalDateTime(startTime);
    if (!normalizedStartTime) {
      return;
    }

    await fetch(`/api/events/${eventId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        type: "time",
        startTime: normalizedStartTime,
      }),
    });
    const query = userId ? `?viewerId=${userId}` : "";
    const response = await fetch(`/api/events/${eventId}${query}`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
      setShowTimeOverlay(false);
      setProposalStart("");
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
    const currentTs = new Date().getTime();
    if (
      !userId ||
      !event ||
      !canAccessParticipantActions ||
      isCandidateDeadlineExpired(event, currentTs)
    ) {
      return;
    }
    await fetch(`/api/events/${eventId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type: "place", place }),
    });
    const query = userId ? `?viewerId=${userId}` : "";
    const response = await fetch(`/api/events/${eventId}${query}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as EventDetail;
      setEvent(data);
      setShowPlaceOverlay(false);
      setPlaceQuery("");
      setPlaceResults([]);
    }
  };

  const toggleInvitee = (friendId: string) => {
    setSelectedInviteeIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleInviteFriends = async () => {
    if (!event || !userId || !canAccessParticipantActions || selectedInviteeIds.length === 0) {
      return;
    }

    const requestMode = event.visibility === "private" && userId !== event.owner.userId;
    const response = await fetch(`/api/events/${eventId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId: userId,
        friendIds: selectedInviteeIds,
        mode: requestMode ? "request" : "invite",
      }),
    });

    if (!response.ok) {
      setInviteMessage("送信に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    const data = (await response.json()) as { created: number; mode: "invite" | "request" };
    setInviteMessage(
      data.mode === "request"
        ? `オーナーに ${data.created} 名分の招待申請を送信しました。`
        : `${data.created} 名に招待を送信しました。`
    );
    setSelectedInviteeIds([]);
    setShowInviteOverlay(false);
  };

  const handleCreateInviteLink = async () => {
    if (!event || !userId) return;

    if (event.visibility === "private" && userId !== event.owner.userId) {
      setInviteMessage("プライベートイベントではオーナーのみリンク招待を作成できます。");
      return;
    }

    setIsCreatingInviteLink(true);
    const response = await fetch(`/api/events/${eventId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId: userId,
        mode: "link",
      }),
    });
    setIsCreatingInviteLink(false);

    if (!response.ok) {
      setInviteMessage("リンク招待の作成に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    const data = (await response.json()) as { inviteUrl?: string };
    if (!data.inviteUrl) {
      setInviteMessage("リンク招待の作成に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    setInviteLink(data.inviteUrl);
    setInviteMessage("リンク招待を作成しました。");
  };

  const handleCalendarDownload = () => {
    if (!event || !userId || !canDownloadCalendar || hasRegisteredCalendar) {
      return;
    }

    try {
      if (calendarRegistrationStorageKey) {
        window.localStorage.setItem(calendarRegistrationStorageKey, event.updatedAt);
      }
    } catch {
      // Ignore storage failures and continue with the download.
    }

    setCalendarRegistrationVersion(event.updatedAt);
    window.location.assign(`/api/events/${event.id}/calendar`);
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteMessage("招待リンクをコピーしました。");
    } catch {
      setInviteMessage("コピーに失敗しました。リンクを長押しして共有してください。");
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
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:max-w-5xl sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="フィードへ戻る"
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm"
            >
              <span className="material-symbols-rounded">chevron_left</span>
            </Link>
            <h1 className="text-lg font-semibold">イベント詳細</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-5xl sm:px-6 sm:py-10">
        <section>
          <div>
              <p className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                <span className="material-symbols-rounded text-sm">
                  {visibilityMeta[event.visibility].icon}
                </span>
                {visibilityMeta[event.visibility].label}
              </p>
              <h1 className="text-3xl font-semibold">{event.purpose}</h1>
              <div className="mt-3 text-sm text-[var(--muted)]">
                <AvatarName displayName={event.owner.displayName} avatarIcon={event.owner.avatarIcon} />
              </div>
          </div>

          <div className="mt-6 grid gap-4 pt-4 md:grid-cols-4">
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
                エリア
              </p>
              <p className="mt-2 text-sm font-semibold">{event.area ?? "未設定"}</p>
            </div>
            <div className="p-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                場所
              </p>
              <p className="mt-2 text-sm font-semibold">
                {event.fixedPlaceName ?? "候補から決定"}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {event.fixedPlaceAddress ?? ""}
              </p>
            </div>
            <div className="p-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                状態
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
                <span className="material-symbols-rounded text-base">{statusMeta.icon}</span>
                {statusMeta.label}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
              参加 {event.participants.filter((p) => p.status === "approved").length}/{event.capacity}
            </span>
            {event.status === "completed" && userId ? (
              <div className="w-full space-y-2 sm:w-auto sm:min-w-[19rem]">
                <button
                  onClick={() => handleRecreateFromCompleted("same_members_new_place")}
                  disabled={recreateMode != null}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-rounded">group</span>
                  {recreateMode === "same_members_new_place"
                    ? "作成中..."
                    : "目的・メンバーは同じ（お店は別）で新規作成"}
                </button>
                <button
                  onClick={() => handleRecreateFromCompleted("same_place_new_members")}
                  disabled={recreateMode != null}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--accent)] shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-rounded">storefront</span>
                  {recreateMode === "same_place_new_members"
                    ? "作成中..."
                    : "お店・目的は同じ（メンバーは別）で新規作成"}
                </button>
              </div>
            ) : isOwner ? (
              <div className="w-full space-y-2 sm:w-auto">
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700"
                >
                  <span className="material-symbols-rounded">check_circle</span>
                  参加登録済み
                </button>
                <Link
                  href={`/events/${event.id}/manage`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                >
                  <span className="material-symbols-rounded">settings</span>
                  オーナー管理
                </Link>
                {canDownloadCalendar && (
                  <button
                    type="button"
                    onClick={handleCalendarDownload}
                    disabled={hasRegisteredCalendar}
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange-500 bg-white px-4 py-2 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:shadow-none disabled:hover:bg-gray-100"
                  >
                    <span className="material-symbols-rounded">calendar_add_on</span>
                    カレンダーに登録
                  </button>
                )}
              </div>
            ) : participantStatus === "approved" ? (
              <div className="w-full space-y-2 sm:w-auto">
                <button
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700"
                >
                  <span className="material-symbols-rounded">check_circle</span>
                  参加登録済み
                </button>
                {canDownloadCalendar && (
                  <button
                    type="button"
                    onClick={handleCalendarDownload}
                    disabled={hasRegisteredCalendar}
                    className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-orange-500 bg-white px-4 py-2 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:shadow-none disabled:hover:bg-gray-100"
                  >
                    <span className="material-symbols-rounded">calendar_add_on</span>
                    カレンダーに登録
                  </button>
                )}
                <button
                  onClick={handleLeave}
                  className="w-full text-center text-[11px] font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
                >
                  参加登録を解除
                </button>
              </div>
            ) : participantStatus === "requested" ? (
              <button
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 sm:w-auto"
              >
                <span className="material-symbols-rounded">schedule</span>
                承認待ち
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white sm:w-auto"
              >
                <span className="material-symbols-rounded">send</span>
                参加リクエスト
              </button>
            )}
          </div>
          {event.comment && event.comment.trim().length > 0 && (
            <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
              <p className="text-xs font-semibold text-[var(--accent)]">コメント</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">
                {event.comment}
              </p>
            </div>
          )}
          {recreateMessage && (
            <p className="mt-2 text-xs font-semibold text-rose-700">{recreateMessage}</p>
          )}
        </section>

        {(needsTimeCandidates || needsPlaceCandidates) && (
          <section className="mt-8 space-y-6 pt-6">
            {!canAccessParticipantActions && (
              <p className="rounded-2xl bg-gray-50 px-4 py-3 text-xs font-semibold text-[var(--muted)]">
                候補の追加や投票は、参加登録後に利用できます。
              </p>
            )}
            {candidateActionsDisabled && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                投票期限が過ぎたため、候補の追加と投票はできません。
              </p>
            )}
            {needsTimeCandidates && (
              <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                日程候補
                <button
                  onClick={openTimeProposalOverlay}
                  disabled={candidateActionsDisabled || !canAccessParticipantActions}
                  className={`${plusButtonClass} ${candidateActionsDisabled || !canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
                  aria-label="日程を提案"
                >
                  <span className="material-symbols-rounded">add</span>
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-sky-700">
                  <span className="material-symbols-rounded text-sm">auto_awesome</span>
                  AI推測 TOP3
                </span>
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
                {event.timeCandidates.map((candidate) => (
                  <li key={candidate.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <p className="min-w-0 flex-1 truncate font-semibold text-[var(--foreground)]">
                        {formatStart(candidate.startTime)}
                      </p>
                      {(() => {
                        const selected =
                          timeVoteSelection[candidate.id] ??
                          (candidate.myAvailability == null ? undefined : candidate.myAvailability);
                        return (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => handleTimeVote(candidate.id, true)}
                          disabled={candidateActionsDisabled || !canAccessParticipantActions}
                          className={`grid h-9 w-9 place-items-center rounded-full ${
                            selected === true
                              ? "bg-emerald-100 text-emerald-700"
                              : selected === false
                                ? "bg-gray-100 text-gray-400"
                                : "bg-white text-[var(--muted)] shadow-sm"
                          } ${candidateActionsDisabled || !canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
                          aria-label="この候補は参加可能"
                        >
                          <span className="material-symbols-rounded text-base">check</span>
                        </button>
                        <button
                          onClick={() => handleTimeVote(candidate.id, false)}
                          disabled={candidateActionsDisabled || !canAccessParticipantActions}
                          className={`grid h-9 w-9 place-items-center rounded-full ${
                            selected === false
                              ? "bg-rose-100 text-rose-700"
                              : selected === true
                                ? "bg-gray-100 text-gray-400"
                                : "bg-white text-[var(--muted)] shadow-sm"
                          } ${candidateActionsDisabled || !canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
                          aria-label="この候補は参加不可"
                        >
                          <span className="material-symbols-rounded text-base">close</span>
                        </button>
                      </div>
                        );
                      })()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {needsPlaceCandidates && (
              <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                場所
                <button
                  onClick={openPlaceProposalOverlay}
                  disabled={candidateActionsDisabled || !canAccessParticipantActions}
                  className={`${plusButtonClass} ${candidateActionsDisabled || !canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
                  aria-label="場所を提案"
                >
                  <span className="material-symbols-rounded">add</span>
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-amber-700">
                  <span className="material-symbols-rounded text-sm">auto_awesome</span>
                  候補 最大5件
                </span>
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
                {event.placeCandidates.map((candidate) => (
                  <li key={candidate.id} className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        onClick={() => setSelectedPlaceDetail(candidate)}
                        className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-left"
                      >
                        <Image
                          src={candidate.photoUrl ?? "/file.svg"}
                          alt={`${candidate.name} の写真`}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1 max-w-[11rem] sm:max-w-[14rem]">
                          <p className="truncate font-semibold text-[var(--foreground)]">
                            {truncateWithEllipsis(candidate.name, 16)}
                          </p>
                          <p className="truncate text-xs">
                            {truncateWithEllipsis(candidate.address, 22)}
                          </p>
                        </div>
                      </button>
                      {(() => {
                        const selected =
                          placeVoteSelection[candidate.id] ??
                          (candidate.myScore == null
                            ? undefined
                            : candidate.myScore >= 3
                              ? "good"
                              : "bad");
                        return (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            handlePlaceVote(candidate.id, "good");
                          }}
                          disabled={candidateActionsDisabled || !canAccessParticipantActions}
                          className={`grid h-9 w-9 place-items-center rounded-full ${
                            selected === "good"
                              ? "bg-emerald-100 text-emerald-700"
                              : selected === "bad"
                                ? "bg-gray-100 text-gray-400"
                                : "bg-white text-[var(--muted)] shadow-sm"
                          } ${candidateActionsDisabled || !canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
                          aria-label="このお店は良い"
                        >
                          <span className="material-symbols-rounded text-base">thumb_up</span>
                        </button>
                        <button
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            handlePlaceVote(candidate.id, "bad");
                          }}
                          disabled={candidateActionsDisabled || !canAccessParticipantActions}
                          className={`grid h-9 w-9 place-items-center rounded-full ${
                            selected === "bad"
                              ? "bg-rose-100 text-rose-700"
                              : selected === "good"
                                ? "bg-gray-100 text-gray-400"
                                : "bg-white text-[var(--muted)] shadow-sm"
                          } ${candidateActionsDisabled || !canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
                          aria-label="このお店は微妙"
                        >
                          <span className="material-symbols-rounded text-base">thumb_down</span>
                        </button>
                      </div>
                        );
                      })()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </section>
        )}

        <section className="mt-8 pt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">参加者</h2>
            <button
              onClick={openInviteOverlay}
              disabled={!canAccessParticipantActions}
              className={`${plusButtonClass} ${!canAccessParticipantActions ? "cursor-not-allowed opacity-50" : ""}`}
              aria-label="参加者を招待"
            >
              <span className="material-symbols-rounded">add</span>
            </button>
          </div>
          {!canAccessParticipantActions && (
            <p className="mt-2 text-xs text-[var(--muted)]">招待機能は参加登録後に利用できます。</p>
          )}
          {inviteMessage && <p className="mt-2 text-xs text-[var(--accent)]">{inviteMessage}</p>}
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {[...event.participants, ...(event.invitedUsers ?? [])].map((participant) => (
              <li key={participant.userId} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <AvatarName displayName={participant.displayName} avatarIcon={participant.avatarIcon} />
                  {(() => {
                    const meta =
                      participant.role === "owner"
                        ? {
                            label: "主催",
                            icon: "star",
                            className: "bg-orange-100 text-[var(--accent)]",
                          }
                        : participantBadgeMeta[participant.status] ?? {
                            label: participantStatusJa[participant.status] ?? participant.status,
                            icon: "person",
                            className: "bg-gray-100 text-gray-600",
                          };
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
                      >
                        <span className="material-symbols-rounded text-sm">{meta.icon}</span>
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>
                {participant.role !== "owner" && participant.invitedBy && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {`${participant.invitedBy.displayName}さんの招待`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      {showTimeOverlay && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-md rounded-3xl bg-[var(--surface)] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">別の日程を提案</h3>
              <button
                onClick={() => setShowTimeOverlay(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--muted)]"
                aria-label="閉じる"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <input
                type="datetime-local"
                value={proposalStart}
                onChange={(event) => setProposalStart(event.target.value)}
                className="rounded-full bg-white px-4 py-2 text-sm shadow-sm"
              />
              <button
                onClick={() => handleTimeProposal(proposalStart)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                <span className="material-symbols-rounded">add_circle</span>
                追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlaceOverlay && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-md rounded-3xl bg-[var(--surface)] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">場所を提案</h3>
              <button
                onClick={() => setShowPlaceOverlay(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--muted)]"
                aria-label="閉じる"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={placeQuery}
                  onChange={(event) => setPlaceQuery(event.target.value)}
                  placeholder="例: 恵比寿 イタリアン"
                  className="flex-1 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
                />
                <button
                  onClick={handlePlaceSearch}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-2)] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                >
                  <span className="material-symbols-rounded">search</span>
                  検索
                </button>
              </div>

              {placeResults.length > 0 && (
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
                  {placeResults.map((place) => (
                    <li
                      key={place.placeId}
                      className="flex flex-col gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <Image
                          src={place.photoUrl ?? "/file.svg"}
                          alt={`${place.name} の写真`}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{place.name}</p>
                          <p className="truncate text-xs text-[var(--muted)]">{place.address}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlaceProposal(place)}
                        className="flex w-full items-center justify-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[var(--accent)] sm:w-auto"
                      >
                        <span className="material-symbols-rounded">add</span>
                        追加
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPlaceDetail && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-md rounded-3xl bg-[var(--surface)] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">場所の詳細</h3>
              <button
                onClick={() => setSelectedPlaceDetail(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--muted)]"
                aria-label="閉じる"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <Image
              src={selectedPlaceDetail.photoUrl ?? "/file.svg"}
              alt={`${selectedPlaceDetail.name} の写真`}
              width={640}
              height={352}
              className="mt-3 h-44 w-full rounded-2xl object-cover"
            />
            <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">{selectedPlaceDetail.name}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{selectedPlaceDetail.address}</p>
            <a
              href={
                selectedPlaceDetail.mapsUrl ??
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${selectedPlaceDetail.lat},${selectedPlaceDetail.lng}`
                )}`
              }
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              <span className="material-symbols-rounded">map</span>
              Googleマップで開く
            </a>
          </div>
        </div>
      )}

      {showInviteOverlay && event && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/35 p-3 sm:items-center sm:justify-center sm:p-6">
          <div className="w-full max-w-md rounded-3xl bg-[var(--surface)] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">フレンドを選択</h3>
              <button
                onClick={() => setShowInviteOverlay(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--muted)]"
                aria-label="閉じる"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <p className="mt-2 text-xs text-[var(--muted)]">
              {event.visibility === "private" && userId !== event.owner.userId
                ? "プライベートイベントのため、選択したフレンドの招待をオーナーに申請します。"
                : "選択したフレンドにイベント招待を送信します。"}
            </p>

            <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--foreground)]">リンクで招待</p>
                <button
                  onClick={handleCreateInviteLink}
                  disabled={
                    isCreatingInviteLink ||
                    (event.visibility === "private" && userId !== event.owner.userId)
                  }
                  className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-rounded text-sm">link</span>
                  作成する
                </button>
              </div>
              {inviteLink && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-[var(--muted)]">{inviteLink}</p>
                  <button
                    onClick={handleCopyInviteLink}
                    className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-[var(--accent)]"
                    aria-label="招待リンクをコピー"
                  >
                    <span className="material-symbols-rounded text-sm">content_copy</span>
                  </button>
                </div>
              )}
              {event.visibility === "private" && userId !== event.owner.userId && (
                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  プライベートイベントのリンク招待はオーナーのみ作成できます。
                </p>
              )}
            </div>

            {inviteMessage && <p className="mt-3 text-xs text-[var(--accent)]">{inviteMessage}</p>}

            {friends.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">招待できるフレンドがいません。</p>
            ) : (
              <div className="mt-4">
                <input
                  value={inviteSearch}
                  onChange={(event) => setInviteSearch(event.target.value)}
                  placeholder="フレンド名・エリアで検索"
                  className="w-full rounded-full bg-white px-4 py-2 text-xs shadow-sm"
                />
                {filteredInviteFriends.length === 0 ? (
                  <p className="mt-3 text-xs text-[var(--muted)]">一致するフレンドがいません。</p>
                ) : (
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {filteredInviteFriends.map((friend) => {
                  const selected = selectedInviteeIds.includes(friend.userId);
                  return (
                    <li
                      key={friend.userId}
                      className={`flex items-center justify-between rounded-2xl px-3 py-3 ${
                        selected ? "bg-orange-50 shadow-sm" : "bg-white shadow-sm"
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <AvatarName displayName={friend.displayName} avatarIcon={friend.avatarIcon} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                              {friend.area ?? "エリア未設定"}
                            </span>
                            {friend.isFavorite && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                お気に入り
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleInvitee(friend.userId)}
                        className={`grid h-8 w-8 place-items-center rounded-full ${
                          selected
                            ? "bg-[var(--accent)] text-white"
                            : "bg-white text-[var(--muted)]"
                        }`}
                        aria-label={selected ? "選択解除" : "選択"}
                      >
                        <span className="material-symbols-rounded">check</span>
                      </button>
                    </li>
                  );
                    })}
                  </ul>
                )}
              </div>
            )}

            <button
              onClick={handleInviteFriends}
              disabled={selectedInviteeIds.length === 0 || !canAccessParticipantActions}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-rounded">send</span>
              {event.visibility === "private" && userId !== event.owner.userId
                ? "オーナーに申請する"
                : "招待する"}
            </button>
          </div>
        </div>
      )}

      {isAuthOverlayOpen && (
        <AuthOverlay
          initialMode={authOverlayMode}
          returnTo={returnToPath}
          onClose={() => setIsAuthOverlayOpen(false)}
        />
      )}
    </div>
  );
}
