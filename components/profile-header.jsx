"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Calendar, Mail, MapPin, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { getFullAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';

export default function ProfileHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Coba ambil data dari localStorage dulu
        const storedUser = localStorage.getItem('user');
        const storedGoogleAccount = localStorage.getItem('googleAccount');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Jika ada data Google account, merge dengan user data
          if (storedGoogleAccount) {
            const googleData = JSON.parse(storedGoogleAccount);
            
            // Merge data, prioritaskan data dari database
            const mergedUser = {
              ...userData,
              profilePicture: userData.profilePicture || googleData.profilePicture,
              avatar: googleData.profilePicture, // Simpan sebagai avatar fallback
            };
            setUser(mergedUser);
          } else {
            setUser(userData);
          }
        }

        // Ambil token dari localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No token found, cannot fetch fresh user data.");
          setLoading(false);
          // Jika tidak ada token tapi ada data localStorage, tetap gunakan itu
          return;
        }

        // Panggil API /auth/me untuk data terbaru (optional, jika server available)
        try {
          const response = await api.get('/auth/me');

          if (response.data && response.data.user) {
            // Merge dengan Google data jika ada
            let finalUser = response.data.user;
            if (storedGoogleAccount) {
              const googleData = JSON.parse(storedGoogleAccount);
              finalUser = {
                ...response.data.user,
                profilePicture: response.data.user.profilePicture || googleData.profilePicture,
                avatar: googleData.profilePicture,
              };
            }
            
            setUser(finalUser);
            // Simpan data terbaru ke localStorage
            localStorage.setItem('user', JSON.stringify(finalUser));
          }
        } catch (apiError) {
          // Tidak apa-apa, gunakan data localStorage yang sudah di-set
        }
      } catch (error) {
        console.error("Gagal mengambil data pengguna:", error);
        setUser(null);
        // Hapus token jika API mengembalikan error otentikasi
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tokenExpiry');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validasi file di frontend juga
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Error', {
        description: 'File harus berupa gambar (JPEG, PNG, GIF, atau WebP).',
      });
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Error', {
        description: 'Ukuran file maksimal 5MB.',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update user data dengan profile picture baru
        const updatedUser = {
          ...user,
          profilePicture: data.profilePicture,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        toast.success('Berhasil', {
          description: 'Foto profil berhasil diperbarui.',
        });

        // Reload halaman untuk update sidebar
        window.location.reload();
      } else {
        // Tampilkan error message dari backend
        toast.error('Error', {
          description: data.message || 'Gagal mengunggah foto profil.',
        });
      }
    } catch (error) {
      // Handle network error atau error lainnya
      toast.error('Error', {
        description: 'Terjadi kesalahan saat mengunggah foto profil. Periksa koneksi internet Anda.',
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Gagal memuat data profil.
        </CardContent>
      </Card>
    );
  }

  // Tentukan nama peran berdasarkan ID
  const roleName = user.role === 'ADMIN' ? 'Admin' : 'User';

  // Gunakan utility function untuk mendapatkan URL avatar lengkap
  const avatarSrc = getFullAvatarUrl(user.profilePicture) || user.avatar || null;
  const userName = user.displayName || user.name || 'User';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const joinedDate = user.createdAt ? new Date(user.createdAt) : null;
  const formattedDate = joinedDate && !isNaN(joinedDate)
    ? joinedDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : "Tanggal tidak valid";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={avatarSrc} 
                alt={user.name || "Profile"}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="text-2xl">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="outline"
              className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
              onClick={handleCameraClick}
              disabled={uploading}
              title={uploading ? "Mengunggah..." : "Klik untuk mengubah foto profil (JPEG, PNG, GIF, WebP - Max 5MB)"}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{user.firstName || user.name || "Pengguna"} {user.lastName || ""}</h1>
              <StatusBadge type={user.role === 'ADMIN' ? 'admin' : 'user'}>
                {roleName}
              </StatusBadge>
            </div>
            <p className="text-muted-foreground">{user.jobTitle || "Job title not set"}</p>
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Mail className="size-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                {user.location || "Location not set"}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                Bergabung {formattedDate}
              </div>
            </div>
          </div>
          <Button variant="default">Edit Profile</Button>
        </div>
      </CardContent>
    </Card>
  );
}