-- MVP: ห้องแห่งความลับ (community posts + direct messages)
-- Run once in the Supabase SQL editor before enabling the feature in production.

create table if not exists public.community_posts (
  id bigserial primary key,
  author_username text not null,
  author_fullname text not null default '',
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_community_posts_created_at
  on public.community_posts (created_at desc);

create table if not exists public.secret_messages (
  id bigserial primary key,
  sender_username text not null,
  recipient_username text not null,
  content text not null check (char_length(content) between 1 and 4000),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint secret_messages_different_users
    check (lower(sender_username) <> lower(recipient_username))
);

create index if not exists idx_secret_messages_sender_created
  on public.secret_messages (sender_username, created_at desc);

create index if not exists idx_secret_messages_recipient_created
  on public.secret_messages (recipient_username, created_at desc);

create table if not exists public.community_read_states (
  username text primary key,
  last_read_post_id bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;
alter table public.secret_messages enable row level security;
alter table public.community_read_states enable row level security;

-- The browser never accesses these tables directly. report_server.py uses the
-- service role after verifying the signed website session token.
