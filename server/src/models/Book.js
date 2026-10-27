const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  chapter_number: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
  },
  total_pages: {
    type: Number,
    default: 1,
  },
  word_count: {
    type: Number,
    default: 0,
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tên sách không được để trống'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    isbn: {
      type: String,
      default: '',
    },
    author: {
      name: { type: String, required: true },
      email: { type: String, default: '' },
    },
    categories: [{ type: String, trim: true }],
    description: {
      type: String,
      default: '',
    },
    cover_image: {
      type: String,
      default: 'https://via.placeholder.com/150x200',
    },
    total_chapters: {
      type: Number,
      default: 0,
    },
    views_count: {
      type: Number,
      default: 0,
    },
    is_published: {
      type: Boolean,
      default: true,
    },
    uploader_name: {
      type: String,
      default: 'Ban Quản Trị',
    },
    
    chapters: [chapterSchema],
  },
  { timestamps: true }
);

// Compound Text Index phục vụ MongoDB Full-Text Search
bookSchema.index({
  title: 'text',
  description: 'text',
  'author.name': 'text',
  categories: 'text',
});
bookSchema.index({ categories: 1 });
module.exports = mongoose.model('Book', bookSchema);