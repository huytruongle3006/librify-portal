const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
  },
  { timestamps: true }
);

// Tạo compound index để 1 user chỉ yêu thích 1 cuốn sách đúng 1 lần
favoriteSchema.index({ user_id: 1, book_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);