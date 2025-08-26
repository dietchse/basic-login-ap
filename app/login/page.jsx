'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import TwoFactorLoginModal from '@/components/two-factor-login-modal';
import { login, resetGoogleLoginState, checkGoogleAccount, googleLoginDirect, verifyGoogleLogin2FA } from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(null);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState(null);
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);

  useEffect(() => {
    // Pastikan kode ini hanya dijalankan di client-side
    if (typeof window === 'undefined') return;
    
    // Jika sudah login, redirect ke dashboard
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const google2faParam = urlParams.get('google2fa');

    resetGoogleLoginState();
    
    // Tampilkan pesan error dari redirect
    if (errorParam) {
      setError('Otentikasi Google gagal. Silakan coba lagi.');
      toast.error('Otentikasi Gagal', {
        description: 'Terjadi kesalahan saat otentikasi Google. Silakan coba lagi.',
      });
      // Hapus parameter error dari URL
      router.replace('/login', undefined, { shallow: true });
    }

    // Check if Google 2FA is required
    if (google2faParam === 'required') {
      setShowTwoFactorModal(true);
      setIsGoogleLogin(true);
      setLoginCredentials({ googleLogin: true });
      toast.info('2FA Diperlukan', {
        description: 'Akun Google Anda memiliki 2FA aktif. Masukkan kode verifikasi.',
      });
      // Hapus parameter google2fa dari URL
      router.replace('/login', undefined, { shallow: true });
    }

    // Panggil checkGoogleAccount untuk memeriksa status otentikasi Google
    const checkGoogleStatus = async () => {
      const result = await checkGoogleAccount();
      if (result.success && result.data.hasGoogleAccount) {
        setGoogleAccount(result.data.googleAccount);
      } else {
        localStorage.removeItem('googleAccount');
        setGoogleAccount(null);
      }
    };
    checkGoogleStatus();
  }, [router]);

  const handleLogin = async ({ email, password, rememberMe, error: formError }) => {
    if (formError) {
      setError(formError);
      toast.error('Gagal Masuk', {
        description: formError,
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      if (result.success) {
        // Check if 2FA is required
        if (result.data.requiresTwoFactor) {
          setLoginCredentials({ email, password, rememberMe });
          setShowTwoFactorModal(true);
          setLoading(false);
          return;
        }

        const { token, user } = result.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (rememberMe) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          localStorage.setItem('tokenExpiry', expiryDate.toISOString());
        } else {
          localStorage.removeItem('tokenExpiry');
        }

        toast.success('Berhasil', {
          description: 'Anda telah berhasil masuk.',
        });

        router.push('/dashboard');
      } else {
        setError(result.error);
        toast.error('Gagal Masuk', {
          description: result.error,
        });
      }
    } catch (err) {
      const errorMessage = 'Terjadi kesalahan saat login. Silakan coba lagi.';
      setError(errorMessage);
      toast.error('Gagal Masuk', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (twoFactorCode) => {
    if (!loginCredentials) return;

    setLoading(true);
    setError('');

    try {
      let result;
      
      if (isGoogleLogin) {
        // Google login with 2FA (after OAuth callback)
        result = await verifyGoogleLogin2FA(twoFactorCode);
      } else {
        // Regular login with 2FA
        result = await login({
          email: loginCredentials.email,
          password: loginCredentials.password,
          twoFactorCode
        });
      }

      if (result.success) {
        const { token, user } = result.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (!isGoogleLogin && loginCredentials.rememberMe) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          localStorage.setItem('tokenExpiry', expiryDate.toISOString());
        } else {
          localStorage.removeItem('tokenExpiry');
        }

        if (isGoogleLogin) {
          // Update Google account info in localStorage
          const updatedGoogleAccount = {
            googleId: user.googleId || '',
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture
          };
          localStorage.setItem('googleAccount', JSON.stringify(updatedGoogleAccount));
        }

        setShowTwoFactorModal(false);
        setLoginCredentials(null);
        setIsGoogleLogin(false);

        toast.success('Berhasil', {
          description: 'Anda telah berhasil masuk.',
        });

        router.push('/dashboard');
      } else {
        toast.error('Gagal Verifikasi', {
          description: result.error,
        });
      }
    } catch (err) {
      const errorMessage = 'Terjadi kesalahan saat verifikasi 2FA.';
      toast.error('Gagal Verifikasi', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorModalClose = () => {
    setShowTwoFactorModal(false);
    setLoginCredentials(null);
    setIsGoogleLogin(false);
    setLoading(false);
  };

  const handleGoogleDirectLogin = async () => {
    console.log('Google Direct Login called');
    setLoading(true);
    setError('');
  
    try {
      const result = await googleLoginDirect();
      console.log('Google login result:', result);
      
      if (result.success) {
        // Check if 2FA is required for Google login
        if (result.data.requiresTwoFactor) {
          console.log('2FA required for Google login');
          setLoginCredentials({ googleLogin: true });
          setIsGoogleLogin(true);
          setShowTwoFactorModal(true);
          setLoading(false);
          return;
        }

        console.log('Google login successful without 2FA');
        const { token, user } = result.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
  
        if (googleAccount) {
          const updatedGoogleAccount = {
            ...googleAccount,
            profilePicture: user.profilePicture || googleAccount.profilePicture,
            firstName: user.firstName,
            lastName: user.lastName,
          };
          localStorage.setItem('googleAccount', JSON.stringify(updatedGoogleAccount));
        }
  
        toast.success('Berhasil', {
          description: 'Anda telah berhasil masuk dengan Google.',
        });
  
        router.push('/dashboard');
      } else {
        console.log('Google login failed:', result.error);
        setError(result.error);
        toast.error('Gagal Masuk', {
          description: result.error,
        });
      }
    } catch (err) {
      console.log('Google login error:', err);
      const errorMessage = err.message || 'Gagal login dengan Google.';
      setError(errorMessage);
      toast.error('Gagal Masuk', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-1/2 bg-muted items-center justify-center">
          <div className="w-full max-w-md p-6">
            <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Ilustrasi akan ditambahkan di sini</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
              Selamat Datang Kembali!
            </h1>
            <AuthForm
              type="login"
              onSubmit={handleLogin}
              loading={loading}
              error={error}
              googleAccount={googleAccount}
              onGoogleDirectLogin={handleGoogleDirectLogin}
            />
          </div>
        </div>
      </div>

      <TwoFactorLoginModal
        isOpen={showTwoFactorModal}
        onClose={handleTwoFactorModalClose}
        onVerify={handleTwoFactorVerify}
        isLoading={loading}
      />
    </>
  );
}