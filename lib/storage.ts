import { supabase } from './supabase';

export interface Memo {
  date: string;
  content: string;
}

export interface PageData {
  sessions: string[];
  memos: Memo[];
}

export interface TocEntry {
  title: string;
  page: number;
}

export interface Book {
  id: string;
  title: string;
  authors: string;
  total_pages: number;
  thumbnail: string | null;
  description: string;
  toc: TocEntry[];
  pages?: Record<string, PageData>;
}

export async function getBooks(): Promise<Book[]> {
  const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function saveBook(book: Omit<Book, 'toc' | 'pages'>) {
  const { error } = await supabase.from('books').upsert({
    id: book.id,
    title: book.title,
    authors: book.authors,
    total_pages: book.total_pages,
    thumbnail: book.thumbnail,
    description: book.description,
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function deleteBook(bookId: string) {
  await supabase.from('books').delete().eq('id', bookId);
}

export async function getBookPages(bookId: string): Promise<Record<string, PageData>> {
  const { data } = await supabase
    .from('book_pages')
    .select('page_number, sessions, memos')
    .eq('book_id', bookId);
  const result: Record<string, PageData> = {};
  for (const row of data || []) {
    result[String(row.page_number)] = {
      sessions: row.sessions || [],
      memos: row.memos || [],
    };
  }
  return result;
}

export async function addSession(bookId: string, date: string, startPage: number, endPage: number) {
  const existing = await getBookPages(bookId);
  const upserts = [];
  for (let p = startPage; p <= endPage; p++) {
    const key = String(p);
    const current = existing[key] || { sessions: [], memos: [] };
    upserts.push({
      book_id: bookId,
      page_number: p,
      sessions: [...current.sessions, date],
      memos: current.memos,
    });
  }
  if (upserts.length > 0) {
    await supabase.from('book_pages').upsert(upserts, { onConflict: 'book_id,page_number' });
  }
}

export async function addMemo(bookId: string, pageNumber: number, content: string, date: string) {
  const key = String(pageNumber);
  const existing = await getBookPages(bookId);
  const current = existing[key] || { sessions: [], memos: [] };
  await supabase.from('book_pages').upsert({
    book_id: bookId,
    page_number: pageNumber,
    sessions: current.sessions,
    memos: [...current.memos, { date, content }],
  }, { onConflict: 'book_id,page_number' });
}

export async function deleteMemo(bookId: string, pageNumber: number, memoIndex: number) {
  const existing = await getBookPages(bookId);
  const current = existing[String(pageNumber)] || { sessions: [], memos: [] };
  const newMemos = current.memos.filter((_, i) => i !== memoIndex);
  await supabase.from('book_pages').upsert({
    book_id: bookId,
    page_number: pageNumber,
    sessions: current.sessions,
    memos: newMemos,
  }, { onConflict: 'book_id,page_number' });
}

export async function saveToc(bookId: string, toc: TocEntry[]) {
  await supabase.from('books').update({ toc }).eq('id', bookId);
}

export function getSessionSummary(pages: Record<string, PageData>) {
  const dateMap: Record<string, number[]> = {};
  Object.entries(pages).forEach(([pageNum, data]) => {
    (data.sessions || []).forEach(date => {
      if (!dateMap[date]) dateMap[date] = [];
      dateMap[date].push(parseInt(pageNum));
    });
  });
  return Object.entries(dateMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, nums]) => {
      nums.sort((a, b) => a - b);
      return { date, startPage: nums[0], endPage: nums[nums.length - 1], count: nums.length };
    });
}
