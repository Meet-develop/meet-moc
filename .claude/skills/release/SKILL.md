---
name: release
description: developブランチをmainにマージし、バージョンタグを付けてGitHub Releaseを作成する。
argument-hint: --version "1.2.0"
allowed-tools:
  - Bash
---

# Skill: release

`develop` → `main` マージ、バージョンタグ付け、GitHub Release作成の一連のリリースワークフロー。

## 対応エージェント
Claude Code, CODEX, その他CLIエージェント（`gh` CLI と `git` が使えれば動作する）

## 前提条件
- `gh` CLI がインストール・認証済みであること
- `main` ブランチが存在すること
- リポジトリ: `Meet-develop/meet-moc`

## バージョニング規則
セマンティックバージョニング（SemVer）に従う:
- `major.minor.patch`（例: `1.2.0`）
- **major**: 破壊的変更
- **minor**: 後方互換の機能追加
- **patch**: バグ修正

## 実行手順

### Step 1 — リリース前チェック
```bash
# developの最新を確認
git fetch origin
git log origin/main..origin/develop --oneline

# 未マージのPRがないか確認
gh pr list --repo Meet-develop/meet-moc --base develop --state open
```

### Step 2 — developをmainにマージ
```bash
git checkout main
git pull origin main
git merge --no-ff origin/develop -m "chore: release v<VERSION>"
git push origin main
```

### Step 3 — タグを付ける
```bash
git tag -a v<VERSION> -m "v<VERSION>"
git push origin v<VERSION>
```

### Step 4 — GitHub Releaseを作成する
```bash
gh release create v<VERSION> \
  --repo Meet-develop/meet-moc \
  --title "v<VERSION>" \
  --generate-notes \
  --target main
```

`--generate-notes` でコミット履歴からリリースノートを自動生成する。

### Step 5 — developを更新する（リリースコミットをマージバック）
```bash
git checkout develop
git merge main
git push origin develop
```

## 出力
```
https://github.com/Meet-develop/meet-moc/releases/tag/v<VERSION>
```
