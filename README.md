# ハマネコ会議

ヨコハマのことを、ネコになって話す場所。

4つの質問に答えるとネコが1ひき生まれます。そのまま、坂のこと、バスのこと、
「こんな市長がいいな」という話を、どこかの区の知らないネコとできます。

- 名前もメールも要りません。ログインなし。
- 答えた4つは、その場で全体の集計にまざります。
- ネコの顔と名前は、ランダムな種から自動でつくられます。同じ種からは同じネコが出ます。

**横浜市とは関係のない、非公式のアプリです。** 市の見解でも正式な意見募集でもありません。
本当に届けたい話は、区役所や市の意見受付にも出してください。

---

## 中身

```
index.html            画面
assets/style.css      見た目
assets/data.js        質問・区・板・最初に置いてある声  ← まず触るならここ
assets/cat.js         ネコの顔と、表紙の絵をつくるところ
assets/store.js       声のしまい場所（localStorage / Supabase）
assets/app.js         動かすところ
supabase/schema.sql   みんなで共有するときの土台
config.example.js     共有するときの設定のひな形
```

ビルド不要。フレームワークもパッケージもゼロ。素の HTML と ES モジュールだけです。

---

## 2つのモード

| | 体験版（既定） | 共有版 |
|---|---|---|
| 声のしまい場所 | そのブラウザの中だけ | Supabase（全員で1つの板） |
| 準備 | なし | 無料枠でOK、15分ほど |
| 向いている場面 | 見せる・試す・改造する | 実際に人を呼ぶ |

体験版でも中身は本物です。最初から12件の声と、架空の集計が入っています。

---

## 公開する（GitHub Pages）

```bash
git init
git add -A
git commit -m "ハマネコ会議、はじめの一歩"
git branch -M main
git remote add origin https://github.com/<あなた>/hamaneko-kaigi.git
git push -u origin main
```

そのあと GitHub の **Settings → Pages** で

- Source: `Deploy from a branch`
- Branch: `main` / `/ (root)`

を選んで保存。1〜2分で `https://<あなた>.github.io/hamaneko-kaigi/` が開きます。

## 手元で動かす

ES モジュールを使うので、ファイルを直接開くのではなくサーバー越しに見てください。

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

---

## みんなで1つの板にする（Supabase）

1. [supabase.com](https://supabase.com) でプロジェクトを1つ作る。
2. SQL Editor に `supabase/schema.sql` をまるごと貼って実行する。
3. `config.example.js` を `config.js` という名前でコピーし、
   Project Settings → API にある **Project URL** と **anon public** キーを書き込む。

```js
window.HAMANEKO_CONFIG = {
  supabase: { url: 'https://xxxx.supabase.co', anonKey: 'eyJhbGciOi...' },
};
```

`config.js` は `.gitignore` に入っています。GitHub Pages に置くときは、
リポジトリに直接コミットするのではなく Actions のシークレットから書き出すか、
公開前提で割り切って手でコミットするかを決めてください。

> anon キーはブラウザに配られる公開用の鍵なので、露出しても事故ではありません。
> **service_role キーは絶対に置かないでください。** あれは全部を書き換えられます。

つながらないときは、自動で体験版に落ちて動き続けます（コンソールに理由が出ます）。

---

## 見回りのこと

370万人に開くなら、ここを甘くすると場が死にます。最初から入っているのは:

- 240字まで。長い演説より、短い事実のほうが読まれます。
- リンク禁止。宣伝と誘導が入りにくくなります。
- 電話番号や番地に見える数字をはじきます（自分と他人を守るため）。
- 露骨な攻撃語をはじきます。語のリストは `assets/app.js` の `NG` にあります。
- どの声にも「知らせる」ボタン。

**足りないもの**（人を呼ぶ前に足してください）:

- 連投の制限。Supabase の Edge Function か Cloudflare Turnstile を投稿の前に挟むのが早いです。
- 見回る人。知らせが3件以上ついた声を出す SQL は `schema.sql` の末尾に置いてあります。
  隠すのは `update posts set hidden = true where id = '...'` の一行です。
- 書きことばのルールを、誰が決めるか。技術ではなく運営の話です。

---

## 書きかえる

**質問を変える** — `assets/data.js` の `QUESTIONS` を編集します。
`kind: 'choice'` なら選択肢の板、`kind: 'ward'` なら区の一覧が出ます。
質問を増やすと、そのぶんステップが増えます（`ward` は1つだけにしてください）。

**板を変える** — 同じファイルの `TOPICS`。id を変えたら、`schema.sql` の
`check (topic in (...))` も合わせてください。

**ネコの種類を増やす** — `assets/cat.js` の `COATS` `PATTERNS` `EYES` `NAME_HEADS`。
いま 6 × 5 × 4 × 3 × 3 = 1,620 通りの顔と、40 通りの名前があります。

**ヨコハマ以外でやる** — `WARDS` を自分のまちの区や町名に、`POPULATION` を人口に、
`heroScene()` の絵をそのまちの風景に差し替えれば、そのまま別のまちの会議になります。
そのために MIT にしてあります。

---

## 手を入れてくれる人へ

小さい Issue も歓迎です。とくにこのあたりが空いています。

- 集計を区ごとに絞って見る
- 声を「共感が多い順」に並べ替える
- 板ごとの声を CSV で書き出す（区役所に持っていける形で）
- スクリーンリーダーでの読み上げ順の確認
- 連投の制限

## ライセンス

MIT。`LICENSE` を見てください。
