'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBooks, getBookPages, addSession, addMemo, deleteMemo, deleteBook, saveToc, getSessionSummary, Book, PageData, TocEntry } from '@/lib/storage';

const ROW_H = 10;
const BLOCK_W = 16;
const BLOCK_COLORS = ['#c9a882', '#a07850', '#8b5e3c', '#4a2f1a'];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function PageGrid({ totalPages, pages, toc, selectedPage, onSelectPage }: {
  totalPages: number;
  pages: Record<string, PageData>;
  toc: TocEntry[] | null;
  selectedPage: number | null;
  onSelectPage: (p: number) => void;
}) {
  const tocStartPages = new Set((toc || []).map(e => e.page));

  return (
    <div className="flex overflow-x-auto">
      {/* 목차 컬럼 */}
      {toc && toc.length > 0 && (
        <div className="flex-shrink-0 w-24 mr-2">
          <div style={{ height: 28 }} />
          {Array.from({ length: totalPages }, (_, i) => {
            const p = i + 1;
            const entry = toc.find(e => e.page === p);
            return (
              <div key={p} style={{ height: ROW_H + 1 }} className="relative flex items-center overflow-hidden">
                {entry && (
                  <>
                    <span className="text-[7px] text-[#8b5e3c] font-semibold truncate leading-none">{entry.title}</span>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-[#d4c4b8]" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지 스트립 */}
      <div className="flex-shrink-0">
        {/* 헤더 */}
        <div style={{ height: 28 }} className="flex items-end pb-1">
          <div style={{ width: 32 }} />
          <span className="text-[9px] text-[#8b5e3c] font-semibold">횟수 →</span>
        </div>

        {Array.from({ length: totalPages }, (_, i) => {
          const p = i + 1;
          const data = pages[String(p)];
          const sessionCount = data?.sessions?.length || 0;
          const hasMemo = (data?.memos?.length || 0) > 0;
          const isSelected = selectedPage === p;
          const showLabel = p === 1 || p % 10 === 0 || p === totalPages;
          const isTocStart = tocStartPages.has(p);
          return (
            <button
              key={p}
              onClick={() => onSelectPage(p)}
              className={`flex items-center ${isSelected ? 'bg-[#8b5e3c]/10 rounded' : ''} ${isTocStart ? 'border-t border-[#e0d4c8]' : ''}`}
              style={{ height: ROW_H + 1 }}
            >
              <span className="text-right pr-1 text-[8px] text-gray-300 flex-shrink-0" style={{ width: 32 }}>
                {showLabel ? p : ''}
              </span>
              <div className="flex items-center" style={{ gap: 2 }}>
                {sessionCount === 0 ? (
                  <div style={{ width: 36, height: 2, backgroundColor: '#ede6df', borderRadius: 1 }} />
                ) : (
                  Array.from({ length: sessionCount }, (_, si) => (
                    <div
                      key={si}
                      style={{
                        width: BLOCK_W,
                        height: ROW_H - 2,
                        backgroundColor: BLOCK_COLORS[Math.min(si, 3)],
                        borderRadius: 2,
                      }}
                    />
                  ))
                )}
                {hasMemo && (
                  <div style={{ width: 4, height: ROW_H - 2, backgroundColor: '#f87171', borderRadius: 2, marginLeft: 3 }} />
                )}
              </div>
            </button>
          );
        })}

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1">
            <div style={{ width: 28, height: 2, backgroundColor: '#ede6df', borderRadius: 1 }} />
            <span className="text-[9px] text-gray-400">안 읽음</span>
          </div>
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-1">
              <div className="flex" style={{ gap: 2 }}>
                {Array.from({ length: n }, (_, si) => (
                  <div key={si} style={{ width: 8, height: 8, backgroundColor: BLOCK_COLORS[si], borderRadius: 1 }} />
                ))}
              </div>
              <span className="text-[9px] text-gray-400">{n}회{n === 3 ? '+' : ''}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="flex items-center" style={{ gap: 2 }}>
              <div style={{ width: 8, height: 8, backgroundColor: BLOCK_COLORS[0], borderRadius: 1 }} />
              <div style={{ width: 4, height: 8, backgroundColor: '#f87171', borderRadius: 1 }} />
            </div>
            <span className="text-[9px] text-gray-400">메모</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const bookId = decodeURIComponent(id);

  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Record<string, PageData>>({});
  const [toc, setToc] = useState<TocEntry[] | null>(null);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [date, setDate] = useState(getTodayStr());
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [memoText, setMemoText] = useState('');
  const [tocLoading, setTocLoading] = useState(false);

  const refresh = useCallback(async () => {
    const books = await getBooks();
    const found = books.find(b => b.id === bookId);
    if (found) {
      setBook(found);
      if (found.toc?.length) setToc(found.toc);
    }
    const p = await getBookPages(bookId);
    setPages(p);
  }, [bookId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAddSession = async () => {
    const sp = parseInt(startPage), ep = parseInt(endPage);
    if (!sp || !ep || sp < 1 || ep < sp) return alert('페이지 범위를 확인해주세요.');
    if (book?.total_pages && ep > book.total_pages) return alert(`총 ${book.total_pages}페이지를 초과했어요.`);
    await addSession(bookId, date, sp, ep);
    await refresh();
    setShowSessionModal(false);
    setStartPage(''); setEndPage(''); setDate(getTodayStr());
  };

  const handleAddMemo = async () => {
    if (!memoText.trim() || !selectedPage) return;
    await addMemo(bookId, selectedPage, memoText.trim(), getTodayStr());
    await refresh();
    setShowMemoModal(false);
    setMemoText('');
  };

  const handleDeleteMemo = async (pageNum: number, idx: number) => {
    if (!confirm('이 메모를 삭제할까요?')) return;
    await deleteMemo(bookId, pageNum, idx);
    await refresh();
  };

  const fetchToc = async () => {
    if (!book) return;
    setTocLoading(true);
    try {
      const isbns = book.id.split(' ').map(s => s.replace(/-/g, '')).filter(Boolean);
      const isbn13 = isbns.find(i => i.length === 13) || isbns[0];
      const res = await fetch(`/api/toc?isbn=${isbn13}&title=${encodeURIComponent(book.title)}`);
      const data = await res.json();
      if (data.toc?.length) {
        await saveToc(bookId, data.toc);
        setToc(data.toc);
        alert(`목차 ${data.toc.length}개 항목을 불러왔어요.`);
      } else {
        alert('이 책의 목차를 찾지 못했어요.');
      }
    } catch { alert('목차를 불러오는 중 문제가 생겼어요.'); }
    setTocLoading(false);
  };

  const handleDeleteBook = async () => {
    if (!confirm('책을 삭제할까요?')) return;
    await deleteBook(bookId);
    router.push('/');
  };

  if (!book) return <div className="min-h-screen bg-[#f8f4ef] flex items-center justify-center text-gray-400">불러오는 중...</div>;

  const sessions = getSessionSummary(pages);
  const totalReadPages = Object.values(pages).filter(p => p.sessions?.length > 0).length;
  const progress = book.total_pages ? Math.round((totalReadPages / book.total_pages) * 100) : 0;
  const selectedData = selectedPage ? pages[String(selectedPage)] : null;

  return (
    <main className="min-h-screen bg-[#f8f4ef]">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <button onClick={() => router.back()} className="text-[#8b5e3c] text-lg">←</button>
          <span className="font-bold text-[#2c1810] flex-1 truncate">{book.title}</span>
        </header>

        {/* 책 정보 */}
        <div className="flex gap-4 bg-white p-4 border-b border-gray-100">
          {book.thumbnail
            ? <img src={book.thumbnail} alt={book.title} className="w-16 h-24 rounded-lg object-cover flex-shrink-0 shadow" />
            : <div className="w-16 h-24 rounded-lg bg-[#f0e6d8] flex items-center justify-center text-3xl flex-shrink-0">📚</div>}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <p className="font-bold text-[#2c1810] text-base line-clamp-2">{book.title}</p>
            <p className="text-sm text-gray-400 mt-0.5">{book.authors}</p>
            <p className="text-xs text-gray-300 mt-0.5">총 {book.total_pages}p</p>
            <div className="mt-2 h-1.5 bg-[#f0e6d8] rounded-full overflow-hidden">
              <div className="h-full bg-[#8b5e3c] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-[#8b5e3c] font-semibold mt-1">{totalReadPages}p 읽음 ({progress}%)</p>
          </div>
        </div>

        {/* 페이지 그리드 */}
        <div className="bg-white mt-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[#2c1810] text-sm">읽은 구간</span>
            <div className="flex gap-2">
              <button onClick={fetchToc} disabled={tocLoading}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full text-white ${toc ? 'bg-[#a07850]' : 'bg-gray-400'}`}>
                {tocLoading ? '로딩...' : toc ? '목차 갱신' : '목차 불러오기'}
              </button>
              <button onClick={() => setShowSessionModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#8b5e3c] text-white">
                + 기록 추가
              </button>
            </div>
          </div>
          {book.total_pages > 0
            ? <PageGrid totalPages={book.total_pages} pages={pages} toc={toc} selectedPage={selectedPage}
                onSelectPage={p => setSelectedPage(prev => prev === p ? null : p)} />
            : <p className="text-sm text-gray-400">페이지 정보가 없어요. 책을 다시 추가해보세요.</p>}
        </div>

        {/* 선택된 페이지 상세 */}
        {selectedPage && (
          <div className="bg-white mt-2 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-[#2c1810]">{selectedPage}페이지</span>
              <button onClick={() => setShowMemoModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#8b5e3c] text-white">+ 메모</button>
            </div>
            {selectedData?.sessions?.length ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedData.sessions.map((d, i) => (
                  <span key={i} className="text-xs bg-[#f0e6d8] text-[#8b5e3c] font-semibold px-3 py-1 rounded-full">{d}</span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-300 mb-3">아직 읽지 않은 페이지예요</p>}
            {selectedData?.memos?.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">{m.date}</span>
                  <button onClick={() => handleDeleteMemo(selectedPage, i)} className="text-xs text-red-400">삭제</button>
                </div>
                <p className="text-sm text-gray-700">{m.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* 읽기 기록 */}
        {sessions.length > 0 && (
          <div className="bg-white mt-2 p-4">
            <p className="font-bold text-[#2c1810] text-sm mb-3">읽기 기록</p>
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-400 w-24">{s.date}</span>
                <span className="text-sm font-semibold text-[#2c1810] flex-1">{s.startPage} - {s.endPage}p</span>
                <span className="text-xs text-[#8b5e3c]">{s.count}페이지</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleDeleteBook} className="w-full py-4 text-red-400 text-sm mt-2">책 삭제</button>
      </div>

      {/* 기록 추가 모달 */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSessionModal(false)}>
          <div className="w-full max-w-2xl mx-auto bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <p className="text-center font-bold text-[#2c1810] text-lg mb-5">읽기 기록 추가</p>
            <label className="text-xs text-gray-400 mb-1 block">날짜</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-[#8b5e3c]"
              value={date} onChange={e => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
            <label className="text-xs text-gray-400 mb-1 block">읽은 페이지{book.total_pages ? ` (총 ${book.total_pages}p)` : ''}</label>
            <div className="flex items-center gap-2 mb-5">
              <input className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                value={startPage} onChange={e => setStartPage(e.target.value)} placeholder="시작" inputMode="numeric" />
              <span className="text-gray-400">~</span>
              <input className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8b5e3c]"
                value={endPage} onChange={e => setEndPage(e.target.value)} placeholder="끝" inputMode="numeric" />
            </div>
            <button onClick={handleAddSession} className="w-full bg-[#8b5e3c] text-white font-bold py-3.5 rounded-xl mb-2">저장</button>
            <button onClick={() => setShowSessionModal(false)} className="w-full text-gray-400 py-2 text-sm">취소</button>
          </div>
        </div>
      )}

      {/* 메모 모달 */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowMemoModal(false)}>
          <div className="w-full max-w-2xl mx-auto bg-white rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <p className="text-center font-bold text-[#2c1810] text-lg mb-5">{selectedPage}페이지 메모</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-5 outline-none focus:border-[#8b5e3c] h-32 resize-none"
              value={memoText} onChange={e => setMemoText(e.target.value)}
              placeholder="이 페이지에서 떠오른 생각을 적어보세요" autoFocus />
            <button onClick={handleAddMemo} className="w-full bg-[#8b5e3c] text-white font-bold py-3.5 rounded-xl mb-2">저장</button>
            <button onClick={() => setShowMemoModal(false)} className="w-full text-gray-400 py-2 text-sm">취소</button>
          </div>
        </div>
      )}
    </main>
  );
}
