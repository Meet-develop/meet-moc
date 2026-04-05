import assert from "node:assert/strict";
import {
  PROFILE_COMPLETION_THRESHOLD,
  decidePostAuthRedirect,
} from "../lib/auth/post-auth-redirect";

const cases = [
  {
    name: "セッションがない場合はオンボーディングへ",
    input: { hasSessionUserId: false, profileRequestOk: false, completionRate: 0 },
    expected: "/onboarding",
  },
  {
    name: "プロフィール取得失敗時はセットアップへ",
    input: { hasSessionUserId: true, profileRequestOk: false, completionRate: 0 },
    expected: "/profile/setup",
  },
  {
    name: "プロフィール未完了時はセットアップへ",
    input: {
      hasSessionUserId: true,
      profileRequestOk: true,
      completionRate: PROFILE_COMPLETION_THRESHOLD - 1,
    },
    expected: "/profile/setup",
  },
  {
    name: "プロフィール完了時はメインへ",
    input: {
      hasSessionUserId: true,
      profileRequestOk: true,
      completionRate: PROFILE_COMPLETION_THRESHOLD,
    },
    expected: "/",
  },
];

for (const testCase of cases) {
  const actual = decidePostAuthRedirect(testCase.input);
  assert.equal(actual, testCase.expected, testCase.name);
  console.log(`[PASS] ${testCase.name}`);
}

console.log("All post-auth redirect tests passed.");
