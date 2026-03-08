"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Category } from "@/lib/setup-data";
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface CategorySwipeProps {
  categories: Category[];
  onComplete: (selectedCategories: string[]) => void;
}

export function CategorySwipe({
  categories,
  onComplete,
}: CategorySwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleSwipe = (categoryId: string, swipeDirection: "left" | "right") => {
    if (swipeDirection === "right") {
      setSelectedCategories((prev) => [...prev, categoryId]);
    }

    setTimeout(() => {
      if (currentIndex < categories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        const finalSelected =
          swipeDirection === "right"
            ? [...selectedCategories, categoryId]
            : selectedCategories;
        onComplete(finalSelected);
      }
    }, 300);
  };

  if (currentIndex >= categories.length) {
    return null;
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-[500px] flex items-center justify-center">
      <div className="absolute top-0 left-0 right-0 flex justify-between px-8 text-6xl opacity-20 pointer-events-none">
        <ThumbsDown className="text-red-500" size={64} />
        <ThumbsUp className="text-green-500" size={64} />
      </div>

      {categories.map((category, index) => {
        if (index < currentIndex) return null;

        const isTop = index === currentIndex;
        const offset = (index - currentIndex) * 10;
        const scale = 1 - (index - currentIndex) * 0.05;

        return (
          <motion.div
            key={category.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: scale,
              opacity: 1,
              y: offset,
              zIndex: categories.length - index,
            }}
            className="absolute w-full"
            style={{ pointerEvents: isTop ? "auto" : "none" }}
          >
            <CategoryCard
              category={category}
              onSwipe={isTop ? handleSwipe : undefined}
              isActive={isTop}
            />
          </motion.div>
        );
      })}

      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-500">
        {currentIndex + 1} / {categories.length}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  onSwipe?: (categoryId: string, direction: "left" | "right") => void;
  isActive: boolean;
}

function CategoryCard({ category, onSwipe, isActive }: CategoryCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? "right" : "left";
      setExitX(info.offset.x > 0 ? 500 : -500);
      onSwipe?.(category.id, direction);
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
        {/* スワイプインジケーター */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute left-8 top-8 px-6 py-3 border-4 border-green-500 rounded-2xl rotate-12"
          >
            <span className="text-3xl font-bold text-green-500">LIKE</span>
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute right-8 top-8 px-6 py-3 border-4 border-red-500 rounded-2xl -rotate-12"
          >
            <span className="text-3xl font-bold text-red-500">NOPE</span>
          </motion.div>
        </div>

        {/* カードコンテンツ */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 py-8">
          {/* 絵文字 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`text-9xl mb-4`}
          >
            {category.emoji}
          </motion.div>

          {/* カテゴリ名 */}
          <h2 className="text-4xl font-bold text-gray-800">
            {category.name}
          </h2>

          {/* 説明 */}
          <p className="text-lg text-gray-600 max-w-sm">
            {category.description}
          </p>

          {/* グラデーションバー */}
          <div className={`w-32 h-2 rounded-full bg-gradient-to-r ${category.color}`} />
        </div>

        {/* ボタン */}
        <div className="flex gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSwipe?.(category.id, "left")}
            className="flex-1 py-4 bg-gradient-to-r from-red-100 to-pink-100 text-red-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
          >
            <ThumbsDown size={24} />
            興味なし
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSwipe?.(category.id, "right")}
            className="flex-1 py-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-600 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
          >
            <ThumbsUp size={24} />
            興味あり
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
