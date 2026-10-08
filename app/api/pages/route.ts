import { NextRequest, NextResponse } from 'next/server';

const YES24_KEY = 'yk_live_c9e876ee08c75ea31f08a30e65b33d71a904ea2ce6b8ebd5';
const YES24_HEADERS = { 'X-Api-Key': YES24_KEY };

async function findItem(query: string): Promise<{ pages: number | null; thumbnail: string | null } | null> {
  const res = await fetch(
    `https://apis.yes24.com/v1/goods/itemList?query=${encodeURIComponent(query)}&page=1&pageSize=5&category=BOOK&detail=Y`,
    { headers: YES24_HEADERS }
  );
  const data = await res.json();
  if (!data.success) return null;
  const items = data.data?.items || [];
  const match = items.find((i: { isbn13: string; isbn10: string }) =>
    i.isbn13 === query || i.isbn10 === query
  ) || items[0];
  if (!match) return null;
  return {
    pages: match.pages || null,
    thumbnail: match.cover || null,
  };
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn');
  const title = req.nextUrl.searchParams.get('title');
  try {
    let item = isbn ? await findItem(isbn) : null;
    if (!item && title) item = await findItem(title);
    if (!item) return NextResponse.json({ pages: null, thumbnail: null });
    return NextResponse.json({ pages: item.pages, thumbnail: item.thumbnail });
  } catch {
    return NextResponse.json({ pages: null, thumbnail: null });
  }
}
