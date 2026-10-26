import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'https://librify-backend.onrender.com';

export default function BookReviews({ bookId, currentUser, darkMode }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ avgRating: 0, totalReviews: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bookId) fetchReviews();
  }, [bookId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/reviews/book/${bookId}`);
      if (res.data.success) {
        setReviews(res.data.data || []);
        setSummary(res.data.summary || { avgRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      console.error('Lỗi lấy đánh giá:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUserId = currentUser?._id || currentUser?.id;
    if (!currentUserId) return alert('Vui lòng đăng nhập để gửi nhận xét');
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/reviews`, {
        userId: currentUserId,
        bookId,
        rating,
        comment,
      });

      if (res.data.success) {
        setComment('');
        fetchReviews();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      marginTop: '32px',
      background: darkMode ? '#1e293b' : '#ffffff',
      padding: '28px',
      borderRadius: '16px',
      border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: darkMode ? '#f8fafc' : '#0f172a' }}>
            Nhận Xét & Đánh Giá Độc Giả
          </h3>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Dựa trên {summary.totalReviews} lượt đánh giá từ cộng đồng
          </span>
        </div>

        {summary.totalReviews > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: darkMode ? '#0f172a' : '#fef3c7', padding: '6px 14px', borderRadius: '10px', border: `1px solid ${darkMode ? '#334155' : '#fde68a'}` }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#d97706' }}>{summary.avgRating}</span>
            <span style={{ color: '#f59e0b', fontSize: '16px' }}>★</span>
          </div>
        )}
      </div>

      {/* Form viết đánh giá */}
      {currentUser ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#cbd5e1' : '#475569' }}>Chấm điểm:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: star <= rating ? '#f59e0b' : '#94a3b8',
                    padding: 0,
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>({rating}/5 sao)</span>
          </div>

          <textarea
            placeholder={`Chia sẻ cảm nhận của bạn về cuốn sách với vai trò ${currentUser.full_name || currentUser.username || 'độc giả'}...`}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              background: darkMode ? '#0f172a' : '#f8fafc',
              border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
              color: darkMode ? '#f8fafc' : '#0f172a',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '10px',
              resize: 'vertical',
            }}
            required
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: '#4f46e5',
              border: 'none',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '13px',
            }}
          >
            {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
          </button>
        </form>
      ) : (
        <div style={{ padding: '14px', borderRadius: '8px', background: darkMode ? '#0f172a' : '#f1f5f9', color: '#64748b', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
          Vui lòng <strong>Đăng nhập</strong> để tham gia đánh giá tác phẩm.
        </div>
      )}

      {/* Danh sách bình luận */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px' }}>
            Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên để lại nhận xét!
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev._id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: darkMode ? '#0f172a' : '#f8fafc',
                border: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '12px',
                  }}>
                    {rev.user_id?.full_name ? rev.user_id.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: darkMode ? '#f8fafc' : '#0f172a' }}>
                      {rev.user_id?.full_name || rev.user_id?.username || 'Độc giả ẩn danh'}
                    </span>
                  {/* DÒNG MỚI: Hỗ trợ cả created_at và createdAt */}
<span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
  {new Date(rev.created_at || rev.createdAt || Date.now()).toLocaleDateString('vi-VN')}
</span>
                  </div>
                </div>

                <div style={{ color: '#f59e0b', fontSize: '13px' }}>
                  {'★'.repeat(rev.rating)}
                  <span style={{ color: '#94a3b8' }}>{'★'.repeat(5 - rev.rating)}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: darkMode ? '#cbd5e1' : '#334155', lineHeight: '1.6' }}>
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}