---
name: pr-review
description: PRを6つの専門サブエージェントで並列レビューする。pr-review-toolkit の全エージェントを同時起動し、Critical/Important/Suggestionの3段階で結果を集約する。PR番号を省略すると現在ブランチのオープンPRを自動取得する。コードレビュー依頼・PRチェック・マージ前確認などで積極的に呼び出すこと。
argument-hint: "[PR番号] [--comment]"
allowed-tools:
  - Bash
  - Agent
---

# Skill: pr-review

pr-review-toolkit の6専門エージェントを**並列で**起動し、包括的なPRレビューを実施する。
各エージェントは独立して `gh pr diff` / `gh pr view` でPR情報を取得するため、並列実行しても情報の欠落は生じない。

## Step 1 — PR番号を解決する

引数に PR 番号が指定されている場合はそれを使用する。指定がない場合:

```bash
gh pr view --json number,title,baseRefName,url
```

取得した値を変数に格納する: `PR_NUMBER`, `PR_TITLE`, `BASE_BRANCH`, `PR_URL`

## Step 2 — 6つのサブエージェントを**単一メッセージ・並列で**起動する

**CRITICAL: 以下の6エージェントは必ず同時に（単一のレスポンスで）起動すること。順番に起動してはいけない。**

各エージェントのプロンプトには取得した `PR_NUMBER` を埋め込む。各エージェントは独立して情報を取得する。

### Agent 1: pr-review-toolkit:code-reviewer
```
PR #${PR_NUMBER} のコードをレビューしてください。
`gh pr diff ${PR_NUMBER}` でdiffを取得し、`gh pr view ${PR_NUMBER} --json title,body,baseRefName` でPR詳細を確認すること。
CLAUDE.md のガイドラインに従い、バグ・スタイル違反・品質問題を報告してください。信頼度80以上の問題のみ報告すること。
```

### Agent 2: pr-review-toolkit:pr-test-analyzer
```
PR #${PR_NUMBER} のテストカバレッジをレビューしてください。
`gh pr diff ${PR_NUMBER}` でdiffを取得すること。
新規追加ロジック・分岐・エラーパスに対するテストの網羅性を分析し、Critical Gap（評価8-10）を優先して報告してください。
```

### Agent 3: pr-review-toolkit:silent-failure-hunter
```
PR #${PR_NUMBER} のエラーハンドリングをレビューしてください。
`gh pr diff ${PR_NUMBER}` でdiffを取得すること。
サイレントエラー・不適切なcatchブロック・不正なフォールバック動作を CRITICAL/HIGH/MEDIUM で分類して報告してください。
```

### Agent 4: pr-review-toolkit:type-design-analyzer
```
PR #${PR_NUMBER} で追加・変更された TypeScript の型をレビューしてください。
`gh pr diff ${PR_NUMBER}` でdiffを取得すること。
型の変更がない場合は「型の変更なし」と報告すること。
encapsulation/invariant-expression/usefulness/enforcement の4軸で評価してください。
```

### Agent 5: pr-review-toolkit:comment-analyzer
```
PR #${PR_NUMBER} のコードコメントをレビューしてください。
`gh pr diff ${PR_NUMBER}` でdiffを取得すること。
追加・変更されたコメントの正確性・保守性・技術的負債リスクを分析し、
Critical Issue / Improvement Opportunity / Recommended Removal に分類して報告してください。
```

### Agent 6: pr-review-toolkit:code-simplifier
```
PR #${PR_NUMBER} のコードの簡潔化・改善機会を特定してください。
`gh pr diff ${PR_NUMBER}` でdiffを取得すること。
機能を変更せず可読性・保守性を向上できる箇所を特定し、具体的な改善案を提示してください。コードを変更しないこと。
```

## Step 3 — 全エージェントの結果を集約する

すべてのエージェントが完了したら、以下のフォーマットで統合レポートを生成する:

```markdown
# PR #${PR_NUMBER} レビューレポート
**タイトル:** ${PR_TITLE}
**URL:** ${PR_URL}

## Critical Issues（マージ前に必ず修正: N件）
- **[エージェント名]** 説明 — `ファイル:行番号`

## Important Issues（修正を強く推奨: N件）
- ...

## Suggestions（任意改善: N件）
- ...

## Strengths（良い実装: N件）
- ...

## エージェント別サマリー

| エージェント | 発見数 | 最高重要度 |
|---|---|---|
| code-reviewer | N件 | Critical/Important/None |
| pr-test-analyzer | N件 | Critical(8-10)/Important(5-7)/None |
| silent-failure-hunter | N件 | CRITICAL/HIGH/MEDIUM/None |
| type-design-analyzer | N件 | Concern/None |
| comment-analyzer | N件 | Critical/Improvement/None |
| code-simplifier | N件 | Suggestion/None |

## 推奨アクション
1. Critical Issues を修正する（マージブロッカー）
2. Important Issues に対応する
3. 修正後に再レビュー: `/pr-review ${PR_NUMBER}`
```

## Step 4 — PRコメントに投稿する（`--comment` フラグ指定時のみ）

`--comment` 引数が指定された場合、または会話中にユーザーが明示的に投稿を要求した場合のみ実行する:

```bash
gh pr comment ${PR_NUMBER} --repo Meet-develop/meet-moc --body "..."
```

## 使用例

```
/pr-review            # 現在ブランチのPRをレビュー
/pr-review 65         # PR番号を指定
/pr-review 65 --comment  # レビュー結果をPRコメントとして投稿
```
