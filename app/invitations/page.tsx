"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InvitationCard } from "@/components/features/invitations/invitation-card";
import type { Invitation } from "@/lib/invitation-data";
import { ArrowLeft, Bell, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadInvitations = async () => {
      try {
        const response = await fetch("/api/invitations");

        if (!response.ok) {
          throw new Error("Failed to fetch invitations");
        }

        const data = (await response.json()) as Invitation[];

        if (isMounted) {
          setInvitations(data);
        }
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

    loadInvitations();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRespond = async (
    invitationId: string,
    response: "accepted" | "declined" | "maybe",
    message?: string
  ) => {
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === invitationId ? { ...inv, status: response } : inv
      )
    );

    setActionError(null);

    try {
      const apiResponse = await fetch(`/api/invitations/${invitationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: response, message }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error("Failed to update invitation");
      }
    } catch (error) {
      console.error(error);
      setActionError("招待の更新に失敗しました。再度お試しください。");
    }
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending"
  );
  const respondedInvitations = invitations.filter(
    (inv) => inv.status !== "pending"
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">戻る</span>
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] bg-clip-text text-transparent">
            招待
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {hasError && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            招待データの取得に失敗しました。時間をおいて再読み込みしてください。
          </div>
        )}

        {actionError && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* 未対応の招待 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-[#FF6B6B]" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">
              新着招待
              {pendingInvitations.length > 0 && (
                <span className="ml-2 px-3 py-1 bg-[#FF6B6B] text-white text-sm rounded-full">
                  {pendingInvitations.length}
                </span>
              )}
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-3xl shadow-md"
              >
                <p className="text-gray-500">読み込み中...</p>
              </motion.div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onRespond={handleRespond}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-3xl shadow-md"
              >
                <p className="text-gray-500">新しい招待はありません</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 対応済みの招待 */}
        {respondedInvitations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-gray-500" size={24} />
              <h2 className="text-xl font-bold text-gray-600">対応済み</h2>
            </div>

            <div className="space-y-3">
              {respondedInvitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 opacity-60"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    {invitation.eventImageUrl && (
                      <Image
                        src={invitation.eventImageUrl}
                        alt={invitation.eventTitle}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">
                      {invitation.eventTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {invitation.organizerName}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invitation.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : invitation.status === "maybe"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {invitation.status === "accepted"
                      ? "参加"
                      : invitation.status === "maybe"
                      ? "検討中"
                      : "辞退"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
