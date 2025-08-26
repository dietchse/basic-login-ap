'use client';

import { useEffect, useState } from "react";
import { Shield, Key, Trash2, Save, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import ChangePasswordModal from '@/components/change-password-modal';
import Setup2FAModal from '@/components/setup-2fa-modal';
import Disable2FAModal from '@/components/disable-2fa-modal';
import ActiveSessionsModal from '@/components/active-sessions-modal';
import DeleteAccountModal from '@/components/delete-account-modal';

export default function ProfileContent() {
  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    name: '',
    phone: '',
    jobTitle: '',
    company: '',
    bio: '',
    location: '',
    website: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [securityInfo, setSecurityInfo] = useState({
    hasPassword: true,
    isGoogleAccount: false,
    canSetPassword: false,
    emailVerified: true,
    accountCreated: null,
    lastUpdated: null,
    twoFactorEnabled: false,
    backupCodesCount: 0,
    activeSessions: 1,
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    weeklyDigest: true,
    securityAlerts: true, // Always enabled (read-only)
    browserNotifications: false,
    productUpdates: true,
    systemMaintenance: true,
    newsletters: true,
    emailFrequency: 'daily',
    digestFrequency: 'weekly',
  });
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    // Load user data from localStorage when component mounts
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        name: user.name || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
      });
    }
    
    // Load security info and notification preferences
    loadSecurityInfo();
    loadNotificationPreferences();
  }, []);

  const loadSecurityInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/security-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityInfo(data);
      }
    } catch (error) {
      console.error('Error loading security info:', error);
    }
  };

  const toggle2FA = async () => {
    if (securityInfo.twoFactorEnabled) {
      setShow2FADisable(true);
    } else {
      setShow2FASetup(true);
    }
  };

  const handle2FASuccess = () => {
    // Refresh security info after 2FA changes
    loadSecurityInfo();
  };

  // Load notification preferences
  const loadNotificationPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/notification-preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Save notification preferences
  const saveNotificationPreferences = async (newPreferences) => {
    setNotificationLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token tidak ditemukan');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(newPreferences);
        toast.success('Preferensi notifikasi berhasil disimpan');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal menyimpan preferensi notifikasi');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Terjadi kesalahan saat menyimpan preferensi');
    } finally {
      setNotificationLoading(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (key, value) => {
    if (key === 'securityAlerts') return; // Security alerts cannot be disabled
    
    const newPreferences = {
      ...notifications,
      [key]: value,
    };
    
    saveNotificationPreferences(newPreferences);
  };

  const handleInputChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Error', {
          description: 'Anda tidak memiliki akses. Silakan login kembali.',
        });
        return;
      }

      // Hapus email dari data yang akan dikirim karena tidak boleh diubah
      const { email, ...profileDataToSend } = userProfile;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/edit-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileDataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success('Berhasil', {
          description: 'Profil berhasil diperbarui.',
        });
      } else {
        toast.error('Error', {
          description: data.message || 'Gagal memperbarui profil.',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error', {
        description: 'Terjadi kesalahan saat memperbarui profil.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Tabs defaultValue="personal" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="personal">Pribadi</TabsTrigger>
        <TabsTrigger value="account">Akun</TabsTrigger>
        <TabsTrigger value="security">Keamanan</TabsTrigger>
        <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
      </TabsList>
      {/* Personal Information */}
      <TabsContent value="personal" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
            <CardDescription>Perbarui detail pribadi dan informasi profil Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nama Depan</Label>
                <Input 
                  id="firstName" 
                  value={userProfile.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nama Belakang</Label>
                <Input 
                  id="lastName" 
                  value={userProfile.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={userProfile.email}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email tidak dapat diubah untuk keamanan akun</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input 
                  id="phone" 
                  value={userProfile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Jabatan</Label>
                <Input 
                  id="jobTitle" 
                  value={userProfile.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Perusahaan</Label>
                <Input 
                  id="company" 
                  value={userProfile.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografi</Label>
              <Textarea
                id="bio"
                placeholder="Ceritakan tentang diri Anda..."
                value={userProfile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4} 
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input 
                  id="location" 
                  value={userProfile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  type="url"
                  placeholder="https://example.com"
                  value={userProfile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Menyimpan...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      {/* Account Settings */}
      <TabsContent value="account" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Akun</CardTitle>
            <CardDescription>Kelola preferensi akun dan langganan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Status Akun</Label>
                <p className="text-muted-foreground text-sm">Akun Anda saat ini aktif</p>
              </div>
              <StatusBadge type="active">
                Aktif
              </StatusBadge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Paket Langganan</Label>
                <p className="text-muted-foreground text-sm">Paket Pro - $29/bulan</p>
              </div>
              <Button variant="outline">Kelola Langganan</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Visibilitas Akun</Label>
                <p className="text-muted-foreground text-sm">
                  Buat profil Anda terlihat oleh pengguna lain
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Ekspor Data</Label>
                <p className="text-muted-foreground text-sm">Unduh salinan data Anda</p>
              </div>
              <Button variant="outline">Ekspor Data</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona Bahaya</CardTitle>
            <CardDescription>Tindakan yang tidak dapat diurungkan dan berbahaya</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Delete Account</Label>
                <p className="text-muted-foreground text-sm">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteAccount(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Akun
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      {/* Security Settings */}
      <TabsContent value="security" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Keamanan</CardTitle>
            <CardDescription>Kelola keamanan akun dan autentikasi Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Password Section */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Kata Sandi</Label>
                  <p className="text-muted-foreground text-sm">
                    {securityInfo.isGoogleAccount && !securityInfo.hasPassword
                      ? 'Akun Google - Buat password untuk login alternatif'
                      : securityInfo.isGoogleAccount && securityInfo.hasPassword
                      ? 'Akun Google dengan password - Dapat login dengan Google atau email/password'
                      : `Terakhir diubah ${securityInfo.lastUpdated ? new Date(securityInfo.lastUpdated).toLocaleDateString('id-ID') : 'tidak diketahui'}`
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {securityInfo.isGoogleAccount && !securityInfo.hasPassword && (
                    <StatusBadge type="googleOnly">
                      Google Only
                    </StatusBadge>
                  )}
                  {securityInfo.isGoogleAccount && securityInfo.hasPassword && (
                    <StatusBadge type="googlePassword">
                      Google + Password
                    </StatusBadge>
                  )}
                  <ChangePasswordModal 
                    hasPassword={securityInfo.hasPassword}
                    canSetPassword={securityInfo.canSetPassword}
                  />
                </div>
              </div>
              <Separator />
              
              {/* Two Factor Authentication */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Autentikasi Dua Faktor</Label>
                  <p className="text-muted-foreground text-sm">
                    Tambahkan lapisan keamanan ekstra ke akun Anda
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    type={securityInfo.twoFactorEnabled ? "twoFAEnabled" : "inactive"}
                  >
                    {securityInfo.twoFactorEnabled ? 'Diaktifkan' : 'Nonaktif'}
                  </StatusBadge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggle2FA}
                    disabled={securityLoading}
                  >
                    {securityLoading ? 'Loading...' : (securityInfo.twoFactorEnabled ? 'Nonaktifkan' : 'Aktifkan')}
                  </Button>
                </div>
              </div>
              <Separator />
              
              {/* Email Verification Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Verifikasi Email</Label>
                  <p className="text-muted-foreground text-sm">
                    Status verifikasi alamat email Anda
                  </p>
                </div>
                <StatusBadge 
                  type={securityInfo.emailVerified ? "verified" : "unverified"}
                >
                  {securityInfo.emailVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                </StatusBadge>
              </div>
              <Separator />
              
              {/* Active Sessions */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Sesi Aktif</Label>
                  <p className="text-muted-foreground text-sm">
                    {securityInfo.activeSessions} sesi aktif ditemukan
                  </p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowActiveSessions(true)}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Lihat Sesi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      {/* Notification Settings */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preferensi Notifikasi</CardTitle>
            <CardDescription>Pilih notifikasi apa yang ingin Anda terima.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Notifikasi Email</Label>
                  <p className="text-muted-foreground text-sm">Terima notifikasi melalui email</p>
                </div>
                <Switch 
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationToggle('emailNotifications', checked)}
                  disabled={notificationLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Notifikasi Push</Label>
                  <p className="text-muted-foreground text-sm">
                    Terima notifikasi push di browser Anda
                  </p>
                </div>
                <Switch 
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationToggle('pushNotifications', checked)}
                  disabled={notificationLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Email Pemasaran</Label>
                  <p className="text-muted-foreground text-sm">
                    Terima email tentang fitur dan pembaruan baru
                  </p>
                </div>
                <Switch 
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => handleNotificationToggle('marketingEmails', checked)}
                  disabled={notificationLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Ringkasan Mingguan</Label>
                  <p className="text-muted-foreground text-sm">
                    Dapatkan ringkasan mingguan aktivitas Anda
                  </p>
                </div>
                <Switch 
                  checked={notifications.weeklyDigest}
                  onCheckedChange={(checked) => handleNotificationToggle('weeklyDigest', checked)}
                  disabled={notificationLoading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Peringatan Keamanan</Label>
                  <p className="text-muted-foreground text-sm">
                    Notifikasi keamanan penting (selalu diaktifkan)
                  </p>
                </div>
                <Switch 
                  checked={notifications.securityAlerts} 
                  disabled 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    {/* 2FA Modals */}
    <Setup2FAModal 
      isOpen={show2FASetup}
      onClose={() => setShow2FASetup(false)}
      onSuccess={handle2FASuccess}
    />
    
    <Disable2FAModal 
      isOpen={show2FADisable}
      onClose={() => setShow2FADisable(false)}
      onSuccess={handle2FASuccess}
    />

    <ActiveSessionsModal 
      isOpen={showActiveSessions}
      onClose={() => setShowActiveSessions(false)}
    />

    <DeleteAccountModal 
      isOpen={showDeleteAccount}
      onClose={() => setShowDeleteAccount(false)}
    />
    </>
  );
}
