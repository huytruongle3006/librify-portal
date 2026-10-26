require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = "mongodb://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@ac-hqanh7z-shard-00-00.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-01.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-02.ww6jayh.mongodb.net:27017/DoAn_NoSQL?ssl=true&replicaSet=atlas-enaiii-shard-0&authSource=admin&retryWrites=true&w=majority";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, default: '' },
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
  status: { type: String, default: 'active' },
  completed_books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối cơ sở dữ liệu DoAn_NoSQL trên Atlas!');

    // Làm sạch các tài khoản mẫu cũ
    await User.deleteMany({ username: { $in: ['huyle', 'minhthuc', 'chinhphuc', 'dinhsat', 'trongvi'] } });

    // Tạo mật khẩu mã hóa (mật khẩu mặc định: 123456)
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);

    const users = [
      {
        username: 'huyle',
        email: 'lehuy.014753@gmail.com',
        full_name: 'Lê Trương Huy',
        password: defaultPassword,
        role: 'admin',
        status: 'active'
      },
      {
        username: 'minhthuc',
        email: 'thuc.tm@example.com',
        full_name: 'Trương Minh Thực',
        password: defaultPassword,
        role: 'reader',
        status: 'active'
      },
      {
        username: 'chinhphuc',
        email: 'phuc.tc@example.com',
        full_name: 'Trần Chính Phúc',
        password: defaultPassword,
        role: 'reader',
        status: 'active'
      },
      {
        username: 'dinhsat',
        email: 'sat.nd@example.com',
        full_name: 'Nguyễn Đinh Sắt',
        password: defaultPassword,
        role: 'reader',
        status: 'active'
      },
      {
        username: 'trongvi',
        email: 'vi.dt@example.com',
        full_name: 'Đỗ Trọng Vĩ',
        password: defaultPassword,
        role: 'reader',
        status: 'active'
      }
    ];

    const result = await User.insertMany(users);
    console.log(`👤 Đã nạp thành công ${result.length} người dùng vào collection 'users'!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi nạp users:', error);
    process.exit(1);
  }
}

seedUsers();