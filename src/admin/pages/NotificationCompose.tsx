import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ComposeNotificationForm } from '../components/ComposeNotificationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NotificationCompose = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const queryClient = useQueryClient();

  const onSent = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const onClearEdit = () => {
    if (editId) {
      queryClient.removeQueries({ queryKey: ["notification", editId] });
    }
    // Clear the edit parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('edit');
    window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compose Notification</h1>
        <p className="text-muted-foreground mt-2">
          {editId ? 'Edit an existing notification' : 'Create and send a new notification to users'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editId ? 'Edit Notification' : 'New Notification'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ComposeNotificationForm
            key={editId ?? 'new'}
            onSent={onSent}
            editing={editId ? { id: editId } as any : null}
            onClearEdit={onClearEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
};