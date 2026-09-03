// ハマネコ会議 — まちのデータと質問
// このファイルを編集すれば、質問も話題も差し替えられます。

export const WARDS = [
  '鶴見区', '神奈川区', '西区', '中区', '南区', '港南区',
  '保土ケ谷区', '旭区', '磯子区', '金沢区', '港北区', '緑区',
  '青葉区', '都筑区', '戸塚区', '栄区', '泉区', '瀬谷区',
];

// 横浜市の人口（概数）。表示用。
export const POPULATION = 3_700_000;

export const QUESTIONS = [
  {
    id: 'ward',
    kind: 'ward',
    ask: 'どのへんを歩いてるネコですか',
    help: '住んでいる区、または通っている区を選んでください。',
  },
  {
    id: 'komari',
    kind: 'choice',
    ask: 'まちで、いちばん気になっていることは',
    help: 'ひとつだけ選んでください。あとで変えられます。',
    options: [
      { v: 'kosodate', label: '子育てと学校' },
      { v: 'idou', label: 'バス・電車・坂道' },
      { v: 'bousai', label: '防災と崖・水害' },
      { v: 'midori', label: 'みどりと海と川' },
      { v: 'shoutengai', label: '商店街と空き家' },
      { v: 'fukushi', label: '介護と医療' },
      { v: 'zaisei', label: '税金の使いみち' },
    ],
  },
  {
    id: 'shichou',
    kind: 'choice',
    ask: 'こんな市長がいいな',
    help: 'いちばん大事にしてほしいことを。',
    options: [
      { v: 'kiku', label: '町内会にも来て、話を聞く' },
      { v: 'kimeru', label: 'もめても、決めて動かす' },
      { v: 'okane', label: 'お金の出入りを全部見せる' },
      { v: 'mirai', label: '30年先に効くことに使う' },
    ],
  },
  {
    id: 'kakawari',
    kind: 'choice',
    ask: 'あなたは、どう関わりたい',
    help: 'これであなたのネコが決まります。',
    options: [
      { v: 'miru', label: 'まずは見ていたい' },
      { v: 'iu', label: '言いたいことがある' },
      { v: 'ugoku', label: '手を動かすほうが早い' },
      { v: 'tsunagu', label: '人と人をつなぎたい' },
    ],
  },
];

export const CAT_TYPES = {
  miru: {
    name: 'ひなたネコ',
    line: '日なたから、まちをずっと見ている。',
    body: '気づくのが早い。おかしいと思ったことを、ときどきひとこと置いていってください。それが誰かの背中を押します。',
  },
  iu: {
    name: 'こえだしネコ',
    line: '言うべきときに、ちゃんと鳴く。',
    body: 'あなたの一声で、黙っていた人が続きます。相手ではなく、ことがらを叩いてください。',
  },
  ugoku: {
    name: 'てだしネコ',
    line: '会議より先に、もう草を刈っている。',
    body: '小さく試した話をここに書くと、真似する人が出てきます。失敗談のほうがよく効きます。',
  },
  tsunagu: {
    name: 'つなぎネコ',
    line: '塀の上を歩いて、隣町までいく。',
    body: '別の区で同じことを言っている人を見つけて、引き合わせてください。話は人がつながると動きます。',
  },
};

export const TOPICS = [
  {
    id: 'shichou',
    label: 'こんな市長がいいな',
    lead: '人を選ぶ話ではなく、してほしいことの話をしましょう。',
    placeholder: '例：区役所の窓口、土曜もどこか一つ開けてほしい。',
  },
  {
    id: 'komari',
    label: 'ご近所のこまりごと',
    lead: 'できるだけ、場所と時間を書いてください。動かしやすくなります。',
    placeholder: '例：朝7時の坂、ベビーカーと車がすれ違えない。',
  },
  {
    id: 'jiman',
    label: 'ヨコハマ自慢',
    lead: '守りたいものが分かると、変えていいものも分かります。',
    placeholder: '例：夕方、丘の上から見える貨物船の灯り。',
  },
];

export const GUIDELINES = [
  '人ではなく、ことがらの話をする。',
  '住所や勤め先など、自分と他人が特定できることは書かない。',
  '違う意見のネコにも、いちおう耳を向ける。',
];

// 最初に置いてある声。中身は架空ですが、横浜でよく話に出ることを元にしています。
export const SEED_POSTS = [
  {
    topic: 'shichou',
    catSeed: 'shuumai-01', name: 'しゅうまいネコ', ward: '中区',
    body: '市の予算、区ごとにいくら使われたのかを一枚の紙で見たい。分厚い資料はもう出ているけど、あれを読める人がどれだけいるか。',
    nya: 41, at: -6.2,
    replies: [
      { catSeed: 'anpan-04', name: 'あんパンネコ', ward: '港北区', body: '区民会議で同じことを言ったら、担当課がA3一枚にしてくれた年があった。続かなかったけど。', at: -5.9 },
    ],
  },
  {
    topic: 'shichou',
    catSeed: 'sakuragi-02', name: 'さくらぎネコ', ward: '西区',
    body: '駅前の再開発より先に、丘の上の道を直してほしい。人が住んでいるのはそっちです。',
    nya: 63, at: -5.1, replies: [],
  },
  {
    topic: 'shichou',
    catSeed: 'kamome-03', name: 'かもめネコ', ward: '神奈川区',
    body: '決めるのが遅いことより、決めた理由が分からないことが困る。反対意見をどう扱ったのかまで書いて出してほしい。',
    nya: 28, at: -3.4,
    replies: [
      { catSeed: 'nori-11', name: 'のりまきネコ', ward: '青葉区', body: 'それだと次に反対する人も準備ができる。健全だと思う。', at: -3.1 },
    ],
  },
  {
    topic: 'shichou',
    catSeed: 'tsuzuki-05', name: 'つづきネコ', ward: '都筑区',
    body: '子どもの数が減っていく前提で、学校の建物をどう使い回すのかを先に見せてほしい。閉めてから考えるのは遅い。',
    nya: 35, at: -2.2, replies: [],
  },
  {
    topic: 'komari',
    catSeed: 'kuri-06', name: 'くりネコ', ward: '保土ケ谷区',
    body: '家の裏が崖で、大雨のたびに寝られない。市の点検は来たけど、そのあとどうなったのか通知が来ない。',
    nya: 57, at: -7.0,
    replies: [
      { catSeed: 'ishi-12', name: 'いしがきネコ', ward: '磯子区', body: '同じ状況です。区の土木事務所に電話したら、点検の記録は見せてもらえました。窓口で聞くと出てくるみたい。', at: -6.6 },
      { catSeed: 'kuri-06', name: 'くりネコ', ward: '保土ケ谷区', body: 'ありがとう、明日行ってみます。', at: -6.4 },
    ],
  },
  {
    topic: 'komari',
    catSeed: 'bus-07', name: 'バスていネコ', ward: '旭区',
    body: '夕方のバスが減って、最終が19時台になった路線がある。車がない家は、そこで生活が切れます。',
    nya: 88, at: -6.1,
    replies: [
      { catSeed: 'seya-13', name: 'せやネコ', ward: '瀬谷区', body: '乗る人が少ないから減る、減るから乗れない。この順番をどこかで止めないと。', at: -5.7 },
    ],
  },
  {
    topic: 'komari',
    catSeed: 'shoten-08', name: 'しょうてんがいネコ', ward: '南区',
    body: '商店街のシャッターが3軒続いた。大家さんは貸したいらしいけど、改装のお金が出ないと言っていた。ここに手が届く仕組みはないんだろうか。',
    nya: 44, at: -4.3, replies: [],
  },
  {
    topic: 'komari',
    catSeed: 'danchi-09', name: 'だんちネコ', ward: '金沢区',
    body: '5階の階段、80代の人が休みながら上がっている。エレベーターの話は20年出ていて、20年決まっていない。',
    nya: 72, at: -3.0,
    replies: [
      { catSeed: 'sakae-14', name: 'さかえネコ', ward: '栄区', body: '踊り場に椅子を置いただけでも、だいぶ違ったと聞いた。それは今日からできる。', at: -2.8 },
    ],
  },
  {
    topic: 'komari',
    catSeed: 'kyuu-10', name: 'きゅうしょくネコ', ward: '緑区',
    body: '中学の昼、まだ家庭によって差がある。何が食べられるかで肩身が狭くなるのは、子どもには重い。',
    nya: 51, at: -1.4, replies: [],
  },
  {
    topic: 'jiman',
    catSeed: 'oka-15', name: 'おかネコ', ward: '鶴見区',
    body: '工場の煙突と、そのうしろの富士山が同時に見える日がある。あれは他のまちでは見たことがない。',
    nya: 66, at: -5.5, replies: [],
  },
  {
    topic: 'jiman',
    catSeed: 'kawa-16', name: 'かわべネコ', ward: '戸塚区',
    body: '柏尾川の桜。人が少ない上流のほうが、実はきれいです。',
    nya: 39, at: -3.8,
    replies: [
      { catSeed: 'izumi-17', name: 'いずみネコ', ward: '泉区', body: '書かないでほしかった（うそです、行きます）', at: -3.6 },
    ],
  },
  {
    topic: 'jiman',
    catSeed: 'yoake-18', name: 'よあけネコ', ward: '中区',
    body: '朝5時の山下公園には、ネコと、走る人と、船だけがいる。あの30分がいちばん横浜です。',
    nya: 94, at: -1.1, replies: [],
  },
];
