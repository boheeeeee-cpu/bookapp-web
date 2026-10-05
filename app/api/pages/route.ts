import { NextRequest, NextResponse } from 'next/server';

const KYOBO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://www.kyobobook.co.kr',
};

async function kyoboPageCount(keyword: string): Promise<number | null> {
  const searchRes = await fetch(
    `https://search.kyobobook.co.kr/search?keyword=${encodeURIComponent(keyword)}&target=total`,
    { headers: KYOBO_HEADERS }
  );
  const html = await searchRes.text();
  const pids = [...html.matchAll(/\/detail\/(S\d+)/g)].map(m => m[1]);
  const unique = [...new Set(pids)].slice(0, 5);
  for (const pid of unique) {
    const detailRes = await fetch(`https://product.kyobobook.co.kr/detail/${pid}`, { headers: KYOBO_HEADERS });
    const detailHtml = await detailRes.text();
    const m = detailHtml.match(/쪽수<\/th>\s*<td>([0-9,]+)쪽/);
    if (m) return parseInt(m[1].replace(/,/g, ''));
  }
  return null;
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn');
  const title = req.nextUrl.searchParams.get('title');
  try {
    let pages: number | null = null;
    if (isbn) pages = await kyoboPageCount(isbn);
    if (!pages && title) pages = await kyoboPageCount(title);
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ pages: null });
  }
}
