import assert from "node:assert/strict";
import {
  COMMUNITY_AXES,
  COMMUNITY_TYPES,
  getCommunityType,
} from "../lib/community-diagnosis/types";
import { DIAGNOSIS_QUESTIONS } from "../lib/community-diagnosis/questions";
import {
  computeDiagnosis,
  type DiagnosisAnswers,
} from "../lib/community-diagnosis/scoring";

// 16タイプのコードが全組み合わせ分そろっていて重複がない
{
  const codes = COMMUNITY_TYPES.map((type) => type.code);
  assert.equal(codes.length, 16, "タイプは16種類");
  assert.equal(new Set(codes).size, 16, "コードに重複がない");

  for (const type of COMMUNITY_TYPES) {
    assert.equal(type.code.length, 4, `${type.code} は4文字`);
    type.code.split("").forEach((letter, index) => {
      const axis = COMMUNITY_AXES[index];
      assert.ok(
        letter === axis.poleA.letter || letter === axis.poleB.letter,
        `${type.code} の${index + 1}文字目は ${axis.label} の極の文字`
      );
    });
    assert.ok(type.name.trim().length > 0, `${type.code} に名前がある`);
    assert.ok(type.themeColor.startsWith("#"), `${type.code} にテーマカラーがある`);
    assert.ok(type.imagePath.startsWith("/images/community-types/"), `${type.code} に画像スロットがある`);
  }
  console.log("[PASS] 16タイプの定義が揃っている");
}

// 相性タイプはすべて実在のコードで、自分自身は含まない
{
  const codes = new Set(COMMUNITY_TYPES.map((type) => type.code));
  for (const type of COMMUNITY_TYPES) {
    assert.ok(type.goodMatchTypes.length > 0, `${type.code} に相性タイプがある`);
    for (const match of type.goodMatchTypes) {
      assert.ok(codes.has(match), `${type.code} の相性タイプ ${match} が実在する`);
      assert.notEqual(match, type.code, `${type.code} の相性タイプに自分自身が含まれない`);
    }
  }
  console.log("[PASS] 相性タイプの参照が正しい");
}

// 質問は各軸ちょうど3問(奇数なので同点なし)
{
  for (const axis of COMMUNITY_AXES) {
    const count = DIAGNOSIS_QUESTIONS.filter((question) => question.axis === axis.key).length;
    assert.equal(count, 3, `${axis.label} の質問は3問`);
  }
  const ids = DIAGNOSIS_QUESTIONS.map((question) => question.id);
  assert.equal(new Set(ids).size, ids.length, "質問IDに重複がない");
  console.log("[PASS] 質問は各軸3問ずつ");
}

const buildAnswers = (pick: (questionId: string, axis: string) => "A" | "B"): DiagnosisAnswers =>
  DIAGNOSIS_QUESTIONS.reduce<DiagnosisAnswers>((acc, question) => {
    acc[question.id] = pick(question.id, question.axis);
    return acc;
  }, {});

// 全てA極を選ぶと BHLO、全てB極を選ぶと SCFD
{
  const allA = computeDiagnosis(buildAnswers(() => "A"));
  assert.equal(allA.code, "BHLO");
  assert.deepEqual(allA.axisScores, { size: 3, mood: 3, role: 3, bond: 3 });

  const allB = computeDiagnosis(buildAnswers(() => "B"));
  assert.equal(allB.code, "SCFD");
  assert.deepEqual(allB.axisScores, { size: 0, mood: 0, role: 0, bond: 0 });
  console.log("[PASS] 全A/全Bの分類が正しい");
}

// 混合回答: 多数決で極が決まる(2対1でも判定できる)
{
  // size は q1 のみ B(2対1でA極)、mood/role は全てB、bond は全てA → "SCFO"... ではなく size=A極なので "BCFO"
  const mixed = computeDiagnosis(
    buildAnswers((questionId, axis) => {
      if (axis === "size") return questionId === "q1" ? "B" : "A";
      if (axis === "bond") return "A";
      return "B";
    })
  );
  assert.equal(mixed.code, "BCFO");
  assert.deepEqual(mixed.axisScores, { size: 2, mood: 0, role: 0, bond: 3 });
  console.log("[PASS] 混合回答の多数決判定が正しい");
}

// 全16コードが実際に到達可能で、定義済みタイプに解決される
{
  for (const type of COMMUNITY_TYPES) {
    const answers = buildAnswers((questionId, axisKey) => {
      const axisIndex = COMMUNITY_AXES.findIndex((axis) => axis.key === axisKey);
      const letter = type.code[axisIndex];
      return letter === COMMUNITY_AXES[axisIndex].poleA.letter ? "A" : "B";
    });
    const result = computeDiagnosis(answers);
    assert.equal(result.code, type.code);
    assert.equal(getCommunityType(result.code)?.code, type.code);
  }
  console.log("[PASS] 全16タイプに到達可能");
}

// 不正コードや未回答はエラー/nullになる
{
  assert.equal(getCommunityType("XXXX"), null);
  assert.equal(getCommunityType(""), null);
  assert.equal(getCommunityType(null), null);
  assert.equal(getCommunityType("bhlo")?.code, "BHLO", "小文字コードは大文字に正規化される");
  assert.throws(() => computeDiagnosis({}), /Missing answer/);
  console.log("[PASS] 不正入力のハンドリングが正しい");
}

console.log("All community diagnosis tests passed.");
