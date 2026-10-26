require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book');
const User = require('./src/models/User');
const Review = require('./src/models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_library';

const sampleComments = [
  { rating: 5, comment: 'Tác phẩm phân tích kiến trúc phần mềm cực kỳ sâu sắc, ví dụ minh họa rất thực tế!' },
  { rating: 5, comment: 'Hệ thống nạp trang rất nhanh, tài liệu trình bày rõ ràng, chuẩn mực học thuật.' },
  { rating: 4, comment: 'Nội dung chương 2 và chương 3 kết hợp rất chặt chẽ giữa lý thuyết và vận hành.' },
  { rating: 5, comment: 'Đọc rất cuốn, các sơ đồ cấu trúc và mô hình dữ liệu giải thích dễ hiểu.' },
  { rating: 4, comment: 'Sách rất phù hợp cho sinh viên chuyên ngành Công nghệ Thông tin nghiên cứu.' },
];

async function seedReviews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB thành công!');

    await Review.deleteMany({});
    const books = await Book.find({}).limit(10);
    const users = await User.find({}).limit(5);

    if (books.length === 0 || users.length === 0) {
      console.log('⚠️ Cần có sách và người dùng trước khi tạo đánh giá.');
      process.exit(0);
    }

    const reviews = [];
    books.forEach((book, bIdx) => {
      const user = users[bIdx % users.length];
      const sample = sampleComments[bIdx % sampleComments.length];
      reviews.push({
        book_id: book._id,
        book_title: book.title,
        user_id: user._id,
        user_name: user.full_name || 'Độc giả',
        rating: sample.rating,
        comment: sample.comment,
        status: 'approved',
      });
    });

    await Review.insertMany(reviews);
    console.log(`🎉 Đã tạo thành công ${reviews.length} đánh giá mẫu vào MongoDB collection reviews!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi tạo reviews:', err);
    process.exit(1);
  }
}

seedReviews();