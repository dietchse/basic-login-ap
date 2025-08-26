"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  X, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe,
  MapPin,
  Clock,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";

export default function ActiveSessionsModal({ 
  isOpen, 
  onClose 
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadActiveSessions();
    }
  }, [isOpen]);

  const loadActiveSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Error', {
          description: 'Token tidak ditemukan',
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/security/active-sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        toast.error('Error', {
          description: data.message || 'Gagal memuat sesi aktif',
        });
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Error', {
        description: 'Terjadi kesalahan saat memuat sesi aktif',
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    setRevoking(sessionId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Error', {
          description: 'Token tidak ditemukan',
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/revoke-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Berhasil', {
          description: 'Sesi berhasil dicabut',
        });
        // Reload sessions
        loadActiveSessions();
      } else {
        toast.error('Error', {
          description: data.message || 'Gagal mencabut sesi',
        });
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Error', {
        description: 'Terjadi kesalahan saat mencabut sesi',
      });
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'smartphone':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Tidak diketahui';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
  };

  const revokeAllOtherSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Error', {
          description: 'Token tidak ditemukan',
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/revoke-all-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Berhasil', {
          description: 'Semua sesi lain berhasil dicabut',
        });
        loadActiveSessions();
      } else {
        toast.error('Error', {
          description: data.message || 'Gagal mencabut semua sesi',
        });
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      toast.error('Error', {
        description: 'Terjadi kesalahan saat mencabut semua sesi',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Sesi Aktif</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="ml-2">Memuat sesi aktif...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Semua Sesi Login</h3>
                  <p className="text-sm text-muted-foreground">
                    {sessions.length} sesi aktif ditemukan
                  </p>
                </div>
                {sessions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={revokeAllOtherSessions}
                    disabled={loading}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout Semua Sesi Lain
                  </Button>
                )}
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sessions.map((session, index) => (
                  <div
                    key={session.id || index}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getDeviceIcon(session.deviceType)}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {session.deviceInfo || session.userAgent || 'Unknown Device'}
                            </h4>
                            {session.isCurrent && (
                              <StatusBadge type="active">
                                Sesi Saat Ini
                              </StatusBadge>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>IP: {session.ipAddress}</span>
                            </div>
                            {session.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{session.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Login: {session.loginTime ? new Date(session.loginTime).toLocaleString('id-ID') : 'Tidak diketahui'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Aktivitas terakhir: {formatLastActivity(session.lastActivity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {!session.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                          disabled={revoking === session.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {revoking === session.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {sessions.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Tidak ada sesi aktif ditemukan</p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Tips Keamanan
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Logout dari device yang tidak Anda kenali</li>
                      <li>• Periksa sesi aktif secara berkala</li>
                      <li>• Gunakan 2FA untuk keamanan tambahan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
