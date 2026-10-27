import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function AIChatBot({ darkMode, currentBook = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Xin chào! Mình là thủ thư ảo của Librify. Bạn cần tìm sách thể loại gì hay muốn mình gợi ý gì không?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Gửi câu hỏi tư vấn / gợi ý sách
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await axios.post('https://librify-backend.onrender.com/api/ai/chat', {
        message: userText,
      });

      if (res.data?.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Có lỗi xảy ra khi kết nối tới trợ lý AI, bạn thử lại sau nhé!' },
        ]);
      }
    } catch (err) {
      console.error('Lỗi gọi AI Chat:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Không thể kết nối đến máy chủ AI lúc này.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Yêu cầu AI tóm tắt nhanh tác phẩm hiện tại
  const handleQuickSummarize = async () => {
    if (!currentBook?._id || loading) return;
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: `Tóm tắt giúp mình cuốn "${currentBook.title}"` },
    ]);

    try {
      const res = await axios.post('https://librify-backend.onrender.com/api/ai/summarize', {
        bookId: currentBook._id,
      });

      if (res.data?.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: res.data.summary }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Chưa thể tạo tóm tắt cho cuốn sách này.' },
        ]);
      }
    } catch (err) {
      console.error('Lỗi summarize:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Lỗi trong quá trình phân tích và tóm tắt.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      {/* Cửa sổ chat */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            right: 0,
            width: '360px',
            height: '520px',
            background: darkMode ? '#1e293b' : '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: '#6366f1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                ✨
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>Librify AI Assistant</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Trợ lý đọc sách thông minh</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Gợi ý nút tóm tắt nhanh nếu đang mở sách */}
          {currentBook && (
            <div
              style={{
                padding: '8px 16px',
                background: darkMode ? '#0f172a' : '#f1f5f9',
                borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                📖 {currentBook.title}
              </span>
              <button
                onClick={handleQuickSummarize}
                disabled={loading}
                style={{
                  padding: '4px 10px',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                Tóm tắt sách ✨
              </button>
            </div>
          )}

          {/* Khung tin nhắn */}
          <div
            style={{
              flexGrow: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius:
                    msg.sender === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background:
                    msg.sender === 'user'
                      ? '#6366f1'
                      : darkMode
                      ? '#334155'
                      : '#f1f5f9',
                  color:
                    msg.sender === 'user'
                      ? '#ffffff'
                      : darkMode
                      ? '#f8fafc'
                      : '#1e293b',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  background: darkMode ? '#334155' : '#f1f5f9',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  fontSize: '12px',
                  fontStyle: 'italic',
                }}
              >
                AI đang suy nghĩ và phản hồi...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px',
              borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              gap: '8px',
              background: darkMode ? '#1e293b' : '#ffffff',
            }}
          >
            <input
              type="text"
              placeholder="Hỏi về sách, gợi ý tác phẩm..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              style={{
                flexGrow: 1,
                padding: '9px 14px',
                borderRadius: '10px',
                border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
                background: darkMode ? '#0f172a' : '#f8fafc',
                color: darkMode ? '#f8fafc' : '#0f172a',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              style={{
                background: '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0 14px',
                fontWeight: '700',
                cursor: loading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !inputMessage.trim() ? 0.5 : 1,
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}

      {/* Nút bấm tròn mở Chatbot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        title="Trợ lý Gemini AI"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}