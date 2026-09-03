// ハマネコ会議 — ネコの顔をつくる
// 同じ seed からは、いつも同じネコが出てきます。

const COATS = [
  { id: 'kiji',   fur: '#8a7358', dark: '#5f4c39', label: 'キジ' },
  { id: 'chatora',fur: '#c98a4b', dark: '#a3652f', label: '茶トラ' },
  { id: 'shiro',  fur: '#eae5db', dark: '#c3bdb0', label: '白' },
  { id: 'kuro',   fur: '#3b3a3e', dark: '#232227', label: '黒' },
  { id: 'hai',    fur: '#9aa3a6', dark: '#6f797c', label: 'サバ' },
  { id: 'mike',   fur: '#e6dccd', dark: '#b8794a', label: '三毛' },
];

const EYES = ['#3f7d6a', '#b8862f', '#4a6f96', '#7a5c86'];

const PATTERNS = ['plain', 'tabby', 'tuxedo', 'patch', 'point'];

// 名前のもと。前半はまちと食べもの、後半はいつも「ネコ」。
const NAME_HEADS = [
  'しゅうまい', 'あんパン', 'さくらぎ', 'かもめ', 'つづき', 'くり',
  'バスてい', 'しょうてんがい', 'だんち', 'きゅうしょく', 'おか', 'かわべ',
  'よあけ', 'のりまき', 'いしがき', 'せや', 'さかえ', 'いずみ',
  'なまむぎ', 'さかみち', 'こうえん', 'れんが', 'かんらんしゃ', 'しおかぜ',
  'ゆうやけ', 'あまやどり', 'ひなた', 'こたつ', 'にぼし', 'まぐろ',
  'いえけい', 'たこやき', 'あじさい', 'ぎんなん', 'はまなし', 'つきみ',
  'ふとうしょ', 'とうだい', 'かいだん', 'えのき', 'すいどう', 'てつばし',
];

/** 文字列から安定した整数を得る */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function catNameFor(seed) {
  const h = hash(seed + ':name');
  return NAME_HEADS[h % NAME_HEADS.length] + 'ネコ';
}

export function catTraits(seed) {
  const h = hash(seed);
  const coat = COATS[h % COATS.length];
  const pattern = PATTERNS[Math.floor(h / 7) % PATTERNS.length];
  const eye = EYES[Math.floor(h / 53) % EYES.length];
  // 目の開きかたと耳の角度も少しだけ振る
  const squint = (Math.floor(h / 311) % 3); // 0 ふつう 1 半目 2 まるい
  const earTilt = (Math.floor(h / 1013) % 3) - 1;
  return { coat, pattern, eye, squint, earTilt, label: coat.label };
}

/**
 * ネコの顔を SVG 文字列で返す。
 * @param {string} seed
 * @param {number} size ピクセル
 */
export function catFace(seed, size = 44) {
  const t = catTraits(seed);
  const { fur, dark } = t.coat;
  const isDark = t.coat.id === 'kuro';
  const line = isDark ? '#ded8cd' : '#2a2a2e';   // 黒ネコは線を明るく
  const nose = isDark ? '#d09aa2' : '#a8626b';

  const earL = `M12,17 L9.5,${5 + t.earTilt} L21,11 Z`;
  const earR = `M38,17 L40.5,${5 - t.earTilt} L29,11 Z`;
  const earInner = t.pattern === 'point' ? dark : fur;

  let marks = '';
  if (t.pattern === 'tabby') {
    marks += `<path d="M18,13 q7,-3 14,0" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>`;
    marks += `<path d="M20,18 q5,-2.4 10,0" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  if (t.pattern === 'tuxedo') {
    marks += `<path d="M25,26 q9,2 9,10 q-4,5 -9,5 q-5,0 -9,-5 q0,-8 9,-10 z" fill="#f4f1e9" opacity="0.95"/>`;
  }
  if (t.pattern === 'patch') {
    marks += `<path d="M14,14 q9,-4 12,5 q-8,7 -13,2 z" fill="${dark}" opacity="0.9"/>`;
  }
  if (t.pattern === 'point') {
    marks += `<ellipse cx="25" cy="33" rx="9" ry="6.5" fill="${dark}" opacity="0.55"/>`;
  }

  const eyeShape = t.squint === 1
    ? `<path d="M15,27 q4,3 8,0" fill="none" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>
       <path d="M27,27 q4,3 8,0" fill="none" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>`
    : t.squint === 2
      ? `<circle cx="19" cy="27" r="4.2" fill="${t.eye}"/><circle cx="31" cy="27" r="4.2" fill="${t.eye}"/>
         <circle cx="19" cy="27" r="1.7" fill="#1b1b1f"/><circle cx="31" cy="27" r="1.7" fill="#1b1b1f"/>
         <circle cx="20.6" cy="25.4" r="1" fill="#fff" opacity=".85"/><circle cx="32.6" cy="25.4" r="1" fill="#fff" opacity=".85"/>`
      : `<ellipse cx="19" cy="27" rx="3.5" ry="4.3" fill="${t.eye}"/><ellipse cx="31" cy="27" rx="3.5" ry="4.3" fill="${t.eye}"/>
         <ellipse cx="19" cy="27" rx="1.3" ry="3.2" fill="#1b1b1f"/><ellipse cx="31" cy="27" rx="1.3" ry="3.2" fill="#1b1b1f"/>`;

  return `<svg viewBox="0 0 50 50" width="${size}" height="${size}" role="img" aria-label="${t.label}のネコ" focusable="false">
  <path d="${earL}" fill="${earInner}"/>
  <path d="${earR}" fill="${earInner}"/>
  <path d="M25,8 C36.5,8 42,16 42,26 C42,36.5 34.5,43 25,43 C15.5,43 8,36.5 8,26 C8,16 13.5,8 25,8 Z" fill="${fur}"/>
  ${marks}
  ${eyeShape}
  <path d="M25,32.4 l-2.4,-2 h4.8 z" fill="${nose}"/>
  <path d="M25,34 q-2.6,2.6 -5,0.6 M25,34 q2.6,2.6 5,0.6" fill="none" stroke="${line}" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
  <path d="M7,25 L1,23 M7,28.5 L1,29.5 M43,25 L49,23 M43,28.5 L49,29.5" stroke="${isDark ? line : dark}" stroke-width="1" stroke-linecap="round" opacity=".55"/>
</svg>`;
}

/** トップに置く、堤防のネコと港の風景 */
export function heroScene() {
  return `<svg viewBox="0 0 640 430" class="scene" role="img"
   aria-label="堤防に座ったネコが、うしろすがたで港のビルと観覧車をながめている絵">

  <!-- 日なた -->
  <circle cx="252" cy="152" r="50" fill="var(--hinata)" opacity=".5"/>

  <!-- かもめ -->
  <g fill="none" stroke="var(--sumi)" stroke-width="2.2" stroke-linecap="round" opacity=".35">
    <path d="M402 78 l9 -7 l9 7"/>
    <path d="M446 104 l7 -5.5 l7 5.5"/>
    <path d="M330 62 l6 -5 l6 5"/>
  </g>

  <!-- 遠景：はたらく港 -->
  <g fill="var(--umi)" opacity=".26">
    <!-- ランドマークふう -->
    <path d="M372 246 V126 l10 -18 l22 -6 l22 6 l10 18 V246 Z"/>
    <!-- 三つならぶ棟 -->
    <rect x="440" y="164" width="22" height="82"/>
    <rect x="466" y="184" width="22" height="62"/>
    <rect x="492" y="200" width="22" height="46"/>
    <rect x="344" y="196" width="20" height="50"/>
  </g>

  <!-- 観覧車 -->
  <g opacity=".38">
    <g stroke="var(--umi)" fill="none">
      <circle cx="556" cy="186" r="36" stroke-width="3.4"/>
      <circle cx="556" cy="186" r="5" stroke-width="3"/>
      <path d="M556 150 v72 M520 186 h72 M531 161 l50 50 M581 161 l-50 50" stroke-width="1.6"/>
      <path d="M542 213 L528 246 M570 213 L584 246" stroke-width="3"/>
    </g>
  </g>

  <!-- 赤レンガの倉庫、二棟 -->
  <g opacity=".62">
    <rect x="8" y="222" width="70" height="24" fill="var(--renga)"/>
    <rect x="212" y="228" width="52" height="18" fill="var(--renga)"/>
    <rect x="8" y="222" width="70" height="4" fill="var(--sumi)" opacity=".22"/>
    <rect x="212" y="228" width="52" height="4" fill="var(--sumi)" opacity=".22"/>
  </g>

  <!-- 海 -->
  <rect x="0" y="246" width="640" height="82" fill="var(--umi)" opacity=".4"/>
  <rect x="0" y="246" width="640" height="3" fill="var(--umi)" opacity=".3"/>
  <g stroke="var(--kabe)" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".5">
    <path d="M40 268 q11 -7 22 0 M126 288 q11 -7 22 0 M262 262 q11 -7 22 0
             M330 302 q11 -7 22 0 M456 276 q11 -7 22 0 M540 296 q11 -7 22 0 M596 264 q11 -7 22 0"/>
  </g>

  <!-- 貨物船 -->
  <g fill="var(--sumi)" opacity=".45">
    <path d="M392 292 h74 l-10 15 h-54 z"/>
    <rect x="440" y="276" width="16" height="16"/>
    <rect x="452" y="266" width="4" height="12"/>
  </g>

  <!-- 堤防 -->
  <rect x="0" y="328" width="640" height="15" fill="var(--sumi)" opacity=".8"/>
  <rect x="0" y="343" width="640" height="87" fill="var(--sumi)" opacity=".12"/>
  <g stroke="var(--sumi)" stroke-width="1.4" opacity=".18">
    <path d="M92 343 v87 M244 343 v87 M396 343 v87 M548 343 v87"/>
  </g>

  <!-- ネコ、うしろすがた -->
  <g class="hero-cat" fill="var(--sumi)">
    <path d="M122 200 L112 166 L146 192 Z"/>
    <path d="M180 200 L190 166 L156 192 Z"/>
    <circle cx="151" cy="222" r="32"/>
    <path d="M115 306 Q110 242 151 238 Q192 242 187 306 Z"/>
    <path d="M95 330 Q95 262 151 262 Q207 262 207 330 Z"/>
  </g>
  <path class="hero-tail" d="M200 320 C 240 326 254 356 240 380 C 232 394 214 392 212 376"
        fill="none" stroke="var(--sumi)" stroke-width="11" stroke-linecap="round"/>
</svg>`;
}
