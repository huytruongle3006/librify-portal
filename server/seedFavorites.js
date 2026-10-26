require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = "mongodb://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@ac-hqanh7z-shard-00-00.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-01.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-02.ww6jayh.mongodb.net:27017/DoAn_NoSQL?ssl=true&replicaSet=atlas-enaiii-shard-0&authSource=admin&retryWrites=true&w=majority";

const FavoriteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  created_at: { type: Date, default: Date.now }
});

const Favorite = mongoose.models.Favorite || mongoose.model('Favorite', FavoriteSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Book = mongoose.models.Book || mongoose.model('Book', new mongoose.Schema({}, { strict: false }));

async function seedFavorites() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu DoAn_NoSQL trên Atlas!');

    const users = await User.find({}).limit(10);
    const books = await Book.find({}).limit(30);

    if (users.length === 0 || books.length === 0) {
      console.log('❌ Cần có ít nhất 1 user và 1 book trong database trước khi nạp favorites!');
      process.exit(1);
    }

    // Làm sạch favorites cũ
    await Favorite.deleteMany({});

    const favorites = [];
    users.forEach((user, uIndex) => {
      // Mỗi người dùng thêm yêu thích từ 3 đến 5 cuốn sách ngẫu nhiên
      const count = 3 + (uIndex % 3);
      for (let i = 0; i < count; i++) {
        const book = books[(uIndex * 3 + i) % books.length];
        favorites.push({
          user_id: user._id,
          book_id: book._id,
          created_at: new Date(Date.now() - (uIndex + i) * 3600000 * 24)
        });
      }
    });

    const result = await Favorite.insertMany(favorites);
    console.log(`❤️ Đã nạp thành công ${result.length} bản ghi vào collection 'favorites'!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi nạp favorites:', error);
    process.exit(1);
  }
}

seedFavorites();