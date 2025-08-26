import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Interceptor untuk mengelola header Authorization
api.interceptors.request.use(
  (config) => {
    // Hapus header Authorization untuk rute /auth/google-login-direct
    if (config.url.includes('/auth/google-login-direct')) {
      delete config.headers['Authorization'];
    } else {
      // Untuk rute lain, sertakan token jika ada
      const token = localStorage.getItem('token');
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// State sederhana untuk mencegah redirect berulang
let isGoogleLoginInProgress = false;

export const register = async ({ email, password, name }) => {
  try {
    const response = await api.post('/auth/register', { email, password, name });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Terjadi kesalahan' };
  }
};

export const login = async ({ email, password }) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Email atau kata sandi salah. Silakan coba lagi.',
    };
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Verifikasi gagal. Silakan coba lagi.' };
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.' };
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/auth/reset-password?token=${token}`, { password });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.' };
  }
};

export const checkGoogleAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Token tidak ditemukan' };
    }
    const response = await api.get('/auth/check-google-account', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error checking Google account:', error);
    return { success: false, error: error.response?.data?.message || 'Gagal memeriksa akun Google.' };
  }
};

export const googleLoginDirect = async (twoFactorCode = null) => {
  try {
    const storedGoogleAccount = localStorage.getItem('googleAccount');
    if (!storedGoogleAccount) {
      return { success: false, error: 'Data akun Google tidak ditemukan' };
    }

    const googleAccount = JSON.parse(storedGoogleAccount);
    const googleId = googleAccount.googleId;
    if (!googleId) {
      return { success: false, error: 'googleId tidak ditemukan' };
    }

    const requestBody = { googleId };
    if (twoFactorCode) {
      requestBody.twoFactorCode = twoFactorCode;
    }

    const response = await api.post('/auth/google-login-direct', requestBody);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error in googleLoginDirect:', error);
    return { success: false, error: error.response?.data?.message || 'Gagal login dengan Google.' };
  }
};

export const verifyGoogleLogin2FA = async (twoFactorCode) => {
  try {
    const response = await api.post('/auth/verify-google-2fa', { twoFactorCode });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error in verifyGoogleLogin2FA:', error);
    return { success: false, error: error.response?.data?.message || 'Gagal verifikasi 2FA untuk Google login.' };
  }
};

export const googleLogin = () => {
  if (isGoogleLoginInProgress) {
    return;
  }
  isGoogleLoginInProgress = true;
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
};

export const resetGoogleLoginState = () => {
  isGoogleLoginInProgress = false;
};

export default api;