# 資格道場

資格試験の問題を1問ずつ解いて、その場で正解と解説を確認できる学習サイトです。いまは次の2つに対応しています。

| 試験 | ページ | 問題 |
|---|---|---|
| Ruby技術者認定試験 Silver（version 3 / Ruby 3.1） | `/ruby-silver/` | オリジナル 240 問 + 公式模擬問題 50 問 |
| Ruby技術者認定試験 Gold（version 3 / Ruby 3.1） | `/ruby-gold/` | オリジナル 92 問 + 公式模擬問題 50 問 |

公式模擬問題は [Ruby Association のサンプル問題](https://github.com/ruby-association/prep-test/tree/version3) をもとに誤記を修正したもので、解説はこのサイトの書き下ろしです。
修正点は [docs/official-prep-test.md](docs/official-prep-test.md)（Silver）と [docs/official-prep-test-gold.md](docs/official-prep-test-gold.md)（Gold）にまとめています。

- 出題順・選択肢の並びは毎回ランダム、受験履歴と復習はブラウザの localStorage に試験ごとに保存（Silver は `rs-*`、Gold は `rg-*`）
- 以前の URL（`/#quiz` や `/#r…`）で開くと、Ruby Silver のページに移ります

## 構成（Astro + TypeScript）

| パス | 内容 |
|---|---|
| `src/lib/exams.ts` | 試験の一覧（名前・問題ファイル・分野・localStorage のキー・合格ライン）とサイト名 |
| `src/data/<試験>/*.yml` | 問題データ（YAML）。id は `exams.ts` の `files` の順に振る連番で、学習履歴に保存されるので、順序を変えたり途中のファイルに問題を足したりしないこと（追加は新しいファイルを末尾に） |
| `src/data/<試験>/*_official.yml` | 公式模擬問題（`official` は出典の問題番号） |
| `src/lib/questions.ts` | ビルド時に YAML を読み込んで検証する。不正なデータがあればビルドが失敗する |
| `src/pages/index.astro` | トップページ（試験を選ぶ） |
| `src/pages/[exam].astro` | 試験ごとのページ。試験の情報と問題を JSON として埋め込む |
| `src/client/` | ブラウザで動く TypeScript（画面・状態・ルーティング・キーボード操作） |
| `src/styles/global.css` | スタイル |
| `verify.rb` | 全問題のコードを実際の Ruby で実行し、正解と一致するか検証 |
| `vercel.json` | CSP などのセキュリティヘッダー |

外部 CDN は使わず、highlight.js と JetBrains Mono は同梱しています。CSP（`script-src 'self'; style-src 'self'`）を守るため、
インラインの `<script>` / `<style>` / `style="..."` 属性 / `onclick=` は使わないでください。

### 試験を追加するには

1. `src/lib/exams.ts` の `EXAMS` に試験を足す（`slug` がページの URL とデータのディレクトリ名になる）
2. `src/data/<slug>/` に問題の YAML を置く。分野（`cat`）は `exams.ts` の `cats` のいずれか（新しい分野は `src/lib/types.ts` の `CATEGORIES` にも追加）
3. Ruby 以外の試験では `verify.rb` の検証は使えないので、別の確認方法を用意する

## 使い方

```sh
npm install
npm run dev       # 開発サーバー
npm run build     # 型チェック（astro check）+ dist/ へ出力
npm run verify    # 問題の検証（Ruby が必要。LANG=C.UTF-8 などの UTF-8 環境で実行）
                  # 試験を絞るなら: ruby verify.rb ruby-gold
```
