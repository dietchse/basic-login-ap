'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AuthForm from '@/components/AuthForm';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleForgotPassword = async ({ email, error: formError }) => {
    if (formError) {
      setError(formError);
      toast.error('Gagal', {
        description: formError,
      });
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await forgotPassword(email);
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
    } catch (err) {
      const errorMessage = 'Terjadi kesalahan saat mengirim link reset. Silakan coba lagi.';
      setError(errorMessage);
      toast.error('Gagal', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
            Lupa Kata Sandi
          </h1>
          <AuthForm
            type="forgot-password"
            onSubmit={handleForgotPassword}
            loading={loading}
            error={error || message}
            isSuccess={!!message}
          />
        </div>
      </div>
    </div>
  );
}