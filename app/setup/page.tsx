"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CategorySwipe } from "@/components/features/profile/category-swipe";
import { AllergenSelector } from "@/components/features/profile/allergen-selector";
import { ProgressBar } from "@/components/features/profile/progress-bar";
import { categories, allergens } from "@/lib/setup-data";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const totalSteps = 2;
  const progress = (step / totalSteps) * 100;

  const handleCategoriesComplete = (categories: string[]) => {
    setSelectedCategories(categories);
    setStep(2);
  };

  const handleAllergensComplete = (allergens: string[]) => {
    setSelectedAllergens(allergens);
    setStep(3);
    
    // プロフィールデータを保存（実際はAPIに送信）
    console.log("Profile data:", {
      categories: selectedCategories,
      allergens: selectedAllergens,
    });

    // 完了後、少し待ってからホームに遷移
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] bg-clip-text text-transparent">
            Meet & Moc
          </h1>
        </div>
      </header>

      {/* プログレスバー */}
      {step < 3 && (
        <ProgressBar
          progress={progress}
          currentStep={step}
          totalSteps={totalSteps}
        />
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  あなたの興味を教えてください
                </h2>
                <p className="text-gray-600">
                  カードを左右にスワイプして選択
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  右にスワイプ = 興味あり | 左にスワイプ = 興味なし
                </p>
              </div>
              <CategorySwipe
                categories={categories}
                onComplete={handleCategoriesComplete}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <AllergenSelector
                allergens={allergens}
                onComplete={handleAllergensComplete}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut",
                }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-24 h-24 text-[#FF6B6B]" />
              </motion.div>
              
              <h2 className="text-4xl font-bold bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] bg-clip-text text-transparent mb-4">
                登録完了！
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                あなたにぴったりのイベントを探しましょう
              </p>

              <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3">選択した興味</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCategories.map((catId) => {
                    const cat = categories.find((c) => c.id === catId);
                    return cat ? (
                      <span
                        key={catId}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {cat.emoji} {cat.name}
                      </span>
                    ) : null;
                  })}
                </div>

                {selectedAllergens.length > 0 && (
                  <>
                    <h3 className="font-bold text-gray-800 mb-3">
                      アレルギー・NG
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAllergens.map((allergenId) => {
                        const allergen = allergens.find(
                          (a) => a.id === allergenId
                        );
                        return allergen ? (
                          <span
                            key={allergenId}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                          >
                            {allergen.emoji} {allergen.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-[#845EF7] rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span className="ml-2 text-sm">ホーム画面に移動中...</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
