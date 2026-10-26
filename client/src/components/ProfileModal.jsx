import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdateUser, darkMode }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra tính hợp lệ khi người dùng có ý định đổi mật khẩu
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

      // Chuẩn bị payload chuẩn xác
      const payload = {
        userId: currentUser?._id || currentUser?.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        avatar: formData.avatar.trim(),
      };

      // Chỉ gửi thông tin mật khẩu lên nếu người dùng thực sự muốn đổi mật khẩu
      if (isChangingPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await axios.put('http://localhost:5000/api/users/profile', payload);

      if (res.data?.success) {
        alert('🎉 ' + res.data.message);
        // Cập nhật lại thông tin ở App.jsx và localStorage
        onUpdateUser(res.data.data);
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
      background: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        width: '460px',
        maxWidth: '92%',
        color: darkMode ? '#f8fafc' : '#0f172a',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      }}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-user-pen" style={{ color: '#6366f1' }}></i>
            Thông Tin Cá Nhân
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            paddingTop: '14px',
            marginTop: '6px',
          }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#6366f1', marginBottom: '10px' }}>
              Thay đổi Mật Khẩu (Để trống nếu không đổi)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

          {/* Nút hành động */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
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
      </div>
    </div>
  );
}