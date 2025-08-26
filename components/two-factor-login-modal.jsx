"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { ShieldCheck, X, Key } from "lucide-react";
import { toast } from "sonner";

export default function TwoFactorLoginModal({ 
  isOpen, 
  onClose, 
  onVerify, 
  isLoading = false 
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError("Masukkan kode verifikasi");
      return;
    }

    if (!useBackupCode && code.length !== 6) {
      setError("Kode authenticator harus 6 digit");
      return;
    }

    if (useBackupCode && code.length !== 8) {
      setError("Backup code harus 8 karakter");
      return;
    }

    setError("");
    onVerify(code);
  };

  const handleClose = () => {
    setCode("");
    setError("");
    setUseBackupCode(false);
    onClose();
  };

  const handleCodeChange = (value) => {
    setCode(value);
    if (error) setError("");
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Verifikasi 2FA</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <Label className="text-base font-medium">
                {useBackupCode ? "Masukkan Backup Code" : "Masukkan Kode Verifikasi"}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {useBackupCode 
                  ? "Masukkan backup code 8 karakter yang Anda simpan"
                  : "Buka aplikasi authenticator dan masukkan kode 6 digit"
                }
              </p>
            </div>
            
            <div className="flex justify-center">
              {useBackupCode ? (
                <Input
                  type="text"
                  placeholder="XXXXXXXX"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="text-center text-lg tracking-wider w-48"
                  disabled={isLoading}
                  autoFocus
                />
              ) : (
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            </div>
            
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={toggleBackupCode}
                disabled={isLoading}
                className="text-sm"
              >
                <Key className="h-4 w-4 mr-1" />
                {useBackupCode ? "Gunakan Kode Authenticator" : "Gunakan Backup Code"}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tips:</strong>
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {useBackupCode 
                ? "Backup code hanya dapat digunakan sekali. Setelah digunakan, code akan dihapus dari sistem."
                : "Kode authenticator berubah setiap 30 detik. Pastikan memasukkan kode yang terbaru."
              }
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !code.trim() || (!useBackupCode && code.length !== 6) || (useBackupCode && code.length !== 8)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
