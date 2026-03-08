"use client";

import { useParams, useRouter } from "next/navigation";
import { mockEventDetails } from "@/lib/event-detail-data";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  User,
  Users,
  DollarSign,
  ArrowLeft,
  Heart,
  Share2,
} from "lucide-react";
import { DateScheduler } from "@/components/features/events/date-scheduler";
import { ParticipantList } from "@/components/features/events/participant-list";
import { RelationshipButton } from "@/components/features/relationship/relationship-button";
import { useState } from "react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const event = mockEventDetails[eventId];
  const [isLiked, setIsLiked] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            イベントが見つかりません
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-[#FF6B6B] hover:underline"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = () => {
    setHasJoined(true);
    // 実際はAPIに送信
    console.log("Joined event:", eventId);
  };

  const handleShare = () => {
    // シェア機能
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      // Fallback: クリップボードにコピー
      navigator.clipboard.writeText(window.location.href);
      alert("URLをクリップボードにコピーしました！");
    }
  };

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
            Meet & Moc
          </h1>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart
                size={24}
                className={isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Share2 size={24} className="text-gray-600" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ヒーロー画像 */}
        {event.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-96 rounded-3xl overflow-hidden shadow-2xl mb-8"
          >
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* タイトルオーバーレイ */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {event.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/90 backdrop-blur-sm text-purple-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* イベント情報カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            イベント詳細
          </h2>

          <div className="space-y-4 mb-6">
            {/* 主催者 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">主催者</div>
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={event.organizerAvatar}
                      alt={event.organizerName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {event.organizerName}
                  <RelationshipButton userId={event.organizerId} compact />
                </div>
              </div>
            </div>

            {/* 日付 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">日時</div>
                <div className="font-medium text-gray-800">
                  {new Date(event.date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </div>
              </div>
            </div>

            {/* 場所 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">場所</div>
                <div className="font-medium text-gray-800">
                  {event.location}
                </div>
              </div>
            </div>

            {/* 参加人数 */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-600">参加人数</div>
                <div className="font-medium text-gray-800">
                  {event.currentParticipants} / {event.maxParticipants} 名
                </div>
              </div>
            </div>

            {/* 金額 */}
            {event.price && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">参加費</div>
                  <div className="font-medium text-gray-800">
                    ¥{event.price.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 説明 */}
          <div className="p-4 bg-gray-50 rounded-2xl">
            <h3 className="font-bold text-gray-800 mb-2">イベント内容</h3>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>
        </motion.div>

        {/* 日程調整 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <DateScheduler
            dateOptions={event.dateOptions}
            participants={event.participants}
          />
        </motion.div>

        {/* 参加者リスト */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <ParticipantList participants={event.participants} />
        </motion.div>

        {/* 参加ボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky bottom-4 z-40"
        >
          {hasJoined ? (
            <div className="bg-white rounded-full shadow-2xl p-4 text-center">
              <span className="text-green-600 font-bold text-lg">
                ✓ 参加表明済み
              </span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              className="w-full py-5 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transition-shadow"
            >
              このイベントに参加する
            </motion.button>
          )}
        </motion.div>
      </main>
    </div>
  );
}
