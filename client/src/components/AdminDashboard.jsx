import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ContributeModal from './ContributeModal';

export default function AdminDashboard({ onBack, onBookCreated, darkMode, currentUser }) {
  // Tabs: 'books' | 'users' | 'categories' | 'reviews' | 'analytics' | 'system'
  const [activeTab, setActiveTab] = useState('books');
  const [previewBook, setPreviewBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [trending, setTrending] = useState([]);

  // Modals & Forms Sách
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isEditBookOpen, setIsEditBookOpen] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState(null);

  // Modal Thêm/Sửa chương
  const [selectedBookForChapter, setSelectedBookForChapter] = useState(null);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(-1);
  const [chapterForm, setChapterForm] = useState({ title: '', total_pages: 30, content: '' });

  // Modals & Forms Người dùng
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ full_name: '', email: '', password: '', role: 'reader' });

  // Modals & Forms Thể loại
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  // State tìm kiếm theo từng tab
  const [bookSearch, setBookSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'books') fetchBooks();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'analytics') {
      fetchBooks();
      fetchUsers();
      fetchTrending();
    }
  }, [activeTab]);

  const fetchBooks = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/books?all=true');
      if (res.data?.success) setBooks(res.data.data);
    } catch (err) {
      console.error('Lỗi tải danh sách sách admin:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/admin/users');
      if (res.data?.success) setUsers(res.data.data);
    } catch (err) {
      console.error('Lỗi tải người dùng:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/admin/categories');
      if (res.data?.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Lỗi tải thể loại:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/admin/reviews');
      if (res.data?.success) setReviews(res.data.data);
    } catch (err) {
      console.error('Lỗi tải đánh giá:', err);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await axios.get('https://librify-backend.onrender.com/api/reader/trending');
      if (res.data?.success) setTrending(res.data.data);
    } catch (err) {
      console.error('Lỗi tải bảng xếp hạng:', err);
    }
  };

  // ==================== QUẢN LÝ SÁCH ====================
  const handleTogglePublish = async (bookId) => {
    try {
      const res = await axios.patch(`https://librify-backend.onrender.com/api/admin/books/${bookId}/publish`);
      if (res.data?.success) {
        alert(res.data.message);
        fetchBooks();
        if (onBookCreated) onBookCreated();
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái xuất bản: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenPreview = async (book) => {
    try {
      const res = await axios.get(`https://librify-backend.onrender.com/api/books/${book._id}`);
      if (res.data?.success) {
        setPreviewBook(res.data.data);
      } else {
        setPreviewBook(book);
      }
    } catch (err) {
      setPreviewBook(book);
    }
  };

  const handleUpdateBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookForEdit) return;
    try {
      await axios.put(`https://librify-backend.onrender.com/api/admin/books/${selectedBookForEdit._id}`, selectedBookForEdit);
      setIsEditBookOpen(false);
      setSelectedBookForEdit(null);
      fetchBooks();
      if (onBookCreated) onBookCreated();
    } catch (err) {
      alert('Lỗi cập nhật sách: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tác phẩm này khỏi hệ thống?')) return;
    try {
      const res = await axios.delete(`https://librify-backend.onrender.com/api/books/${bookId}`, {
        headers: { 'x-user-role': currentUser?.role || 'admin' },
      });
      if (res.data?.success) {
        setBooks((prev) => prev.filter((b) => b._id !== bookId));
        if (onBookCreated) onBookCreated();
      }
    } catch (err) {
      alert('Lỗi xóa sách: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenChapterModal = (b) => {
    setSelectedBookForChapter(b);
    if (b.chapters && b.chapters.length > 0) {
      setSelectedChapterIdx(0);
      const ch = b.chapters[0];
      setChapterForm({
        title: ch.title || '',
        total_pages: ch.total_pages || 30,
        content: ch.content || ch.description || '',
      });
    } else {
      setSelectedChapterIdx(-1);
      setChapterForm({ title: '', total_pages: 30, content: '' });
    }
  };

  const handleSelectChapterToEdit = (idxStr) => {
    const idx = Number(idxStr);
    setSelectedChapterIdx(idx);

    if (idx === -1) {
      setChapterForm({
        title: `Chương ${(selectedBookForChapter?.chapters?.length || 0) + 1}: `,
        total_pages: 30,
        content: '',
      });
    } else {
      const ch = selectedBookForChapter?.chapters?.[idx];
      if (ch) {
        setChapterForm({
          title: ch.title || '',
          total_pages: ch.total_pages || 30,
          content: ch.content || ch.description || '',
        });
      }
    }
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    if (!selectedBookForChapter?._id) return;

    try {
      if (selectedChapterIdx === -1) {
        await axios.post(
          `https://librify-backend.onrender.com/api/books/${selectedBookForChapter._id}/chapters`,
          chapterForm
        );
        alert('🎉 Đã thêm chương mới thành công!');
      } else {
        await axios.put(
          `https://librify-backend.onrender.com/api/admin/books/${selectedBookForChapter._id}/chapters/${selectedChapterIdx}`,
          chapterForm
        );
        alert(`🎉 Đã cập nhật nội dung Chương ${selectedChapterIdx + 1} thành công!`);
      }

      setSelectedBookForChapter(null);
      fetchBooks();
    } catch (err) {
      console.error('Lỗi lưu chương:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu nội dung chương!');
    }
  };

  // ==================== QUẢN LÝ NGƯỜI DÙNG ====================
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ full_name: '', email: '', password: '', role: 'reader' });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`https://librify-backend.onrender.com/api/admin/users/${editingUser._id}`, userForm);
        alert('Cập nhật tài khoản thành công!');
      } else {
        await axios.post('https://librify-backend.onrender.com/api/admin/users', userForm);
        alert('Tạo tài khoản mới thành công!');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserForm({ full_name: '', email: '', password: '', role: 'reader' });
      fetchUsers();
    } catch (err) {
      alert('Lỗi xử lý người dùng: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'reader' : 'admin';
    try {
      const res = await axios.patch(`https://librify-backend.onrender.com/api/admin/users/${userId}/role`, { role: nextRole });
      if (res.data?.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: nextRole } : u)));
      }
    } catch (err) {
      alert('Lỗi cập nhật vai trò: ' + err.message);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await axios.patch(`https://librify-backend.onrender.com/api/admin/users/${userId}/status`);
      if (res.data?.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? res.data.data : u)));
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Xác nhận xóa tài khoản người dùng này?')) return;
    try {
      await axios.delete(`https://librify-backend.onrender.com/api/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Lỗi xóa người dùng');
    }
  };

  // ==================== QUẢN LÝ THỂ LOẠI ====================
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatForm({ name: '', description: '' });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`https://librify-backend.onrender.com/api/admin/categories/${editingCategory._id}`, catForm);
        alert('Cập nhật thể loại thành công!');
      } else {
        await axios.post('https://librify-backend.onrender.com/api/admin/categories', catForm);
        alert('Thêm thể loại mới thành công!');
      }
      setIsCatModalOpen(false);
      setEditingCategory(null);
      setCatForm({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      alert('Lỗi xử lý thể loại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Xác nhận xóa thể loại này?')) return;
    try {
      await axios.delete(`https://librify-backend.onrender.com/api/admin/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert('Lỗi xóa thể loại');
    }
  };

  // ==================== QUẢN LÝ ĐÁNH GIÁ (REVIEWS) ====================
  const handleToggleReview = async (id) => {
    try {
      await axios.patch(`https://librify-backend.onrender.com/api/admin/reviews/${id}/toggle`);
      fetchReviews();
    } catch (err) {
      alert('Lỗi đổi trạng thái đánh giá');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Xác nhận xóa đánh giá này khỏi MongoDB?')) return;
    try {
      await axios.delete(`https://librify-backend.onrender.com/api/admin/reviews/${id}`);
      fetchReviews();
    } catch (err) {
      alert('Lỗi xóa đánh giá');
    }
  };



  // Bộ lọc tìm kiếm
  const filteredBooks = (books || []).filter((b) => {
    const q = bookSearch.toLowerCase();
    const title = (b.title || '').toLowerCase();
    const author = (typeof b.author === 'object' ? b.author?.name : b.author || '').toLowerCase();
    const uploader = (b.uploader_name || b.contributed_by || '').toLowerCase();
    const cats = Array.isArray(b.categories) ? b.categories.join(' ').toLowerCase() : (b.categories || '').toLowerCase();
    return title.includes(q) || author.includes(q) || uploader.includes(q) || cats.includes(q);
  });

  const filteredUsers = (users || []).filter((u) => {
    const q = userSearch.toLowerCase();
    const fullName = (u.full_name || u.fullName || u.name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const role = (u.role || '').toLowerCase();
    return fullName.includes(q) || username.includes(q) || email.includes(q) || role.includes(q);
  });

  const filteredCategories = (categories || []).filter((c) => {
    const q = categorySearch.toLowerCase();
    const name = (typeof c === 'object' ? c.name : c || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });

  const filteredReviews = (reviews || []).filter((r) => {
    const q = reviewSearch.toLowerCase();
    const bTitle = (r.bookTitle || r.book?.title || '').toLowerCase();
    const uName = (r.userName || r.user?.username || r.user?.full_name || '').toLowerCase();
    const comment = (r.comment || r.content || '').toLowerCase();
    return bTitle.includes(q) || uName.includes(q) || comment.includes(q);
  });

  const categoryStats = useMemo(() => {
    const stats = {};
    books.forEach((b) => {
      if (Array.isArray(b.categories)) {
        b.categories.forEach((cat) => {
          stats[cat] = (stats[cat] || 0) + 1;
        });
      }
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  }, [books]);

  const totalReads = useMemo(() => {
    return trending.reduce((sum, item) => sum + Number(item.score || item.views || 0), 0);
  }, [trending]);

  // Style helpers
  const cardStyle = {
    background: darkMode ? '#1e293b' : '#ffffff',
    borderRadius: '16px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    padding: '24px',
    marginBottom: '24px',
  };

  const tableHeaderStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    color: darkMode ? '#94a3b8' : '#64748b',
    borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
  };

  const tableCellStyle = {
    padding: '14px 16px',
    fontSize: '14px',
    borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
  };

  const statBoxStyle = {
    background: darkMode ? '#0f172a' : '#f8fafc',
    borderRadius: '12px',
    padding: '18px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
  };

  return (
    <div>
      {/* Header thanh công cụ Quản trị */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              marginBottom: '8px',
            }}
          >
            ← Quay lại Thư viện
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: darkMode ? '#f8fafc' : '#0f172a' }}>
            Hệ Thống Quản Trị & Điều Hành Thư Viện
          </h1>
        </div>

        {/* Thanh chuyển Tab */}
        <div style={{ display: 'flex', gap: '6px', background: darkMode ? '#1e293b' : '#e2e8f0', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'books', label: 'Quản Lý Sách', icon: 'fa-book' },
            { id: 'users', label: 'Người Dùng & Quyền', icon: 'fa-users' },
            { id: 'categories', label: 'Quản Lý Thể Loại', icon: 'fa-tags' },
            { id: 'reviews', label: 'Quản Lý Đánh Giá', icon: 'fa-comments' },
            { id: 'analytics', label: 'Báo Cáo & Xu Hướng', icon: 'fa-chart-line' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#6366f1' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : darkMode ? '#94a3b8' : '#475569',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: QUẢN LÝ SÁCH */}
      {activeTab === 'books' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
              Danh Sách Tác Phẩm ({filteredBooks?.length || books?.length || 0})
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm tên sách, tác giả..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  style={{
                    padding: '9px 32px 9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    fontSize: '13px',
                    width: '240px',
                    outline: 'none',
                  }}
                />
                {bookSearch && (
                  <button
                    type="button"
                    onClick={() => setBookSearch('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsAddBookOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                + Thêm Sách Mới
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Tên Sách</th>
                  <th style={tableHeaderStyle}>Tác Giả</th>
                  <th style={tableHeaderStyle}>Người Đăng</th>
                  <th style={tableHeaderStyle}>Trạng Thái</th>
                  <th style={tableHeaderStyle}>Thể Loại</th>
                  <th style={tableHeaderStyle}>Số Chương</th>
                  <th style={tableHeaderStyle}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {(filteredBooks || books).map((b) => (
                  <tr key={b._id}>
                    <td style={tableCellStyle}><strong>{b.title}</strong></td>
                    <td style={tableCellStyle}>{b.author?.name || 'Chưa rõ'}</td>
                    <td style={tableCellStyle}>
                      <span style={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#64748b' }}>
                        {b.uploader_name || 'Ban Quản Trị'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: b.is_published ? '#10b981' : '#f59e0b',
                          color: '#ffffff',
                          display: 'inline-block',
                        }}
                      >
                        {b.is_published ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ background: darkMode ? '#334155' : '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                        {Array.isArray(b.categories) ? b.categories.join(', ') : 'Mặc định'}
                      </span>
                    </td>
                    <td style={tableCellStyle}><strong>{b.total_chapters || b.chapters?.length || 0}</strong> chương</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => handleOpenPreview(b)}
                          style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          👁 Xem
                        </button>
                        <button
                          onClick={() => handleTogglePublish(b._id)}
                          style={{ background: b.is_published ? '#64748b' : '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          {b.is_published ? 'Ẩn' : 'Duyệt'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookForEdit(b);
                            setIsEditBookOpen(true);
                          }}
                          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleOpenChapterModal(b)}
                          style={{ background: '#38bdf8', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          + Chương
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b._id)}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ NGƯỜI DÙNG */}
      {activeTab === 'users' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
              Danh Sách Người Dùng ({filteredUsers?.length || users?.length || 0})
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm người dùng, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    padding: '9px 32px 9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    fontSize: '13px',
                    width: '240px',
                    outline: 'none',
                  }}
                />
                {userSearch && (
                  <button
                    type="button"
                    onClick={() => setUserSearch('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* NÚT THÊM TÀI KHOẢN MỚI (ĐÃ SỬA GỌI ĐÚNG HÀM) */}
              <button
                type="button"
                onClick={handleOpenAddUser}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                + Thêm Tài Khoản
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Họ & Tên</th>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>Vai Trò (Role)</th>
                  <th style={tableHeaderStyle}>Trạng Thái</th>
                  <th style={tableHeaderStyle}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {(filteredUsers || users).map((u) => (
                  <tr key={u._id}>
                    <td style={tableCellStyle}><strong>{u.full_name || u.fullName || u.username || 'Độc giả'}</strong></td>
                    <td style={tableCellStyle}>{u.email}</td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '800',
                          background: u.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                          color: u.role === 'admin' ? '#b45309' : '#3730a3',
                        }}
                      >
                        {u.role === 'admin' ? '⭐ Admin' : 'Độc Giả'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ color: u.status === 'blocked' ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                        {u.status === 'blocked' ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({ full_name: u.full_name || '', email: u.email || '', password: '', role: u.role || 'reader' });
                            setIsUserModalOpen(true);
                          }}
                          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          style={{ background: u.role === 'admin' ? '#f59e0b' : '#3b82f6', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {u.role === 'admin' ? 'Hạ Reader' : 'Lên Admin'}
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          style={{ background: u.status === 'blocked' ? '#10b981' : '#64748b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {u.status === 'blocked' ? 'Mở' : 'Khóa'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ THỂ LOẠI */}
      {activeTab === 'categories' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
              Danh Mục Thể Loại ({filteredCategories?.length || categories?.length || 0})
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm thể loại..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  style={{
                    padding: '9px 32px 9px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    fontSize: '13px',
                    width: '240px',
                    outline: 'none',
                  }}
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* NÚT THÊM THỂ LOẠI (ĐÃ SỬA GỌI ĐÚNG HÀM) */}
              <button
                type="button"
                onClick={handleOpenAddCategory}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                + Thêm Thể Loại
              </button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Tên Thể Loại</th>
                <th style={tableHeaderStyle}>Mô Tả</th>
                <th style={tableHeaderStyle}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {(filteredCategories || categories).map((c, idx) => (
                <tr key={c._id || idx}>
                  <td style={tableCellStyle}><strong>{typeof c === 'string' ? c : c.name}</strong></td>
                  <td style={tableCellStyle}>{c.description || 'Không có mô tả'}</td>
                  <td style={tableCellStyle}>
                    {c._id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCatForm({ name: c.name, description: c.description || '' });
                            setIsCatModalOpen(true);
                          }}
                          style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c._id)}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mặc định</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: QUẢN LÝ ĐÁNH GIÁ (REVIEWS) */}
      {activeTab === 'reviews' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
              Danh Sách Đánh Giá & Nhận Xét ({filteredReviews.length})
            </h3>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Tìm tác phẩm, người viết, bình luận..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                style={{
                  padding: '8px 32px 8px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  fontSize: '13px',
                  width: '300px',
                  outline: 'none',
                }}
              />
              {reviewSearch && (
                <button
                  onClick={() => setReviewSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Tác Phẩm</th>
                <th style={tableHeaderStyle}>Độc Giả</th>
                <th style={tableHeaderStyle}>Số Sao</th>
                <th style={tableHeaderStyle}>Nội Dung Bình Luận</th>
                <th style={tableHeaderStyle}>Trạng Thái</th>
                <th style={tableHeaderStyle}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {(filteredReviews || reviews).map((r) => (
                <tr key={r._id}>
                  <td style={tableCellStyle}><strong>{r.book_title || 'Tác phẩm'}</strong></td>
                  <td style={tableCellStyle}>{r.user_name || 'Độc giả'}</td>
                  <td style={tableCellStyle}>
                    <span style={{ color: '#f59e0b', fontWeight: '800' }}>{'⭐'.repeat(r.rating || 5)}</span>
                  </td>
                  <td style={{ ...tableCellStyle, maxWidth: '280px' }}>{r.comment}</td>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: r.status === 'approved' ? '#10b981' : '#64748b',
                        color: '#fff',
                      }}
                    >
                      {r.status === 'approved' ? 'HIỂN THỊ' : 'ĐÃ ẨN'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleToggleReview(r._id)}
                        style={{
                          background: r.status === 'approved' ? '#f59e0b' : '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}
                      >
                        {r.status === 'approved' ? 'Ẩn' : 'Hiện'}
                      </button>
                      <button
                        onClick={() => handleDeleteReview(r._id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: BÁO CÁO & XU HƯỚNG */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tổng Số Sách</div>
              <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>{books.length}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tổng Số Tài Khoản</div>
              <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>{users.length}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tổng Lượt Đọc Tích Lũy</div>
              <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px', color: '#38bdf8' }}>{totalReads}</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tổng Số Thể Loại</div>
              <div style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px', color: '#10b981' }}>{categoryStats.length}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-chart-pie" style={{ color: '#6366f1', marginRight: '8px' }}></i>
                Phân Bổ Tác Phẩm Theo Thể Loại
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryStats.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: darkMode ? '#0f172a' : '#f8fafc', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</span>
                    <span style={{ background: '#6366f1', color: '#fff', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                      {item.count} tài liệu
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800' }}>
                <i className="fa-solid fa-fire" style={{ color: '#ef4444', marginRight: '8px' }}></i>
                Top Xu Hướng Thời Gian Thực (Redis ZSet)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {trending.length > 0 ? (
                  trending.slice(0, 5).map((item, idx) => {
                    const authorName = typeof item.author === 'string' ? item.author : item.author?.name || 'Chưa rõ';
                    const scoreVal = item.score ?? item.views ?? item.read_score ?? 0;
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: darkMode ? '#0f172a' : '#f8fafc', borderRadius: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '14px' }}>#{idx + 1} {item.title}</strong>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{authorName}</div>
                        </div>
                        <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '13px' }}>
                          ★ {scoreVal} lượt xem
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có phiên đọc tích lũy trong Redis ZSet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

  

      {/* MODAL THÊM SÁCH ĐỒNG BỘ */}
      <ContributeModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        currentUser={currentUser}
        darkMode={darkMode}
        onSuccess={() => {
          setIsAddBookOpen(false);
          fetchBooks();
          if (onBookCreated) onBookCreated();
        }}
      />

      {/* MODAL SỬA SÁCH */}
      {isEditBookOpen && selectedBookForEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: darkMode ? '#1e293b' : '#fff', padding: '30px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Chỉnh Sửa Tác Phẩm</h3>
            <form onSubmit={handleUpdateBookSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tên Sách</label>
                <input
                  type="text"
                  required
                  value={selectedBookForEdit.title}
                  onChange={(e) => setSelectedBookForEdit({ ...selectedBookForEdit, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tác Giả</label>
                <input
                  type="text"
                  required
                  value={selectedBookForEdit.author?.name || ''}
                  onChange={(e) => setSelectedBookForEdit({ ...selectedBookForEdit, author: { name: e.target.value } })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Mô Tả</label>
                <textarea
                  rows="3"
                  value={selectedBookForEdit.description || ''}
                  onChange={(e) => setSelectedBookForEdit({ ...selectedBookForEdit, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditBookOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA CHƯƠNG */}
      {selectedBookForChapter && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            width: '560px',
            maxWidth: '92%',
            color: darkMode ? '#f8fafc' : '#0f172a',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                Quản Lý Chương: <span style={{ color: '#6366f1' }}>{selectedBookForChapter.title}</span>
              </h3>
              <button
                onClick={() => setSelectedBookForChapter(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChapter} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1' }}>
                  Tác vụ thực hiện:
                </label>
                <select
                  value={selectedChapterIdx}
                  onChange={(e) => handleSelectChapterToEdit(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#fff' : '#000',
                    marginTop: '4px',
                    fontWeight: '600',
                  }}
                >
                  <option value={-1}>➕ Thêm một chương mới vào sách</option>
                  {selectedBookForChapter.chapters?.map((ch, idx) => (
                    <option key={idx} value={idx}>
                      ✏️ Chỉnh sửa nội dung Chương {idx + 1}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700' }}>Tiêu Đề Chương</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chương 1: Kiến trúc cơ bản..."
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#fff' : '#000',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700' }}>Tổng Số Trang (total_pages)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={chapterForm.total_pages}
                  onChange={(e) => setChapterForm({ ...chapterForm, total_pages: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#fff' : '#000',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '700' }}>
                  Nội Dung Toàn Văn (Ngắt trang bằng <code style={{ color: '#6366f1' }}>---</code>)
                </label>
                <textarea
                  rows="7"
                  required
                  placeholder="Nhập nội dung chi tiết... Muốn ngắt sang trang kế tiếp thì gõ 3 dấu gạch ngang (---) trên một dòng riêng."
                  value={chapterForm.content}
                  onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#fff' : '#000',
                    marginTop: '4px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedBookForChapter(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: 'transparent',
                    color: darkMode ? '#fff' : '#000',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedChapterIdx === -1 ? '#10b981' : '#6366f1',
                    color: '#fff',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {selectedChapterIdx === -1 ? '+ Lưu Chương Mới' : '💾 Lưu Cập Nhật Chương'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NGƯỜI DÙNG (THÊM / SỬA) */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: darkMode ? '#1e293b' : '#fff', padding: '28px', borderRadius: '16px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>{editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Họ và tên:</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Email:</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Mật khẩu {editingUser && '(để trống nếu không đổi)'}:</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  required={!editingUser}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Vai trò:</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="reader">Độc giả (Reader)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsUserModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                  {editingUser ? 'Lưu Thay Đổi' : '+ Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THỂ LOẠI (THÊM / SỬA) */}
      {isCatModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: darkMode ? '#1e293b' : '#fff', padding: '28px', borderRadius: '16px', width: '420px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>{editingCategory ? 'Sửa Thể Loại' : 'Thêm Thể Loại Mới'}</h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Tên thể loại:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khoa học dữ liệu..."
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Mô tả:</label>
                <textarea
                  placeholder="Mô tả tóm tắt nội dung của thể loại này..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  rows={3}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsCatModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                  {editingCategory ? 'Lưu Thay Đổi' : '+ Thêm Thể Loại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC NỘI DUNG SÁCH */}
      {previewBook && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#f8fafc' : '#0f172a',
            borderRadius: '16px',
            padding: '28px',
            width: '760px',
            maxWidth: '92%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: previewBook.is_published ? '#10b981' : '#f59e0b',
                  color: '#fff',
                  textTransform: 'uppercase',
                }}>
                  {previewBook.is_published ? 'ĐÃ DUYỆT' : 'CHỜ DUYỆT'}
                </span>
                <h2 style={{ margin: '8px 0 4px 0', fontSize: '20px', fontWeight: '800' }}>{previewBook.title}</h2>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  Tác giả: <strong>{previewBook.author?.name || 'Chưa rõ'}</strong> | Người đăng:{' '}
                  <strong>{previewBook.uploader_name || 'Ban Quản Trị'}</strong>
                </div>
              </div>
              <button onClick={() => setPreviewBook(null)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              {previewBook.cover_image && (
                <img src={previewBook.cover_image} alt="Bìa sách" style={{ width: '110px', height: '150px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#6366f1' }}>Mô Tả Tác Phẩm:</h4>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: darkMode ? '#cbd5e1' : '#475569' }}>
                  {previewBook.description || 'Chưa có mô tả tóm tắt.'}
                </p>
                <div style={{ marginTop: '12px', fontSize: '12px' }}>
                  <strong>Thể loại: </strong>
                  {Array.isArray(previewBook.categories) ? previewBook.categories.join(', ') : 'Chưa phân loại'}
                </div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800' }}>
              Nội Dung Các Chương ({previewBook.chapters?.length || 0} chương):
            </h4>

            {previewBook.chapters && previewBook.chapters.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {previewBook.chapters.map((chap, idx) => (
                  <div key={idx} style={{ background: darkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#38bdf8' }}>{chap.title || `Chương ${idx + 1}`}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{chap.total_pages || 20} trang</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.6', color: darkMode ? '#94a3b8' : '#334155', whiteSpace: 'pre-line', background: darkMode ? '#1e293b' : '#ffffff', padding: '12px', borderRadius: '6px', border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`, maxHeight: '180px', overflowY: 'auto' }}>
                      {chap.content || 'Nội dung chương chưa được cập nhật.'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                Tác phẩm này chưa có chương nội dung nào!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, paddingTop: '16px' }}>
              <button onClick={() => setPreviewBook(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: darkMode ? '#fff' : '#000', cursor: 'pointer', fontSize: '13px' }}>
                Đóng
              </button>
              {!previewBook.is_published && (
                <button
                  onClick={() => {
                    handleTogglePublish(previewBook._id);
                    setPreviewBook(null);
                  }}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  ✓ Duyệt Xuất Bản Ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}