const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://lehuy014753_db_user:Cp0Fjpj0xkuMGXjf@cluster0.ww6jayh.mongodb.net/DoAn_NoSQL?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    console.log('✅ Đã kết nối MongoDB Atlas thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;