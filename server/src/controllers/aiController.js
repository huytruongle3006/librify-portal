const { GoogleGenerativeAI } = require('@google/generative-ai');
const Book = require('../models/Book');
const { redisClient } = require('../config/redis');

// Khởi tạo Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 1. Tóm tắt sách (Ưu tiên lấy từ cache Redis nếu đã từng tóm tắt)
exports.summarizeBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu bookId' });
    }

    // 1.1 Kiểm tra cache trong Redis để tiết kiệm lượt gọi API
    const cacheKey = `cache:summary:${bookId}`;
    try {
      const cachedSummary = await redisClient.get(cacheKey);
      if (cachedSummary) {
        return res.status(200).json({
          success: true,
          source: 'cache',
          summary: cachedSummary,
        });
      }
    } catch (cacheErr) {
      console.warn('Lỗi đọc Redis cache tóm tắt:', cacheErr.message);
    }

    // 1.2 Lấy thông tin và nội dung các chương từ MongoDB
    const book = await Book.findById(bookId).select('title author chapters description');
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Ghép một phần nội dung tiêu biểu (lấy mô tả hoặc tối đa 2 chương đầu để tránh tràn token)
    let contentSample = '';
    if (book.chapters && book.chapters.length > 0) {
      contentSample = book.chapters
        .slice(0, 3)
        .map((ch, idx) => `[Chương ${idx + 1}: ${ch.title}]\n${(ch.content || ch.description || '').slice(0, 800)}`)
        .join('\n\n');
    } else {
      contentSample = book.description || 'Không có mô tả chi tiết.';
    }

    const prompt = `Bạn là trợ lý ảo đọc sách chuyên nghiệp của thư viện Librify.
Hãy tóm tắt tác phẩm sau một cách hấp dẫn, súc tích trong khoảng 3 đến 5 gạch đầu dòng ngắn gọn và nêu bật thông điệp/nội dung chính.

Tên sách: "${book.title}"
Tác giả: ${book.author?.name || book.author || 'Chưa rõ'}
Nội dung tiêu biểu:
${contentSample}`;

 const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // 1.3 Lưu vào Redis cache với thời gian sống 7 ngày (604800 giây)
    try {
      await redisClient.set(cacheKey, summary, { EX: 604800 });
    } catch (cacheErr) {
      console.warn('Lỗi ghi Redis cache tóm tắt:', cacheErr.message);
    }

    return res.status(200).json({
      success: true,
      source: 'gemini',
      summary,
    });
  } catch (error) {
    console.error('Lỗi summarizeBook:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý tóm tắt với Gemini AI',
    });
  }
};

// 2. Chatbot tư vấn và gợi ý sách theo sở thích người đọc
exports.chatWithAssistant = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    // Lấy danh sách các tác phẩm hiện có trong thư viện để Gemini đưa ra gợi ý chuẩn xác
    const books = await Book.find({ is_published: true })
      .select('title author categories')
      .limit(30)
      .lean();

    const bookCatalog = books
      .map((b) => `- "${b.title}" (Tác giả: ${b.author?.name || b.author || 'Chưa rõ'}, Thể loại: ${(b.categories || []).join(', ')})`)
      .join('\n');

    const systemInstruction = `Bạn là Trợ lý Ảo thủ thư của nền tảng đọc sách Librify.
Nhiệm vụ của bạn:
1. Trả lời thân thiện, lịch sự, đóng vai trò là một người bạn cùng đọc sách.
2. Dưới đây là danh mục sách thực tế hiện có trong thư viện:
${bookCatalog}

3. Nếu người dùng hỏi xin gợi ý sách, hãy ưu tiên gợi ý các tác phẩm có trong danh mục trên và giải thích ngắn gọn lý do phù hợp. Nếu không có sách phù hợp hoàn toàn, hãy đưa ra gợi ý liên quan và khuyên họ tìm đọc thêm.
4. Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, có ngắt đoạn dễ đọc.`;

// Đổi dòng khai báo model thành:
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Tạo phiên chat
    const chat = model.startChat({
      history: Array.isArray(history) ? history : [],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Lỗi chatWithAssistant:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi trò chuyện với Gemini AI',
    });
  }
};