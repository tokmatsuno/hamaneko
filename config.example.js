// これを config.js という名前でコピーして、自分の値を入れてください。
// config.js は .gitignore に入っています（公開リポジトリに鍵を置かないため）。
//
// anon キーは、そもそもブラウザに配られる公開用の鍵です。
// service_role キーは絶対にここに書かないでください。

window.HAMANEKO_CONFIG = {
  supabase: {
    url: 'https://xxxxxxxxxxxx.supabase.co',
    anonKey: 'eyJhbGciOi...',
  },
};
