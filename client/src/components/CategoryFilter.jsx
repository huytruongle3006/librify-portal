import React, { useRef } from 'react';

export default function CategoryFilter({ categories = [], selectedCategory, onSelectCategory, darkMode }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
      {/* Nút cuộn sang trái */}
      <button
        onClick={() => scroll('left')}
        title="Xem danh mục trước"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
          background: darkMode ? '#1e293b' : '#f1f5f9',
        
          color: darkMode ? '#f8fafc' : '#0f172a',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          marginRight: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          zIndex: 2,
        }}
      >
        ‹
      </button>

      {/* Dãy nút danh mục trượt ngang */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          width: '100%',
          minWidth: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '4px 0',
        }}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              display: none !important;
            }
          `}
        </style>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: isSelected ? '700' : '500',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                background: isSelected
                  ? '#4f46e5'
                  : darkMode
                    ? '#1e293b'
                    : '#ffffff',
                color: isSelected
                  ? '#ffffff'
                  : darkMode
                    ? '#94a3b8'
                    : '#475569',
                border: isSelected
                  ? '1px solid #4f46e5'
                  : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                boxShadow: isSelected
                  ? '0 2px 8px rgba(79, 70, 229, 0.25)'
                  : 'none',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Nút cuộn sang phải */}
      <button
        onClick={() => scroll('right')}
        title="Xem thêm danh mục"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          background: darkMode ? '#1e293b' : '#ffffff',
         
          color: darkMode ? '#cbd5e1' : '#334155',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          zIndex: 2,
        }}
      >
        ›
      </button>
    </div>
  );
}