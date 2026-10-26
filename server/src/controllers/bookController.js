const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const { redisClient } = require('../config/redis');

exports.createBook = async (req, res) => {
  try {
    const { title, slug, isbn, author, categories, description, cover_image } = req.body;

    const existingBook = await Book.findOne({ slug });
    if (existingBook) {
      return res.status(400).json({ success: false, message: 'Slug sách đã tồn tại' });
    }

    const book = await Book.create({
      title,
      slug,
      isbn,
      author,
      categories,
      description,
      cover_image,
      total_chapters: 0,
      chapters: [],
    });

    res.status(201).json({ success: true, message: 'Tạo sách thành công', data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thống kê thư viện số: Kết hợp MongoDB Aggregation Pipeline & Tiến độ hoàn thành của độc giả
exports.getLibraryStats = async (req, res) => {
  try {
    const { userId } = req.query;

    // 1. Thống kê theo chuyên mục bằng MongoDB Aggregation Pipeline
    const categoryStats = await Book.aggregate([
      { $match: { is_published: true } },
      { $unwind: { path: '$categories', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
          avgChapters: { $avg: '$total_chapters' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 2. Lấy số lượng sách độc giả hiện tại đã đọc xong (Có kiểm tra hợp lệ ObjectId)
    let userCompletedCount = 0;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).select('completed_books');
      if (user && Array.isArray(user.completed_books)) {
        userCompletedCount = user.completed_books.length;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        categoryStats: categoryStats || [],
        userCompletedCount,
      },
    });
  } catch (error) {
    console.error('Lỗi getLibraryStats:', error);
    // Phản hồi an toàn để tránh làm treo hoặc sập UI React
    res.status(200).json({
      success: true,
      data: {
        categoryStats: [],
        userCompletedCount: 0,
      },
    });
  }
};

// 1. LẤY DANH SÁCH SÁCH ĐÃ DUYỆT (Dành cho trang chủ / bạn đọc)
exports.getAllBooks = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, all } = req.query;

    // Nếu là Admin gọi (?all=true) thì lấy tất cả, ngược lại chỉ lấy sách đã duyệt
    const filter = all === 'true' ? {} : { is_published: true };

    if (category && category !== 'Tất cả') {
      filter.categories = category;
    }

    if (search && search.trim() !== '') {
      filter.$text = { $search: search.trim() };
    }

    const books = await Book.find(filter)

      .skip(all === 'true' ? 0 : (page - 1) * Number(limit))
      .limit(all === 'true' ? 0 : Number(limit))
      .sort({ createdAt: -1 });

    const total = await Book.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: books,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// 3. ĐỘC GIẢ ĐÓNG GÓP / ĐĂNG TẢI SÁCH MỚI (Mặc định is_published: false)
// Độc giả đóng góp / tải sách lên
exports.contributeBook = async (req, res) => {
  try {
    const {
      title,
      author,
      categories,
      description,
      cover_image,
      chapters,
      userId,
      userName,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tiêu đề sách là bắt buộc' });
    }

    const authorData = typeof author === 'string'
      ? { name: author.trim() }
      : { name: author?.name || 'Tác giả độc lập' };

    const categoriesData = Array.isArray(categories)
      ? categories
      : (typeof categories === 'string' && categories.trim() !== ''
        ? categories.split(',').map((c) => c.trim())
        : ['Khoa học máy tính']);

    const generatedSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-') + '-' + Date.now();

    const randomIsbn = '978-' + Math.floor(1000000000 + Math.random() * 9000000000);

    const formattedChapters = Array.isArray(chapters) && chapters.length > 0
      ? chapters.map((ch, index) => ({
        chapter_number: index + 1,
        title: ch.title || `Chương ${index + 1}`,
        slug: `chuong-${index + 1}`,
        total_pages: Number(ch.total_pages) || 20,
        content: ch.content || `Nội dung chương ${index + 1}...`,
        created_at: new Date(),
      }))
      : [{
        chapter_number: 1,
        title: 'Chương 1: Mở đầu & Khởi tạo',
        slug: 'chuong-1',
        total_pages: 20,
        content: 'Nội dung phân đoạn đầu tiên.',
        created_at: new Date(),
      }];

    const bookPayload = {
      title: title.trim(),
      slug: generatedSlug,
      isbn: randomIsbn,
      author: authorData,
      categories: categoriesData,
      description: description || 'Tác phẩm được đóng góp bởi độc giả.',
      cover_image: cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
      total_chapters: formattedChapters.length,
      chapters: formattedChapters,
      is_published: req.body.is_published !== undefined ? Boolean(req.body.is_published) : false,
      // Đảm bảo gán đúng tên uploader gửi từ client:
      uploader_name: userName || req.body?.userName || 'Độc giả đóng góp',
    };

    if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
      bookPayload.created_by = userId;
    }

    const newBook = await Book.create(bookPayload);

    return res.status(201).json({
      success: true,
      message: req.body.is_published ? 'Thêm và xuất bản tác phẩm thành công!' : 'Đăng tải tác phẩm thành công! Tác phẩm đang chờ Quản trị viên duyệt.',
      data: newBook,
    });
  } catch (error) {
    console.error('Lỗi contributeBook:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// Chi tiết sách áp dụng Cache-Aside Pattern (Redis String + TTL 15 phút)

// Thống kê nâng cao bằng MongoDB Aggregation Pipeline
exports.getBookStatistics = async (req, res) => {
  try {
    const stats = await Book.aggregate([
      { $match: { is_published: true } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          totalBooks: { $sum: 1 },
          avgChapters: { $avg: '$total_chapters' },
        },
      },
      { $sort: { totalBooks: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalBooks: 1,
          avgChapters: { $round: ['$avgChapters', 1] },
        },
      },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addChapter = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, slug, content, total_pages, word_count } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách để thêm chương' });
    }

    const nextChapterNumber = book.chapters.length + 1;

    const newChapter = {
      chapter_number: nextChapterNumber,
      title,
      slug,
      content,
      total_pages: total_pages || 30,
      word_count: word_count || (content ? content.split(' ').length : 0),
    };

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      {
        $push: { chapters: newChapter },
        $inc: { total_chapters: 1 },
      },
      { new: true }
    ).select('-chapters.content');

    // Xóa Cache cũ để đảm bảo tính nhất quán (Cache Invalidation)
    await redisClient.del(`cache:book:${bookId}`);

    res.status(200).json({
      success: true,
      message: `Thêm chương ${nextChapterNumber} thành công`,
      data: updatedBook,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Chi tiết sách áp dụng Cache-Aside Pattern (ĐÃ SỬA: Kiểm tra quyền và trạng thái duyệt)
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `cache:book:${id}`;

    // 1. Cache Hit
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const parsedBook = JSON.parse(cachedData);
      // Nếu sách trong cache bị tắt is_published và người xem không phải admin
      if (!parsedBook.is_published && (!req.user || req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Tác phẩm này đang chờ duyệt hoặc đã bị ẩn!' });
      }
      return res.status(200).json({
        success: true,
        source: 'Redis Cache (In-Memory)',
        data: parsedBook,
      });
    }

    // 2. Cache Miss: Truy vấn MongoDB
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Kiểm tra trạng thái xuất bản
    if (!book.is_published && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Tác phẩm này đang chờ duyệt hoặc đã bị ẩn!' });
    }

    // 3. Ghi dữ liệu vào Redis Cache
    await redisClient.setEx(cacheKey, 900, JSON.stringify(book));

    res.status(200).json({
      success: true,
      source: 'MongoDB Database (Disk)',
      data: book,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đọc nội dung chương (ĐÃ SỬA: Chặn đọc chương nếu sách chưa duyệt)
exports.getChapterContent = async (req, res) => {
  try {
    const { bookId, chapterNumber } = req.params;

    const book = await Book.findById(bookId);
    if (!book || !book.chapters || book.chapters.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách hoặc chương' });
    }

    // Chặn người dùng đọc nội dung nếu sách chưa được duyệt
    if (!book.is_published && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Tác phẩm này đang chờ duyệt hoặc đã bị ẩn!' });
    }

    const chapNum = Number(chapterNumber);
    let chapter = book.chapters.find((c) => Number(c.chapter_number) === chapNum);
    if (!chapter && book.chapters[chapNum - 1]) {
      chapter = book.chapters[chapNum - 1];
    }

    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương này' });
    }

    res.status(200).json({
      success: true,
      book_title: book.title,
      chapter: chapter,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    // Xóa Cache trong Redis khi sách bị xóa
    await redisClient.del(`cache:book:${id}`);

    res.status(200).json({ success: true, message: 'Đã xóa sách thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};