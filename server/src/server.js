require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const adminRoutes = require('./routes/adminRoutes');
dotenv.config();

// Kết nối cơ sở dữ liệu
connectDB();
connectRedis();

const app = express();

const cors = require('cors');

app.use(cors({
  origin: '*', // Cho phép tất cả các domain hoặc điền 'https://librify-portal.vercel.app'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(express.json());

// Khai báo Routes
app.use('/api/admin', adminRoutes);
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/reader', require('./routes/readerRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

app.get('/', (req, res) => {
  res.send('API Hệ Thống Thư Viện Số - Polyglot Persistence Active');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});