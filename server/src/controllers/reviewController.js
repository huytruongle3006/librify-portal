const Review = require('../models/Review');
const mongoose = require('mongoose');

// 1. Thêm đánh giá / bình luận mới
exports.addReview = async (req, res) => {
  try {
    const { userId, bookId, rating, comment } = req.body;

    if (!userId || !bookId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đánh giá' });
    }

    const review = await Review.create({
      user_id: userId,
      book_id: bookId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Populate thông tin người dùng vừa tạo để trả về ngay cho frontend
    const populatedReview = await Review.findById(review._id).populate(
      'user_id',
      'full_name username role'
    );

    res.status(201).json({
      success: true,
      message: 'Đăng bình luận thành công',
      data: populatedReview,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy danh sách bình luận kèm thống kê sao của một cuốn sách
exports.getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Lấy danh sách bình luận sắp xếp mới nhất
    const reviews = await Review.find({ book_id: bookId })
      .populate('user_id', 'full_name username role')
      .sort({ createdAt: -1 });

    // Sử dụng MongoDB Aggregation để tính điểm trung bình sao
    const stats = await Review.aggregate([
      { $match: { book_id: new mongoose.Types.ObjectId(bookId) } },
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

    res.status(200).json({
      success: true,
      data: reviews,
      summary: {
        avgRating,
        totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};