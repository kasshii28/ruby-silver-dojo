# Ruby Silver 道場

Ruby技術者認定試験 Silver（version 3 / Ruby 3.1）向けのオリジナル問題 240 問と公式模擬問題 50 問を、1問ずつ解いてその場で正解と解説を確認できる学習サイトです。

公式模擬問題は [Ruby Association のサンプル問題](https://github.com/ruby-association/prep-test/blob/version3/silver_ja.md) をもとに誤記を修正したもので、解説はこのサイトの書き下ろしです。修正点は [docs/official-prep-test.md](docs/official-prep-test.md) にまとめています。

- 公開URL: https://ruby-silver-dojo.vercel.app
- 出題順・選択肢の並びは毎回ランダム、受験履歴と復習はブラウザの localStorage に保存

## 構成（Astro + TypeScript）

| パス | 内容 |
|---|---|
| `src/data/questions/q_*.yml` | 問題データ（YAML）。id はファイル順（`src/lib/questions.ts` の `FILES`）の連番なので、順序を変えないこと |
| `src/lib/questions.ts` | ビルド時に YAML を読み込んで検証する。不正なデータがあればビルドが失敗する |
| `src/pages/index.astro` | ページ本体。問題を JSON として埋め込む |
| `src/client/` | ブラウザで動く TypeScript（画面・状態・ルーティング・キーボード操作） |
| `src/styles/global.css` | スタイル |
| `src/data/questions/q_official.yml` | 公式模擬問題（`official` は出典の問題番号） |
| `verify.rb` | 全問題のコードを実際の Ruby で実行し、正解と一致するか検証 |
| `vercel.json` | CSP などのセキュリティヘッダー |

外部 CDN は使わず、highlight.js と JetBrains Mono は同梱しています。CSP（`script-src 'self'; style-src 'self'`）を守るため、
インラインの `<script>` / `<style>` / `style="..."` 属性 / `onclick=` は使わないでください。

## 使い方

```sh
npm install
npm run dev       # 開発サーバー
npm run build     # 型チェック（astro check）+ dist/ へ出力
npm run verify    # 問題の検証（Ruby が必要。LANG=C.UTF-8 などの UTF-8 環境で実行）
```
