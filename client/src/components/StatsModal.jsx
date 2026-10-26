import React from 'react';

export default function StatsModal({
  isOpen,
  onClose,
  statsData,
  userCompletedCount = 0,
  favoriteCount = 0,
  darkMode = true,
}) {
  if (!isOpen) return null;

  // Lấy danh sách thể loại từ statsData
  const categoriesList = Array.isArray(statsData)
    ? statsData
    : (statsData?.categoryStats || []);

  const completedCount = statsData?.userCompletedCount ?? userCompletedCount ?? 0;
  const totalBooksCount = 60; // Hoặc lấy từ statsData?.totalBooks nếu có
  const completionRate = totalBooksCount > 0 
    ? ((completedCount / totalBooksCount) * 100).toFixed(1) 
    : '0.0';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: darkMode ? '#1e293b' : '#ffffff',
          color: darkMode ? '#f8fafc' : '#0f172a',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '620px',
          boxShadow: darkMode
            ? '0 20px 45px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 20px 45px -15px rgba(0,0,0,0.15)',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
        }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
            <i className="fa-solid fa-chart-pie" style={{ fontSize: '20px' }}></i>
            <span>Thống Kê Thư Viện Số</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: darkMode ? '#334155' : '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: darkMode ? '#cbd5e1' : '#64748b',
              fontSize: '15px',
              transition: 'background 0.2s',
            }}
          >
            ✕
          </button>
        </div>

        {/* Lưới 4 Thẻ Đo Lường Tóm Tắt */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {/* 1. Sách đã hoàn thành */}
          <div
            style={{
              background: darkMode ? '#0f172a' : '#f8fafc',
              padding: '14px 12px',
              borderRadius: '12px',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Đã hoàn thành
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              {completedCount} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>cuốn</span>
            </div>
          </div>

          {/* 2. Yêu thích */}
          <div
            style={{
              background: darkMode ? '#0f172a' : '#f8fafc',
              padding: '14px 12px',
              borderRadius: '12px',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Yêu thích
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f43f5e', marginTop: '4px' }}>
              {favoriteCount} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>cuốn</span>
            </div>
          </div>

          {/* 3. Tổng kho */}
          <div
            style={{
              background: darkMode ? '#0f172a' : '#f8fafc',
              padding: '14px 12px',
              borderRadius: '12px',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Tổng kho
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#6366f1', marginTop: '4px' }}>
              {totalBooksCount} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>cuốn</span>
            </div>
          </div>

          {/* 4. Tỷ lệ hoàn thành */}
          <div
            style={{
              background: darkMode ? '#0f172a' : '#f8fafc',
              padding: '14px 12px',
              borderRadius: '12px',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>
              Tiến độ
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>
              {completionRate}%
            </div>
            {/* Thanh tiến độ mini */}
            <div style={{ width: '100%', height: '4px', background: darkMode ? '#334155' : '#e2e8f0', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Number(completionRate))}%`, height: '100%', background: '#38bdf8' }}></div>
            </div>
          </div>
        </div>

        {/* Bảng Chi Tiết Phân Bổ Thể Loại */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: darkMode ? '#cbd5e1' : '#475569', marginBottom: '10px' }}>
            Phân bổ thể loại (MongoDB Aggregation)
          </div>

          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              borderRadius: '12px',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}`,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: darkMode ? '#0f172a' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '700' }}>Thể loại</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'center' }}>Số lượng sách</th>
                  <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Số chương TB</th>
                </tr>
              </thead>
              <tbody>
                {categoriesList.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc'}`,
                      color: darkMode ? '#e2e8f0' : '#1e293b',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      {item._id || item.category || 'Chuyên mục'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6366f1', fontWeight: '700' }}>
                      {item.count || 0} cuốn
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      {Math.round(item.avgChapters || 6)} chương
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}