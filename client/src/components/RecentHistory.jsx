import React from 'react';

export default function RecentHistory({ recentBooks = [], onOpenBook, darkMode }) {
  if (!recentBooks || recentBooks.length === 0) return null;

  return (
    <div
      style={{
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '28px',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
        boxShadow: darkMode ? 'none' : '0 2px 6px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          color: '#6366f1',
          fontSize: '13px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <i className="fa-solid fa-clock-rotate-left"></i> Vừa đọc gần đây (Redis List)
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {recentBooks.map((item) => (
          <div
            key={item._id}
            onClick={() => onOpenBook(item._id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: darkMode ? '#0f172a' : '#f8fafc',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.04)' : '#e2e8f0'}`,
              cursor: 'pointer',
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = darkMode ? '#334155' : '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = darkMode ? '#0f172a' : '#f8fafc';
            }}
          >
            <img
              src={item.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80'}
              alt={item.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';
              }}
              style={{
                width: '44px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '6px',
                flexShrink: 0,
                background: '#334155',
              }}
            />

            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '4px',
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.author?.name || 'Nhiều tác giả'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}