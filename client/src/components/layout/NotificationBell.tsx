import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/config/api';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Poll count every 30s
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const res = await api.get('/notifications/count');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = countData?.count || 0;

  // Fetch list only when open
  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const res = await api.get('/notifications?per_page=10');
      return res.data;
    },
    enabled: isOpen,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border rounded-lg shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="p-3 border-b flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-primary"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : listData?.data?.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                No notifications
              </div>
            ) : (
              <div className="divide-y">
                {listData?.data?.map((notif: any) => (
                  <div key={notif.id} className={`p-4 hover:bg-muted/50 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{notif.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t text-center bg-muted/30">
            <button className="text-sm font-medium text-primary hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
