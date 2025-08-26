'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/api';
import { toast } from 'sonner';
import Spinner from '@/components/Spinner';

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const tokenValue = searchParams.get('token');
    setToken(tokenValue);
  }, [searchParams]);

  useEffect(() => {
    if (token !== null) {
      if (token) {
        setLoading(true);
        setError('');
        setMessage('');

        verifyEmail(token).then((result) => {
          if (result.success) {
            setMessage(result.data.message);
            toast.success('Berhasil', {
              description: result.data.message,
            });
            router.push('/login');
          } else {
            const errorMessage = result.error;
            setError(errorMessage);
            toast.error('Verifikasi Gagal', {
              description: errorMessage,
            });
          }
          setLoading(false);
        });
      } else {
        setError('Token tidak valid');
        toast.error('Verifikasi Gagal', {
          description: 'Token tidak valid.',
        });
        setLoading(false);
      }
    }
  }, [token, router]);

  if (token === null) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-800 px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          {loading ? (
            <span className="flex items-center justify-center">
              <Spinner className="mr-2" />
              Sedang memverifikasi...
            </span>
          ) : error ? (
            'Verifikasi Gagal'
          ) : (
            'Verifikasi Berhasil'
          )}
        </h1>
        {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 dark:text-green-400 text-sm text-center">{message}</p>}
      </div>
    </div>
  );
}