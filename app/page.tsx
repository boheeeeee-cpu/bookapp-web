'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBooks, Book } from '@/lib/storage';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => { getBooks().then(setBooks); }, []);

  const getProgress = (book: Book) => {
    if (!book.total_pages) return 0;
    // pages not loaded on home — show 0 for now
    return 0;
  };

  return (
    <main className="min-h-screen bg-[#f8f4ef]">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-[#2c1810]">내 독서 기록</h1>
          <Link href="/search" className="bg-[#8b5e3c] text-white text-sm font-semibold px-4 py-2 rounded-full">
            + 책 추가
          </Link>
        </header>

        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
            <span className="text-6xl">📖</span>
            <p className="text-lg font-semibold text-[#2c1810]">아직 등록한 책이 없어요</p>
            <p className="text-sm text-gray-400">책을 검색해서 추가해보세요</p>
          </div>
        ) : (
          <ul className="p-4 space-y-3">
            {books.map(book => (
              <li key={book.id}>
                <Link href={`/book/${encodeURIComponent(book.id)}`}
                  className="flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                  {book.thumbnail
                    ? <img src={book.thumbnail} alt={book.title} className="w-14 h-20 rounded object-cover flex-shrink-0" />
                    : <div className="w-14 h-20 rounded bg-[#f0e6d8] flex items-center justify-center flex-shrink-0 text-2xl">📚</div>}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-[#2c1810] text-sm leading-snug line-clamp-2">{book.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{book.authors}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{book.total_pages}p</p>
                    <div className="mt-2 h-1.5 bg-[#f0e6d8] rounded-full overflow-hidden">
                      <div className="h-full bg-[#8b5e3c] rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
