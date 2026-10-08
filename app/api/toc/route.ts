import { NextRequest, NextResponse } from 'next/server';

const YES24_KEY = 'yk_live_c9e876ee08c75ea31f08a30e65b33d71a904ea2ce6b8ebd5';
const YES24_HEADERS = { 'X-Api-Key': YES24_KEY };

function parseToc(tocText: string): { title: string; page: number }[] | null {
  const entries: { title: string; page: number }[] = [];
  for (const line of tocText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean)) {
    const m1 = line.match(/^(.+?)\s*[.…\s]{0,20}\s*(\d{1,4})\s*$/);
    if (m1) {
      const title = m1[1].trim();
      const page = parseInt(m1[2]);
      if (title.length >= 2 && title.length <= 80 && page >= 1 && page <= 3000)
        entries.push({ title, page });
      continue;
    }
    const m2 = line.match(/^(\d{1,4})\s+(.{2,80})$/);
    if (m2) {
      const page = parseInt(m2[1]);
      const title = m2[2].trim();
      if (page >= 1 && page <= 3000) entries.push({ title, page });
    }
  }
  if (entries.length >= 2) {
    entries.sort((a, b) => a.page - b.page);
    return entries;
  }
  return null;
}

function tocTitlesOnly(tocText: string): { title: string; page: number }[] | null {
  const lines = tocText.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  return lines.map((title, idx) => ({ title, page: idx + 1 }));
}

async function fetchToc(searchType: 'ISBN13' | 'ItemId', query: string): Promise<string | null> {
  const res = await fetch(
    `https://apis.yes24.com/v1/goods/content?searchType=${searchType}&query=${encodeURIComponent(query)}`,
    { headers: YES24_HEADERS }
  );
  const data = await res.json();
  if (!data.success) return null;
  return data.data?.data?.contents || null;
}

async function findItemId(query: string): Promise<string | null> {
  const res = await fetch(
    `https://apis.yes24.com/v1/goods/itemList?query=${encodeURIComponent(query)}&page=1&pageSize=5&category=BOOK&detail=Y`,
    { headers: YES24_HEADERS }
  );
  const data = await res.json();
  if (!data.success) return null;
  const items = data.data?.items || [];
  return items[0] ? String(items[0].itemId) : null;
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn');
  const title = req.nextUrl.searchParams.get('title');
  try {
    let tocText: string | null = null;

    // 1) ISBN13으로 직접 조회
    if (isbn) tocText = await fetchToc('ISBN13', isbn);

    // 2) ItemId로 조회 (ISBN 실패 시 or 제목으로 검색 후)
    if (!tocText) {
      const query = isbn || title || '';
      if (query) {
        const itemId = await findItemId(query);
        if (itemId) tocText = await fetchToc('ItemId', itemId);
      }
    }

    if (!tocText) return NextResponse.json({ toc: null });

    const toc = parseToc(tocText) || tocTitlesOnly(tocText);
    return NextResponse.json({ toc });
  } catch {
    return NextResponse.json({ toc: null });
  }
}
