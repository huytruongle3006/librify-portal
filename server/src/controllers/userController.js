const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nosql_digital_library_secret_key_2026';

// 1. Đăng ký tài khoản
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      full_name,
      role: role || 'reader',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        _id: newUser._id,
        username: newUser.username,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Đăng nhập tài khoản
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        _id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Quên mật khẩu (Tạo mã xác nhận mô phỏng 6 số)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Email chưa được đăng ký trong hệ thống' });
    }

    // Sinh mã OTP 6 số
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // Có hiệu lực 15 phút
    await user.save();

    // Trong môi trường đồ án, trả về luôn mã OTP để demo trực quan mà không cần config SMTP mail thật
    res.status(200).json({
      success: true,
      message: 'Mã xác nhận đã được cấp phát',
      demoOtpCode: resetCode,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Đặt lại mật khẩu với OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: otpCode,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công, vui lòng đăng nhập lại' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Quản trị: Lấy danh sách toàn bộ độc giả
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, total: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Quản trị: Khóa / Mở khóa người dùng
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Cập nhật thông tin cá nhân của người dùng hiện tại
exports.updateProfile = async (req, res) => {
  try {
    // Đảm bảo có khai báo biến avatar ở đây:
    const { userId, full_name, email, avatar, currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại!' });
    }

    if (full_name) user.full_name = full_name.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();

    if (email && email.trim() !== '' && email !== user.email) {
      const emailExists = await User.findOne({ email: email.trim(), _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email này đã có người sử dụng!' });
      }
      user.email = email.trim();
    }

    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại!' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};