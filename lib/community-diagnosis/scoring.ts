import { COMMUNITY_AXES, type AxisKey } from "./types";
import { DIAGNOSIS_QUESTIONS } from "./questions";

export type DiagnosisAnswer = "A" | "B";
export type DiagnosisAnswers = Record<string, DiagnosisAnswer>;

export type DiagnosisResult = {
  code: string;
  // 軸ごとのA極(B/H/L/O)回答数(0〜3)。将来の推薦ロジックで軸の強さとして利用できる
  axisScores: Record<AxisKey, number>;
};

export const computeDiagnosis = (answers: DiagnosisAnswers): DiagnosisResult => {
  const axisScores = {} as Record<AxisKey, number>;
  let code = "";

  for (const axis of COMMUNITY_AXES) {
    const questions = DIAGNOSIS_QUESTIONS.filter((question) => question.axis === axis.key);
    let aCount = 0;

    for (const question of questions) {
      const answer = answers[question.id];
      if (answer !== "A" && answer !== "B") {
        throw new Error(`Missing answer for question ${question.id}`);
      }
      if (answer === "A") {
        aCount += 1;
      }
    }

    axisScores[axis.key] = aCount;
    code += aCount * 2 > questions.length ? axis.poleA.letter : axis.poleB.letter;
  }

  return { code, axisScores };
};
