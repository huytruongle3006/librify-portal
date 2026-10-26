require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book'); // Đảm bảo đúng đường dẫn từ server/
const User = require('./src/models/User');
const { redisClient, connectRedis } = require('./src/config/redis');

// 👉 Đảm bảo luôn trỏ đúng chuỗi MongoDB Atlas:
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@cluster0.ww6jayh.mongodb.net/DoAn_NoSQL?retryWrites=true&w=majority';

async function seedRedisForBarem() {
  try {
    await mongoose.connect(MONGO_URI);
    await connectRedis();
    console.log('✅ Đã kết nối MongoDB Atlas và Upstash Redis!');

    const books = await Book.find({}).limit(50);
    const users = await User.find({}).limit(10);

    if (books.length === 0) {
      console.log('❌ Chưa có sách nào trên MongoDB Atlas! Hãy chạy seedRealBooks.js trước.');
      process.exit(1);
    }

    console.log(`📚 Đã tìm thấy ${books.length} sách trên MongoDB Atlas.`);

    const defaultUserId = (users && users.length > 0 && users[0]._id) 
      ? users[0]._id.toString() 
      : '660c1a2b3c4d5e6f7a8b9c99';

    console.log('⏳ Đang tạo các key Hashes và 1 ZSET chứa các cuốn sách...');

    // Xóa Sorted Set cũ để loại bỏ hoàn toàn các ID sách rác từ localhost
    await redisClient.del('leaderboard:books:trending');

    for (let i = 0; i < books.length; i++) {
      const bookId = books[i]._id.toString();
      
      const assignedUser = (users && users.length > 0) 
        ? users[i % users.length]._id.toString() 
        : defaultUserId;

      // 1. Nạp Hashes tiến độ đọc
      const randomChapter = Math.floor(Math.random() * 3) + 1;
      const randomPage = Math.floor(Math.random() * 20) + 5;
      const hashKey = `reading_progress:${assignedUser}:${bookId}`;

      await redisClient.hSet(hashKey, {
        chapter: String(randomChapter),
        page: String(randomPage),
        scroll_ratio: '0',
        updated_at: String(Date.now() - i * 60000),
      });

      // 2. Nạp điểm lượt đọc vào Sorted Set (ZSET)
      const initialScore = 120 - (i * 2); 
      await redisClient.zAdd('leaderboard:books:trending', {
        score: Math.max(initialScore, 5),
        value: bookId,
      });
    }

    console.log(`🎉 HOÀN TẤT! Đã đồng bộ ID sách từ MongoDB Atlas sang Upstash Redis thành công!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedRedisForBarem();