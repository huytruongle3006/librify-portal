import React, { useState } from 'react';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        otpCode: '',
        newPassword: '',
    });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [demoOtp, setDemoOtp] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('https://librify-backend.onrender.com/api/users/login', {
                username: formData.username,
                password: formData.password,
            });
            if (res.data.success) {
                onAuthSuccess(res.data.user, res.data.token);
                onClose();
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Đăng nhập thất bại' });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('https://librify-backend.onrender.com/api/users/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
            });
            if (res.data.success) {
                setMsg({ type: 'success', text: 'Đăng ký thành công! Bạn có thể đăng nhập.' });
                setTab('login');
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Đăng ký thất bại' });
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        try {
            // forgot
            const res = await axios.post('https://librify-backend.onrender.com/api/users/forgot-password', { email: formData.email });
            if (res.data.success) {
                setDemoOtp(res.data.demoOtpCode);
                setMsg({ type: 'success', text: `Mã OTP xác thực mô phỏng: ${res.data.demoOtpCode}` });
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Gửi yêu cầu thất bại' });
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('https://librify-backend.onrender.com/api/users/reset-password', {
                email: formData.email,
                otpCode: formData.otpCode,
                newPassword: formData.newPassword,
            });
            if (res.data.success) {
                setMsg({ type: 'success', text: 'Đổi mật khẩu thành công! Vui lòng đăng nhập.' });
                setTab('login');
            }
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        background: '#0f172a',
        border: '1px solid #334155',
        color: '#fff',
        fontSize: '13px',
        marginBottom: '12px',
        boxSizing: 'border-box',
        outline: 'none',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', width: '400px', borderRadius: '16px', padding: '28px', border: '1px solid #334155', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                        {tab === 'login' && 'Đăng Nhập'}
                        {tab === 'register' && 'Đăng Ký Tài Khoản'}
                        {tab === 'forgot' && 'Khôi Phục Mật Khẩu'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3af', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                </div>

                {msg.text && (
                    <div style={{
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: msg.type === 'error' ? '#f87171' : '#34d399',
                        border: msg.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    }}>
                        {msg.text}
                    </div>
                )}

                {/* Tab Đăng nhập */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin}>
                        <input name="username" placeholder="Tên đăng nhập hoặc Email" style={inputStyle} value={formData.username} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Mật khẩu" style={inputStyle} value={formData.password} onChange={handleChange} required />
                        <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', background: '#6366f1', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}>
                            Đăng Nhập
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px', color: '#94a3af' }}>
                            <span style={{ cursor: 'pointer', color: '#818cf8' }} onClick={() => { setTab('register'); setMsg({ type: '', text: '' }); }}>Chưa có tài khoản? Đăng ký</span>
                            <span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={() => { setTab('forgot'); setMsg({ type: '', text: '' }); }}>Quên mật khẩu?</span>
                        </div>
                    </form>
                )}

                {/* Tab Đăng ký */}
                {tab === 'register' && (
                    <form onSubmit={handleRegister}>
                        <input name="full_name" placeholder="Họ và tên của bạn" style={inputStyle} value={formData.full_name} onChange={handleChange} required />
                        <input name="username" placeholder="Tên tài khoản (viết liền)" style={inputStyle} value={formData.username} onChange={handleChange} required />
                        <input name="email" type="email" placeholder="Email" style={inputStyle} value={formData.email} onChange={handleChange} required />
                        <input name="password" type="password" placeholder="Mật khẩu khởi tạo" style={inputStyle} value={formData.password} onChange={handleChange} required />
                        <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}>
                            Xác Nhận Đăng Ký
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
                            <span style={{ cursor: 'pointer', color: '#818cf8' }} onClick={() => { setTab('login'); setMsg({ type: '', text: '' }); }}>Đã có tài khoản? Quay lại đăng nhập</span>
                        </div>
                    </form>
                )}

                {/* Tab Quên mật khẩu */}
                {tab === 'forgot' && (
                    <div>
                        {!demoOtp ? (
                            <form onSubmit={handleForgot}>
                                <p style={{ fontSize: '12px', color: '#94a3af', marginBottom: '12px' }}>Nhập email để nhận mã OTP khôi phục mật khẩu:</p>
                                <input name="email" type="email" placeholder="Nhập địa chỉ Email" style={inputStyle} value={formData.email} onChange={handleChange} required />
                                <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', background: '#f59e0b', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                                    Lấy Mã OTP
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <input name="otpCode" placeholder="Nhập mã OTP 6 số" style={inputStyle} value={formData.otpCode} onChange={handleChange} required />
                                <input name="newPassword" type="password" placeholder="Mật khẩu mới" style={inputStyle} value={formData.newPassword} onChange={handleChange} required />
                                <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                                    Xác Nhận Đổi Mật Khẩu
                                </button>
                            </form>
                        )}
                        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px' }}>
                            <span style={{ cursor: 'pointer', color: '#818cf8' }} onClick={() => { setTab('login'); setDemoOtp(''); setMsg({ type: '', text: '' }); }}>Quay lại đăng nhập</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}