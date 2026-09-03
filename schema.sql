-- ハマネコ会議 — みんなでひとつの板を使うための土台
--
-- Supabase の SQL Editor にまるごと貼って実行してください。
-- ログインは求めません。誰が書いたかは記録しません。

create extension if not exists pgcrypto;

/* ---------- 声 ---------- */

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null check (topic in ('shichou', 'komari', 'jiman')),
  cat_seed    text not null check (length(cat_seed) between 4 and 32),
  name        text not null check (length(name) between 1 and 16),
  ward        text not null check (length(ward) between 1 and 8),
  body        text not null check (length(body) between 1 and 240),
  nya         integer not null default 0 check (nya >= 0),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists posts_topic_time on public.posts (topic, created_at desc);

create table if not exists public.replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  cat_seed    text not null check (length(cat_seed) between 4 and 32),
  name        text not null check (length(name) between 1 and 16),
  ward        text not null check (length(ward) between 1 and 8),
  body        text not null check (length(body) between 1 and 240),
  created_at  timestamptz not null default now()
);

create index if not exists replies_post on public.replies (post_id, created_at);

/* ---------- 4つの質問の答え ---------- */
-- 個人が特定できるものは入れません。集計だけを見せます。

create table if not exists public.answers (
  id          bigserial primary key,
  ward        text,
  komari      text,
  shichou     text,
  kakawari    text,
  created_at  timestamptz not null default now()
);

/* ---------- 知らせる（通報） ---------- */

create table if not exists public.reports (
  id          bigserial primary key,
  post_id     uuid references public.posts (id) on delete cascade,
  created_at  timestamptz not null default now()
);

/* ---------- にゃー を1つ増やす／減らす ---------- */
-- 行を丸ごと更新させないために、この関数だけを外に開けます。

create or replace function public.bump_nya(p_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v integer;
begin
  if p_delta not in (-1, 1) then
    raise exception 'delta は -1 か 1 だけです';
  end if;
  update public.posts
     set nya = greatest(0, nya + p_delta)
   where id = p_id
  returning nya into v;
  return coalesce(v, 0);
end;
$$;

/* ---------- 集計の窓 ---------- */

create or replace view public.answer_tally as
select
  (select count(*) from public.answers) as "_n",
  (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
     from (select komari k, count(*) c from public.answers
            where komari is not null group by komari) s) as komari,
  (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
     from (select shichou k, count(*) c from public.answers
            where shichou is not null group by shichou) s) as shichou,
  (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
     from (select kakawari k, count(*) c from public.answers
            where kakawari is not null group by kakawari) s) as kakawari,
  (select coalesce(jsonb_object_agg(k, c), '{}'::jsonb)
     from (select ward k, count(*) c from public.answers
            where ward is not null group by ward) s) as ward;

/* ---------- 誰が何をできるか ---------- */

alter table public.posts   enable row level security;
alter table public.replies enable row level security;
alter table public.answers enable row level security;
alter table public.reports enable row level security;

-- 読む: 隠されていない声だけ
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts
  for select to anon, authenticated using (hidden = false);

drop policy if exists replies_read on public.replies;
create policy replies_read on public.replies
  for select to anon, authenticated using (true);

-- 書く: 誰でも1回ずつ。書き換えと削除は開けません。
drop policy if exists posts_write on public.posts;
create policy posts_write on public.posts
  for insert to anon, authenticated with check (hidden = false and nya = 0);

drop policy if exists replies_write on public.replies;
create policy replies_write on public.replies
  for insert to anon, authenticated with check (true);

drop policy if exists answers_write on public.answers;
create policy answers_write on public.answers
  for insert to anon, authenticated with check (true);

drop policy if exists reports_write on public.reports;
create policy reports_write on public.reports
  for insert to anon, authenticated with check (true);

-- answers は個票を読ませません。集計の窓だけを開けます。
grant select on public.answer_tally to anon, authenticated;
grant execute on function public.bump_nya(uuid, integer) to anon, authenticated;

/* ---------- 見回り用（管理者が SQL Editor で使う） ---------- */

-- 知らせが3件以上ついた声
--   select p.*, count(r.id) as reports
--     from posts p join reports r on r.post_id = p.id
--    group by p.id having count(r.id) >= 3 order by 2 desc;

-- 隠す
--   update posts set hidden = true where id = '...';

/* ---------- 注意 ---------- */
-- anon キーは公開されます。連投を止めたい場合は、Supabase の
-- Edge Function を前に置いて IP ごとの回数制限をかけるか、
-- Cloudflare Turnstile などを投稿前に挟んでください。
-- 小さく始めるなら、まずは「知らせる」と手動の見回りで足ります。
