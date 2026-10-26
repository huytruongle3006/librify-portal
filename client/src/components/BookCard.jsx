import React from 'react';

export default function BookCard({ book, onOpen, darkMode, isFavorited, onToggleFavorite }) {
  return (
    <div
      onClick={() => onOpen(book._id)}
      style={{
        background: darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '390px',
        boxShadow: darkMode ? '0 4px 14px rgba(0,0,0,0.25)' : '0 4px 14px rgba(0,0,0,0.04)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = darkMode
          ? '0 12px 24px rgba(0,0,0,0.45)'
          : '0 12px 24px rgba(99, 102, 241, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = darkMode
          ? '0 4px 14px rgba(0,0,0,0.25)'
          : '0 4px 14px rgba(0,0,0,0.04)';
      }}
    >
      {/* Vùng ảnh bìa sách */}
      <div style={{ position: 'relative', width: '100%', height: '200px', flexShrink: 0, background: '#0f172a' }}>
        <img
          src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80'}
          alt={book.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />

        {/* Nút yêu thích */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onToggleFavorite === 'function') {
              onToggleFavorite(book._id);
            }
          }}
          title={isFavorited ? 'Bỏ yêu thích' : 'Lưu vào tủ sách'}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isFavorited ? '#ef4444' : '#ffffff',
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <i className={isFavorited ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
        </button>

        {/* Huy hiệu số chương */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#38bdf8',
          }}
        >
          {book.total_chapters || book.chapters?.length || 6} chương
        </div>
      </div>

      {/* Thông tin tác phẩm & chân thẻ */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '800',
              lineHeight: '1.4',
              marginBottom: '6px',
              color: darkMode ? '#f8fafc' : '#0f172a',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              minHeight: '38px',
            }}
          >
            {book.title}
          </h3>
          <p
            style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '0 0 10px 0',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {book.author?.name || 'Nhiều tác giả'}
          </p>

          {/* Thẻ thể loại hiển thị đầy đủ, không bị giới hạn 95px */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                background: darkMode ? '#334155' : '#f1f5f9',
                color: darkMode ? '#38bdf8' : '#4f46e5',
                padding: '3px 8px',
                borderRadius: '6px',
                fontWeight: '700',
                display: 'inline-block',
                maxWidth: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              🏷️ {book.categories?.[0] || 'Chuyên đề'}
            </span>
          </div>
        </div>

        {/* Chân thẻ: Nút Đọc ngay trải đều toàn chiều rộng */}
        <div
          style={{
            paddingTop: '12px',
            marginTop: 'auto',
            borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'}`,
          }}
        >
          <span
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '12px',
              fontWeight: '700',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              padding: '8px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.28)',
              transition: 'opacity 0.2s',
            }}
          >
            Đọc ngay <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }}></i>
          </span>
        </div>
      </div>
    </div>
  );
}