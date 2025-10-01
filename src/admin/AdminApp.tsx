import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotificationCompose } from './pages/NotificationCompose';
import { NotificationHistory } from './pages/NotificationHistory';
import { OptInAnalytics } from './pages/OptInAnalytics';
import { UserAnalyticsPage } from './pages/UserAnalyticsPage';
import { GranularAnalyticsPage } from './pages/GranularAnalyticsPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { MomentsPage } from './pages/MomentsPage';
import { CinemaPage } from './pages/CinemaPage';
import LeadsList from '../pages/management/LeadsList';

const LeadDetail = lazy(() => import('../pages/management/LeadDetail'));
const AdminMemberAnalytics = lazy(() => import('../pages/AdminMemberAnalytics'));
const EnhancedAdminMemberAnalytics = lazy(() => import('../pages/EnhancedAdminMemberAnalytics'));

export const AdminApp = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="notifications/compose" element={<NotificationCompose />} />
        <Route path="notifications/history" element={<NotificationHistory />} />
        <Route path="analytics/opt-in" element={<OptInAnalytics />} />
        <Route path="analytics/users" element={<UserAnalyticsPage />} />
        <Route path="analytics/granular" element={<GranularAnalyticsPage />} />
        <Route path="analytics/member-analytics" element={<EnhancedAdminMemberAnalytics />} />
        <Route path="analytics/member-analytics-legacy" element={<AdminMemberAnalytics />} />
        <Route path="management/subscribers" element={<SubscribersPage />} />
        <Route path="management/moments" element={<MomentsPage />} />
        <Route path="management/cinema" element={<CinemaPage />} />
        <Route path="management/leads" element={<LeadsList />} />
        <Route path="management/leads/:id" element={<LeadDetail />} />
        <Route path="*" element={<Navigate to="/management/admin" replace />} />
      </Routes>
      <Toaster />
    </>
  );
};