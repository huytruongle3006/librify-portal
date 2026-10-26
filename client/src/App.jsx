import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import CategoryFilter from './components/CategoryFilter';
import BookCard from './components/BookCard';
import TrendingSidebar from './components/TrendingSidebar';
import ReaderView from './components/ReaderView';
import RecentHistory from './components/RecentHistory';
import StatsModal from './components/StatsModal';
import AuthModal from './components/UserModal';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [categories, setCategories] = useState(['Tất cả']);
  const [books, setBooks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [favoriteBookIds, setFavoriteBookIds] = useState([]);

  // Điều hướng hiển thị: 'portal' | 'reader' | 'admin'
  const [viewMode, setViewMode] = useState('portal');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [statsData, setStatsData] = useState(null);

  // Quản lý người dùng
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('lib_user');
    return saved
      ? JSON.parse(saved)
      : { _id: "660c1a2b3c4d5e6f7a8b9c99", full_name: "Lê Trương Huy", role: "admin" };
  });

  const fetchStats = async () => {
    try {
      const userId = currentUser?._id || '';
      const res = await axios.get(`https://librify-backend.onrender.com/api/books/stats?userId=${userId}`);
      if (res.data.success) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu thống kê:', err);
    }
  };

  // Trạng thái đọc sách
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [chapterNum, setChapterNum] = useState(1);
  const [completedBookIds, setCompletedBookIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [restoreNotice, setRestoreNotice] = useState(null);
  const [isReadingScoreUpdated, setIsReadingScoreUpdated] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('https://librify-backend.onrender.com/api/categories');
        if (res.data.success && res.data.data.length > 0) {
          const catNames = ['Tất cả', '❤️ Yêu thích', '✅ Đã đọc', ...res.data.data.map((c) => c.name)];
          setCategories(catNames);
        } else {
          setCategories(['Tất cả', '❤️ Yêu thích', '✅ Đã đọc']);
        }
      } catch (err) {
        console.error('Lỗi nạp categories:', err);
        setCategories(['Tất cả', '❤️ Yêu thích', '✅ Đã đọc']);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchTrending();
    if (currentUser?._id) {
      fetchRecentHistory(currentUser._id);
      fetchCompletedBookIds(currentUser._id);
    } else {
      // 👉 THÊM VÀO ĐÂY: Reset sạch danh sách khi đã đăng xuất
      setRecentHistory([]); 
      setCompletedBookIds([]); 
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?._id) {
      axios
        .get(`https://librify-backend.onrender.com/api/favorites/ids/${currentUser._id}`)
        .then((res) => {
          if (res.data.success) {
            setFavoriteBookIds(res.data.data);
          }
        })
        .catch((err) => console.error('Lỗi lấy danh sách yêu thích:', err));
    } else {
      setFavoriteBookIds([]);
    }
  }, [currentUser]);

  const fetchCompletedBookIds = async (userId) => {
    if (!userId) return;
    try {
      const res = await axios.get(`https://librify-backend.onrender.com/api/reader/completed-ids/${userId}`);
      if (res.data.success) {
        setCompletedBookIds(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách sách đã đọc:', err);
    }
  };

  const handleToggleFavorite = async (bookId) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await axios.post('https://librify-backend.onrender.com/api/favorites/toggle', {
        userId: currentUser._id,
        bookId,
      });

      if (res.data.success) {
        if (res.data.isFavorited) {
          setFavoriteBookIds((prev) => [...prev, bookId]);
        } else {
          setFavoriteBookIds((prev) => prev.filter((id) => id !== bookId));
        }
      }
    } catch (err) {
      console.error('Lỗi cập nhật yêu thích:', err);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/books?limit=60');
      if (res.data.success) {
        setBooks(res.data.data);
        setTotalBooks(res.data.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/reader/trending');
      if (res.data.success) setTrending(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentHistory = async (userId) => {
    try {
      const res = await axios.get(`https://librify-backend.onrender.com/api/reader/history/${userId}`);
      if (res.data.success) setRecentBooks(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('lib_user', JSON.stringify(user));
    localStorage.setItem('lib_token', token);
    fetchRecentHistory(user._id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lib_user');
    localStorage.removeItem('lib_token');
    setViewMode('portal');
    setRecentBooks([]);
  };

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedCategory === '❤️ Yêu thích') {
        return matchSearch && favoriteBookIds.includes(b._id);
      }
      if (selectedCategory === 'Đã đọc' || selectedCategory === '✅ Đã đọc') {
        return matchSearch && completedBookIds.map(String).includes(String(b._id));
      }
      const matchCategory =
        selectedCategory === 'Tất cả' ||
        (b.categories && b.categories.includes(selectedCategory));

      return matchSearch && matchCategory;
    });
  }, [books, searchQuery, selectedCategory, favoriteBookIds, completedBookIds]);
  const openBook = async (bookId) => {
    try {
      const res = await axios.get(`https://librify-backend.onrender.com/api/books/${bookId}`);
      if (!res.data?.success) return;

      const book = res.data.data;
      setSelectedBook(book);
      setViewMode('reader');
      setIsReadingScoreUpdated(false);

      const userId = currentUser?._id || "660c1a2b3c4d5e6f7a8b9c99";

      // Theo dõi phiên đọc và cập nhật bảng xếp hạng Trending
      axios
        .post(`https://librify-backend.onrender.com/api/reader/track-read/${bookId}`, { userId })
        .then((response) => {
          if (response.data?.counted) {
            fetchTrending();
          }
        })
        .catch((err) => console.error('Lỗi theo dõi phiên đọc:', err));

      // Lấy tiến độ đọc trước đó từ Redis
      const progressRes = await axios.get(`https://librify-backend.onrender.com/api/reader/progress/${userId}/${bookId}`);
      const progress = progressRes.data?.data;

      let initChapter = 0; // Chương 1 tương ứng với chỉ số index 0
      let initPage = 1;

      if (progress && Object.keys(progress).length > 0) {
        const rawChap = progress.chapter !== undefined ? progress.chapter : progress.chapterIndex;
        const parsedChap = parseInt(rawChap, 10);
        const parsedPage = parseInt(progress.page || progress.last_page, 10);

        // Kiểm tra đúng giá trị số nguyên không âm (chấp nhận cả số 0 của Chương 1)
        if (!isNaN(parsedChap) && parsedChap >= 0) {
          initChapter = parsedChap;
        }
        if (!isNaN(parsedPage) && parsedPage > 0) {
          initPage = parsedPage;
        }

        setRestoreNotice(`Tiếp tục từ phiên trước: Chương ${initChapter + 1} - Trang ${initPage}`);
      } else {
        setRestoreNotice(null);
      }

      setChapterNum(initChapter);
      setCurrentPage(initPage);
      loadChapter(book._id, initChapter + 1, initPage);
      // Giữ nguyên việc không gọi saveProgress tự động để tránh ghi đè tiến độ cũ
    } catch (err) {
      console.error('Lỗi nạp sách và khôi phục tiến độ:', err);
    }
  };
  const loadChapter = async (bookId, chap, page = 1) => {
    try {
      const res = await axios.get(`https://librify-backend.onrender.com/api/books/${bookId}/chapters/${chap}`);
      if (res.data.success) {
        setCurrentChapter(res.data.chapter);
        setChapterNum(chap);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveProgress = async (pageVal, chapVal = chapterNum, targetBookId = selectedBook?._id) => {
    setCurrentPage(pageVal);
    const userId = currentUser?._id || "660c1a2b3c4d5e6f7a8b9c99";
    const bookIdToSave = targetBookId || selectedBook?._id;
    if (!bookIdToSave) return;
    try {
      await axios.post('https://librify-backend.onrender.com/api/reader/progress', {
        userId,
        bookId: bookIdToSave,
        chapter: chapVal,
        page: pageVal,
        scrollRatio: 0.5,
      });
      fetchRecentHistory(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMarkCompleted = async () => {
    if (!selectedBook?._id || !currentUser?._id) return;
    try {
      const res = await axios.post('/api/reader/toggle-completed', {
        userId: currentUser._id,
        bookId: selectedBook._id,
      });
      if (res.data.success) {
        return res.data.isCompleted;
      }
    } catch (err) {
      console.error('Lỗi cập nhật hoàn thành tác phẩm:', err);
    }
  };

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('lib_theme') === 'dark';
  });

  const toggleTheme = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('lib_theme', nextMode ? 'dark' : 'light');
  };

  const handleUpdateUser = (updatedData) => {
    setCurrentUser(updatedData);
    localStorage.setItem('user', JSON.stringify(updatedData));
  };
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
      color: darkMode ? '#f8fafc' : '#0f172a',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      <Navbar
        onHomeClick={() => { setViewMode('portal'); fetchBooks(); }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={viewMode === 'portal'}
        onOpenStats={() => {
          fetchStats();
          setIsStatsOpen(true);
        }}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser} // <-- THÊM DÒNG NÀY ĐỂ PROFILE HOẠT ĐỘNG
        onBookCreated={fetchBooks}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setViewMode('admin')}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 24px' }}>
        {viewMode === 'admin' ? (
          /* Lớp kiểm tra quyền hạn (Role Guard): Chặn nếu không phải admin */
          currentUser?.role === 'admin' ? (
            <AdminDashboard
              onBack={() => setViewMode('portal')}
              onBookCreated={fetchBooks}
              darkMode={darkMode}
              currentUser={currentUser}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: darkMode ? '#1e293b' : '#ffffff',
              borderRadius: '16px',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              marginTop: '40px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⛔</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>
                Từ chối quyền truy cập!
              </h2>
              <p style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                Bạn cần đăng nhập với tài khoản có quyền Quản trị viên (Admin) để sử dụng trang này.
              </p>
              <button
                onClick={() => setViewMode('portal')}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Quay về Thư viện
              </button>
            </div>
          )
        ) : viewMode === 'portal' ? (
          <div>
            {currentUser && recentBooks && recentBooks.length > 0 && (
              <RecentHistory
                books={recentBooks}
                onSelectBook={handleSelectBook}
                darkMode={darkMode}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '32px' }}>
              <div style={{ minWidth: 0 }}>
                <CategoryFilter
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: darkMode ? '#f8fafc' : '#0f172a' }}>
                    Tất Cả Tác Phẩm
                  </h2>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Hiển thị <strong>{filteredBooks.length}</strong> / {totalBooks} tài liệu
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '20px' }}>
                  {filteredBooks.map((b) => (
                    <BookCard
                      key={b._id}
                      book={b}
                      onOpen={openBook}
                      darkMode={darkMode}
                      isFavorited={favoriteBookIds.includes(b._id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              <div>
                <TrendingSidebar
                  trending={trending}
                  onRefresh={fetchTrending}
                  onOpenBook={openBook}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
        ) : (
          <ReaderView
            bookId={selectedBook?._id}
            currentUser={currentUser}
            darkMode={darkMode}
            onToggleCompleted={handleToggleMarkCompleted}
            onBack={() => {
              setViewMode('portal');
              fetchTrending();
              if (currentUser?._id) fetchRecentHistory(currentUser._id);
            }}
          />
        )}
      </main>

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        statsData={statsData}
        favoriteCount={favoriteBookIds.length}
        darkMode={darkMode}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}