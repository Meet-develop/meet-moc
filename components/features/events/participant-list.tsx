"use client";

import { motion } from "framer-motion";
import { Participant } from "@/lib/event-detail-data";
import Image from "next/image";
import { CheckCircle, HelpCircle, XCircle } from "lucide-react";

interface ParticipantListProps {
  participants: Participant[];
}

export function ParticipantList({ participants }: ParticipantListProps) {
  const confirmedCount = participants.filter(
    (p) => p.status === "confirmed"
  ).length;
  const maybeCount = participants.filter((p) => p.status === "maybe").length;
  const declinedCount = participants.filter(
    (p) => p.status === "declined"
  ).length;

  const getStatusIcon = (status: Participant["status"]) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "maybe":
        return <HelpCircle className="w-5 h-5 text-yellow-500" />;
      case "declined":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: Participant["status"]) => {
    switch (status) {
      case "confirmed":
        return "参加";
      case "maybe":
        return "検討中";
      case "declined":
        return "不参加";
    }
  };

  const getStatusColor = (status: Participant["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "maybe":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">参加者</h3>

      {/* 統計 */}
      <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-2xl">
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-green-600">
            {confirmedCount}
          </div>
          <div className="text-xs text-gray-600">参加</div>
        </div>
        <div className="w-px bg-gray-300" />
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {maybeCount}
          </div>
          <div className="text-xs text-gray-600">検討中</div>
        </div>
        {declinedCount > 0 && (
          <>
            <div className="w-px bg-gray-300" />
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-red-600">
                {declinedCount}
              </div>
              <div className="text-xs text-gray-600">不参加</div>
            </div>
          </>
        )}
      </div>

      {/* 参加者リスト */}
      <div className="space-y-3">
        {participants
          .filter((p) => p.status !== "declined")
          .map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {/* アバター */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-md">
                <Image
                  src={participant.avatarUrl}
                  alt={participant.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* 情報 */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    {participant.name}
                  </span>
                  {getStatusIcon(participant.status)}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(participant.joinedAt).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  に参加表明
                </div>
              </div>

              {/* ステータスバッジ */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  participant.status
                )}`}
              >
                {getStatusText(participant.status)}
              </span>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
