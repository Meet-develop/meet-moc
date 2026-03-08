"use client";

import { motion } from "framer-motion";
import { Allergen } from "@/lib/setup-data";
import { useState } from "react";

interface AllergenSelectorProps {
  allergens: Allergen[];
  onComplete: (selectedAllergens: string[]) => void;
  onBack?: () => void;
}

export function AllergenSelector({
  allergens,
  onComplete,
  onBack,
}: AllergenSelectorProps) {
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergenId)
        ? prev.filter((id) => id !== allergenId)
        : [...prev, allergenId]
    );
  };

  const handleSubmit = () => {
    onComplete(selectedAllergens);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          アレルギー・NG設定
        </h2>
        <p className="text-gray-600 text-center mb-8">
          該当するものをタップしてください（複数選択可）
        </p>

        {/* アレルゲングリッド */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {allergens.map((allergen, index) => {
            const isSelected = selectedAllergens.includes(allergen.id);
            return (
              <motion.button
                key={allergen.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: index * 0.05,
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleAllergen(allergen.id)}
                className={`relative aspect-square rounded-2xl p-4 transition-all ${
                  isSelected
                    ? "bg-gradient-to-br from-[#FF6B6B] to-[#845EF7] shadow-xl"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-4xl mb-2">{allergen.emoji}</span>
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {allergen.name}
                  </span>
                </div>
                
                {/* チェックマーク */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                  >
                    <span className="text-[#FF6B6B] text-lg">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 選択数表示 */}
        <div className="text-center mb-6">
          <span className="text-sm text-gray-600">
            {selectedAllergens.length > 0
              ? `${selectedAllergens.length}件選択中`
              : "該当なしの場合はそのまま次へ"}
          </span>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow"
            >
              戻る
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            次へ進む
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
