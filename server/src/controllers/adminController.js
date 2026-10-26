const Book = require('../models/Book');
const User = require('../models/User');
const Category = require('../models/Category');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');
const { redisClient } = require('../config/redis');

// ==================== 1. QUẢN LÝ SÁCH (CRUD) ====================
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, categories, description, cover_image } = req.body;

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        title,
        author: typeof author === 'string' ? { name: author } : author,
        categories: Array.isArray(categories) ? categories : [categories],
        description,
        cover_image,
      },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
    }

    res.status(200).json({ success: true, message: 'Cập nhật sách thành công', data: updatedBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    const { bookId, chapterIndex } = req.params;
    const { title, total_pages, content } = req.body;

    const book = await Book.findById(bookId);
    if (!book || !book.chapters[chapterIndex]) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương' });
    }

    if (title) book.chapters[chapterIndex].title = title;
    if (total_pages) book.chapters[chapterIndex].total_pages = Number(total_pages);
    if (content) book.chapters[chapterIndex].content = content;

    book.markModified('chapters');
    await book.save();

    res.status(200).json({ success: true, message: 'Cập nhật chương thành công', data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 2. QUẢN LÝ NGƯỜI DÙNG (CRUD) ====================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -password_hash').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email này đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      full_name: full_name || 'Độc giả mới',
      email,
      password: hashedPassword,
      role: role || 'reader',
      status: 'active',
    });

    res.status(201).json({ success: true, message: 'Thêm tài khoản thành công', data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, password } = req.body;

    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password -password_hash');
    res.status(200).json({ success: true, message: 'Cập nhật tài khoản thành công', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password -password_hash');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    user.status = user.status === 'blocked' ? 'active' : 'blocked';
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);

    if (redisClient?.isReady) {
      await redisClient.del(`recent_history:${id}`);
      const progKeys = await redisClient.keys(`reading_progress:${id}:*`);
      if (progKeys.length > 0) {
        await redisClient.del(progKeys);
      }
    }

    res.status(200).json({ success: true, message: 'Đã xóa người dùng và dữ liệu liên quan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 3. QUẢN LÝ THỂ LOẠI (CRUD) ====================
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Tên thể loại là bắt buộc' });

    const newCat = await Category.create({ name, description });
    res.status(201).json({ success: true, message: 'Thêm thể loại thành công', data: newCat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedCat = await Category.findByIdAndUpdate(id, { name, description }, { new: true });
    res.status(200).json({ success: true, message: 'Cập nhật thể loại thành công', data: updatedCat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Đã xóa thể loại thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 4. QUẢN LÝ ĐÁNH GIÁ (REVIEWS CRUD) ====================
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ created_at: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { book_id, user_id, user_name, rating, comment } = req.body;
    if (!book_id || !user_id || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin đánh giá' });
    }

    const book = await Book.findById(book_id);
    const newReview = await Review.create({
      book_id,
      book_title: book?.title || 'Tác phẩm',
      user_id,
      user_name: user_name || 'Độc giả',
      rating: Number(rating),
      comment,
      status: 'approved',
    });

    res.status(201).json({ success: true, message: 'Gửi đánh giá thành công', data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

    review.status = review.status === 'approved' ? 'hidden' : 'approved';
    await review.save();

    res.status(200).json({ success: true, message: 'Đã đổi trạng thái đánh giá', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Đã xóa đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 5. BÁO CÁO & XU HƯỚNG TỔNG HỢP ====================
exports.getSystemAnalytics = async (req, res) => {
  try {
    const [totalBooks, totalUsers, totalReviews, categories] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      Review.countDocuments(),
      Category.find({}, 'name'),
    ]);

    let trendingBooks = [];
    if (redisClient?.isReady) {
      const trendingData = await redisClient.zRangeWithScores('leaderboard:books:trending', 0, 9, { REV: true });
      if (trendingData.length > 0) {
        const bookIds = trendingData.map(t => t.value);
        const bookDocs = await Book.find({ _id: { $in: bookIds } });
        trendingBooks = trendingData.map(t => {
          const doc = bookDocs.find(b => String(b._id) === String(t.value));
          return {
            _id: t.value,
            title: doc?.title || 'Tác phẩm',
            author: doc?.author?.name || 'Tác giả',
            score: t.score,
          };
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        totalReviews,
        totalCategories: categories.length,
        trendingBooks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== 6. GIÁM SÁT & XÓA BỘ NHỚ TẠM REDIS ====================
exports.clearRedisCache = async (req, res) => {
  try {
    if (redisClient?.isReady) {
      await redisClient.flushDb();
      res.status(200).json({ success: true, message: 'Đã dọn dẹp sạch toàn bộ cache trên Redis thành công!' });
    } else {
      res.status(500).json({ success: false, message: 'Redis chưa sẵn sàng kết nối' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.togglePublishBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });

    book.is_published = !book.is_published;
    await book.save();

    res.status(200).json({ 
      success: true, 
      message: book.is_published ? 'Đã duyệt xuất bản sách!' : 'Đã ẩn sách khỏi trang chủ', 
      data: book 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API dành riêng cho Trang Quản Trị: Lấy tất cả sách và đưa sách mới đăng lên đầu
exports.getAdminBooks = async (req, res) => {
  try {
    // Không lọc is_published, lấy toàn bộ
    const books = await Book.find({})
      .select('-chapters.content')
      .sort({ createdAt: -1 }); // Sách vừa đăng sẽ nằm ngay đầu bảng

    res.status(200).json({
      success: true,
      total: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};