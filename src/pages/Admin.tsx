import React from "react";
import { Navigate } from "react-router-dom";
import { useManagementAuth } from "@/hooks/useManagementAuth";
import { ManagementLayout } from "@/components/management/ManagementLayout";
import { AdminApp } from "../admin/AdminApp";

const Admin: React.FC = () => {
  const { managementUser, loading } = useManagementAuth();

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
      <AdminApp />
    </ManagementLayout>
  );
};

export default Admin;
