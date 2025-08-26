'use client';

import { Suspense } from 'react';
import ResetPasswordClient from '@/components/ResetPasswordClient';
import Spinner from '@/components/Spinner';

function LoadingComponent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
          <span className="flex items-center justify-center">
            <Spinner className="mr-2" />
            Sedang memuat...
          </span>
        </h1>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ResetPasswordClient />
    </Suspense>
  );
}