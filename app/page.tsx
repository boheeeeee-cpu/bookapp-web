'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBooks, Book } from '@/lib/storage';

const WIN = {
  panel: {
    background: '#d4d0c8',
    border: '2px solid #000',
    boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #4a4a4a',
  } as React.CSSProperties,
  titleBar: {
    background: '#000',
    color: '#fff',
    fontFamily: '"Courier New", monospace',
    fontSize: 12,
    fontWeight: 'bold',
    padding: '3px 8px',
    userSelect: 'none' as const,
    letterSpacing: 1,
  } as React.CSSProperties,
  btn: {
    background: '#d4d0c8',
    border: '2px solid',
    borderColor: '#fff #4a4a4a #4a4a4a #fff',
    fontFamily: '"Courier New", monospace',
    fontSize: 11,
    fontWeight: 'bold',
    padding: '3px 10px',
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  btnPrimary: {
    background: '#000',
    color: '#fff',
    border: '2px solid #000',
    fontFamily: '"Courier New", monospace',
    fontSize: 11,
    fontWeight: 'bold',
    padding: '3px 10px',
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
};

const STIPPLE = {
  backgroundImage: 'radial-gradient(circle, #999 1px, transparent 1px)',
  backgroundSize: '4px 4px',
  backgroundColor: '#fff',
} as React.CSSProperties;

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => { getBooks().then(setBooks); }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Courier New", monospace', color: '#000' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>

        {/* 메인 윈도우 */}
        <div style={{ ...WIN.panel, margin: 16, marginTop: 20 }}>
          <div style={WIN.titleBar}>
            ── 내 독서 기록 ──────────────────
          </div>
          <div style={{ padding: '8px 10px 6px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #999' }}>
            <Link href="/search" style={{ ...WIN.btnPrimary, textDecoration: 'none', display: 'inline-block' }}>
              [ + 책 추가 ]
            </Link>
          </div>

          {books.length === 0 ? (
            <div style={{ ...STIPPLE, padding: 40, textAlign: 'center' }}>
              <div style={{ background: '#fff', border: '2px solid #000', padding: 16, display: 'inline-block' }}>
                <p style={{ fontSize: 11, fontWeight: 'bold', margin: 0, letterSpacing: 1 }}>[ NO BOOKS FOUND ]</p>
                <p style={{ fontSize: 10, color: '#666', margin: '6px 0 0', letterSpacing: 0.5 }}>책을 검색해서 추가하세요</p>
              </div>
            </div>
          ) : (
            <div>
              {books.map((book, idx) => (
                <Link key={book.id} href={`/book/${encodeURIComponent(book.id)}`}
                  style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', gap: 10, padding: '8px 10px',
                    borderBottom: idx < books.length - 1 ? '1px solid #999' : 'none',
                    background: '#d4d0c8',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#b8b4ac')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#d4d0c8')}
                  >
                    <div style={{
                      width: 44, height: 60, flexShrink: 0,
                      border: '2px solid #000',
                      overflow: 'hidden', background: '#fff',
                    }}>
                      {book.thumbnail
                        ? <img src={book.thumbnail} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ ...STIPPLE, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18 }}>▪</span>
                          </div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: 11, fontWeight: 'bold', margin: 0, letterSpacing: 0.5, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {book.title}
                      </p>
                      <p style={{ fontSize: 9, fontWeight: 'normal', margin: '2px 0 0', letterSpacing: 0.3 }}>{book.authors}</p>
                      <p style={{ fontSize: 9, fontWeight: 'normal', margin: '1px 0 0' }}>{book.total_pages}p</p>
                      {/* 진행 바 */}
                      <div style={{ marginTop: 4, height: 8, border: '1px solid #000', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', background: '#000' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#444', letterSpacing: 0.5 }}>▶</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 상태 바 */}
          <div style={{ background: '#a8a49c', borderTop: '1px solid #777', padding: '2px 8px', display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 9, color: '#fff', letterSpacing: 0.5 }}>{books.length} BOOKS</span>
          </div>
        </div>

      </div>
    </main>
  );
}
