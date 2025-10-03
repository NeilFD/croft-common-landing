import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/management/settings/UserManagement';
import { MyProfile } from '@/components/management/settings/MyProfile';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { Navigate } from 'react-router-dom';

const Settings = () => {
  const { managementUser, loading } = useManagementAuth();
  const isAdmin = managementUser?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="font-brutalist text-xl mb-2">Loading...</div>
          <div className="font-industrial text-muted-foreground">Verifying access...</div>
        </div>
      </div>
    );
  }

  if (!managementUser?.hasAccess) {
    return <Navigate to="/management/login" replace />;
  }

  return (
    <ManagementLayout>
      <div className="p-6">
        <h1 className="font-brutalist text-3xl mb-6">Settings</h1>
        
        <Tabs defaultValue={isAdmin ? "users" : "profile"} className="w-full">
          <TabsList>
            {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
          
          {isAdmin && (
            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}
          
          <TabsContent value="profile" className="mt-6">
            <MyProfile />
          </TabsContent>
        </Tabs>
      </div>
    </ManagementLayout>
  );
};

export default Settings;
