"use client";

import { motion } from "framer-motion";
import type { DiagnosisQuestion } from "@/lib/community-diagnosis/questions";
import type { DiagnosisAnswer } from "@/lib/community-diagnosis/scoring";

type QuestionCardProps = {
  question: DiagnosisQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (choice: DiagnosisAnswer) => void;
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
    >
      <p className="text-xs font-semibold text-[var(--accent)]">
        Q{questionNumber} / {totalQuestions}
      </p>
      <h2 className="mt-2 text-lg font-bold text-[var(--foreground)]">{question.text}</h2>

      <div className="mt-5 space-y-3">
        {(
          [
            { choice: "A" as const, label: question.optionA },
            { choice: "B" as const, label: question.optionB },
          ]
        ).map((option) => (
          <button
            key={option.choice}
            type="button"
            onClick={() => onAnswer(option.choice)}
            className="w-full rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-4 text-left text-sm font-semibold text-[var(--foreground)] transition active:scale-[0.98] hover:border-[var(--accent)] hover:bg-orange-50"
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
