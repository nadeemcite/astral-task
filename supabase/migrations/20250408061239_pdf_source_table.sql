-- Enable the "vector" extension in the "extensions" schema
create extension if not exists vector
  with schema extensions;

-- Create pdf_source table with unique url
create table if not exists pdf_source (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  file_path text,
  file_extract_path text,
  created_at timestamptz default now()
);

-- Add index on url column (optional since unique already creates one)
create index if not exists idx_pdf_source_url on pdf_source(url);

-- Create pdf_page table
create table if not exists pdf_page (
  id uuid primary key default gen_random_uuid(),
  pdf_source_id uuid references pdf_source(id) on delete cascade,
  content text not null,
  page_number int not null,
  embeddings vector(1536)
);

-- matching function
create or replace function match_pdf_pages(query_embedding vector, pdf_source uuid)
returns table(page_number int, similarity float) as $$
  select page_number,
         1 - (embeddings <=> query_embedding) as similarity
  from pdf_page
  where pdf_source_id = pdf_source
  order by similarity desc;
$$ language sql stable;