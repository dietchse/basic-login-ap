"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";
import { toast } from 'sonner';

export default function ChangePasswordModal({ hasPassword = true, canSetPassword = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const isSettingPassword = canSetPassword && !hasPassword;

  const handleInputChange = (field, value) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    // Untuk set password pertama, tidak perlu current password
    if (!isSettingPassword) {
      if (!passwords.currentPassword) {
        toast.error('Error', {
          description: 'Password lama harus diisi',
        });
        return false;
      }
    }

    if (!passwords.newPassword) {
      toast.error('Error', {
        description: 'Password baru harus diisi',
      });
      return false;
    }

    if (passwords.newPassword.length < 6) {
      toast.error('Error', {
        description: 'Password baru minimal 6 karakter',
      });
      return false;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Error', {
        description: 'Konfirmasi password tidak sesuai',
      });
      return false;
    }

    // Hanya cek jika bukan setting password pertama
    if (!isSettingPassword && passwords.currentPassword === passwords.newPassword) {
      toast.error('Error', {
        description: 'Password baru harus berbeda dengan password lama',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: isSettingPassword ? undefined : passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isSettingPassword && canSetPassword) {
          toast.success('🎉 Password Berhasil Dibuat!', {
            description: 'Sekarang Anda dapat login dengan Google atau email + password.',
          });
        } else {
          toast.success('Berhasil', {
            description: 'Password berhasil diubah',
          });
        }
        
        // Reset form dan tutup modal
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setOpen(false);
        
        // Reload security info untuk update badge
        window.location.reload();
      } else {
        toast.error('Error', {
          description: data.message || 'Gagal mengubah password',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error', {
        description: 'Terjadi kesalahan saat mengubah password',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {isSettingPassword && canSetPassword ? (
            <>
              <GoogleIcon className="w-4 h-4" />
              Buat Password
            </>
          ) : (
            <>
              <Key className="w-4 h-4" />
              Ubah Kata Sandi
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSettingPassword && canSetPassword && <GoogleIcon className="w-5 h-5" />}
            {isSettingPassword ? 'Buat Password untuk Akun Google' : 'Ubah Kata Sandi'}
          </DialogTitle>
          <DialogDescription>
            {isSettingPassword 
              ? 'Buat password untuk akun Google Anda agar dapat login dengan email dan password sebagai alternatif login Google.'
              : 'Masukkan password lama dan password baru untuk mengubah kata sandi Anda.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Current Password - hanya tampil jika bukan setting password pertama */}
          {!isSettingPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Lama</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder="Masukkan password lama"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                  disabled={loading}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="flex items-center gap-2">
              {isSettingPassword && canSetPassword && <GoogleIcon className="w-4 h-4" />}
              {isSettingPassword ? 'Password Baru untuk Akun Google' : 'Password Baru'}
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder={isSettingPassword ? "Buat password baru (min. 6 karakter)" : "Masukkan password baru (min. 6 karakter)"}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                disabled={loading}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwords.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Konfirmasi password baru"
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSettingPassword ? 'Membuat...' : 'Mengubah...'}
              </>
            ) : (
              isSettingPassword ? 'Buat Password' : 'Ubah Password'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
