import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUpdateUser, 
  onSelectBook, 
  darkMode 
}) {
  // Tab hiện tại: 'profile' hoặc 'contributions'
  const [activeTab, setActiveTab] = useState('profile');

  // State thông tin cá nhân
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  // State danh sách sách đã đóng góp & xem trước
  const [myBooks, setMyBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [previewBook, setPreviewBook] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || currentUser.username || '',
        email: currentUser.email || '',
        avatar: currentUser.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [currentUser, isOpen]);

  // Tự động tải danh sách sách khi chuyển sang tab Tác Phẩm Đã Đăng
  useEffect(() => {
    if (isOpen && activeTab === 'contributions' && currentUser?._id) {
      fetchMyBooks();
    }
  }, [isOpen, activeTab, currentUser]);

 const fetchMyBooks = async () => {
    try {
      setLoadingBooks(true);
      const userId = currentUser?._id || currentUser?.id;
      const userName = currentUser?.full_name || currentUser?.fullName || currentUser?.name || currentUser?.username || '';
      
      const res = await axios.get(
        `https://librify-backend.onrender.com/api/books/my-contributions/${userId}?userName=${encodeURIComponent(userName)}`
      );
      if (res.data?.success) {
        setMyBooks(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách tác phẩm:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isChangingPassword = Boolean(formData.newPassword && formData.newPassword.trim() !== '');

    if (isChangingPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
        return;
      }
      if (formData.newPassword.length < 6) {
        alert('Mật khẩu mới phải có tối thiểu 6 ký tự!');
        return;
      }
      if (!formData.currentPassword || formData.currentPassword.trim() === '') {
        alert('Vui lòng nhập mật khẩu hiện tại để xác thực!');
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        userId: currentUser?._id || currentUser?.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        avatar: formData.avatar.trim(),
      };

      if (isChangingPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await axios.put('https://librify-backend.onrender.com/api/users/profile', payload);

      if (res.data?.success) {
        alert('🎉 ' + res.data.message);
        if (onUpdateUser) onUpdateUser(res.data.data);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      backdropFilter: 'blur(5px)',
    }}>
      <div style={{
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px',
        width: activeTab === 'contributions' ? '650px' : '480px',
        maxWidth: '94%',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        color: darkMode ? '#f8fafc' : '#0f172a',
        boxShadow: '0 25px 30px -5px rgba(0,0,0,0.4)',
        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
        transition: 'width 0.25s ease',
      }}>
        
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className={activeTab === 'profile' ? "fa-solid fa-user-gear" : "fa-solid fa-book-bookmark"} style={{ color: '#6366f1' }}></i>
            {activeTab === 'profile' ? 'Tài Khoản & Hồ Sơ' : 'Tác Phẩm Đã Đóng Góp'}
          </h3>
          <button
            onClick={() => { setPreviewBook(null); onClose(); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Thanh chuyển đổi Tab */}
        <div style={{
          display: 'flex',
          background: darkMode ? '#0f172a' : '#f1f5f9',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '18px',
          gap: '4px',
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('profile'); setPreviewBook(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              background: activeTab === 'profile' ? (darkMode ? '#334155' : '#ffffff') : 'transparent',
              color: activeTab === 'profile' ? '#6366f1' : (darkMode ? '#94a3b8' : '#64748b'),
              boxShadow: activeTab === 'profile' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Thông Tin Cá Nhân
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('contributions'); setPreviewBook(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              background: activeTab === 'contributions' ? (darkMode ? '#334155' : '#ffffff') : 'transparent',
              color: activeTab === 'contributions' ? '#6366f1' : (darkMode ? '#94a3b8' : '#64748b'),
              boxShadow: activeTab === 'contributions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Sách Của Tôi ({myBooks.length})
          </button>
        </div>

        {/* ===================== TAB 1: THÔNG TIN CÁ NHÂN ===================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700' }}>Họ và Tên</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
              <label style={{ fontSize: '13px', fontWeight: '700' }}>Địa chỉ Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              <label style={{ fontSize: '13px', fontWeight: '700' }}>Link Ảnh Đại Diện (Avatar URL)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="https://... hoặc dán link ảnh đại diện"
                  value={formData.avatar || ''}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    background: darkMode ? '#0f172a' : '#f8fafc',
                    color: darkMode ? '#fff' : '#000',
                  }}
                />
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Preview"
                    style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
              </div>
            </div>

            {/* Vùng đổi mật khẩu */}
            <div style={{
              borderTop: `1px dashed ${darkMode ? '#334155' : '#e2e8f0'}`,
              paddingTop: '12px',
              marginTop: '4px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#6366f1', marginBottom: '8px' }}>
                Thay đổi Mật Khẩu (Để trống nếu không đổi)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600' }}>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu cũ nếu muốn đổi..."
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                      background: darkMode ? '#0f172a' : '#f8fafc',
                      color: darkMode ? '#fff' : '#000',
                      marginTop: '3px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600' }}>Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)..."
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                      background: darkMode ? '#0f172a' : '#f8fafc',
                      color: darkMode ? '#fff' : '#000',
                      marginTop: '3px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600' }}>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                      background: darkMode ? '#0f172a' : '#f8fafc',
                      color: darkMode ? '#fff' : '#000',
                      marginTop: '3px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Nút lưu */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
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
                disabled={loading}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#6366f1',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        )}

        {/* ===================== TAB 2: TÁC PHẨM ĐÃ ĐÓNG GÓP ===================== */}
        {activeTab === 'contributions' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            {/* Nếu đang chọn xem chi tiết 1 cuốn */}
            {previewBook ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewBook(null)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0,
                  }}
                >
                  ← Quay lại danh sách sách của tôi
                </button>

                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                }}>
                  <img
                    src={previewBook.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'}
                    alt={previewBook.title}
                    style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        background: previewBook.is_published ? '#dcfce7' : '#fef3c7',
                        color: previewBook.is_published ? '#15803d' : '#b45309',
                      }}>
                        {previewBook.is_published ? '✓ ĐÃ DUYỆT' : '⏳ CHỜ DUYỆT'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {previewBook.total_chapters || previewBook.chapters?.length || 1} chương
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800' }}>{previewBook.title}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Tác giả: {typeof previewBook.author === 'string' ? previewBook.author : previewBook.author?.name}
                    </p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                      {previewBook.description || 'Chưa có mô tả tóm tắt.'}
                    </p>
                  </div>
                </div>

                {/* Danh sách chương & nội dung */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: darkMode ? '#cbd5e1' : '#334155' }}>
                    Nội dung các chương ({previewBook.chapters?.length || 1} chương):
                  </div>
                  {previewBook.chapters && previewBook.chapters.length > 0 ? (
                    previewBook.chapters.map((chap, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: darkMode ? '#0f172a' : '#ffffff',
                          border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        }}
                      >
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#6366f1', marginBottom: '6px' }}>
                          {chap.title || `Chương ${chap.chapter_number || idx + 1}`} ({chap.total_pages || 20} trang)
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: darkMode ? '#94a3b8' : '#64748b',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.5',
                          maxHeight: '120px',
                          overflowY: 'auto',
                          background: darkMode ? '#1e293b' : '#f8fafc',
                          padding: '8px',
                          borderRadius: '6px',
                        }}>
                          {chap.content || 'Nội dung chương chưa được cập nhật.'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '15px' }}>
                      Đang tải hoặc chưa có nội dung chương.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectBook) onSelectBook(previewBook);
                      onClose();
                    }}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#6366f1',
                      color: '#fff',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Mở Trình Đọc Sách
                  </button>
                </div>
              </div>
            ) : (
              /* Danh sách các cuốn sách của người dùng */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loadingBooks ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Đang tải danh sách tác phẩm của bạn...
                  </div>
                ) : myBooks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '13px' }}>
                    Bạn chưa đóng góp tác phẩm nào cho hệ thống thư viện.
                  </div>
                ) : (
                  myBooks.map((book) => (
                    <div
                      key={book._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: darkMode ? '#0f172a' : '#f8fafc',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'}
                          alt={book.title}
                          style={{ width: '42px', height: '56px', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: darkMode ? '#f8fafc' : '#0f172a' }}>
                            {book.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                            {typeof book.author === 'string' ? book.author : book.author?.name} • {book.total_chapters || 1} chương
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: book.is_published ? '#dcfce7' : '#fef3c7',
                          color: book.is_published ? '#15803d' : '#b45309',
                        }}>
                          {book.is_published ? '✓ ĐÃ DUYỆT' : '⏳ CHỜ DUYỆT'}
                        </span>

                        <button
                          type="button"
                          onClick={async () => {
                            // Gọi API lấy đầy đủ chi tiết bao gồm các chương
                            try {
                              const res = await axios.get(`https://librify-backend.onrender.com/api/books/${book._id}?userId=${currentUser?._id || currentUser?.id}`);
                              if (res.data?.success) {
                                setPreviewBook(res.data.data);
                              } else {
                                setPreviewBook(book);
                              }
                            } catch (e) {
                              setPreviewBook(book);
                            }
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '7px',
                            border: 'none',
                            background: '#6366f1',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}