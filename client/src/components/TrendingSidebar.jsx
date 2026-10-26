import React from 'react';

export default function TrendingSidebar({ trending = [], onRefresh, onOpenBook, darkMode }) {
  return (
    <div
      style={{
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        padding: '22px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
        boxShadow: darkMode ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: darkMode ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#ef4444' }}>🔥</span> Thịnh Hành Nhất
        </h3>
        <button
          onClick={onRefresh}
          style={{
            background: 'none',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            color: darkMode ? '#94a3b8' : '#64748b',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '600',
          }}
        >
          <i className="fa-solid fa-rotate-right"></i> Cập nhật
        </button>
      </div>

      {trending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '13px' }}>
          <i className="fa-solid fa-chart-line" style={{ fontSize: '24px', marginBottom: '10px', display: 'block', opacity: 0.5 }}></i>
          Chưa có bảng xếp hạng hôm nay.<br />Hãy mở đọc sách để tạo điểm xếp hạng!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trending.slice(0, 10).map((item, index) => {
            const isTop3 = index < 3;
            const rankBadgeColors = ['#f59e0b', '#64748b', '#b45309'];

            return (
              <div
                key={item.bookId || index}
                onClick={() => onOpenBook(item.bookId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: darkMode ? '#0f172a' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'transparent'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? '#0f172a' : '#f8fafc';
                }}
              >
                {/* Thứ hạng */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: isTop3 ? rankBadgeColors[index] : (darkMode ? '#334155' : '#e2e8f0'),
                    color: isTop3 ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '800',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                {/* Tiêu đề & tác giả */}
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.author}
                  </div>
                </div>

                {/* Điểm lượt đọc */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-regular fa-eye" style={{ fontSize: '11px' }}></i>
                  {item.score || 0}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}