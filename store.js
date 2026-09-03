// ハマネコ会議 — 声のしまい場所
//
// 既定では localStorage に入ります。つまり「そのブラウザの中だけ」の体験版です。
// 370万人でひとつの板を共有するには、下の SupabaseStore を使ってください。
// 設定は config.js（config.example.js をコピー）で行います。
//
// どちらの実装も同じ形をしています:
//   init(), loadProfile(), saveProfile(p), clearProfile()
//   listPosts(topicId), createPost(post), createReply(postId, reply)
//   toggleNya(postId), hasNya(postId), tally(), report(postId)

import { SEED_POSTS } from './data.js';

const NS = 'hamaneko:v2';
const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ------------------------------------------------------------------ */
/* ブラウザの中だけ（既定）                                             */
/* ------------------------------------------------------------------ */

class LocalStore {
  constructor() { this.kind = 'local'; }

  #read(key, fallback) {
    try {
      const raw = localStorage.getItem(`${NS}:${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  #write(key, value) {
    try { localStorage.setItem(`${NS}:${key}`, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  async init() {
    if (!this.#read('posts', null)) {
      const now = Date.now();
      const hour = 3600 * 1000;
      const posts = SEED_POSTS.map((s) => ({
        id: uid(),
        topic: s.topic,
        catSeed: s.catSeed,
        name: s.name,
        ward: s.ward,
        body: s.body,
        nya: s.nya,
        createdAt: now + s.at * 24 * hour,
        seeded: true,
        replies: (s.replies || []).map((r) => ({
          id: uid(),
          catSeed: r.catSeed, name: r.name, ward: r.ward, body: r.body,
          createdAt: now + r.at * 24 * hour,
        })),
      }));
      this.#write('posts', posts);
    }
    if (!this.#read('tally', null)) {
      // 体験版なので、はじめに架空の集計を入れておきます。
      this.#write('tally', {
        _n: 1284,
        komari: { kosodate: 214, idou: 297, bousai: 168, midori: 141, shoutengai: 132, fukushi: 186, zaisei: 146 },
        shichou: { kiku: 352, kimeru: 288, okane: 391, mirai: 253 },
        kakawari: { miru: 512, iu: 331, ugoku: 244, tsunagu: 197 },
        ward: {
          '鶴見区': 61, '神奈川区': 72, '西区': 58, '中区': 84, '南区': 66,
          '港南区': 70, '保土ケ谷区': 54, '旭区': 76, '磯子区': 49, '金沢区': 63,
          '港北区': 103, '緑区': 57, '青葉区': 111, '都筑区': 88, '戸塚区': 94,
          '栄区': 38, '泉区': 45, '瀬谷区': 33,
        },
      });
    }
  }

  async loadProfile() { return this.#read('profile', null); }
  async saveProfile(p) {
    this.#write('profile', p);
    const t = this.#read('tally', { _n: 0, komari: {}, shichou: {}, kakawari: {}, ward: {} });
    if (!p._counted) {
      t._n = (t._n || 0) + 1;
      for (const k of ['komari', 'shichou', 'kakawari']) {
        t[k] = t[k] || {};
        if (p[k]) t[k][p[k]] = (t[k][p[k]] || 0) + 1;
      }
      t.ward = t.ward || {};
      if (p.ward) t.ward[p.ward] = (t.ward[p.ward] || 0) + 1;
      this.#write('tally', t);
      p._counted = true;
      this.#write('profile', p);
    }
    return p;
  }
  async clearProfile() { localStorage.removeItem(`${NS}:profile`); }

  async listPosts(topicId) {
    const all = this.#read('posts', []);
    return all
      .filter((p) => !topicId || p.topic === topicId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async createPost(post) {
    const all = this.#read('posts', []);
    const row = { ...post, id: uid(), nya: 0, createdAt: Date.now(), replies: [] };
    all.push(row);
    this.#write('posts', all);
    return row;
  }

  async createReply(postId, reply) {
    const all = this.#read('posts', []);
    const p = all.find((x) => x.id === postId);
    if (!p) throw new Error('その声が見つかりません');
    const row = { ...reply, id: uid(), createdAt: Date.now() };
    p.replies.push(row);
    this.#write('posts', all);
    return row;
  }

  async toggleNya(postId) {
    const mine = this.#read('nya', {});
    const all = this.#read('posts', []);
    const p = all.find((x) => x.id === postId);
    if (!p) return { nya: 0, on: false };
    const on = !mine[postId];
    mine[postId] = on;
    p.nya = Math.max(0, (p.nya || 0) + (on ? 1 : -1));
    this.#write('nya', mine);
    this.#write('posts', all);
    return { nya: p.nya, on };
  }

  hasNya(postId) { return !!this.#read('nya', {})[postId]; }

  async report(postId) {
    const r = this.#read('reports', {});
    r[postId] = (r[postId] || 0) + 1;
    this.#write('reports', r);
    return r[postId];
  }

  async tally() { return this.#read('tally', { _n: 0 }); }
}

/* ------------------------------------------------------------------ */
/* みんなで共有する（Supabase）                                         */
/* ------------------------------------------------------------------ */

class SupabaseStore {
  constructor(cfg) { this.kind = 'supabase'; this.cfg = cfg; }

  async init() {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    this.db = createClient(this.cfg.url, this.cfg.anonKey);
  }

  async loadProfile() {
    try { return JSON.parse(localStorage.getItem(`${NS}:profile`)) || null; }
    catch { return null; }
  }

  async saveProfile(p) {
    localStorage.setItem(`${NS}:profile`, JSON.stringify(p));
    if (!p._counted) {
      const { error } = await this.db.from('answers').insert({
        ward: p.ward, komari: p.komari, shichou: p.shichou, kakawari: p.kakawari,
      });
      if (!error) {
        p._counted = true;
        localStorage.setItem(`${NS}:profile`, JSON.stringify(p));
      }
    }
    return p;
  }

  async clearProfile() { localStorage.removeItem(`${NS}:profile`); }

  async listPosts(topicId) {
    let q = this.db
      .from('posts')
      .select('id, topic, cat_seed, name, ward, body, nya, created_at, replies(id, cat_seed, name, ward, body, created_at)')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(200);
    if (topicId) q = q.eq('topic', topicId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id, topic: r.topic, catSeed: r.cat_seed, name: r.name, ward: r.ward,
      body: r.body, nya: r.nya, createdAt: new Date(r.created_at).getTime(),
      replies: (r.replies || [])
        .map((x) => ({
          id: x.id, catSeed: x.cat_seed, name: x.name, ward: x.ward, body: x.body,
          createdAt: new Date(x.created_at).getTime(),
        }))
        .sort((a, b) => a.createdAt - b.createdAt),
    }));
  }

  async createPost(post) {
    const { data, error } = await this.db.from('posts').insert({
      topic: post.topic, cat_seed: post.catSeed, name: post.name, ward: post.ward, body: post.body,
    }).select().single();
    if (error) throw error;
    return { ...post, id: data.id, nya: 0, createdAt: Date.now(), replies: [] };
  }

  async createReply(postId, reply) {
    const { data, error } = await this.db.from('replies').insert({
      post_id: postId, cat_seed: reply.catSeed, name: reply.name, ward: reply.ward, body: reply.body,
    }).select().single();
    if (error) throw error;
    return { ...reply, id: data.id, createdAt: Date.now() };
  }

  async toggleNya(postId) {
    const mine = JSON.parse(localStorage.getItem(`${NS}:nya`) || '{}');
    const on = !mine[postId];
    mine[postId] = on;
    localStorage.setItem(`${NS}:nya`, JSON.stringify(mine));
    const { data, error } = await this.db.rpc('bump_nya', { p_id: postId, p_delta: on ? 1 : -1 });
    if (error) throw error;
    return { nya: data, on };
  }

  hasNya(postId) {
    try { return !!JSON.parse(localStorage.getItem(`${NS}:nya`) || '{}')[postId]; }
    catch { return false; }
  }

  async report(postId) {
    await this.db.from('reports').insert({ post_id: postId });
    return 1;
  }

  async tally() {
    const { data, error } = await this.db.from('answer_tally').select('*').single();
    if (error) throw error;
    return data;
  }
}

/* ------------------------------------------------------------------ */

export async function openStore() {
  const cfg = globalThis.HAMANEKO_CONFIG?.supabase;
  const store = cfg?.url && cfg?.anonKey ? new SupabaseStore(cfg) : new LocalStore();
  try {
    await store.init();
    return store;
  } catch (err) {
    if (store.kind === 'supabase') {
      console.warn('共有サーバーにつながらないので、ブラウザの中だけで動かします。', err);
      const fallback = new LocalStore();
      await fallback.init();
      fallback.degraded = true;
      return fallback;
    }
    throw err;
  }
}
