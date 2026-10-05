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
}

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
    setPageCount(null);
    setLoadingPages(true);
    try {
      const isbns = doc.isbn.split(' ').map(s => s.replace(/-/g, '')).filter(Boolean);
      const isbn13 = isbns.find(i => i.length === 13) || isbns[0];
      const res = await fetch(`/api/pages?isbn=${isbn13}&title=${encodeURIComponent(doc.title)}`);
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
      total_pages: pageCount || 0,
      thumbnail: selected.thumbnail || null,
      description: selected.contents || '',
    });
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-[#f8f4ef]">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <button onClick={() => router.back()} className="text-[#8b5e3c] text-lg">←</button>
          <input
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 outline-none focus:border-[#8b5e3c]"
            placeholder="책 제목을 입력하세요"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button onClick={search} className="bg-[#8b5e3c] text-white text-sm font-semibold px-4 py-2 rounded-xl">
            검색
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center mt-20 text-[#8b5e3c]">검색 중...</div>
        ) : (
          <ul className="p-4 space-y-2">
            {results.map(doc => (
              <li key={doc.isbn}>
                <button onClick={() => selectBook(doc)}
                  className="w-full flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow text-left">
                  {doc.thumbnail
                    ? <img src={doc.thumbnail} alt={doc.title} className="w-12 h-16 rounded object-cover flex-shrink-0" />
                    : <div className="w-12 h-16 rounded bg-[#f0e6d8] flex items-center justify-center flex-shrink-0 text-xl">📚</div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2c1810] text-sm line-clamp-2">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.authors.join(', ')}</p>
                    {myBookIds.includes(doc.isbn) && (
                      <span className="text-xs text-[#8b5e3c] font-semibold mt-1 inline-block">이미 추가됨</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 선택 모달 */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setSelected(null)}>
            <div className="w-full max-w-2xl mx-auto bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center gap-3 mb-5">
                {selected.thumbnail
                  ? <img src={selected.thumbnail} alt={selected.title} className="w-20 h-28 rounded-lg object-cover shadow" />
                  : <div className="w-20 h-28 rounded-lg bg-[#f0e6d8] flex items-center justify-center text-4xl">📚</div>}
                <p className="text-lg font-bold text-[#2c1810] text-center">{selected.title}</p>
                <p className="text-sm text-gray-400">{selected.authors.join(', ')}</p>
                <p className="text-sm font-bold text-[#8b5e3c]">
                  {loadingPages ? '페이지 수 확인 중...' : pageCount ? `총 ${pageCount}페이지` : '페이지 정보 없음'}
                </p>
                {selected.contents && (
                  <p className="text-xs text-gray-500 text-center line-clamp-3">{selected.contents}</p>
                )}
              </div>
              <button onClick={addBook}
                className="w-full bg-[#8b5e3c] text-white font-bold py-3.5 rounded-xl mb-2">
                내 책장에 추가
              </button>
              <button onClick={() => setSelected(null)}
                className="w-full text-gray-400 py-2 text-sm">취소</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
