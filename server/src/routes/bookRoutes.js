const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
  createBook,
  getAllBooks,
  getBookById,
  getBookStatistics,
  addChapter,
  getChapterContent,
  deleteBook,
  getLibraryStats,
  contributeBook,
  getMyContributedBooks, // 1. BẮT BUỘC CÓ DÒNG NÀY Ở ĐÂY
} = require('../controllers/bookController');

// Middleware xác thực quyền Admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] || req.body?.userId || req.query?.userId;
    const userRoleHeader = req.headers['x-user-role'];

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        return next();
      }
    }

    if (userRoleHeader === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Từ chối quyền truy cập: Thao tác này chỉ dành riêng cho Quản trị viên (Admin)!'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực quyền hạn: ' + err.message
    });
  }
};

// 1. Quản lý danh sách và tạo sách mới
router.route('/')
  .get(getAllBooks)
  .post(requireAdmin, createBook);

// 2. ROUTE SÁCH CỦA TÔI: Bỏ chữ "bookController." đi, gọi trực tiếp tên hàm
router.get('/my-contributions/:userId', getMyContributedBooks);

// 3. Thống kê thư viện
router.get('/stats', getLibraryStats);
router.get('/statistics', getBookStatistics);

// 4. Độc giả đóng góp sách mới
router.post('/contribute', contributeBook);

// 5. Chi tiết sách và xóa sách
router.route('/:id')
  .get(getBookById)
  .delete(requireAdmin, deleteBook);

// 6. Quản lý nội dung chương
router.post('/:bookId/chapters', requireAdmin, addChapter);
router.get('/:bookId/chapters/:chapterNumber', getChapterContent);

module.exports = router;