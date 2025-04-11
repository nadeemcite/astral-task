-- Create the "users" table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- Create the "user_search_activity" table
create table if not exists user_search_activity (
  id uuid primary key default gen_random_uuid(),
  search_keyword text not null,
  grade text,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Alter the existing pdf_source table to add the created_by_user_id column
alter table pdf_source
  add column if not exists created_by_user_id uuid references users(id) on delete set null;

-- Insert anonymous user if it doesn't already exist
insert into users (email)
values ('anon@anon.com')
on conflict (email) do nothing;

-- User history view, unique search results
CREATE OR REPLACE VIEW distinct_user_search_activity AS
SELECT DISTINCT ON (search_keyword, grade)
       *
FROM user_search_activity
ORDER BY search_keyword, grade, created_at DESC;