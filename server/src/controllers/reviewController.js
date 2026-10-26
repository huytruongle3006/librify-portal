const Review = require('../models/Review');
const Book = require('../models/Book');
const User = require('../models/User');
const mongoose = require('mongoose');

// 1. Thêm đánh giá / bình luận mới
exports.addReview = async (req, res) => {
  try {
    const { userId, bookId, rating, comment, userName } = req.body;

    if (!userId || !bookId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá' });
    }

    // Tự động tìm user_name và book_title nếu frontend không gửi kèm
    let finalUserName = userName;
    if (!finalUserName && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).select('full_name username name');
      if (user) {
        finalUserName = user.full_name || user.username || user.name;
      }
    }

    let finalBookTitle = '';
    if (mongoose.Types.ObjectId.isValid(bookId)) {
      const book = await Book.findById(bookId).select('title');
      if (book) {
        finalBookTitle = book.title;
      }
    }

    const review = await Review.create({
      user_id: userId,
      user_name: finalUserName || 'Độc giả',
      book_id: bookId,
      book_title: finalBookTitle,
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Populate thông tin người dùng vừa tạo để trả về ngay cho frontend
    const populatedReview = await Review.findById(review._id).populate(
      'user_id',
      'full_name username role'
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng bình luận thành công',
      data: populatedReview,
    });
  } catch (error) {
    console.error('Lỗi addReview:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy danh sách bình luận kèm thống kê sao của một cuốn sách (CHỈ LẤY BÌNH LUẬN ĐÃ DUYỆT / KHÔNG BỊ ẨN)
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(200).json({
        success: true,
        data: [],
        summary: { avgRating: 0, totalReviews: 0 },
      });
    }

    // 👉 1. Chỉ tìm những đánh giá có trạng thái approved (hoặc không phải hidden)
    const filter = {
      book_id: new mongoose.Types.ObjectId(bookId),
      status: { $ne: 'hidden' }
    };

    const reviews = await Review.find(filter)
      .populate('user_id', 'full_name username role')
      .sort({ created_at: -1 });

    // 👉 2. Thống kê điểm trung bình sao cũng chỉ tính trên các đánh giá hiển thị
    const stats = await Review.aggregate([
      { 
        $match: filter 
      },
      {
        $group: {
          _id: '$book_id',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    return res.status(200).json({
      success: true,
      data: reviews,
      summary: {
        avgRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error('Lỗi getReviewsByBook:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};