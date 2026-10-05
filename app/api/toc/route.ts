import { NextRequest, NextResponse } from 'next/server';

const KYOBO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  'Referer': 'https://www.kyobobook.co.kr',
};

async function kyoboToc(keyword: string) {
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

    let tocText = '';
    const idx = detailHtml.indexOf('목차');
    if (idx > -1) tocText = detailHtml.slice(idx, idx + 8000);
    if (!tocText) continue;

    const plain = tocText
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n').trim();

    const entries: { title: string; page: number }[] = [];
    for (const line of plain.split('\n').map(l => l.trim()).filter(Boolean)) {
      const m1 = line.match(/^(.+?)\s*[.…\s]{0,20}\s*(\d{1,4})\s*$/);
      if (m1) {
        const title = m1[1].trim();
        const page = parseInt(m1[2]);
        if (title.length >= 2 && title.length <= 60 && page >= 1 && page <= 2000)
          entries.push({ title, page });
        continue;
      }
      const m2 = line.match(/^(\d{1,4})\s+(.{2,60})$/);
      if (m2) {
        const page = parseInt(m2[1]);
        const title = m2[2].trim();
        if (page >= 1 && page <= 2000) entries.push({ title, page });
      }
    }
    if (entries.length >= 2) {
      entries.sort((a, b) => a.page - b.page);
      return entries;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn');
  const title = req.nextUrl.searchParams.get('title');
  try {
    let toc = null;
    if (isbn) toc = await kyoboToc(isbn);
    if (!toc && title) toc = await kyoboToc(title);
    return NextResponse.json({ toc });
  } catch {
    return NextResponse.json({ toc: null });
  }
}
