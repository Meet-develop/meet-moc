"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Event } from "@/lib/mock-data";
import Image from "next/image";
import { Calendar, MapPin, User } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventCardProps {
  event: Event;
  onSwipe?: (direction: "left" | "right") => void;
  onDetailClick?: () => void;
  onMaybeClick?: () => void;
}

export function EventCard({
  event,
  onSwipe,
  onDetailClick,
  onMaybeClick,
}: EventCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? "right" : "left";
      setExitX(info.offset.x > 0 ? 500 : -500);
      onSwipe?.(direction);
    }
  };

  // ハッシュタグの色を取得
  const getHashtagColor = (tag: string) => {
    const colors = [
      "bg-pink-100 text-pink-700",
      "bg-purple-100 text-purple-700",
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-yellow-100 text-yellow-700",
      "bg-orange-100 text-orange-700",
    ];
    const index = tag.length % colors.length;
    return colors[index];
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileHover={{ scale: 1.02 }}
      className="absolute w-full max-w-md cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* 画像エリア */}
        {event.imageUrl && (
          <div className="relative h-64 w-full overflow-hidden">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              unoptimized
            />
            {/* グラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* 主催者アバター */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-4 right-4"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-lg">
                <Image
                  src={event.organizerAvatar}
                  alt={event.organizerName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </motion.div>

            {/* タイトル */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                {event.title}
              </h3>
            </div>
          </div>
        )}

        {/* コンテンツエリア */}
        <div className="p-6 space-y-4">
          {/* 主催者情報 */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              主催: {event.organizerName}
            </span>
          </div>

          {/* 日付 */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-[#FF6B6B]" />
            <span className="text-sm font-medium text-gray-700">
              {new Date(event.date).toLocaleDateString("ja-JP", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          </motion.div>

          {/* 場所 */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-[#845EF7]" />
            <span className="text-sm font-medium text-gray-700">
              {event.location}
            </span>
          </motion.div>

          {/* ハッシュタグ */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {event.hashtags.map((tag, index) => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: 0.4 + index * 0.1,
                }}
                whileHover={{ scale: 1.1 }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${getHashtagColor(
                  tag
                )}`}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>

          {/* アクションボタン */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMaybeClick}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              検討中 (Maybe)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDetailClick}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] text-white rounded-full font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              詳しく見る
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

interface EventFeedProps {
  events: Event[];
}

export function EventFeed({ events }: EventFeedProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: "left" | "right") => {
    console.log(`Swiped ${direction}`);
    // 次のカードを表示
    if (currentIndex < events.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const handleDetailClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px] flex items-center justify-center">
      {events.map((event, index) => {
        if (index < currentIndex) return null;
        
        const isTop = index === currentIndex;
        const offset = (index - currentIndex) * 10;
        const scale = 1 - (index - currentIndex) * 0.05;

        return (
          <motion.div
            key={event.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: scale,
              opacity: 1,
              y: offset,
              zIndex: events.length - index,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute w-full"
            style={{ pointerEvents: isTop ? "auto" : "none" }}
          >
            <EventCard
              event={event}
              onSwipe={isTop ? handleSwipe : undefined}
              onDetailClick={() => handleDetailClick(event.id)}
              onMaybeClick={() => console.log("Maybe clicked", event.id)}
            />
          </motion.div>
        );
      })}

      {currentIndex >= events.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-2xl font-bold text-gray-400">
            すべてのイベントを確認しました！
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentIndex(0)}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] text-white rounded-full font-medium shadow-lg"
          >
            最初から見る
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
