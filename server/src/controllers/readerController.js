const { redisClient } = require('../config/redis');
const Book = require('../models/Book');
const User = require('../models/User');


// Đánh dấu sách đã đọc xong (Đồng bộ đồng thời Redis Set & MongoDB Array)
// Thêm 3 hàm này vào server/src/controllers/readerController.js:

exports.toggleMarkCompleted = async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bookId' });
    }

    const redisKey = `user:${userId}:completed_books`;
    const bookIdStr = String(bookId);
    const isMember = await redisClient.sIsMember(redisKey, bookIdStr);

    if (isMember) {
      await Promise.all([
        redisClient.sRem(redisKey, bookIdStr),
        User.findByIdAndUpdate(userId, { $pull: { completed_books: bookId } })
      ]);
      return res.status(200).json({ success: true, isCompleted: false });
    } else {
      await Promise.all([
        redisClient.sAdd(redisKey, bookIdStr),
        User.findByIdAndUpdate(userId, { $addToSet: { completed_books: bookId } })
      ]);
      return res.status(200).json({ success: true, isCompleted: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompletedBookIds = async (req, res) => {
  try {
    const { userId } = req.params;
    const redisKey = `user:${userId}:completed_books`;
    let completedIds = await redisClient.sMembers(redisKey);

    if (!completedIds || completedIds.length === 0) {
      const user = await User.findById(userId).select('completed_books');
      if (user?.completed_books?.length > 0) {
        completedIds = user.completed_books.map((id) => String(id));
        await redisClient.sAdd(redisKey, completedIds);
      } else {
        completedIds = [];
      }
    }

    res.status(200).json({ success: true, data: completedIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkBookCompletedStatus = async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const redisKey = `user:${userId}:completed_books`;
    const isMember = await redisClient.sIsMember(redisKey, String(bookId));
    res.status(200).json({ success: true, isCompleted: Boolean(isMember) });
  } catch (error) {
    res.status(500).json({ success: false, isCompleted: false });
  }
};
// 1. Lưu tiến trình đọc dở vào Redis Hashes + Cập nhật Lịch sử đọc vào Redis List
exports.saveReadingProgress = async (req, res) => {
  try {
    const { userId, bookId, chapter, page, scrollRatio } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bookId' });
    }

    // 1.1 Lưu vị trí đọc dở vào Redis Hashes (HSET)
    const hashKey = `reading_progress:${userId}:${bookId}`;
    await redisClient.hSet(hashKey, {
      chapter: String(chapter || 1),
      page: String(page || 1),
      scroll_ratio: String(scrollRatio || 0),
      updated_at: String(Date.now()),
    });

    // 1.2 Quản lý lịch sử đọc gần nhất bằng Redis List (LPUSH + LREM + LTRIM)
    const listKey = `recent_history:${userId}`;
    await redisClient.lRem(listKey, 0, String(bookId)); // Xóa nếu đã tồn tại để tránh trùng
    await redisClient.lPush(listKey, String(bookId));   // Đẩy lên đầu danh sách
    await redisClient.lTrim(listKey, 0, 4);              // Chỉ lưu tối đa 5 cuốn gần nhất

    res.status(200).json({
      success: true,
      message: 'Đã lưu tiến trình đọc (Hashes) và lịch sử gần nhất (List)',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy danh sách 5 cuốn sách vừa đọc gần nhất từ Redis List
exports.getRecentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const listKey = `recent_history:${userId}`;

    const bookIds = await redisClient.lRange(listKey, 0, 4);
    if (!bookIds || bookIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const books = await Book.find({ _id: { $in: bookIds } }).select('title cover_image author categories');

    // Giữ nguyên thứ tự đọc gần nhất theo Redis List
    const result = bookIds
      .map((id) => books.find((b) => b._id.toString() === id))
      .filter(Boolean);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lấy tiến trình đọc dở từ Redis Hashes (HGETALL)
exports.getReadingProgress = async (req, res) => {
  try {
    const { userId, bookId } = req.params;
    const key = `reading_progress:${userId}:${bookId}`;

    const progress = await redisClient.hGetAll(key);
    if (!progress || Object.keys(progress).length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// 4. Tăng điểm lượt đọc bằng Redis ZSET có chống spam Cooldown (10 giây)
exports.trackChapterRead = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.body?.userId || 'anonymous';

    // Nếu không có bookId hoặc bookId là "undefined", chặn ngay
    if (!bookId || bookId === 'undefined') {
      return res.status(400).json({ success: false, message: 'ID sách không hợp lệ' });
    }

    const lockKey = `cooldown:read:${userId}:${bookId}`;

    // Kiểm tra xem khóa cooldown có đang tồn tại không bằng Redis EXISTS
    const exists = await redisClient.exists(lockKey);

    if (exists) {
      console.log(`[COOLDOWN CHẶN] Người dùng ${userId} vừa mở cuốn ${bookId} trong 10s qua!`);
      return res.status(200).json({
        success: true,
        counted: false,
        message: 'Đang trong phiên đọc 10 giây (cooldown), không tăng điểm.',
      });
    }

    // Thiết lập cờ khóa sống trong đúng 10 giây
    await redisClient.set(lockKey, 'active', { EX: 10 });

    // Tăng 1 điểm trong Redis ZSET
    const newScore = await redisClient.zIncrBy('leaderboard:books:trending', 1, String(bookId));
    console.log(`[TĂNG ĐIỂM THÀNH CÔNG] Sách ${bookId} đạt điểm mới: ${newScore}`);

    res.status(200).json({
      success: true,
      counted: true,
      bookId,
      newScore: parseInt(newScore, 10),
      message: 'Ghi nhận phiên đọc mới thành công!',
    });
  } catch (error) {
    console.error('Lỗi trackChapterRead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// 1. Bật / Tắt trạng thái đã đọc xong (Đồng bộ đồng thời Redis Set & MongoDB)
exports.toggleMarkCompleted = async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bookId' });
    }

    const redisKey = `user:${userId}:completed_books`;
    const bookIdStr = String(bookId);

    // Kiểm tra xem ID sách đã nằm trong Redis Set chưa
    const isMember = await redisClient.sIsMember(redisKey, bookIdStr);

    if (isMember) {
      // Đã có -> Hủy hoàn thành
      await Promise.all([
        redisClient.sRem(redisKey, bookIdStr), // Xóa khỏi Redis Set
        User.findByIdAndUpdate(userId, { $pull: { completed_books: bookId } }) // Gỡ khỏi MongoDB
      ]);

      return res.status(200).json({
        success: true,
        isCompleted: false,
        message: 'Đã hủy đánh dấu hoàn thành',
      });
    } else {
      // Chưa có -> Ghi nhận hoàn thành
      await Promise.all([
        redisClient.sAdd(redisKey, bookIdStr), // Thêm vào Redis Set
        User.findByIdAndUpdate(userId, { $addToSet: { completed_books: bookId } }) // Thêm vào MongoDB
      ]);

      return res.status(200).json({
        success: true,
        isCompleted: true,
        message: 'Đã lưu trạng thái đã đọc thành công',
      });
    }
  } catch (error) {
    console.error('Lỗi toggleMarkCompleted:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy toàn bộ danh sách ID sách đã đọc (Cache-Aside: Đọc từ Redis Set trước, fallback MongoDB)
exports.getCompletedBookIds = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId' });
    }

    const redisKey = `user:${userId}:completed_books`;

    // 1. Kiểm tra trên Redis Set trước (In-Memory $O(1)$)
    let completedIds = await redisClient.sMembers(redisKey);

    if (completedIds && completedIds.length > 0) {
      return res.status(200).json({
        success: true,
        source: 'Redis Set',
        data: completedIds,
      });
    }

    // 2. Cache Miss: Truy vấn từ MongoDB và nạp ngược lại vào Redis Set
    const user = await User.findById(userId).select('completed_books');
    if (user && user.completed_books && user.completed_books.length > 0) {
      completedIds = user.completed_books.map((id) => String(id));

      // Nạp danh sách vào Redis Set để phục vụ các lần request sau
      await redisClient.sAdd(redisKey, completedIds);
    } else {
      completedIds = [];
    }

    res.status(200).json({
      success: true,
      source: 'MongoDB',
      data: completedIds,
    });
  } catch (error) {
    console.error('Lỗi getCompletedBookIds:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Lấy Top 10 Bảng xếp hạng thịnh hành (Redis Sorted Set)
exports.getTrendingBooks = async (req, res) => {
  try {
    const trendingKey = 'leaderboard:books:trending';

    // 1. Lấy dữ liệu từ Redis
    let topEntries = [];
    try {
      topEntries = await redisClient.zRangeWithScores(trendingKey, 0, 9, { REV: true });
    } catch (e) {
      // Dự phòng nếu thư viện dùng sendCommand
      const raw = await redisClient.sendCommand(['ZREVRANGE', trendingKey, '0', '9', 'WITHSCORES']);
      if (Array.isArray(raw)) {
        for (let i = 0; i < raw.length; i += 2) {
          topEntries.push({ value: raw[i], score: Number(raw[i + 1]) });
        }
      }
    }

    if (!topEntries || topEntries.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. Lấy danh sách ID
    const bookIds = topEntries.map((item) => item.value).filter(Boolean);

    // 3. Tìm sách trong MongoDB Atlas
    const books = await Book.find({ _id: { $in: bookIds } })
      .select('title cover_image author categories')
      .lean();

    // 4. Ghép nối dữ liệu
    const result = topEntries
      .map((item) => {
        const b = books.find((x) => x._id.toString() === item.value);
        if (!b) return null;

        const authorName = typeof b.author === 'string'
          ? b.author
          : (b.author?.name || 'Chưa rõ');

        return {
          bookId: item.value,
          _id: item.value,
          score: Math.round(item.score),
          title: b.title || 'Sách mẫu',
          author: authorName,
          cover_image: b.cover_image || '',
          categories: b.categories || [],
        };
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Lỗi getTrendingBooks:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};