const Book = require('../models/Book');

// Hàm bổ trợ gọi Gemini API với cơ chế tự động chuyển sang model dự phòng nếu bị 503
async function generateWithFallback(promptText, apiKey) {
  // Danh sách các model khả dụng sắp xếp theo độ ưu tiên
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash'
  ];

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      console.warn(`Model ${modelName} trả về lỗi, chuyển model tiếp theo:`, data.error?.message || data);
      lastError = data.error?.message || 'Lỗi không xác định từ model';
    } catch (err) {
      console.warn(`Lỗi kết nối tới model ${modelName}:`, err.message);
      lastError = err.message;
    }
  }

  throw new Error(lastError || 'Tất cả các model AI hiện đang bận');
}

// 1. Tóm tắt sách
exports.summarizeBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu bookId' });
    }

    const book = await Book.findById(bookId).select('title author chapters description');
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tác phẩm' });
    }

    let contentSample = '';
    if (book.chapters && book.chapters.length > 0) {
      contentSample = book.chapters
        .slice(0, 3)
        .map((ch, idx) => `[Chương ${idx + 1}: ${ch.title || ''}]\n${(ch.content || ch.description || '').slice(0, 800)}`)
        .join('\n\n');
    } else {
      contentSample = book.description || 'Không có mô tả chi tiết.';
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

    const summary = await generateWithFallback(promptText, apiKey);

    return res.status(200).json({
      success: true,
      summary
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
    const reply = await generateWithFallback(promptText, apiKey);

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