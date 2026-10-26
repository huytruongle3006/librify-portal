import React, { useState } from 'react';
import axios from 'axios';

const AVAILABLE_CATEGORIES = [
    'Khoa học máy tính',
    'Công nghệ thông tin',
    'Cơ sở dữ liệu',
    'Hệ thống phân tán',
    'Kiến trúc phần mềm',
    'An toàn thông tin',
];
export default function ContributeModal({ isOpen, onClose, currentUser, darkMode, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        categories: 'Khoa học máy tính',
        description: '',
        cover_image: '',
    });

    // Quản lý danh sách nhiều chương dưới dạng mảng
    const [chapters, setChapters] = useState([
        { title: 'Chương 1: Mở đầu & Khởi tạo', total_pages: 20, content: '' }
    ]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // Thêm một chương mới vào form
    const handleAddChapterField = () => {
        const nextIndex = chapters.length + 1;
        setChapters([
            ...chapters,
            { title: `Chương ${nextIndex}: Nội dung tiếp theo`, total_pages: 20, content: '' }
        ]);
    };

    // Xóa bớt một chương
    const handleRemoveChapterField = (index) => {
        if (chapters.length === 1) {
            alert('Tác phẩm phải có tối thiểu 1 chương!');
            return;
        }
        setChapters(chapters.filter((_, i) => i !== index));
    };

    // Cập nhật giá trị từng chương
    const handleChapterChange = (index, field, value) => {
        const updated = [...chapters];
        updated[index][field] = value;
        setChapters(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert('Vui lòng nhập tên tác phẩm!');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                chapters: chapters.map((ch, idx) => ({
                    chapter_number: idx + 1,
                    title: ch.title?.trim() || `Chương ${idx + 1}`,
                    total_pages: Number(ch.total_pages) || 15,
                    content: ch.content && ch.content.trim() !== ''
                        ? ch.content.trim()
                        : `Nội dung chi tiết của chương ${idx + 1}...`,
                })),
                userId: currentUser?._id || currentUser?.id,
                userName: currentUser?.full_name || currentUser?.fullName || currentUser?.name || currentUser?.username || 'Le Truong Huy',
                // Admin tạo thì tự động ĐÃ DUYỆT (true), độc giả tạo thì CHỜ DUYỆT (false)
                is_published: currentUser?.role === 'admin',
            };
            const res = await axios.post('https://librify-backend.onrender.com/api/books/contribute', payload);

            if (res.data?.success) {
                alert('🎉 ' + res.data.message);
                onClose();
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            alert('Lỗi đăng sách: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
        }}>
            <div style={{
                background: darkMode ? '#1e293b' : '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                width: '680px',
                maxWidth: '92%',
                maxHeight: '88vh',
                overflowY: 'auto',
                border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                color: darkMode ? '#f8fafc' : '#0f172a',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                        📖 Đóng Góp Tác Phẩm & Nội Dung Toàn Văn
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>
                {/* KHUNG QUY ĐỊNH & HƯỚNG DẪN ĐĂNG TẢI TÁC PHẨM */}
                <div
                    style={{
                        background: darkMode ? 'rgba(99, 102, 241, 0.08)' : '#f8faff',
                        border: `1px solid ${darkMode ? '#3730a3' : '#c7d2fe'}`,
                        borderRadius: '12px',
                        padding: '16px 18px',
                        marginTop: '18px',
                        marginBottom: '10px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#4f46e5',
                            fontWeight: '800',
                            fontSize: '14px',
                            marginBottom: '10px',
                        }}
                    >
                        <i className="fa-solid fa-circle-info" style={{ fontSize: '16px' }}></i>
                        <span>QUY ĐỊNH ĐĂNG TẢI & HƯỚNG DẪN SOẠN THẢO TRANG ĐỌC</span>
                    </div>

                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '13px',
                            lineHeight: '1.7',
                            color: darkMode ? '#cbd5e1' : '#334155',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                        }}
                    >
                        <li>
                            <strong>Quy cách ngắt trang (Trình đọc sách):</strong> Để nội dung chương được phân tách chính xác theo từng trang, hãy gõ 3 dấu gạch ngang (
                            <code
                                style={{
                                    background: darkMode ? '#334155' : '#e0e7ff',
                                    color: '#4f46e5',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                }}
                            >
                                ---
                            </code>
                            ) trên một dòng riêng biệt ở mỗi điểm kết thúc trang. Hệ thống đọc sách sẽ căn cứ vào ký hiệu này để lật trang.
                        </li>

                        <li>
                            <strong>Chính sách phê duyệt:</strong> Mọi tác phẩm đóng góp từ độc giả sẽ ở trạng thái{' '}
                            <span
                                style={{
                                    background: '#fef3c7',
                                    color: '#d97706',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                }}
                            >
                                CHỜ DUYỆT
                            </span>
                            . Quản trị viên sẽ kiểm tra nội dung và bản quyền trước khi kích hoạt hiển thị công khai trên hệ thống Thư viện.
                        </li>

                        <li>
                            <strong>Tiêu chuẩn nội dung:</strong> Không đăng tải tác phẩm vi phạm bản quyền, nội dung bạo lực, phản cảm hoặc chứa liên kết độc hại.
                        </li>
                        <li>
                            <strong>Đồng bộ Số trang & Nội dung:</strong> Nếu bạn thiết lập <em>Tổng Số  Trang</em>   lớn hơn số lượng trang văn bản thực tế soạn thảo, các trang chưa có nội dung sẽ tự động hiển thị thông báo <em>"Nội dung đang được biên soạn thêm"</em> khi độc giả lật tới. Hãy đảm bảo bổ sung đủ các đoạn ngắt trang (<code>---</code>) tương ứng với tổng số trang dự kiến.
                        </li>
                    </ul>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '700' }}>Tên Sách / Tác Phẩm *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ví dụ: Lập trình hướng đối tượng với Java..."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700' }}>Tác Giả *</label>
                            <input
                                type="text"
                                required
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                placeholder="Tên tác giả..."
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                            />
                        </div>
                        {/* ĐOẠN MỚI DẠNG XỔ XUỐNG */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '700' }}>Thể Loại *</label>
                            <select
                                value={formData.categories}
                                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                                    background: darkMode ? '#0f172a' : '#ffffff',
                                    color: darkMode ? '#f8fafc' : '#0f172a',
                                    marginTop: '4px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    outline: 'none',
                                }}
                            >
                                {AVAILABLE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '700' }}>Link Ảnh Bìa (Tùy chọn)</label>
                        <input
                            type="text"
                            value={formData.cover_image}
                            onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: '700' }}>Mô Tả Tóm Tắt Tác Phẩm</label>
                        <textarea
                            rows="2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Giới thiệu nội dung chính..."
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                        />
                    </div>

                    {/* KHU VỰC THÊM NHIỀU CHƯƠNG */}
                    <div style={{ borderTop: `1px dashed ${darkMode ? '#334155' : '#cbd5e1'}`, paddingTop: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '800', color: '#6366f1' }}>
                                Danh Sách Chương Toàn Văn ({chapters.length} chương)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddChapterField}
                                style={{
                                    background: '#6366f1',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                + Thêm Chương Mới
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {chapters.map((ch, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '10px',
                                        background: darkMode ? '#0f172a' : '#f8fafc',
                                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700' }}>Chương {idx + 1}</span>
                                        {chapters.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveChapterField(idx)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                                            >
                                                ✕ Xóa chương
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '10px', marginBottom: '8px' }}>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Tiêu đề chương..."
                                            value={ch.title}
                                            onChange={(e) => handleChapterChange(idx, 'title', e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            placeholder="Số trang..."
                                            value={ch.total_pages}
                                            onChange={(e) => handleChapterChange(idx, 'total_pages', e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>

                                    <textarea
                                        rows="3"
                                        placeholder="Nội dung bài đọc chi tiết của chương này..."
                                        value={ch.content}
                                        onChange={(e) => handleChapterChange(idx, 'content', e.target.value)}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>



                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', cursor: 'pointer', color: darkMode ? '#fff' : '#000' }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                        >
                            {loading ? 'Đang gửi...' : 'Gửi Phê Duyệt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}