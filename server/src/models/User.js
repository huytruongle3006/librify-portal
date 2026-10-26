const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Tên đăng nhập không được để trống'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    full_name: {
      type: String,
      trim: true,
    },
  
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    password_hash: {
      type: String,
    },
    role: {
      type: String,
      enum: ['reader', 'admin'],
      default: 'reader',
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    avatar: { type: String, default: '' },
    // Danh sách các tác phẩm độc giả đã bấm "Đánh dấu đã đọc" (Lưu trữ bền vững)
    completed_books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    // Tiến độ đọc gần nhất lưu vào MongoDB phòng khi Redis hết hạn cache
    reading_history: [
      {
        book: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book',
        },
        last_read_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    collection: 'users', // Ép buộc đúng collection 'users' trong MongoDB Compass
    timestamps: true,
    strict: false,  
  }
);

module.exports = mongoose.model('User', userSchema);