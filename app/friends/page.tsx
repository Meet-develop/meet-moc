"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { AvatarName } from "@/components/ui/avatar-name";

type Friend = { userId: string; displayName: string; avatarIcon?: string | null };

type Favorite = { userId: string; displayName: string; avatarIcon?: string | null };

export default function FriendsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const loadData = async (currentUserId: string) => {
    const [friendsResponse, favoritesResponse] = await Promise.all([
      fetch(`/api/friends?userId=${currentUserId}`),
      fetch(`/api/favorites?userId=${currentUserId}`),
    ]);

    if (friendsResponse.ok) {
      setFriends((await friendsResponse.json()) as Friend[]);
    }
    if (favoritesResponse.ok) {
      setFavorites((await favoritesResponse.json()) as Favorite[]);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);
      if (currentUserId) {
        loadData(currentUserId);
      }
    };

    loadUser();
  }, []);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((favorite) => favorite.userId)),
    [favorites]
  );

  const toggleFavorite = async (friendId: string) => {
    if (!userId) return;
    const action = favoriteIds.has(friendId) ? "remove" : "add";
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, favoriteUserId: friendId, action }),
    });
    loadData(userId);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-md flex-col gap-2 px-4 py-4 sm:max-w-4xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
            ← フィードに戻る
          </Link>
          <span className="text-xs text-[var(--muted)]">フレンド</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
        {!userId && (
          <div className="mb-6 rounded-3xl bg-white/80 p-4 text-sm text-[var(--muted)] shadow-sm">
            フレンド一覧を表示するにはログインが必要です。
            <Link href="/onboarding" className="ml-2 text-[var(--accent)]">
              ログインはこちら
            </Link>
          </div>
        )}
        <h1 className="text-2xl font-semibold">フレンド一覧</h1>
        <section className="mt-4 border-t border-orange-100 pt-4">
          {friends.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">フレンドがまだいません。</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {friends.map((friend) => (
                <li key={friend.userId} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <AvatarName displayName={friend.displayName} avatarIcon={friend.avatarIcon} />
                  <button
                    onClick={() => toggleFavorite(friend.userId)}
                    className={`flex w-full items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-semibold sm:w-auto sm:py-1 ${
                      favoriteIds.has(friend.userId)
                        ? "bg-[var(--accent-3)] text-white"
                        : "bg-white text-[var(--muted)] shadow-sm"
                    }`}
                  >
                    <span className="material-symbols-rounded">
                      {favoriteIds.has(friend.userId) ? "star" : "star_border"}
                    </span>
                    {favoriteIds.has(friend.userId) ? "お気に入り" : "お気に入りに追加"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
