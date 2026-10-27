import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookReviews from './BookReviews';

export default function ReaderView({ bookId, onBack, currentUser, darkMode }) {
  const [book, setBook] = useState(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [isMarkedRead, setIsMarkedRead] = useState(false);
  const [chapterProgressMap, setChapterProgressMap] = useState({});
  const [isReady, setIsReady] = useState(false);

  // States quản lý Popup tóm tắt AI
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
  const totalPages = Number(rawPages) > 1 ? Number(rawPages) : 10;
  const readPercent = Math.min(100, Math.round(((currentPage || 1) / totalPages) * 100));

  const syncProgress = (pageVal, chapterIdx) => {
    if (!isReady || !currentUser?._id || !bookId) return;

    const actualChapterNumber = Number(chapterIdx) + 1;

    axios
      .post('https://librify-backend.onrender.com/api/reader/progress', {
        userId: currentUser._id,
        bookId,
        page: pageVal,
        last_page: pageVal,
        chapter: actualChapterNumber,
        chapterIndex: actualChapterNumber,
      })
      .catch((err) => console.error('Lỗi syncProgress:', err));
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

  // Hàm gọi API Tóm Tắt Sách bằng AI
  const handleSummarize = async () => {
    if (!book?._id) return;
    try {
      setIsSummarizing(true);
      const res = await fetch(`https://librify-backend.onrender.com/api/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book._id }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setSummaryText(data.summary);
        setSummaryModalOpen(true);
      } else {
        setSummaryText(data.message || 'Không thể tạo tóm tắt lúc này. Vui lòng thử lại sau ít phút.');
        setSummaryModalOpen(true);
      }
    } catch (error) {
      setSummaryText('Đã có sự cố khi kết nối tới dịch vụ AI của hệ thống.');
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

    // Phân chia nội dung theo trang
    let pages = [];
    if (/---+/.test(contentText)) {
      pages = contentText.split(/\s*---+[\s\r\n]*/).map((p) => p.trim()).filter(Boolean);
    } else if (contentText.trim() !== '') {
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
        <div
          style={{
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            paddingBottom: '12px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#6366f1',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {bookTitle}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{chapterName}</span>
        </div>

        {/* Nội dung trang sách */}
        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: '1.9',
            textAlign: 'justify',
            whiteSpace: 'pre-line',
            color: darkMode ? '#e2e8f0' : '#1e293b',
          }}
        >
          {currentPageText ? (
            currentPageText
          ) : isPageEmpty ? (
            <div
              style={{
                padding: '36px 20px',
                borderRadius: '12px',
                background: darkMode ? '#1e293b' : '#f8fafc',
                border: `1px dashed ${darkMode ? '#334155' : '#cbd5e1'}`,
                textAlign: 'center',
                color: darkMode ? '#94a3b8' : '#64748b',
                fontStyle: 'italic',
                marginTop: '16px',
              }}
            >
              📄 Nội dung của chương này đã kết thúc ở trang {pages.length}. Các trang tiếp theo đang được tác giả biên soạn thêm.
            </div>
          ) : (
            <div
              style={{
                padding: '36px 20px',
                borderRadius: '12px',
                background: darkMode ? '#1e293b' : '#f8fafc',
                border: `1px dashed ${darkMode ? '#334155' : '#cbd5e1'}`,
                textAlign: 'center',
                color: darkMode ? '#94a3b8' : '#64748b',
                fontStyle: 'italic',
                marginTop: '16px',
              }}
            >
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Tùy chỉnh cỡ chữ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: darkMode ? '#1e293b' : '#ffffff',
              borderRadius: '10px',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              padding: '4px 10px',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Cỡ chữ:</span>
            <button
              onClick={() => setFontSize((s) => Math.max(13, s - 1))}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#fff' : '#000',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              A-
            </button>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#fff' : '#000',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              A+
            </button>
          </div>

          {/* Nút gọi AI Tóm tắt sách */}
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            style={{
              background: isSummarizing
                ? '#94a3b8'
                : 'linear-gradient(135deg, #f59e0b 0%, #6366f1 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '10px',
              cursor: isSummarizing ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
              transition: 'all 0.2s',
            }}
          >
            {isSummarizing ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                ></span>
                <span>Đang tóm tắt...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Tóm tắt sách</span>
              </>
            )}
          </button>

          {/* Đánh dấu đã đọc */}
          <button
            onClick={handleToggleMarkRead}
            style={{
              background: isMarkedRead ? '#10b981' : darkMode ? '#1e293b' : '#ffffff',
              border: `1px solid ${isMarkedRead ? '#10b981' : darkMode ? '#334155' : '#e2e8f0'}`,
              color: isMarkedRead ? '#fff' : darkMode ? '#f8fafc' : '#475569',
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
        <div
          style={{
            background: darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            height: 'fit-content',
          }}
        >
          <h4
            style={{
              margin: '0 0 16px 0',
              fontSize: '15px',
              fontWeight: '800',
              color: darkMode ? '#f8fafc' : '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-list-ul" style={{ color: '#6366f1' }}></i> MỤC LỤC TÁC PHẨM
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(book?.chapters && book.chapters.length > 0 ? book.chapters : [{ title: 'Chương 1' }]).map(
              (chap, idx) => (
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
                    background: activeChapterIndex === idx ? '#6366f1' : darkMode ? 'transparent' : '#f8fafc',
                    color: activeChapterIndex === idx ? '#ffffff' : darkMode ? '#94a3b8' : '#475569',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {chap.title || `Chương ${idx + 1}`}
                </button>
              )
            )}
          </div>
        </div>

        {/* Cột phải: Khung nội dung toàn văn + Phần đánh giá */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              background: darkMode ? '#1e293b' : '#ffffff',
              borderRadius: '16px',
              padding: '36px 40px',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '560px',
              boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '800',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                  }}
                >
                  {currentChapter.title}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: readPercent === 100 ? '#10b981' : '#6366f1',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      {readPercent}%
                    </span>

                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '3px 10px',
                        background: darkMode ? '#334155' : '#f1f5f9',
                        borderRadius: '8px',
                        color: darkMode ? '#cbd5e1' : '#475569',
                      }}
                    >
                      Trang {currentPage} / {totalPages}
                    </span>
                  </div>

                  <div
                    style={{
                      width: '110px',
                      height: '4px',
                      background: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${readPercent}%`,
                        height: '100%',
                        background: readPercent === 100 ? '#10b981' : '#6366f1',
                        transition: 'width 0.25s ease',
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {renderPageContent()}
            </div>

            {/* Thanh chuyển trang */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '24px',
                marginTop: '32px',
                borderTop: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
              }}
            >
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

              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  margin: '0 8px',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                }}
              >
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

          {/* Khu vực đánh giá & bình luận */}
          <BookReviews bookId={bookId} currentUser={currentUser} darkMode={darkMode} />
        </div>
      </div>

      {/* POPUP MODAL TÓM TẮT TÁC PHẨM BẰNG AI */}
      {summaryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            padding: '16px',
          }}
          onClick={() => setSummaryModalOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '680px',
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Popup */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: `1px solid ${darkMode ? '#1e293b' : '#f1f5f9'}`,
                background: darkMode
                  ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)'
                  : 'linear-gradient(90deg, #fffbeb 0%, #eef2ff 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '18px',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  ✨
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '800',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                    }}
                  >
                    Tóm Tắt Tác Phẩm Bằng AI
                  </h3>
                  <p
                    style={{
                      margin: '2px 0 0 0',
                      fontSize: '12px',
                      color: darkMode ? '#94a3b8' : '#64748b',
                    }}
                  >
                    {book?.title || 'Tác phẩm'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSummaryModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  fontSize: '18px',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Nội dung tóm tắt hiển thị đẹp */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                fontSize: '14.5px',
                lineHeight: '1.85',
                color: darkMode ? '#cbd5e1' : '#334155',
                textAlign: 'left',
              }}
            >
              {summaryText.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                  return <div key={idx} style={{ height: '8px' }}></div>;
                }

                // Dòng gạch đầu dòng
                const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');
                const cleanLine = isBullet
                  ? trimmed.replace(/^[\*\-]\s*/, '')
                  : trimmed;

                // Tự động chuyển ký tự **in đậm** thành thẻ HTML <b>
                const formattedHtml = cleanLine.replace(
                  /\*\*(.*?)\*\*/g,
                  `<b style="color: ${darkMode ? '#f8fafc' : '#0f172a'}; font-weight: 700;">$1</b>`
                );

                if (isBullet) {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '10px',
                        paddingLeft: '4px',
                      }}
                    >
                      <span
                        style={{
                          color: '#6366f1',
                          fontSize: '16px',
                          lineHeight: '1.4',
                          fontWeight: 'bold',
                        }}
                      >
                        •
                      </span>
                      <span
                        dangerouslySetInnerHTML={{ __html: formattedHtml }}
                        style={{ flex: 1 }}
                      />
                    </div>
                  );
                }

                return (
                  <p
                    key={idx}
                    style={{ margin: '0 0 12px 0' }}
                    dangerouslySetInnerHTML={{ __html: formattedHtml }}
                  />
                );
              })}
            </div>

            {/* Footer Popup */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                borderTop: `1px solid ${darkMode ? '#1e293b' : '#f1f5f9'}`,
                backgroundColor: darkMode ? '#0b1120' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                ></span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Phân tích bởi Google Gemini AI
                </span>
              </div>

              <button
                onClick={() => setSummaryModalOpen(false)}
                style={{
                  background: '#6366f1',
                  border: 'none',
                  color: '#ffffff',
                  padding: '7px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}