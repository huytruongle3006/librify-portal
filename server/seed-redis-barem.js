require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/Book');
const User = require('./src/models/User');
const { createClient } = require('redis');

// 1. Chuỗi kết nối MongoDB Atlas Standard (tránh lỗi DNS SRV)
const MONGO_URI = "mongodb://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@ac-hqanh7z-shard-00-00.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-01.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-02.ww6jayh.mongodb.net:27017/DoAn_NoSQL?ssl=true&replicaSet=atlas-enaiii-shard-0&authSource=admin&retryWrites=true&w=majority";

// 2. Chuỗi kết nối Upstash Redis Cloud
const REDIS_URL = process.env.REDIS_URL || "rediss://default:gQAAAAAAAf6gAAIgcDEwNWIwYWI1NTk0MWM0NzE5YjA4YWRiOTJjNDYwMjJmYQ@modest-bee-130720.upstash.io:6379";

const redisClient = createClient({
  url: REDIS_URL
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

async function seedRedisForBarem() {
  try {
    await mongoose.connect(MONGO_URI);
    await redisClient.connect();
    console.log('✅ Đã kết nối thành công MongoDB Atlas và Upstash Redis Cloud!');

    const books = await Book.find({}).limit(50);
    const users = await User.find({}).limit(10);

    if (books.length === 0) {
      console.log('❌ Chưa tìm thấy sách nào trên MongoDB Atlas! Hãy đảm bảo đã nạp sách trước.');
      process.exit(1);
    }

    console.log(`📚 Đã lấy được ${books.length} cuốn sách thực tế từ MongoDB Atlas.`);

    const defaultUserId = (users && users.length > 0 && users[0]._id) 
      ? users[0]._id.toString() 
      : '660c1a2b3c4d5e6f7a8b9c99';

    console.log('⏳ Đang dọn dẹp và nạp dữ liệu Hashes + Sorted Set lên Upstash Redis...');

    // Xóa Sorted Set cũ để loại bỏ ID rác cũ
    await redisClient.del('leaderboard:books:trending');

    for (let i = 0; i < books.length; i++) {
      const bookId = books[i]._id.toString();
      
      const assignedUser = (users && users.length > 0) 
        ? users[i % users.length]._id.toString() 
        : defaultUserId;

      // 1. Nạp Hashes tiến độ đọc (Polyglot Reading Progress)
      const randomChapter = Math.floor(Math.random() * 3) + 1;
      const randomPage = Math.floor(Math.random() * 20) + 5;
      const hashKey = `reading_progress:${assignedUser}:${bookId}`;

      await redisClient.hSet(hashKey, {
        chapter: String(randomChapter),
        page: String(randomPage),
        scroll_ratio: '0',
        updated_at: String(Date.now() - i * 60000),
      });

      // 2. Nạp điểm xếp hạng vào Sorted Set (ZSET)
      const initialScore = 120 - (i * 2); 
      await redisClient.zAdd('leaderboard:books:trending', {
        score: Math.max(initialScore, 5),
        value: bookId,
      });
    }

    console.log(`🎉 HOÀN TẤT! Toàn bộ điểm và bảng xếp hạng đã được đồng bộ lên Upstash Redis.`);
    await redisClient.quit();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi nạp Redis:', error);
    process.exit(1);
  }
}

seedRedisForBarem();