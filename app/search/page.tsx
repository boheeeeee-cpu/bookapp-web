'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveBook, getBooks } from '@/lib/storage';

interface KakaoDoc {
  isbn: string;
  title: string;
  authors: string[];
  thumbnail: string;
  contents: string;
  yes24Id?: number;
  pages?: number | null;
}

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
    padding: '4px 12px',
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
    padding: '4px 12px',
    cursor: 'pointer',
    letterSpacing: 0.5,
  } as React.CSSProperties,
  input: {
    background: '#fff',
    color: '#000',
    border: '2px solid',
    borderColor: '#4a4a4a #fff #fff #4a4a4a',
    fontFamily: '"Courier New", monospace',
    fontSize: 11,
    padding: '4px 8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    letterSpacing: 0.3,
  } as React.CSSProperties,
};

const STIPPLE = {
  backgroundImage: 'radial-gradient(circle, #999 1px, transparent 1px)',
  backgroundSize: '4px 4px',
  backgroundColor: '#fff',
} as React.CSSProperties;

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KakaoDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<KakaoDoc | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [myBookIds, setMyBookIds] = useState<string[]>([]);

  useEffect(() => {
    getBooks().then(books => setMyBookIds(books.map(b => b.id)));
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.documents || []);
    } catch {}
    setLoading(false);
  };

  const selectBook = async (doc: KakaoDoc) => {
    setSelected(doc);
    if (doc.pages) {
      setPageCount(doc.pages);
      setLoadingPages(false);
      return;
    }
    setPageCount(null);
    setLoadingPages(true);
    try {
      const isbn = doc.isbn.split(' ').find(s => s.replace(/-/g, '').length === 13) || doc.isbn;
      const res = await fetch(`/api/pages?isbn=${isbn}&title=${encodeURIComponent(doc.title)}`);
      const data = await res.json();
      if (data.pages) setPageCount(data.pages);
    } catch {}
    setLoadingPages(false);
  };

  const addBook = async () => {
    if (!selected) return;
    await saveBook({
      id: selected.isbn,
      title: selected.title,
      authors: selected.authors.join(', '),
      total_pages: pageCount || selected.pages || 0,
      thumbnail: selected.thumbnail || null,
      description: selected.contents || '',
    });
    router.push('/');
  };

  return (
    <main style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Courier New", monospace', color: '#000' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 40px' }}>

        <div style={{ ...WIN.panel, margin: 16, marginTop: 20 }}>
          <div style={WIN.titleBar}>
            ── 책 검색 ───────────────────────
          </div>

          {/* 검색 바 */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #999', display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => router.back()} style={{ ...WIN.btn, padding: '4px 8px', flexShrink: 0 }}>◀</button>
            <input
              style={{ ...WIN.input, flex: 1 }}
              placeholder="책 제목 입력..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
            <button onClick={search} style={{ ...WIN.btnPrimary, flexShrink: 0 }}>검색</button>
          </div>

          {/* 결과 */}
          {loading ? (
            <div style={{ ...STIPPLE, padding: 40, textAlign: 'center' }}>
              <div style={{ background: '#fff', border: '2px solid #000', padding: 12, display: 'inline-block' }}>
                <p style={{ fontSize: 10, margin: 0, letterSpacing: 1 }}>SEARCHING...</p>
              </div>
            </div>
          ) : (
            <div>
              {results.map((doc, idx) => (
                <button key={doc.isbn} onClick={() => selectBook(doc)}
                  style={{
                    display: 'flex', gap: 10, padding: '8px 10px', width: '100%',
                    background: '#d4d0c8', border: 'none', borderBottom: '1px solid #999',
                    cursor: 'pointer', textAlign: 'left', fontFamily: '"Courier New", monospace',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#b8b4ac')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#d4d0c8')}
                >
                  <div style={{ width: 40, height: 54, flexShrink: 0, border: '2px solid #000', overflow: 'hidden', background: '#fff' }}>
                    {doc.thumbnail
                      ? <img src={doc.thumbnail} alt={doc.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ ...STIPPLE, width: '100%', height: '100%' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 'bold', margin: 0, letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </p>
                    <p style={{ fontSize: 9, color: '#666', margin: '2px 0 0' }}>{doc.authors.join(', ')}</p>
                    {myBookIds.includes(doc.isbn) && (
                      <span style={{ fontSize: 9, color: '#000', background: '#d4d0c8', border: '1px solid #000', padding: '1px 4px', marginTop: 2, display: 'inline-block', letterSpacing: 0.5 }}>
                        [이미 추가됨]
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택 모달 */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
            onClick={() => setSelected(null)}>
            <div style={{ ...WIN.panel, width: '100%', maxWidth: 360 }} onClick={e => e.stopPropagation()}>
              <div style={WIN.titleBar}>── 책 추가 ──────────────────────</div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 56, height: 76, flexShrink: 0, border: '2px solid #000', overflow: 'hidden', background: '#fff' }}>
                    {selected.thumbnail
                      ? <img src={selected.thumbnail} alt={selected.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ ...STIPPLE, width: '100%', height: '100%' }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 'bold', margin: 0, letterSpacing: 0.5 }}>{selected.title}</p>
                    <p style={{ fontSize: 9, color: '#666', margin: '3px 0' }}>{selected.authors.join(', ')}</p>
                    <p style={{ fontSize: 10, fontWeight: 'bold', margin: 0, letterSpacing: 0.5 }}>
                      {loadingPages ? 'LOADING...' : pageCount ? `${pageCount}p` : 'N/A'}
                    </p>
                  </div>
                </div>
                {selected.contents && (
                  <p style={{ fontSize: 9, color: '#555', marginBottom: 14, lineHeight: 1.5, letterSpacing: 0.3,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                    {selected.contents}
                  </p>
                )}
                <button onClick={addBook} style={{ ...WIN.btnPrimary, width: '100%', marginBottom: 6, fontSize: 12, padding: '6px 0' }}>
                  [ 내 책장에 추가 ]
                </button>
                <button onClick={() => setSelected(null)} style={{ ...WIN.btn, width: '100%', fontSize: 10, padding: '4px 0' }}>
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
