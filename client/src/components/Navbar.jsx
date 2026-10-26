import React, { useState } from 'react';
import ContributeModal from './ContributeModal';
import ProfileModal from './ProfileModal';
export default function Navbar({
  onHomeClick,
  searchQuery,
  setSearchQuery,
  showSearch,
  onOpenStats,
  currentUser,
  onUpdateUser,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  darkMode,
  onToggleTheme,
  onBookCreated, // Nhận callback để refresh sách khi độc giả đăng thành công
}) {
  // KHAI BÁO STATE PHẢI NẰM TẠI ĐÂY (TRƯỚC RETURN)
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  return (
    <>
      <nav style={{
        background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '14px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease'
      }}>
        {/* Logo & Tên thương hiệu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onHomeClick}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          }}>
            <i className="fa-solid fa-book-open" style={{ color: '#fff', fontSize: '18px' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: darkMode ? '#f8fafc' : '#0f172a' }}>
              LIBRIFY
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '-2px' }}>THƯ VIỆN SỐ TRỰC TUYẾN</div>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        {showSearch && (
          <div style={{ position: 'relative', width: '380px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}></i>
            <input
              type="text"
              placeholder="Tìm kiếm tác phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 16px 9px 38px',
                borderRadius: '24px',
                background: darkMode ? '#1e293b' : '#f1f5f9',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                color: darkMode ? '#f8fafc' : '#0f172a',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
          </div>
        )}

        {/* Nhóm thao tác bên phải */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Nút Đổi Dark / Light Mode */}
          <button
            onClick={onToggleTheme}
            title={darkMode ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}
            style={{
              background: darkMode ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
              color: darkMode ? '#fbbf24' : '#64748b',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s',
            }}
          >
            <i className={darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
          </button>

          {/* 1. NÚT ĐÓNG GÓP SÁCH ĐÃ ĐƯỢC LÀM ĐẸP */}
          <button
            onClick={() => setIsContributeOpen(true)}
            style={{
              background: darkMode
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              boxShadow: darkMode
                ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                : '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode
                ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                : '0 4px 12px rgba(5, 150, 105, 0.25)';
            }}
          >
            <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '14px' }}></i>
            <span>Đóng Góp Sách</span>
          </button>

          {/* Nút Thống kê (giữ nguyên) */}
          <button
            onClick={onOpenStats}
            style={{
              background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
              border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`,
              color: '#10b981',
              padding: '7px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-chart-pie"></i> Thống kê
          </button>
          {/* Nút Trang Quản Trị (nếu là Admin) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)',
              }}
            >
              Trang Quản Trị
            </button>
          )}

          {currentUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px 6px 4px 12px',
                borderRadius: '14px',
                background: darkMode ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
                border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Bấm vào Avatar hoặc Họ tên để mở cửa sổ chỉnh sửa thông tin */}
              <div
                onClick={() => setIsProfileOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                title="Bấm để chỉnh sửa thông tin cá nhân"
              >
                {/* KHỐI HIỂN THỊ AVATAR: HÌNH ẢNH HOẶC CHỮ CÁI ĐẦU */}
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.full_name || currentUser.username}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0'}`,
                    }}
                    onError={(e) => {
                      // Khi link ảnh bị lỗi hoặc chết, ẩn thẻ img để fallback hiển thị an toàn
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: currentUser?.role === 'admin'
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {(currentUser?.full_name || currentUser?.username || 'H')[0]}
                  </div>
                )}

                <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      letterSpacing: '-0.2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {currentUser.full_name || currentUser.username}
                    <i className="fa-solid fa-pen-to-square" style={{ fontSize: '11px', color: '#94a3b8' }}></i>
                  </div>
                  <div style={{ marginTop: '3px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        background: currentUser.role === 'admin'
                          ? (darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7')
                          : (darkMode ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5'),
                        color: currentUser.role === 'admin' ? '#f59e0b' : '#059669',
                        border: `1px solid ${currentUser.role === 'admin'
                            ? (darkMode ? 'rgba(245, 158, 11, 0.3)' : '#fde68a')
                            : (darkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0')
                          }`,
                      }}
                    >
                      {currentUser.role === 'admin' ? '⭐ Quản trị viên' : '📖 Độc giả'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Đăng xuất */}
              <button
                onClick={onLogout}
                style={{
                  background: darkMode ? '#334155' : '#ffffff',
                  border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                  color: darkMode ? '#cbd5e1' : '#64748b',
                  padding: '7px 11px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Thoát</span>
              </button>
            </div>

          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: '#4f46e5',
                border: 'none',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
              }}
            >
              Đăng Nhập
            </button>
          )}
        </div>
      </nav>

      {/* Modal Đóng Góp Sách */}
      <ContributeModal
        isOpen={isContributeOpen}
        onClose={() => setIsContributeOpen(false)}
        currentUser={currentUser}
        darkMode={darkMode}
        onSuccess={() => {
          if (onBookCreated) onBookCreated();
        }}
      />
      {/* Modal Chỉnh Sửa Thông Tin Cá Nhân */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
        darkMode={darkMode}
      />
    </>
  );
}