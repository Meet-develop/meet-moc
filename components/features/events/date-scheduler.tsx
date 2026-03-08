"use client";

import { motion } from "framer-motion";
import { DateOption, Participant } from "@/lib/event-detail-data";
import { Calendar, Clock, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface DateSchedulerProps {
  dateOptions: DateOption[];
  participants: Participant[];
  currentUserId?: string;
  onVote?: (dateOptionId: string, available: boolean) => void;
}

export function DateScheduler({
  dateOptions,
  participants,
  onVote,
}: DateSchedulerProps) {
  const [userVotes, setUserVotes] = useState<{ [dateId: string]: boolean }>(
    {}
  );

  const handleVote = (dateOptionId: string) => {
    const newVote = !userVotes[dateOptionId];
    setUserVotes((prev) => ({
      ...prev,
      [dateOptionId]: newVote,
    }));
    onVote?.(dateOptionId, newVote);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <Calendar className="text-[#FF6B6B]" />
        日程調整
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        参加できる日程をタップしてください（複数選択可）
      </p>

      {/* 日程オプション */}
      <div className="space-y-4">
        {dateOptions.map((option, index) => {
          const availableCount = option.availableParticipants.length;
          const totalParticipants = participants.filter(
            (p) => p.status !== "declined"
          ).length;
          const percentage = Math.round(
            (availableCount / totalParticipants) * 100
          );
          const isUserVoted = userVotes[option.id] || false;
          const isPopular = percentage >= 60;

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`relative rounded-2xl border-2 overflow-hidden transition-all cursor-pointer ${
                isUserVoted
                  ? "border-[#FF6B6B] bg-gradient-to-r from-[#FF6B6B]/10 to-[#845EF7]/10"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
              onClick={() => handleVote(option.id)}
            >
              {/* 人気バッジ */}
              {isPopular && (
                <div className="absolute top-2 right-2 px-3 py-1 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] text-white text-xs font-bold rounded-full">
                  🔥 人気
                </div>
              )}

              <div className="p-4">
                {/* 日付と時間 */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-5 h-5 text-gray-700" />
                      <span className="font-bold text-lg text-gray-800">
                        {formatDate(option.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {option.startTime} - {option.endTime}
                      </span>
                    </div>
                  </div>

                  {/* チェックマーク */}
                  <motion.div
                    animate={{
                      scale: isUserVoted ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isUserVoted
                        ? "bg-gradient-to-r from-[#FF6B6B] to-[#845EF7]"
                        : "bg-gray-200"
                    }`}
                  >
                    {isUserVoted ? (
                      <span className="text-white text-2xl">✓</span>
                    ) : (
                      <span className="text-gray-400 text-2xl">+</span>
                    )}
                  </motion.div>
                </div>

                {/* 参加可能人数 */}
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {availableCount} / {totalParticipants} 人が参加可能
                  </span>
                  <span className="text-xs text-gray-500">({percentage}%)</span>
                </div>

                {/* プログレスバー */}
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="absolute h-full bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] rounded-full"
                  />
                </div>

                {/* 参加者アバター */}
                <div className="flex items-center gap-1 flex-wrap">
                  {option.availableParticipants.slice(0, 8).map((participantId) => {
                    const participant = participants.find(
                      (p) => p.id === participantId
                    );
                    if (!participant) return null;

                    return (
                      <div
                        key={participantId}
                        className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white"
                        title={participant.name}
                      >
                        <Image
                          src={participant.avatarUrl}
                          alt={participant.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    );
                  })}
                  {option.availableParticipants.length > 8 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                      +{option.availableParticipants.length - 8}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 投票状況の説明 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <p className="text-sm text-gray-700">
          💡 <strong>ヒント:</strong>{" "}
          複数の日程を選択すると、主催者が最適な日を決めやすくなります！
        </p>
      </div>
    </div>
  );
}
