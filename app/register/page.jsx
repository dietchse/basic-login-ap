'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // Tambahkan useEffect
import AuthForm from '@/components/AuthForm';
import { register } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Blokir akses jika sudah login
  useEffect(() => {
    // Pastikan kode hanya berjalan di client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  // Perbaiki parameter agar sesuai dengan AuthForm yang baru
  const handleRegister = async ({ email, password, firstName, lastName, error: formError }) => {
    if (formError) {
      setError(formError);
      toast.error('Pendaftaran Gagal', {
        description: formError,
      });
      return;
    }

    setLoading(true);
    setError('');

    // Kirim data yang benar ke API
    const result = await register({ email, password, firstName, lastName });

    if (result.success) {
      // Simpan data ke localStorage jika berhasil
      const user = { email, firstName, lastName, profilePicture: null };
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Berhasil', {
        description: 'Pendaftaran berhasil. Silakan verifikasi email Anda.',
      });

      router.push('/login');
    } else {
      const errorMessage = result.error;
      setError(errorMessage);
      toast.error('Pendaftaran Gagal', {
        description: errorMessage,
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Kolom Kiri: Ilustrasi (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted items-center justify-center">
        <div className="w-full max-w-md p-6">
          {/* Placeholder untuk ilustrasi */}
          <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Ilustrasi akan ditambahkan di sini</p>
          </div>
        </div>
      </div>
      {/* Kolom Kanan: Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
            Buat Akun Baru
          </h1>
          <AuthForm type="register" onSubmit={handleRegister} error={error} loading={loading} />
        </div>
      </div>
    </div>
  );
}