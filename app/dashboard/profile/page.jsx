import AppLayout from '@/components/dashboard-layout';
import ProfileContent from "@/components/profile-content";
import ProfileHeader from "@/components/profile-header";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="container mx-auto space-y-6 px-4 py-10">
        <ProfileHeader />
        <ProfileContent />
      </div>
    </AppLayout>
  );
}