'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Disable2FAModal({ isOpen, onClose, onSuccess }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDisable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Error', {
        description: 'Masukkan kode 6 digit yang valid',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/security/disable-2fa', {
        token: verificationCode
      });
      
      toast.success('Berhasil', {
        description: response.data.message || '2FA berhasil dinonaktifkan',
      });
      
      onSuccess?.();
      onClose();
      setVerificationCode('');
    } catch (error) {
      toast.error('Gagal', {
        description: error.response?.data?.message || 'Gagal menonaktifkan 2FA',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setVerificationCode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Nonaktifkan 2FA
          </DialogTitle>
          <DialogDescription>
            Menonaktifkan 2FA akan mengurangi keamanan akun Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Peringatan Keamanan
                </p>
                <p className="text-xs text-muted-foreground">
                  Tanpa 2FA, akun Anda hanya dilindungi oleh password. 
                  Pastikan Anda menggunakan password yang kuat dan unik.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification">
              Masukkan kode dari authenticator untuk konfirmasi:
            </Label>
            <Input
              id="verification"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Anda juga dapat menggunakan backup code jika ada
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDisable2FA} 
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? 'Processing...' : 'Nonaktifkan 2FA'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
