"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AvatarName } from "@/components/ui/avatar-name";

type InviteDetail = {
  eventId: string;
  purpose: string;
  inviter: string;
  inviterAvatarIcon?: string | null;
  status: string;
};

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const [invite, setInvite] = useState<InviteDetail | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInvite = async () => {
      const response = await fetch(`/api/invites/${token}`);
      if (response.ok) {
        const data = (await response.json()) as InviteDetail;
        setInvite(data);
      }
    };

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id ?? null);
    };

    loadInvite();
    loadUser();
  }, [token]);

  const handleAccept = async () => {
    if (!userId) {
      setMessage("ログインしてください。");
      return;
    }

    const response = await fetch(`/api/invites/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (response.ok) {
      setMessage("参加を受け付けました。");
    } else {
      setMessage("参加に失敗しました。");
    }
  };

  if (!invite) {
    return (
      <div className="min-h-screen px-6 py-20 text-center text-sm text-[var(--muted)]">
        招待情報を読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:max-w-4xl sm:px-6">
          <Link
            href="/"
            aria-label="フィードへ戻る"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm"
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </Link>
          <h1 className="text-lg font-semibold">招待リンク</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10 sm:max-w-4xl sm:px-6 sm:py-12">
        <h1 className="text-2xl font-semibold">招待が届きました</h1>
        <div className="mt-2 text-sm text-[var(--muted)]">
          <AvatarName displayName={`${invite.inviter}さん`} avatarIcon={invite.inviterAvatarIcon} />
        </div>
        <div className="mt-6 pt-4">
          <p className="text-sm font-semibold">{invite.purpose}</p>
        </div>
        <button
          onClick={handleAccept}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          <span className="material-symbols-rounded">event_available</span>
          参加する
        </button>
        {message && <p className="mt-4 text-sm text-[var(--accent)]">{message}</p>}
      </main>
    </div>
  );
}
