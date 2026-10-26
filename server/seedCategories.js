require('dotenv').config();
const mongoose = require('mongoose');

// Định nghĩa Schema Category nếu chưa có
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true },
  description: String,
  created_at: { type: Date, default: Date.now }
});

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

// Chuỗi kết nối trực tiếp đến Atlas đã cấu hình
const MONGO_URI = "mongodb://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@ac-hqanh7z-shard-00-00.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-01.ww6jayh.mongodb.net:27017,ac-hqanh7z-shard-00-02.ww6jayh.mongodb.net:27017/DoAn_NoSQL?ssl=true&replicaSet=atlas-enaiii-shard-0&authSource=admin&retryWrites=true&w=majority";

const categories = [
  { name: 'Kiến trúc phần mềm', slug: 'kien-truc-phan-mem', description: 'Các mẫu thiết kế và kiến trúc hệ thống hiện đại' },
  { name: 'Hệ thống phân tán', slug: 'he-thong-phan-tan', description: 'Điện toán phân tán, điện toán đám mây và microservices' },
  { name: 'Cơ sở dữ liệu', slug: 'co-so-du-lieu', description: 'Hệ quản trị CSDL quan hệ, NoSQL và Polyglot Persistence' },
  { name: 'Khoa học máy tính', slug: 'khoa-hoc-may-tinh', description: 'Thuật toán, cấu trúc dữ liệu và hệ điều hành' },
  { name: 'Trí tuệ nhân tạo', slug: 'tri-tue-nhan-tao', description: 'Machine Learning, Deep Learning và xử lý ngôn ngữ tự nhiên' },
  { name: 'Công nghệ thông tin', slug: 'cong-nghe-thong-tin', description: 'Kỹ nghệ phần mềm và quản trị dự án CNTT' }
];

async function seedCategories() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB Atlas thành công!');

    // Dọn dẹp danh mục cũ nếu có
    await Category.deleteMany({});

    // Thêm 6 thể loại chuẩn khớp với 60 đầu sách
    await Category.insertMany(categories);
    console.log(`🎉 Đã nạp thành công ${categories.length} thể loại sách lên MongoDB Atlas!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi nạp categories:', error);
    process.exit(1);
  }
}

seedCategories();