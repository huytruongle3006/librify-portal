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
  contributeBook, // Import thêm hàm này trực tiếp
} = require('../controllers/bookController');

// Middleware xác thực quyền Admin từ MongoDB hoặc Header
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
router.get('/my-contributions/:userId', bookController.getMyContributedBooks);
// 2. Thống kê thư viện
router.get('/stats', getLibraryStats);
router.get('/statistics', getBookStatistics);

// 3. Độc giả đóng góp / đăng tải sách mới (PHẢI NẰM TRÊN ROUTE /:id)
router.post('/contribute', contributeBook);

// 4. Chi tiết sách và xóa sách
router.route('/:id')
  .get(getBookById)
  .delete(requireAdmin, deleteBook);

// 5. Quản lý nội dung chương
router.post('/:bookId/chapters', requireAdmin, addChapter);
router.get('/:bookId/chapters/:chapterNumber', getChapterContent);


module.exports = router;