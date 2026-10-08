import { NextRequest, NextResponse } from 'next/server';

const YES24_KEY = 'yk_live_c9e876ee08c75ea31f08a30e65b33d71a904ea2ce6b8ebd5';
const YES24_HEADERS = { 'X-Api-Key': YES24_KEY };

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ documents: [] });

  const res = await fetch(
    `https://apis.yes24.com/v1/goods/itemList?query=${encodeURIComponent(q)}&page=1&pageSize=20&category=BOOK&detail=Y`,
    { headers: YES24_HEADERS }
  );
  const data = await res.json();
  if (!data.success) return NextResponse.json({ documents: [] });

  const documents = (data.data?.items || []).map((item: {
    isbn13: string; isbn10: string; itemId: number;
    title: string; author: string; cover: string; publisher: string;
    pages?: number;
    contentDetail?: { tableOfContents?: string };
  }) => ({
    isbn: item.isbn13 || item.isbn10 || String(item.itemId),
    title: item.title,
    authors: [item.author],
    thumbnail: item.cover,
    contents: item.publisher || '',
    yes24Id: item.itemId,
    pages: item.pages || null,
    toc: item.contentDetail?.tableOfContents || null,
  }));

  return NextResponse.json({ documents });
}
