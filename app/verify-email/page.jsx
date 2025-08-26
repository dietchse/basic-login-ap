'use client';

import dynamic from 'next/dynamic';

// Muat komponen VerifyEmailClient secara dinamis dengan SSR dinonaktifkan
const VerifyEmailClient = dynamic(() => import('@/components/VerifyEmailClient'), {
  ssr: false, // Nonaktifkan Server-Side Rendering
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
          Sedang memuat...
        </h1>
      </div>
    </div>
  ),
});

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}