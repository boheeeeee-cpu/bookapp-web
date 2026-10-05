import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ documents: [] });
  const res = await fetch(
    `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(q)}&size=20`,
    { headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
