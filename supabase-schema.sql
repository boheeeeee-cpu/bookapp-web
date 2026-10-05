CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  total_pages INTEGER DEFAULT 0,
  thumbnail TEXT,
  description TEXT,
  toc JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE book_pages (
  book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER,
  sessions TEXT[] DEFAULT '{}',
  memos JSONB DEFAULT '[]',
  PRIMARY KEY (book_id, page_number)
);
