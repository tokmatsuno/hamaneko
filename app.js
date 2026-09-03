// ハマネコ会議 — 動かすところ

import { WARDS, POPULATION, QUESTIONS, CAT_TYPES, TOPICS, GUIDELINES } from './data.js';
import { catFace, catNameFor, randomSeed, heroScene } from './cat.js';
import { openStore } from './store.js';

const MAX = 240;
const $ = (sel) => document.querySelector(sel);
const el = (sel) => document.querySelector(sel);

let store;
let profile = null;
let step = 0;
const draft = {};
let topic = TOPICS[0].id;
let replyingTo = null;

/* ---------- ちいさな道具 ---------- */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function whenText(ms) {
  const d = Math.floor((Date.now() - ms) / 60000);
  if (d < 1) return 'いま';
  if (d < 60) return `${d}分前`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}時間前`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}日前`;
  return new Date(ms).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

const NG = [/死ね/, /殺す/, /しねよ/, /くたばれ/];

/** 書ける文かどうか調べる。だめなら理由を返す。 */
function checkBody(text) {
  const t = text.trim();
  if (!t) return '何か書いてから、置いていってください。';
  if ([...t].length > MAX) return `${MAX}字までです。いまは${[...t].length}字。`;
  if (/https?:\/\//i.test(t)) return 'リンクは貼れません。中身を自分の言葉で書いてください。';
  if (/\d[\d\-\s]{6,}\d/.test(t)) return '電話番号や番地に見える数字が入っています。消してください。';
  if (NG.some((re) => re.test(t))) return '人を攻撃する言葉が入っています。ことがらの話に書き直してください。';
  return null;
}

/* ---------- 表紙 ---------- */

function paintHero() {
  el('#scene').innerHTML = heroScene();
  el('#pop').textContent = (POPULATION / 10000).toLocaleString('ja-JP') + '万';
}

function paintTopbar() {
  const box = el('#whoami');
  if (!profile) { box.innerHTML = ''; return; }
  box.innerHTML = `${catFace(profile.catSeed, 30)}
    <span><b>${esc(profile.name)}</b>・${esc(profile.ward)}</span>
    <button class="btn-plain" id="quit">やめる</button>`;
  el('#quit').addEventListener('click', async () => {
    if (!confirm('このネコを消して、はじめからやり直しますか。書いた声はのこります。')) return;
    await store.clearProfile();
    profile = null; step = 0;
    for (const k of Object.keys(draft)) delete draft[k];
    paintTopbar(); paintAsk(); paintBoard(); paintHeroCta();
    el('#ask-band').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function paintHeroCta() {
  const b = el('#hero-cta');
  if (profile) {
    b.textContent = 'はなしに行く';
    b.dataset.go = '#board-band';
    el('#hero-hint').textContent = `${profile.name}として書けます。`;
  } else {
    b.textContent = 'ネコになる';
    b.dataset.go = '#ask-band';
    el('#hero-hint').textContent = '質問は4つ。30秒くらいです。';
  }
}

/* ---------- 集計 ---------- */

async function paintTally() {
  const t = await store.tally();
  el('#tally-n').textContent =
    `いまのところ ${(t._n || 0).toLocaleString('ja-JP')} ひきぶんの答え`;

  const blocks = [
    { q: QUESTIONS[1], key: 'komari', head: '気になっていること' },
    { q: QUESTIONS[2], key: 'shichou', head: 'こんな市長がいいな' },
    { q: QUESTIONS[3], key: 'kakawari', head: 'どう関わりたいか' },
  ].map(({ q, key, head }) => {
    const counts = t[key] || {};
    const rows = q.options
      .map((o) => ({ label: o.label, n: counts[o.v] || 0 }))
      .sort((a, b) => b.n - a.n);
    return tallyBlock(head, rows);
  });

  const wards = Object.entries(t.ward || {})
    .map(([label, n]) => ({ label, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  blocks.push(tallyBlock('答えたネコが多い区', wards, '（上から6区）'));

  el('#tally').innerHTML = blocks.join('');
}

function tallyBlock(head, rows, sub = '') {
  const total = rows.reduce((s, r) => s + r.n, 0) || 1;
  const max = rows[0]?.n || 1;
  const items = rows.map((r, i) => `
    <li${i === 0 ? ' class="top"' : ''}>
      <span class="lab">${esc(r.label)}</span>
      <span class="num">${Math.round((r.n / total) * 100)}%</span>
      <span class="bar"><i style="width:${Math.max(2, (r.n / max) * 100)}%"></i></span>
    </li>`).join('');
  return `<div class="tally"><h3>${esc(head)}${sub ? `<span class="num"> ${esc(sub)}</span>` : ''}</h3><ol>${items}</ol></div>`;
}

/* ---------- 質問 ---------- */

function paintAsk() {
  const box = el('#ask');
  if (profile) { paintDone(box); return; }

  const q = QUESTIONS[step];
  const dots = QUESTIONS.map((_, i) =>
    `<i class="${i < step ? 'on' : i === step ? 'now' : ''}"></i>`).join('');

  const body = q.kind === 'ward'
    ? `<div class="wards">${WARDS.map((w) => `
        <button class="opt" type="button" data-v="${esc(w)}"
          aria-pressed="${draft.ward === w}">${esc(w)}</button>`).join('')}</div>`
    : `<div class="opts">${q.options.map((o) => `
        <button class="opt" type="button" data-v="${esc(o.v)}"
          aria-pressed="${draft[q.id] === o.v}">${esc(o.label)}</button>`).join('')}</div>`;

  box.innerHTML = `
    <div class="ask-step">${dots}<span>${step + 1} / ${QUESTIONS.length}</span></div>
    <h2>${esc(q.ask)}</h2>
    <p>${esc(q.help)}</p>
    ${body}
    <div class="ask-foot">
      ${step > 0 ? '<button class="btn-quiet" type="button" id="back">ひとつ戻る</button>' : ''}
    </div>`;

  box.querySelectorAll('.opt').forEach((b) => {
    b.addEventListener('click', () => {
      draft[q.id] = b.dataset.v;
      box.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-pressed', x === b));
      setTimeout(next, 180);
    });
  });
  el('#back')?.addEventListener('click', () => { step = Math.max(0, step - 1); paintAsk(); });
}

async function next() {
  if (step < QUESTIONS.length - 1) { step += 1; paintAsk(); return; }
  const seed = randomSeed();
  profile = {
    catSeed: seed,
    name: catNameFor(seed),
    ward: draft.ward,
    komari: draft.komari,
    shichou: draft.shichou,
    kakawari: draft.kakawari,
  };
  profile = await store.saveProfile(profile);
  paintAsk(); paintTopbar(); paintHeroCta(); paintTally(); paintBoard();
  el('#ask').classList.add('reveal');
}

function paintDone(box) {
  const type = CAT_TYPES[profile.kakawari] || CAT_TYPES.miru;
  box.innerHTML = `
    <div class="done">
      <div class="done-card">
        ${catFace(profile.catSeed, 76)}
        <div>
          <h2>${esc(profile.name)}</h2>
          <p class="line">${esc(type.name)}。${esc(type.line)}</p>
          <p class="body">${esc(type.body)}</p>
        </div>
      </div>
      <div class="rename">
        <label class="sr" for="newname">ネコの名前</label>
        <input id="newname" type="text" maxlength="16" value="${esc(profile.name)}">
        <button class="btn-quiet" type="button" id="save-name">この名前にする</button>
        <button class="btn-quiet" type="button" id="reroll">別のネコになる</button>
      </div>
      <ul class="rules">${GUIDELINES.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
    </div>`;

  el('#save-name').addEventListener('click', async () => {
    const v = el('#newname').value.trim();
    if (!v) return;
    profile.name = v.slice(0, 16);
    await store.saveProfile(profile);
    paintTopbar(); paintDone(box);
  });
  el('#reroll').addEventListener('click', async () => {
    const seed = randomSeed();
    profile.catSeed = seed;
    profile.name = catNameFor(seed);
    await store.saveProfile(profile);
    paintTopbar(); paintDone(box);
  });
}

/* ---------- 板 ---------- */

function paintTopics() {
  el('#topics').innerHTML = TOPICS.map((t) => `
    <button class="topic" type="button" role="tab" data-id="${t.id}"
      aria-selected="${t.id === topic}">${esc(t.label)}</button>`).join('');
  el('#topics').querySelectorAll('.topic').forEach((b) => {
    b.addEventListener('click', () => {
      topic = b.dataset.id; replyingTo = null;
      paintTopics(); paintBoard();
    });
  });
}

async function paintBoard() {
  const t = TOPICS.find((x) => x.id === topic);
  el('#topic-lead').textContent = t.lead;

  // 書くところ
  const w = el('#compose-wrap');
  if (!profile) {
    w.innerHTML = `<div class="locked">
      <p>書くには、まずネコになってください。答えた4つは、上の集計にまざります。</p>
      <button class="btn" type="button" data-go="#ask-band">ネコになる</button>
    </div>`;
  } else {
    w.innerHTML = `<div class="compose">
      <label class="sr" for="body">${esc(t.label)}に書く</label>
      <textarea id="body" placeholder="${esc(t.placeholder)}" maxlength="400"></textarea>
      <div class="compose-foot">
        <button class="btn" type="button" id="send">置いていく</button>
        <span class="count" id="cc">0 / ${MAX}</span>
      </div>
      <p class="note hide" id="err"></p>
    </div>`;
    const ta = el('#body');
    ta.addEventListener('input', () => {
      const n = [...ta.value].length;
      const c = el('#cc');
      c.textContent = `${n} / ${MAX}`;
      c.classList.toggle('over', n > MAX);
    });
    el('#send').addEventListener('click', () => send(ta));
  }

  // 声のリスト
  const posts = await store.listPosts(topic);
  const list = el('#posts');
  if (!posts.length) {
    list.innerHTML = `<li><div class="empty"><b>まだ誰もいません</b>
      ここは ${esc(t.label)} の板です。最初の一声を置いていってください。</div></li>`;
    return;
  }
  list.innerHTML = posts.map(postHtml).join('');
  wireBoard();
}

function postHtml(p) {
  const on = store.hasNya(p.id);
  const replies = (p.replies || []).map((r) => `
    <li>
      <div class="who">${catFace(r.catSeed, 26)}<b>${esc(r.name)}</b>
        <span>${esc(r.ward)}</span><time>${whenText(r.createdAt)}</time></div>
      <p class="said">${esc(r.body)}</p>
    </li>`).join('');

  return `<li data-id="${p.id}">
    <div class="who">${catFace(p.catSeed, 38)}<b>${esc(p.name)}</b>
      <span>${esc(p.ward)}</span><time>${whenText(p.createdAt)}</time></div>
    <p class="said">${esc(p.body)}</p>
    <div class="acts">
      <button class="nya" type="button" data-nya="${p.id}" aria-pressed="${on}">
        にゃー ${p.nya || 0}</button>
      ${profile ? `<button class="btn-plain" type="button" data-reply="${p.id}">返す</button>` : ''}
      <button class="btn-plain" type="button" data-report="${p.id}">知らせる</button>
    </div>
    ${replies ? `<ul class="replies">${replies}</ul>` : ''}
    ${replyingTo === p.id ? `
      <div class="reply-box">
        <label class="sr" for="rbody">返す</label>
        <textarea id="rbody" placeholder="${esc(p.name)}に返す" maxlength="400"></textarea>
        <div class="compose-foot">
          <button class="btn" type="button" data-send-reply="${p.id}">返す</button>
          <button class="btn-quiet" type="button" data-cancel-reply="1">やめる</button>
          <span class="count" id="rcc">0 / ${MAX}</span>
        </div>
        <p class="note hide" id="rerr"></p>
      </div>` : ''}
  </li>`;
}

function wireBoard() {
  const list = el('#posts');

  list.querySelectorAll('[data-nya]').forEach((b) => {
    b.addEventListener('click', async () => {
      const { nya, on } = await store.toggleNya(b.dataset.nya);
      b.textContent = `にゃー ${nya}`;
      b.setAttribute('aria-pressed', String(on));
    });
  });

  list.querySelectorAll('[data-reply]').forEach((b) => {
    b.addEventListener('click', () => {
      replyingTo = replyingTo === b.dataset.reply ? null : b.dataset.reply;
      paintBoard().then(() => el('#rbody')?.focus());
    });
  });

  list.querySelectorAll('[data-cancel-reply]').forEach((b) => {
    b.addEventListener('click', () => { replyingTo = null; paintBoard(); });
  });

  list.querySelectorAll('[data-report]').forEach((b) => {
    b.addEventListener('click', async () => {
      await store.report(b.dataset.report);
      b.textContent = '知らせました';
      b.disabled = true;
    });
  });

  const rta = el('#rbody');
  if (rta) {
    rta.addEventListener('input', () => {
      const n = [...rta.value].length;
      const c = el('#rcc');
      c.textContent = `${n} / ${MAX}`;
      c.classList.toggle('over', n > MAX);
    });
    list.querySelector('[data-send-reply]')?.addEventListener('click', async (e) => {
      const postId = e.currentTarget.dataset.sendReply;
      const bad = checkBody(rta.value);
      const err = el('#rerr');
      if (bad) { err.textContent = bad; err.classList.remove('hide'); return; }
      await store.createReply(postId, {
        catSeed: profile.catSeed, name: profile.name, ward: profile.ward,
        body: rta.value.trim(),
      });
      replyingTo = null;
      paintBoard();
    });
  }
}

async function send(ta) {
  const err = el('#err');
  const bad = checkBody(ta.value);
  if (bad) { err.textContent = bad; err.classList.remove('hide'); return; }
  err.classList.add('hide');
  await store.createPost({
    topic,
    catSeed: profile.catSeed, name: profile.name, ward: profile.ward,
    body: ta.value.trim(),
  });
  ta.value = '';
  await paintBoard();
  el('#posts').firstElementChild?.classList.add('reveal');
}

/* ---------- 起動 ---------- */

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (!go) return;
  el(go.dataset.go)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

(async function boot() {
  store = await openStore();
  profile = await store.loadProfile();

  paintHero();
  paintHeroCta();
  paintTopbar();
  paintAsk();
  paintTopics();
  await paintTally();
  await paintBoard();

  el('#mode').textContent = store.kind === 'supabase'
    ? 'いまは、みんなと同じ板につながっています。'
    : 'いまは体験版です。書いた声はこのブラウザの中だけに残ります。みんなで共有するには README を読んでください。';
})();
