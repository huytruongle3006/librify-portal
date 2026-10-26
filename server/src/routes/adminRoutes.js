const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// Duyệt hoặc Ẩn xuất bản tác phẩm
router.patch('/books/:id/publish', async (req, res) => {
  try {
    const Book = require('../models/Book');
    const { redisClient } = require('../config/redis');
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sách!' });
    }

    // Đảo trạng thái duyệt
    book.is_published = !book.is_published;
    await book.save();

    // Xóa cache Redis của cuốn sách này để cập nhật dữ liệu mới
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del(`cache:book:${id}`);
      }
    } catch (cacheErr) {
      console.warn('Lỗi dọn cache:', cacheErr.message);
    }

    return res.status(200).json({
      success: true,
      message: book.is_published ? 'Đã duyệt xuất bản tác phẩm thành công!' : 'Đã ẩn tác phẩm về trạng thái chờ duyệt!',
      data: book,
    });
  } catch (error) {
    console.error('Lỗi duyệt sách:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
// 1. Quản lý Sách & Chương
router.put('/books/:id', adminController.updateBook);
router.put('/books/:bookId/chapters/:chapterIndex', adminController.updateChapter);
router.get('/books', adminController.getAdminBooks);

// 2. Quản lý Người dùng & Phân quyền
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/role', adminController.toggleUserRole);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// 3. Thống kê & Báo cáo tổng hợp
router.get('/analytics', adminController.getSystemAnalytics);

// 4. Quản lý Thể loại / Danh mục
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// 5. Quản lý Đánh giá (Reviews)
router.get('/reviews', adminController.getAllReviews);
router.post('/reviews', adminController.createReview);
router.patch('/reviews/:id/toggle', adminController.toggleReviewStatus);
router.delete('/reviews/:id', adminController.deleteReview);

// 6. Quản trị Bộ nhớ đệm Redis
router.post('/clear-cache', adminController.clearRedisCache);

module.exports = router;