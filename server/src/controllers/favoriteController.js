const Favorite = require('../models/Favorite');

// Thêm hoặc Hủy yêu thích (Toggle Favorite)
exports.toggleFavorite = async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc bookId' });
    }

    const existing = await Favorite.findOne({ user_id: userId, book_id: bookId });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.status(200).json({
        success: true,
        isFavorited: false,
        message: 'Đã xóa khỏi danh sách yêu thích',
      });
    } else {
      await Favorite.create({ user_id: userId, book_id: bookId });
      return res.status(201).json({
        success: true,
        isFavorited: true,
        message: 'Đã thêm vào danh sách yêu thích',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách ID các sách mà người dùng đã yêu thích
exports.getUserFavoriteIds = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ user_id: userId }).select('book_id');
    const bookIds = favorites.map((f) => f.book_id.toString());
    res.status(200).json({ success: true, data: bookIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết toàn bộ sách yêu thích kèm thông tin tác phẩm (populate)
exports.getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ user_id: userId })
      .populate('book_id')
      .sort({ createdAt: -1 });

    const books = favorites.map((f) => f.book_id).filter(Boolean);
    res.status(200).json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};