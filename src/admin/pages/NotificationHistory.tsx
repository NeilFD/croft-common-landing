import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationsTable } from '../components/NotificationsTable';
import { DeliveriesTable } from '../components/DeliveriesTable';
import { NotificationPicker } from '../components/NotificationPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const NotificationHistory = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'dry'>('all');
  const [archivedFilter, setArchivedFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'queued' | 'sent'>('all');

  const handleEdit = (id: string) => {
    navigate(`/admin/notifications/compose?edit=${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification History</h1>
        <p className="text-muted-foreground mt-2">
          View, filter, and manage your notification history
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Notifications</CardTitle>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'live' | 'dry')}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="dry">Dry runs</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'draft' | 'queued' | 'sent')}>
              <TabsList>
                <TabsTrigger value="all">Any status</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
                <TabsTrigger value="queued">Scheduled</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={archivedFilter} onValueChange={(v) => setArchivedFilter(v as 'all' | 'active' | 'archived')}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <NotificationsTable
            onSelect={(id) => setSelectedId(id)}
            selectedId={selectedId}
            filterMode={filterMode}
            archivedFilter={archivedFilter}
            statusFilter={statusFilter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Deliveries</CardTitle>
          <div className="w-full sm:w-auto">
            <NotificationPicker value={selectedId} onChange={(id) => setSelectedId(id)} />
          </div>
        </CardHeader>
        <CardContent>
          {selectedId ? (
            <DeliveriesTable notificationId={selectedId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a notification to view deliveries.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};