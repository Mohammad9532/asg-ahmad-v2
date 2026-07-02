import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, CheckCircle2, Archive, Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/config/api';

const NotificationRow = ({ notification }: { notification: any }) => {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: async () => api.post(`/notifications/${notification.id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async () => api.post(`/notifications/${notification.id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30';
      default: return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'high') return <AlertCircle className="w-5 h-5" />;
    if (priority === 'medium') return <AlertTriangle className="w-5 h-5" />;
    if (type === 'system') return <Info className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  return (
    <div className={`p-4 border-b flex gap-4 transition-colors ${notification.is_read ? 'opacity-70 bg-background' : 'bg-muted/10'} hover:bg-muted/30`}>
      <div className={`mt-1 p-2 rounded-full h-fit ${getPriorityColor(notification.priority)}`}>
        {getIcon(notification.type, notification.priority)}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`font-semibold text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
            {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
          </span>
        </div>
        <p className={`text-sm ${!notification.is_read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
          {notification.message}
        </p>
        <div className="flex gap-2 mt-2">
          <span className="text-[10px] uppercase font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
            {notification.category}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {!notification.is_read && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs"
            onClick={() => markReadMutation.mutate()}
            disabled={markReadMutation.isPending}
            title="Mark as read"
          >
            <Check className="w-3 h-3 mr-1" /> Read
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => archiveMutation.mutate()}
          disabled={archiveMutation.isPending}
          title="Archive"
        >
          <Archive className="w-3 h-3 mr-1" /> Archive
        </Button>
      </div>
    </div>
  );
};

export default function NotificationsAdmin() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter, search],
    queryFn: async () => {
      const params: any = { per_page: 50 };
      if (filter === 'unread') params.is_read = 'false';
      if (search) params.search = search;
      const res = await api.get('/notifications', { params });
      return res.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    }
  });

  const notifications = data?.data || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground">Manage your system alerts and messages.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || notifications.length === 0}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex bg-background border rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Inbox
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'unread' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Unread
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Input 
              placeholder="Search notifications..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="divide-y max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-muted-foreground">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p>No notifications found in this view.</p>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <NotificationRow key={notif.id} notification={notif} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
