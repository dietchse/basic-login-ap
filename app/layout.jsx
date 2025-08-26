import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthProvider';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner'; // Impor Toaster dari Shadcn/UI Sonner

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aplikasi Autentikasi',
  description: 'Aplikasi autentikasi yang reusable dengan Next.js 15 dan Shadcn/UI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-300`}>
        <AuthProvider>
          <header className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </header>
          <main>{children}</main>
          <Toaster richColors theme="system" />
        </AuthProvider>
      </body>
    </html>
  );
}