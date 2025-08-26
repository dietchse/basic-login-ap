'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Copy, Download, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Setup2FAModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Setup, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const response = await api.post('/security/enable-2fa');
      const data = response.data;
      
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep(2);
      
      toast.success('Berhasil', {
        description: 'QR Code untuk 2FA telah dibuat. Scan dengan aplikasi authenticator Anda.',
      });
    } catch (error) {
      toast.error('Gagal', {
        description: error.response?.data?.message || 'Gagal mengaktifkan 2FA',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Error', {
        description: 'Masukkan kode 6 digit yang valid',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-2fa', {
        token: verificationCode
      });
      
      if (response.data.verified) {
        setStep(3);
        toast.success('Berhasil', {
          description: '2FA berhasil diverifikasi dan diaktifkan!',
        });
      }
    } catch (error) {
      toast.error('Gagal', {
        description: error.response?.data?.message || 'Kode verifikasi tidak valid',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil', {
      description: 'Disalin ke clipboard',
    });
  };

  const downloadBackupCodes = () => {
    const content = `Backup Codes untuk 2FA\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nSimpan kode-kode ini di tempat yang aman!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-2fa.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = () => {
    onSuccess?.();
    onClose();
    setStep(1);
    setVerificationCode('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Setup Autentikasi Dua Faktor
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Aktifkan 2FA untuk keamanan ekstra"}
            {step === 2 && "Verifikasi setup 2FA Anda"}
            {step === 3 && "Simpan backup codes Anda"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Introduction */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mengapa 2FA?</CardTitle>
                <CardDescription>
                  2FA menambah lapisan keamanan ekstra dengan memerlukan kode dari aplikasi authenticator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Proteksi akun bahkan jika password bocor</li>
                  <li>• Kode berubah setiap 30 detik</li>
                  <li>• Dapat menggunakan Google Authenticator, Authy, dll</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: QR Code & Verification */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan QR code ini dengan aplikasi authenticator Anda:
              </p>
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="secret">Atau masukkan kode manual:</Label>
                <div className="flex gap-2">
                  <Input 
                    id="secret" 
                    value={secret} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification">Masukkan kode dari authenticator:</Label>
              <Input
                id="verification"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Simpan Backup Codes
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Backup codes dapat digunakan jika Anda kehilangan akses ke authenticator
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes:</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono p-2 bg-background rounded text-center"
                  >
                    {showBackupCodes ? code : '••••••••'}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              2FA berhasil diaktifkan!
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button onClick={handleEnable2FA} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                {loading ? 'Loading...' : 'Aktifkan 2FA'}
              </Button>
            </>
          )}
          
          {step === 2 && (
            <>
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button 
                onClick={handleVerify2FA} 
                disabled={loading || verificationCode.length !== 6}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Verifying...' : 'Verifikasi'}
              </Button>
            </>
          )}
          
          {step === 3 && (
            <Button onClick={handleComplete} className="w-full bg-red-600 hover:bg-red-700 text-white">
              Selesai
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
