"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({
  progress,
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 py-4 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            ステップ {currentStep} / {totalSteps}
          </span>
          <motion.span
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-sm font-bold bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] bg-clip-text text-transparent"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
        
        {/* プログレスバー */}
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute h-full bg-gradient-to-r from-[#FF6B6B] to-[#845EF7] rounded-full"
          />
          
          {/* 光沢エフェクト */}
          <motion.div
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ willChange: "transform" }}
          />
        </div>
      </div>
    </div>
  );
}
