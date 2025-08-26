'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FcGoogle } from 'react-icons/fc';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { googleLogin } from '@/lib/api';
import Spinner from '@/components/Spinner';

export default function AuthForm({ type, onSubmit, loading, error, googleAccount, onGoogleDirectLogin, isSuccess }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'forgot-password') {
      if (!formData.email) {
        const error = 'Email wajib diisi';
        setErrorMessage(error);
        onSubmit({ email: formData.email, error });
        return;
      }
    } else if (!formData.email || !formData.password || (type === 'register' && !formData.name)) {
      const error = 'Semua kolom wajib diisi';
      setErrorMessage(error);
      onSubmit({ ...formData, rememberMe, error });
      return;
    }
    setErrorMessage('');
    onSubmit({ ...formData, rememberMe, error: null });
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  const handleUseDifferentAccount = () => {
    localStorage.removeItem('googleAccount');
    window.location.reload();
  };

  if (googleAccount && type !== 'forgot-password') {
    return (
      <div className="w-full space-y-6">
        <div className="mb-4 p-4 bg-gray-100 dark:bg-black border border-black rounded-lg flex items-center space-x-4">
          {googleAccount.profilePicture ? (
            <img
              src={googleAccount.profilePicture}
              alt="Foto Profil"
              className="w-12 h-12 rounded-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.querySelector('.initial-avatar').style.display = 'flex';
              }}
            />
          ) : null}
          {/* Inisial nama jika tidak ada foto atau gagal load */}
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center initial-avatar" style={{display: googleAccount.profilePicture ? 'none' : 'flex'}}>
            <span className="text-gray-600 dark:text-gray-400 text-xl">
              {googleAccount.name ? googleAccount.name.charAt(0) : 'U'}
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-black dark:text-gray-100">
              {googleAccount.name || 'Pengguna Google'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{googleAccount.email}</p>
          </div>
        </div>
        {(error || errorMessage) && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error || errorMessage}</span>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full text-sm sm:text-base border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
          onClick={onGoogleDirectLogin}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Spinner className="mr-2" />
              Memuat...
            </span>
          ) : (
            <>
              <FcGoogle className="mr-2 h-5 w-5" />
              Login dengan Google
            </>
          )}
        </Button>
        <div className="text-center">
          <Button
            variant="link"
            onClick={handleUseDifferentAccount}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            Gunakan Akun Lain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:h-5 sm:w-5" />
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama Anda"
                className="pl-10 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:h-5 sm:w-5" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email Anda"
              className="pl-10 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
        {type !== 'forgot-password' && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:h-5 sm:w-5" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Masukkan kata sandi Anda"
                className="pl-10 pr-10 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
        )}
        {type === 'login' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked)}
              />
              <Label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-300">
                Ingat Saya
              </Label>
            </div>
            <a
              href="/forgot-password"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Lupa Kata Sandi?
            </a>
          </div>
        )}
        {(error || errorMessage) && (
          <div className="mb-4 p-4 border rounded-lg flex items-center
            ${isSuccess ? 'bg-green-100 dark:bg-green-900/50 border-green-400 dark:border-green-700 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 border-red-400 dark:border-red-700 text-red-700 dark:text-red-300'}">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isSuccess ? 'M5 13l4 4L19 7' : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}
              />
            </svg>
            <span>{error || errorMessage}</span>
          </div>
        )}
        <Button
          type="submit"
          className="w-full text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Spinner className="mr-2" />
              {type === 'forgot-password' ? 'Mengirim...' : type === 'register' ? 'Mendaftar...' : 'Masuk...'}
            </span>
          ) : (
            <>
              {type === 'forgot-password' ? 'Kirim Link Reset' : type === 'register' ? 'Daftar' : 'Masuk'}
            </>
          )}
        </Button>
      </form>
      {type !== 'forgot-password' && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                Atau lanjutkan dengan
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-sm sm:text-base border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <FcGoogle className="mr-2 h-5 w-5" />
            {type === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google'}
          </Button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            {type === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <a
              href={type === 'login' ? '/register' : '/login'}
              className="text-gray-800 dark:text-gray-100 hover:underline"
            >
              {type === 'login' ? 'Daftar Gratis Sekarang!' : 'Masuk Sekarang!'}
            </a>
          </p>
        </>
      )}
      {type === 'forgot-password' && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          Kembali ke{' '}
          <a href="/login" className="text-gray-800 dark:text-gray-100 hover:underline">
            Masuk
          </a>
        </p>
      )}
    </div>
  );
}