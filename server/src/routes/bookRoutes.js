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
  getMyContributedBooks,
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

// 2. Thống kê thư viện (Route tĩnh - phải đặt trước /:id)
router.get('/stats', getLibraryStats);
router.get('/statistics', getBookStatistics);

// 3. Độc giả đóng góp sách mới (Route tĩnh - phải đặt trước /:id)
router.post('/contribute', contributeBook);

// 👉 4. SÁCH CỦA TÔI (BẮT BUỘC ĐẶT TRƯỚC /:id NẾU KHÔNG SẼ BỊ LỖI 403 / 404):
router.get('/my-contributions/:userId', getMyContributedBooks);

// 5. Chi tiết sách và xóa sách (ROUTE CÓ PARAM ĐỘNG /:id PHẢI ĐẶT SAU CÙNG)
router.route('/:id')
  .get(getBookById)
  .delete(requireAdmin, deleteBook);

// 6. Quản lý nội dung chương
router.post('/:bookId/chapters', requireAdmin, addChapter);
router.get('/:bookId/chapters/:chapterNumber', getChapterContent);

module.exports = router;