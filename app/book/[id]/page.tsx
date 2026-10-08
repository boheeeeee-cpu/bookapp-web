'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBooks, getBookPages, addSession, addMemo, deleteMemo, deleteBook, saveToc, getSessionSummary, Book, PageData, TocEntry } from '@/lib/storage';

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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: 'bold',
    padding: '3px 8px',
    cursor: 'pointer',
    letterSpacing: 0.5,
    color: '#000',
  } as React.CSSProperties,
  btnPrimary: {
    background: '#000',
    color: '#fff',
    border: '2px solid #000',
    fontFamily: '"Courier New", monospace',
    fontSize: 10,
    fontWeight: 'bold',
    padding: '3px 8px',
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
  } as React.CSSProperties,
};

const STIPPLE: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #999 1px, transparent 1px)',
  backgroundSize: '4px 4px',
  backgroundColor: '#fff',
};

const ROW_H = 13;
const CELL_SIZE = 11;
const CELL_GAP = 2;

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function PageGrid({ totalPages, pages, toc, selectedPage, onSelectPage, onAddMemo }: {
  totalPages: number;
  pages: Record<string, PageData>;
  toc: TocEntry[] | null;
  selectedPage: number | null;
  onSelectPage: (p: number) => void;
  onAddMemo: (p: number) => void;
}) {
  const [expandedMemo, setExpandedMemo] = useState<number | null>(null);
  const tocStartPages = new Set((toc || []).map(e => e.page));

  return (
    <div style={{ display: 'flex', overflowX: 'auto' }}>
      {/* 목차 컬럼 */}
      {toc && toc.length > 0 && (
        <div style={{ flexShrink: 0, width: 90, marginRight: 4 }}>
          <div style={{ height: 24 }} />
          {Array.from({ length: totalPages }, (_, i) => {
            const p = i + 1;
            const entry = toc.find(e => e.page === p);
            const memoCount = pages[String(p)]?.memos?.length || 0;
            const memoExpanded = expandedMemo === p;
            return (
              <div key={p}>
                <div style={{ height: ROW_H, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                  {entry && (
                    <>
                      <span style={{ fontSize: 7, color: '#000', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: 0.3, fontFamily: '"Courier New", monospace' }}>
                        {entry.title}
                      </span>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: '#000' }} />
                    </>
                  )}
                </div>
                {memoExpanded && memoCount > 0 && (
                  <div style={{ height: memoCount * 44 }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지 그리드 */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ height: 24, display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <div style={{ width: 30 }} />
          <span style={{ fontSize: 8, fontWeight: 'bold', letterSpacing: 1, fontFamily: '"Courier New", monospace', color: '#000' }}>COUNT &rarr;</span>
        </div>

        {Array.from({ length: totalPages }, (_, i) => {
          const p = i + 1;
          const data = pages[String(p)];
          const sessionCount = data?.sessions?.length || 0;
          const memos = data?.memos || [];
          const hasMemo = memos.length > 0;
          const isSelected = selectedPage === p;
          const showLabel = p === 1 || p % 10 === 0 || p === totalPages;
          const isTocStart = tocStartPages.has(p);
          const cellCount = Math.max(5, sessionCount);
          const memoExpanded = expandedMemo === p;

          return (
            <div key={p}>
              <button
                onClick={() => onSelectPage(p)}
                style={{
                  display: 'flex', alignItems: 'center', height: ROW_H,
                  background: isSelected ? '#000' : 'transparent',
                  border: 'none', cursor: 'pointer', width: '100%',
                  borderTop: isTocStart ? '1px solid #000' : 'none',
                  padding: 0,
                }}
              >
                <span style={{
                  width: 30, textAlign: 'right', paddingRight: 3,
                  fontSize: 7, color: isSelected ? '#fff' : '#000',
                  fontFamily: '"Courier New", monospace', flexShrink: 0,
                }}>
                  {showLabel ? p : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: ROW_H }}>
                  <div style={{ display: 'flex', gap: CELL_GAP }}>
                    {Array.from({ length: cellCount }, (_, j) => (
                      <div
                        key={j}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          border: '1px solid #000',
                          flexShrink: 0,
                          ...(j < sessionCount
                            ? { background: isSelected ? '#fff' : '#000' }
                            : isSelected
                              ? { background: '#333' }
                              : STIPPLE),
                        }}
                      />
                    ))}
                  </div>

                  {/* 메모 토글 버튼 */}
                  {hasMemo && (
                    <button
                      onClick={e => { e.stopPropagation(); setExpandedMemo(memoExpanded ? null : p); }}
                      style={{
                        background: memoExpanded ? '#000' : '#fff',
                        color: memoExpanded ? '#fff' : '#000',
                        border: '1px solid #000',
                        fontFamily: '"Courier New", monospace',
                        fontSize: 7, fontWeight: 'bold',
                        padding: '0 3px', cursor: 'pointer', flexShrink: 0,
                        height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`,
                      }}
                    >
                      {memoExpanded ? '▼' : '▶'}
                    </button>
                  )}

                  {isSelected && (
                    <button
                      onClick={e => { e.stopPropagation(); onAddMemo(p); }}
                      style={{ ...WIN.btn, fontSize: 8, padding: '1px 5px', flexShrink: 0, background: '#fff', color: '#000' }}
                    >MEMO+</button>
                  )}
                </div>
              </button>

              {/* 메모 인라인 펼치기 */}
              {memoExpanded && memos.length > 0 && (
                <div style={{ marginLeft: 30, borderLeft: '2px solid #000', paddingLeft: 6 }}>
                  {memos.map((m, mi) => (
                    <div key={mi} style={{
                      padding: '4px 0',
                      borderBottom: mi < memos.length - 1 ? '1px dashed #000' : 'none',
                      minHeight: 44,
                    }}>
                      <span style={{ fontSize: 7, fontWeight: 'bold', display: 'block', letterSpacing: 0.3, fontFamily: '"Courier New", monospace', color: '#000' }}>
                        {m.date}
                      </span>
                      <span style={{ fontSize: 9, display: 'block', lineHeight: 1.5, fontFamily: '"Courier New", monospace', color: '#000', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {m.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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

  if (!book) return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace' }}>
      <div style={{ ...WIN.panel }}>
        <div style={WIN.titleBar}>── LOADING ──────────────────────</div>
        <div style={{ ...STIPPLE, padding: 30, textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 1 }}>LOADING...</span>
        </div>
      </div>
    </div>
  );

  const sessions = getSessionSummary(pages);
  const totalReadPages = Object.values(pages).filter(p => p.sessions?.length > 0).length;
  const progress = book.total_pages ? Math.round((totalReadPages / book.total_pages) * 100) : 0;
  const selectedData = selectedPage ? pages[String(selectedPage)] : null;

  return (
    <main style={{ minHeight: '100vh', background: '#fff', fontFamily: '"Courier New", monospace', color: '#000' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 60px' }}>

        {/* 헤더 */}
        <div style={{ ...WIN.panel, margin: 12, marginTop: 16 }}>
          <div style={WIN.titleBar}>
            ── {book.title.slice(0, 28)}{book.title.length > 28 ? '…' : ''} ──
          </div>

          {/* 책 정보 */}
          <div style={{ display: 'flex', gap: 10, padding: '10px 10px 8px', borderBottom: '1px solid #999' }}>
            <div style={{ width: 52, height: 72, flexShrink: 0, border: '2px solid #000', overflow: 'hidden', background: '#fff' }}>
              {book.thumbnail
                ? <img src={book.thumbnail} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ ...STIPPLE, width: '100%', height: '100%' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 'bold', margin: 0, letterSpacing: 0.3, color: '#000' }}>{book.title}</p>
              <p style={{ fontSize: 9, margin: '2px 0 0', color: '#000' }}>{book.authors}</p>
              <p style={{ fontSize: 9, margin: '1px 0 0', color: '#000' }}>총 {book.total_pages}p</p>
              <div style={{ marginTop: 6, height: 10, border: '2px solid #000', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress}%`, background: '#000', transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 9, fontWeight: 'bold', margin: '2px 0 0', letterSpacing: 0.5, color: '#000' }}>
                {totalReadPages}p READ ({progress}%)
              </p>
            </div>
          </div>

          {/* 툴바 */}
          <div style={{ padding: '6px 10px', display: 'flex', gap: 6, borderBottom: '1px solid #999' }}>
            <button onClick={() => router.back()} style={{ ...WIN.btn, padding: '3px 6px' }}>◀</button>
            <div style={{ flex: 1 }} />
            <button onClick={fetchToc} disabled={tocLoading} style={{ ...WIN.btn, opacity: tocLoading ? 0.6 : 1 }}>
              {tocLoading ? 'LOADING…' : toc ? 'REFRESH TOC' : 'LOAD TOC'}
            </button>
            <button onClick={() => setShowSessionModal(true)} style={WIN.btnPrimary}>
              + 기록
            </button>
          </div>

          {/* 페이지 그리드 라벨 */}
          <div style={{ padding: '6px 10px 2px' }}>
            <span style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: 1, color: '#000' }}>── 읽은 구간 ──</span>
          </div>

          {/* 페이지 그리드 */}
          <div style={{ padding: '0 10px 10px', overflowX: 'auto' }}>
            {book.total_pages > 0
              ? <PageGrid totalPages={book.total_pages} pages={pages} toc={toc} selectedPage={selectedPage}
                  onSelectPage={p => setSelectedPage(prev => prev === p ? null : p)}
                  onAddMemo={p => { setSelectedPage(p); setShowMemoModal(true); }} />
              : <p style={{ fontSize: 10, color: '#000', margin: 0, letterSpacing: 0.5 }}>페이지 정보가 없어요.</p>}
          </div>
        </div>

        {/* 선택된 페이지 상세 */}
        {selectedPage && (
          <div style={{ ...WIN.panel, margin: '0 12px 8px' }}>
            <div style={WIN.titleBar}>── PAGE {selectedPage} ──────────────────</div>
            <div style={{ padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, color: '#000' }}>p.{selectedPage}</span>
                <button onClick={() => setShowMemoModal(true)} style={WIN.btnPrimary}>+ MEMO</button>
              </div>
              {selectedData?.sessions?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {selectedData.sessions.map((d, i) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 'bold', border: '2px solid #000', padding: '2px 6px', background: '#000', color: '#fff', letterSpacing: 0.5 }}>{d}</span>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#000', color: '#fff', padding: '4px 8px', marginBottom: 8, display: 'inline-block' }}>
                  <span style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 }}>[ 아직 읽지 않은 페이지 ]</span>
                </div>
              )}
              {selectedData?.memos?.map((m, i) => (
                <div key={i} style={{ border: '2px solid #000', padding: 8, marginBottom: 6, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 'bold', letterSpacing: 0.3, color: '#000' }}>{m.date}</span>
                    <button onClick={() => handleDeleteMemo(selectedPage, i)}
                      style={{ ...WIN.btn, fontSize: 8, padding: '1px 4px' }}>DEL</button>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 'bold', margin: 0, lineHeight: 1.5, letterSpacing: 0.3, color: '#000' }}>{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 읽기 기록 */}
        {sessions.length > 0 && (
          <div style={{ ...WIN.panel, margin: '0 12px 8px' }}>
            <div style={WIN.titleBar}>── 읽기 기록 ─────────────────────</div>
            <div>
              {sessions.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', padding: '5px 10px',
                  borderBottom: i < sessions.length - 1 ? '1px solid #000' : 'none',
                  fontSize: 9, letterSpacing: 0.5, fontFamily: '"Courier New", monospace', color: '#000',
                }}>
                  <span style={{ width: 80, flexShrink: 0 }}>{s.date}</span>
                  <span style={{ flex: 1, fontWeight: 'bold' }}>{s.startPage} - {s.endPage}p</span>
                  <span style={{ fontWeight: 'bold' }}>{s.count}p</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 책 삭제 */}
        <div style={{ margin: '0 12px' }}>
          <button onClick={handleDeleteBook} style={{ ...WIN.btn, width: '100%', fontSize: 9, padding: '4px 0' }}>
            [책 삭제]
          </button>
        </div>
      </div>

      {/* 기록 추가 모달 */}
      {showSessionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setShowSessionModal(false)}>
          <div style={{ ...WIN.panel, width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={WIN.titleBar}>── 읽기 기록 추가 ────────────────</div>
            <div style={{ padding: 14 }}>
              <label style={{ fontSize: 9, fontWeight: 'bold', display: 'block', marginBottom: 4, letterSpacing: 0.5, color: '#000' }}>날짜</label>
              <input style={{ ...WIN.input, marginBottom: 12 }}
                value={date} onChange={e => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
              <label style={{ fontSize: 9, fontWeight: 'bold', display: 'block', marginBottom: 4, letterSpacing: 0.5, color: '#000' }}>
                읽은 페이지{book.total_pages ? ` (총 ${book.total_pages}p)` : ''}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <input style={{ ...WIN.input, flex: 1, width: 'auto' }}
                  value={startPage} onChange={e => setStartPage(e.target.value)} placeholder="시작" inputMode="numeric" />
                <span style={{ fontSize: 12, fontWeight: 'bold', color: '#000' }}>~</span>
                <input style={{ ...WIN.input, flex: 1, width: 'auto' }}
                  value={endPage} onChange={e => setEndPage(e.target.value)} placeholder="끝" inputMode="numeric" />
              </div>
              <button onClick={handleAddSession} style={{ ...WIN.btnPrimary, width: '100%', fontSize: 12, padding: '6px 0', marginBottom: 6 }}>
                [저장]
              </button>
              <button onClick={() => setShowSessionModal(false)} style={{ ...WIN.btn, width: '100%', fontSize: 10, padding: '4px 0' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 메모 모달 */}
      {showMemoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setShowMemoModal(false)}>
          <div style={{ ...WIN.panel, width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={WIN.titleBar}>── p.{selectedPage} 메모 ─────────────────</div>
            <div style={{ padding: 14 }}>
              <textarea
                style={{ ...WIN.input, height: 100, resize: 'none', marginBottom: 12, display: 'block', lineHeight: 1.5 }}
                value={memoText} onChange={e => setMemoText(e.target.value)}
                placeholder="이 페이지에서 떠오른 생각..." autoFocus />
              <button onClick={handleAddMemo} style={{ ...WIN.btnPrimary, width: '100%', fontSize: 12, padding: '6px 0', marginBottom: 6 }}>
                [저장]
              </button>
              <button onClick={() => setShowMemoModal(false)} style={{ ...WIN.btn, width: '100%', fontSize: 10, padding: '4px 0' }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
