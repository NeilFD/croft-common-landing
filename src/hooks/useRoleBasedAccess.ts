import { useManagementAuth } from "@/hooks/useManagementAuth";

export const useRoleBasedAccess = () => {
  const { hasRole, canEdit } = useManagementAuth();

  const canViewSensitiveData = () => {
    return hasRole('admin') || hasRole('sales');
  };

  const canCreateBookings = () => {
    return hasRole('admin') || hasRole('sales');
  };

  const canDeleteBookings = () => {
    return hasRole('admin');
  };

  const canViewAuditLog = () => {
    return hasRole('admin') || hasRole('finance');
  };

  const hideEmailPhone = () => {
    // Hide email/phone for ops and readonly roles by default
    return hasRole('ops') || hasRole('readonly');
  };

  const canManageSpaces = () => {
    return canEdit();
  };

  const canEditBookings = () => {
    return hasRole('admin') || hasRole('sales');
  };

  return {
    canViewSensitiveData,
    canCreateBookings,
    canDeleteBookings,
    canViewAuditLog,
    hideEmailPhone,
    canManageSpaces,
    canEditBookings,
  };
};