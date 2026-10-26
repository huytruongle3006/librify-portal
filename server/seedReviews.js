require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = "mongodb://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@ac-hqanh7z-shard-00-00.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-01.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-02.ww6jayh.mongodb.net:27017/DoAn_NoSQL?ssl=true&replicaSet=atlas-enaiii-shard-0&authSource=admin&retryWrites=true&w=majority";

const ReviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Book = mongoose.models.Book || mongoose.model('Book', new mongoose.Schema({}, { strict: false }));

const commentsPool = [
  'Cuốn sách rất chi tiết, phân tích kiến trúc phần mềm chặt chẽ và dễ áp dụng.',
  'Nội dung trình bày rõ ràng, ví dụ cụ thể về hệ thống phân tán quy mô lớn.',
  'Tài liệu hữu ích cho việc tối ưu hiệu năng cơ sở dữ liệu và triển khai dự án.',
  'Nguyên lý diễn giải trực quan, đọc xong nắm chắc luồng vận hành của hệ thống.',
  'Rất đáng để đọc và nghiên cứu kỹ, mở rộng tư duy thiết kế phần mềm sạch.'
];

async function seedReviews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu DoAn_NoSQL trên Atlas!');

    const users = await User.find({}).limit(10);
    const books = await Book.find({}).limit(30);

    if (users.length === 0 || books.length === 0) {
      console.log('❌ Cần có ít nhất 1 user và 1 book trong database trước khi nạp reviews!');
      process.exit(1);
    }

    // Làm sạch reviews cũ
    await Review.deleteMany({});

    const reviews = [];
    books.forEach((book, bIndex) => {
      // Mỗi cuốn sách có từ 1 đến 2 review từ các người dùng khác nhau
      const reviewCount = (bIndex % 2) + 1;
      for (let i = 0; i < reviewCount; i++) {
        const user = users[(bIndex + i) % users.length];
        reviews.push({
          user_id: user._id,
          book_id: book._id,
          rating: 4 + (i % 2), // 4 hoặc 5 sao
          comment: commentsPool[(bIndex + i) % commentsPool.length],
          created_at: new Date(Date.now() - (bIndex * 3600000 + i * 1800000))
        });
      }
    });

    const result = await Review.insertMany(reviews);
    console.log(`⭐ Đã nạp thành công ${result.length} đánh giá vào collection 'reviews'!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi nạp reviews:', error);
    process.exit(1);
  }
}

seedReviews();