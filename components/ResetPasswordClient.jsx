'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '@/lib/api';
import { toast } from 'sonner';
import Spinner from '@/components/Spinner';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const tokenValue = searchParams.get('token');
    setToken(tokenValue);
    setInitialLoading(false);

    if (!tokenValue) {
      setError('Token tidak valid');
      toast.error('Gagal', {
        description: 'Token tidak valid.',
      });
    }
  }, [searchParams]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Kata sandi wajib diisi');
      toast.error('Gagal', {
        description: 'Kata sandi wajib diisi.',
      });
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const result = await resetPassword(token, password);

    if (result.success) {
      setMessage(result.data.message);
      toast.success('Berhasil', {
        description: result.data.message,
      });
      setTimeout(() => router.push('/login'), 3000);
    } else {
      const errorMessage = result.error;
      setError(errorMessage);
      toast.error('Gagal', {
        description: errorMessage,
      });
    }

    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            <span className="flex items-center justify-center">
              <Spinner className="mr-2" />
              Sedang memuat...
            </span>
          </h1>
        </div>
      </div>
    );
  }

  // Jika tidak ada token atau token invalid
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            Token Tidak Valid
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
            Link reset password tidak valid atau sudah kedaluwarsa.
          </p>
          <Button 
            onClick={() => router.push('/forgot-password')} 
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            Minta Reset Password Baru
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          Atur Ulang Kata Sandi
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kata Sandi Baru
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400 sm:h-5 sm:w-5" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
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
          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
          {message && <p className="text-green-500 dark:text-green-400 text-sm">{message}</p>}
          <Button type="submit" className="w-full text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <Spinner className="mr-2" />
                Mengatur Ulang...
              </span>
            ) : (
              'Atur Ulang'
            )}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-4">
          Kembali ke{' '}
          <a href="/login" className="text-gray-800 dark:text-gray-100 hover:underline">
            Masuk
          </a>
        </p>
      </div>
    </div>
  );
}