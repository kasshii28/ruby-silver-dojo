# Ruby Silver 道場

Ruby技術者認定試験 Silver（version 3 / Ruby 3.1）向けのオリジナル問題 240 問を、1問ずつ解いてその場で正解と解説を確認できる学習サイトです。

- 公開URL: https://ruby-silver-dojo.vercel.app
- 出題順・選択肢の並びは毎回ランダム、受験履歴と復習はブラウザの localStorage に保存

## 構成

| ファイル | 内容 |
|---|---|
| `q_*.yml` | 問題データ（YAML）。`q_extra.yml` は複数選択・穴埋め中心の追加分 |
| `verify.rb` | 全問題のコードを実際の Ruby で実行し、正解と一致するか検証 |
| `build.rb` | 問題を JS に変換して `dist/` と単一ファイル版を生成 |
| `template2.html` | サイトの UI（現行） |
| `dist/` | 静的サイトの成果物（Vercel にデプロイ） |
| `ruby-silver-dojo.html` | 単一ファイル版 |

## 使い方

```sh
export LANG=C.UTF-8 LC_ALL=C.UTF-8
ruby verify.rb   # 問題の検証
ruby build.rb    # dist/ と単一ファイル版を生成
```
