import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookReviews from './BookReviews'; // 👉 1. Thêm dòng import này

export default function ReaderView({ bookId, onBack, currentUser, darkMode }) {
  const [book, setBook] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [isMarkedRead, setIsMarkedRead] = useState(false);
  const [chapterProgressMap, setChapterProgressMap] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  useEffect(() => {
    if (!bookId) return;

    let isMounted = true;

    const initReaderData = async () => {
      try {
        const bookReq = axios.get(`https://librify-backend.onrender.com/api/books/${bookId}`);
        const requests = [bookReq];

        if (currentUser?._id) {
          requests.push(
            axios.get(`https://librify-backend.onrender.com/api/reader/progress/${currentUser._id}/${bookId}`),
            axios.get(`https://librify-backend.onrender.com/api/reader/check-completed/${currentUser._id}/${bookId}`)
          );
        }

        const [bookRes, progRes, completedRes] = await Promise.all(requests);

        if (!isMounted) return;

        let totalChapsCount = 1;
        if (bookRes.data?.success) {
          setBook(bookRes.data.data);
          totalChapsCount = bookRes.data.data.chapters?.length || 1;
        }

        let initialChapIndex = 0;
        let initialPage = 1;

        if (progRes?.data?.success && progRes.data.data) {
          const prog = progRes.data.data;
          const rawChap = prog.chapter !== undefined ? prog.chapter : prog.chapterIndex;
          let parsedChap = parseInt(rawChap, 10);
          const parsedPage = parseInt(prog.page || prog.last_page, 10);

          if (!isNaN(parsedChap)) {
            if (parsedChap >= 1) {
              initialChapIndex = Math.min(parsedChap - 1, totalChapsCount - 1);
            } else {
              initialChapIndex = 0;
            }
          }

          if (!isNaN(parsedPage) && parsedPage > 0) {
            initialPage = parsedPage;
          }
        }

        setActiveChapterIndex(initialChapIndex);
        setCurrentPage(initialPage);
        setChapterProgressMap({
          [initialChapIndex]: initialPage,
        });

        if (completedRes?.data?.success) {
          setIsMarkedRead(Boolean(completedRes.data.isCompleted));
        }
      } catch (err) {
        console.error('Lỗi khởi tạo màn hình đọc:', err);
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

    initReaderData();

    return () => {
      isMounted = false;
    };
  }, [bookId, currentUser]);

  const currentChapter = book?.chapters?.[activeChapterIndex] || {
    title: `Chương ${activeChapterIndex + 1}`,
  };

  const rawPages = currentChapter?.total_pages;
  const totalPages = (Number(rawPages) > 1)
    ? Number(rawPages)
    : 10;

  const readPercent = Math.min(100, Math.round(((currentPage || 1) / totalPages) * 100));

  const syncProgress = (pageVal, chapterIdx) => {
    if (!isReady || !currentUser?._id || !bookId) return;

    const actualChapterNumber = Number(chapterIdx) + 1;

    axios.post('https://librify-backend.onrender.com/api/reader/progress', {
      userId: currentUser._id,
      bookId,
      page: pageVal,
      last_page: pageVal,
      chapter: actualChapterNumber,
      chapterIndex: actualChapterNumber,
    }).catch((err) => console.error('Lỗi syncProgress:', err));
  };

  const handlePageChange = (newPage) => {
    const validPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(validPage);

    setChapterProgressMap((prev) => ({
      ...prev,
      [activeChapterIndex]: validPage,
    }));

    syncProgress(validPage, activeChapterIndex);
  };
  const handleSummarize = async () => {
    if (!book?._id) return;
    try {
      setIsSummarizing(true);
      const res = await fetch(`https://librify-backend.onrender.com/api/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book._id })
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setSummaryText(data.summary);
        setSummaryModalOpen(true);
      } else {
        setSummaryText(data.message || 'Không thể tạo tóm tắt lúc này. Vui lòng thử lại sau.');
        setSummaryModalOpen(true);
      }
    } catch (error) {
      setSummaryText('Đã có lỗi xảy ra khi kết nối tới máy chủ AI.');
      setSummaryModalOpen(true);
    } finally {
      setIsSummarizing(false);
    }
  };
  const handleSelectChapter = (chapIdx) => {
    const savedPageForChapter = chapterProgressMap[chapIdx] || 1;
    setActiveChapterIndex(chapIdx);
    setCurrentPage(savedPageForChapter);
    syncProgress(savedPageForChapter, chapIdx);
  };

  const handleToggleMarkRead = async () => {
    if (!currentUser?._id || !bookId) return;
    try {
      const res = await axios.post('https://librify-backend.onrender.com/api/reader/toggle-completed', {
        userId: currentUser._id,
        bookId,
      });
      if (res.data?.success) {
        setIsMarkedRead(res.data.isCompleted);
      }
    } catch (err) {
      console.error('Lỗi lưu trạng thái hoàn thành:', err);
    }
  };

  const renderPageContent = () => {
    const chapterName = currentChapter.title || `Chương ${activeChapterIndex + 1}`;
    const bookTitle = book?.title || 'Tác phẩm';
    const contentText = currentChapter.content || currentChapter.description || '';

    // 1. Phân chia nội dung theo trang
    let pages = [];
    if (/---+/.test(contentText)) {
      pages = contentText.split(/\s*---+[\s\r\n]*/).map((p) => p.trim()).filter(Boolean);
    } else if (contentText.trim() !== '') {
      // Tách an toàn khoảng 1500 ký tự nhưng không làm đứt đôi từ
      const maxChars = 1500;
      let text = contentText.trim();
      while (text.length > 0) {
        if (text.length <= maxChars) {
          pages.push(text);
          break;
        }
        let breakIndex = text.lastIndexOf(' ', maxChars);
        if (breakIndex === -1 || breakIndex < maxChars * 0.7) breakIndex = maxChars;
        pages.push(text.slice(0, breakIndex).trim());
        text = text.slice(breakIndex).trim();
      }
    }

    // 2. Xác định nội dung cho trang hiện tại
    const pageIndex = Math.max(0, currentPage - 1);
    let currentPageText = '';
    let isPageEmpty = false;

    if (pages.length > 0) {
      if (pageIndex < pages.length) {
        currentPageText = pages[pageIndex];
      } else {
        isPageEmpty = true;
      }
    }

    return (
      <div style={{ lineHeight: '1.9', fontSize: `${fontSize}px`, color: darkMode ? '#cbd5e1' : '#334155' }}>
        {/* Header trang đọc */}
        <div style={{
          borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          paddingBottom: '12px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {bookTitle}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {chapterName}
          </span>
        </div>

        {/* ĐÃ XÓA BỎ DÒNG TIÊU ĐỀ <h3> Mục X.Y LẶP LẠI Ở ĐÂY */}

        {/* Nội dung thực tế của trang đọc */}
        <div style={{
          fontSize: `${fontSize}px`,
          lineHeight: '1.9',
          textAlign: 'justify',
          whiteSpace: 'pre-line',
          color: darkMode ? '#e2e8f0' : '#1e293b'
        }}>
          {currentPageText ? (
            currentPageText
          ) : isPageEmpty ? (
            <div style={{
              padding: '36px 20px',
              borderRadius: '12px',
              background: darkMode ? '#1e293b' : '#f8fafc',
              border: `1px dashed ${darkMode ? '#334155' : '#cbd5e1'}`,
              textAlign: 'center',
              color: darkMode ? '#94a3b8' : '#64748b',
              fontStyle: 'italic',
              marginTop: '16px'
            }}>
              📄 Nội dung của chương này đã kết thúc ở trang {pages.length}. Các trang tiếp theo đang được tác giả biên soạn thêm.
            </div>
          ) : (
            <div style={{
              padding: '36px 20px',
              borderRadius: '12px',
              background: darkMode ? '#1e293b' : '#f8fafc',
              border: `1px dashed ${darkMode ? '#334155' : '#cbd5e1'}`,
              textAlign: 'center',
              color: darkMode ? '#94a3b8' : '#64748b',
              fontStyle: 'italic',
              marginTop: '16px'
            }}>
              📖 Nội dung của chương này đang được cập nhật hoặc chưa có dữ liệu.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isReady || !book) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 0', color: darkMode ? '#cbd5e1' : '#64748b' }}>
        <p style={{ fontSize: '15px', fontWeight: '600' }}>Đang nạp tác phẩm và khôi phục tiến độ đọc...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Thanh công cụ phía trên */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{
            background: darkMode ? '#1e293b' : '#ffffff',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            color: darkMode ? '#f8fafc' : '#0f172a',
            padding: '9px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          ← Quay lại thư viện
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '10px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, padding: '4px 10px', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Cỡ chữ:</span>
            <button onClick={() => setFontSize((s) => Math.max(13, s - 1))} style={{ background: 'none', border: 'none', color: darkMode ? '#fff' : '#000', cursor: 'pointer', fontWeight: 'bold' }}>A-</button>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{fontSize}px</span>
            <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} style={{ background: 'none', border: 'none', color: darkMode ? '#fff' : '#000', cursor: 'pointer', fontWeight: 'bold' }}>A+</button>
          </div>
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-sm hover:opacity-90 transition active:scale-95 disabled:opacity-50"
          >
            {isSummarizing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Đang tóm tắt...
              </>
            ) : (
              <>
                <span>✨</span> Tóm tắt sách
              </>
            )}
          </button>
          <button
            onClick={handleToggleMarkRead}
            style={{
              background: isMarkedRead ? '#10b981' : (darkMode ? '#1e293b' : '#ffffff'),
              border: `1px solid ${isMarkedRead ? '#10b981' : (darkMode ? '#334155' : '#e2e8f0')}`,
              color: isMarkedRead ? '#fff' : (darkMode ? '#f8fafc' : '#475569'),
              padding: '9px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-check"></i>
            {isMarkedRead ? 'Đã hoàn thành' : 'Đánh dấu đã đọc'}
          </button>
        </div>
      </div>

      {/* Khung đọc sách 2 cột */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Cột trái: Mục lục */}
        <div style={{
          background: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          height: 'fit-content'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: darkMode ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-list-ul" style={{ color: '#6366f1' }}></i> MỤC LỤC TÁC PHẨM
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(book?.chapters && book.chapters.length > 0 ? book.chapters : [{ title: 'Chương 1' }]).map((chap, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectChapter(idx)}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeChapterIndex === idx ? '700' : '500',
                  background: activeChapterIndex === idx ? '#6366f1' : (darkMode ? 'transparent' : '#f8fafc'),
                  color: activeChapterIndex === idx ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {chap.title || `Chương ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        {/* Cột phải: Khung nội dung toàn văn + Phần đánh giá */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '36px 40px',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '560px',
            boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: darkMode ? '#f8fafc' : '#0f172a' }}>
                  {currentChapter.title}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: readPercent === 100 ? '#10b981' : '#6366f1',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '8px',
                    }}>
                      {readPercent}%
                    </span>

                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      background: darkMode ? '#334155' : '#f1f5f9',
                      borderRadius: '8px',
                      color: darkMode ? '#cbd5e1' : '#475569'
                    }}>
                      Trang {currentPage} / {totalPages}
                    </span>
                  </div>

                  <div style={{ width: '110px', height: '4px', background: darkMode ? '#334155' : '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${readPercent}%`, height: '100%', background: readPercent === 100 ? '#10b981' : '#6366f1', transition: 'width 0.25s ease' }}></div>
                  </div>
                </div>
              </div>

              {renderPageContent()}
            </div>

            {/* Thanh chuyển trang */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '24px',
              marginTop: '32px',
              borderTop: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 10)}
                disabled={currentPage <= 1}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  color: darkMode ? '#cbd5e1' : '#475569',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: currentPage <= 1 ? 0.4 : 1,
                }}
              >
                « -10 Trang
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  color: darkMode ? '#cbd5e1' : '#475569',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: currentPage <= 1 ? 0.4 : 1,
                }}
              >
                ‹ Trang trước
              </button>

              <span style={{ fontSize: '14px', fontWeight: '700', margin: '0 8px', color: darkMode ? '#f8fafc' : '#0f172a' }}>
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#6366f1',
                  color: '#ffffff',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  opacity: currentPage >= totalPages ? 0.4 : 1,
                }}
              >
                Trang tiếp ›
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 10)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  color: darkMode ? '#cbd5e1' : '#475569',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: currentPage >= totalPages ? 0.4 : 1,
                }}
              >
                +10 Trang »
              </button>
            </div>
          </div>

          {/* 👉 2. KHU VỰC ĐÁNH GIÁ & BÌNH LUẬN NẰM NGAY BÊN DƯỚI NỘI DUNG ĐỌC */}
          <BookReviews
            bookId={bookId}
            currentUser={currentUser}
            darkMode={darkMode}
          />
          {/* MODAL HIỂN THỊ TÓM TẮT AI */}
          {summaryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-500/20">
                      ✨
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                        Tóm Tắt Tác Phẩm AI
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {book?.title || 'Tác phẩm'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSummaryModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* Nội dung tóm tắt */}
                <div className="p-6 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 font-sans whitespace-pre-line">
                  {summaryText.replace(/\*\*/g, '')}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Được tạo bởi Gemini AI
                  </span>
                  <button
                    onClick={() => setSummaryModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition active:scale-95 shadow-sm"
                  >
                    Đóng
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}