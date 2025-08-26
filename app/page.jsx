'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.user) {
            router.push('/dashboard');
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiry');
            toast.error('Sesi tidak valid', {
              description: 'Silakan login kembali.',
            });
            router.push('/login');
          }
        })
        .catch((err) => {
          console.error('Error fetching /auth/me (stored token):', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiry');
          toast.error('Gagal memeriksa sesi', {
            description: 'Silakan login kembali.',
          });
          router.push('/login');
        });
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800">
      <p className="text-gray-900 dark:text-gray-100">Memuat...</p>
    </div>
  );
}