const Book = require('../models/Book');

// Tự động nạp Redis Client từ cấu hình hệ thống
let redisClient;
try {
  const redisModule = require('../config/redis');
  redisClient = redisModule.redisClient || redisModule.client || redisModule;
} catch (err) {
  console.warn('Không thể nạp Redis Client, hệ thống sẽ chạy ở chế độ không Cache:', err.message);
}

// 1. Tóm tắt sách (Bộ nhớ đệm Redis - 0 Token cho các lần gọi lặp lại)
exports.summarizeBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu bookId' });
    }

    const cacheKey = `summary:book:${bookId}`;

    // ========================================================
    // ⚡ BƯỚC 1: KIỂM TRA BỘ NHỚ ĐỆM REDIS
    // ========================================================
    if (redisClient) {
      try {
        const cachedSummary = await redisClient.get(cacheKey);
        if (cachedSummary) {
          console.log(`⚡ [REDIS CACHE HIT] Lấy tóm tắt từ Redis cho sách: ${bookId}`);
          return res.status(200).json({
            success: true,
            summary: cachedSummary,
            cached: true
          });
        }
      } catch (redisErr) {
        console.warn('Lỗi khi đọc từ Redis:', redisErr.message);
      }
    }

    // ========================================================
    // BƯỚC 2: TRUY VẤN MONGODB NẾU CHƯA CÓ TRONG REDIS
    // ========================================================
    const book = await Book.findById(bookId).select('title author chapters description');
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tác phẩm' });
    }

    let contentSample = '';
    if (book.chapters && book.chapters.length > 0) {
      contentSample = book.chapters
        .slice(0, 2)
        .map((ch, idx) => `[Chương ${idx + 1}: ${ch.title || ''}]\n${(ch.content || ch.description || '').slice(0, 500)}`)
        .join('\n\n');
    } else {
      contentSample = (book.description || 'Không có mô tả chi tiết.').slice(0, 800);
    }

    const promptText = `Bạn là trợ lý ảo của thư viện số Librify.
Hãy tóm tắt tác phẩm sau một cách hấp dẫn, súc tích trong 3 đến 5 gạch đầu dòng ngắn gọn và nêu bật thông điệp chính:

Tên sách: "${book.title}"
Tác giả: ${book.author?.name || book.author || 'Chưa rõ'}
Nội dung tiêu biểu:
${contentSample}`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ' });
    }

    // Gọi Gemini API phân tích nội dung
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            maxOutputTokens: 400,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ Gemini API:', data.error);
      return res.status(response.status).json({
        success: false,
        message: data.error?.message || 'Dịch vụ AI đang bận, vui lòng thử lại sau.'
      });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không thể tạo nội dung tóm tắt.';

    // ========================================================
    // 💾 BƯỚC 3: LƯU VÀO REDIS (Hạn lưu trữ: 7 ngày = 604800 giây)
    // ========================================================
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, summary, { EX: 60 * 60 * 24 * 7 });
        console.log(`💾 [REDIS CACHED] Đã lưu tóm tắt vào Redis key: ${cacheKey}`);
      } catch (saveRedisErr) {
        console.warn('Lỗi khi ghi dữ liệu vào Redis:', saveRedisErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      summary,
      cached: false
    });
  } catch (error) {
    console.error('Lỗi controller summarizeBook:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý tóm tắt phía máy chủ'
    });
  }
};

// 2. Chatbot tư vấn sách
exports.chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    const books = await Book.find({ is_published: true })
      .select('title author categories')
      .limit(30)
      .lean();

    const bookCatalog = books
      .map((b) => `- "${b.title}" (Tác giả: ${b.author?.name || b.author || 'Chưa rõ'}, Thể loại: ${(b.categories || []).join(', ')})`)
      .join('\n');

    const promptText = `Bạn là Trợ lý Thủ thư thông thái của thư viện số Librify.
Danh mục sách hiện có trong hệ thống:
${bookCatalog}

Câu hỏi của độc giả: "${message}"

Hãy trả lời lịch sự, thân thiện bằng tiếng Việt tự nhiên và ưu tiên gợi ý các cuốn sách thực tế có trong danh mục trên.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Lỗi chat Gemini API:', data.error);
      return res.status(response.status).json({
        success: false,
        message: data.error?.message || 'Trợ lý AI đang bận, bạn thử lại sau ít giây nhé.'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Rất tiếc, mình chưa thể đưa ra câu trả lời lúc này.';

    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    console.error('Lỗi controller chatWithAssistant:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi máy chủ khi xử lý chat'
    });
  }
};