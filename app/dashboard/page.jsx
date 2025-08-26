'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Proses parameter dari Google OAuth redirect
    const tokenFromUrl = searchParams.get('token');
    const googleId = searchParams.get('googleId');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const phone = searchParams.get('phone');
    const jobTitle = searchParams.get('jobTitle');
    const company = searchParams.get('company');
    const bio = searchParams.get('bio');
    const location = searchParams.get('location');
    const website = searchParams.get('website');
    const profilePicture = searchParams.get('profilePicture');

    if (tokenFromUrl) {
      // Simpan token
      localStorage.setItem('token', tokenFromUrl);

      // Fetch user data dari backend menggunakan token
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${tokenFromUrl}`,
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
            localStorage.setItem('user', JSON.stringify(data.user));

            // Simpan informasi akun Google jika ada
            if (googleId && email) {
              const googleAccountData = {
                googleId,
                email: decodeURIComponent(email),
                name: name ? decodeURIComponent(name) : null,
                firstName: firstName ? decodeURIComponent(firstName) : null,
                lastName: lastName ? decodeURIComponent(lastName) : null,
                phone: phone ? decodeURIComponent(phone) : null,
                jobTitle: jobTitle ? decodeURIComponent(jobTitle) : null,
                company: company ? decodeURIComponent(company) : null,
                bio: bio ? decodeURIComponent(bio) : null,
                location: location ? decodeURIComponent(location) : null,
                website: website ? decodeURIComponent(website) : null,
                profilePicture: data.user.profilePicture || (profilePicture ? decodeURIComponent(profilePicture) : null),
              };
              localStorage.setItem('googleAccount', JSON.stringify(googleAccountData));
            }

            toast.success('Berhasil', {
              description: 'Anda telah berhasil masuk dengan Google.',
            });

            // Clean URL (remove parameters)
            window.history.replaceState({}, document.title, '/dashboard');
            
            // Reload page to update sidebar
            window.location.reload();
          } else {
            throw new Error('Failed to fetch user data');
          }
        })
        .catch((err) => {
          console.error('Error fetching user data:', err);
          toast.error('Error', {
            description: 'Gagal memuat data pengguna.',
          });
          localStorage.removeItem('token');
          router.push('/login');
        });
    }
  }, [router, searchParams]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}