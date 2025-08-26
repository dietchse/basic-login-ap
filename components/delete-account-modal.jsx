import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/lib/AuthProvider';

export default function DeleteAccountModal({ isOpen, onClose }) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmUnderstand, setConfirmUnderstand] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { logout } = useContext(AuthContext);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      toast.error('Password diperlukan untuk menghapus akun');
      return;
    }

    if (confirmText !== 'DELETE') {
      toast.error('Ketik "DELETE" untuk konfirmasi penghapusan akun');
      return;
    }

    if (!confirmUnderstand) {
      toast.error('Anda harus memahami konsekuensi penghapusan akun');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.delete('/security/delete-account', {
        data: { password }
      });

      if (response.data) {
        toast.success('Akun berhasil dihapus. Terima kasih telah menggunakan layanan kami.');
        
        // Logout dan redirect ke homepage
        logout();
        router.push('/');
        onClose();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setConfirmText('');
      setConfirmUnderstand(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] w-[calc(100%-2rem)] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Hapus Akun Secara Permanen
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan dan akan menghapus secara permanen:
          </p>
          <div className="flex justify-center">
            <ul className="list-disc list-inside space-y-1 text-sm text-left inline-block">
              <li>Semua data profil dan pengaturan akun</li>
              <li>Riwayat aktivitas dan session</li>
              <li>Pengaturan keamanan dan 2FA</li>
              <li>File yang diupload (foto profil, dll)</li>
              <li>Semua data yang terkait dengan akun ini</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 text-center">
            <Label htmlFor="password" className="text-center block">Konfirmasi Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="text-center"
            />
          </div>

          <div className="space-y-2 text-center">
            <Label htmlFor="confirm-text" className="text-center block">
              Ketik <span className="font-mono bg-muted px-1 rounded">DELETE</span> untuk mengonfirmasi
            </Label>
            <Input
              id="confirm-text"
              placeholder="Ketik DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
              className="text-center"
            />
          </div>

          <div className="flex items-start justify-center space-x-2">
            <Checkbox
              id="understand"
              checked={confirmUnderstand}
              onCheckedChange={setConfirmUnderstand}
              disabled={isLoading}
              className="mt-1"
            />
            <Label htmlFor="understand" className="text-sm text-center leading-5">
              Saya memahami bahwa tindakan ini tidak dapat dibatalkan dan semua data akan hilang secara permanen
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={
              isLoading || 
              !password.trim() || 
              confirmText !== 'DELETE' || 
              !confirmUnderstand
            }
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Hapus Akun Secara Permanen</span>
                <span className="sm:hidden">Hapus Akun</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
