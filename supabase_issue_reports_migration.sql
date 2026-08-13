-- Website issue reports. Run once in the Supabase SQL editor before deployment.

create table if not exists public.issue_reports (
  id bigserial primary key,
  title text not null check (char_length(title) between 1 and 160),
  category text not null check (category in ('system', 'data', 'display', 'performance', 'other')),
  page_name text not null check (char_length(page_name) between 1 and 120),
  priority text not null default 'normal' check (priority in ('normal', 'urgent', 'blocking')),
  description text not null check (char_length(description) between 1 and 5000),
  attachment_name text not null default '',
  attachment_type text not null default '',
  attachment_data text not null default '',
  status text not null default 'received' check (status in ('received', 'investigating', 'resolved')),
  reporter_username text not null,
  reporter_fullname text not null default '',
  reporter_role text not null default '',
  assigned_to text not null default '',
  resolution_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_issue_reports_created_at on public.issue_reports (created_at desc);
create index if not exists idx_issue_reports_status on public.issue_reports (status, created_at desc);
create index if not exists idx_issue_reports_reporter on public.issue_reports (reporter_username, created_at desc);

alter table public.issue_reports enable row level security;

-- The browser uses report_server.py, which verifies the signed session and
-- accesses this table with the Supabase service-role key.
