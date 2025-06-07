"use client";

import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Trash2, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, clearNotifications } = useAppContext();

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'error': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline flex items-center">
            <Bell className="mr-2 h-6 w-6" />
            Notifications
          </CardTitle>
          <CardDescription>Recent updates and alerts regarding your claims.</CardDescription>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearNotifications} className="text-destructive hover:bg-destructive/10 border-destructive hover:text-destructive">
            <Trash2 className="mr-1 h-4 w-4" /> Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Image src="https://placehold.co/300x200.png" alt="No notifications" width={200} height={133} data-ai-hint="empty state bell" className="mx-auto mb-6 rounded-lg" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No New Notifications</h3>
            <p className="text-muted-foreground">You're all caught up! Important updates will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map(notif => (
              <li
                key={notif.id}
                className={cn(
                  "flex items-start p-4 rounded-md border transition-colors hover:border-primary/50",
                  notif.read ? "bg-background/50" : "bg-card shadow-sm",
                  notif.type === 'error' && !notif.read && "border-destructive/50",
                  notif.type === 'success' && !notif.read && "border-accent/50"
                )}
              >
                <div className="flex-shrink-0 mr-3 mt-1">{getIconForType(notif.type)}</div>
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                     <h4 className={cn("font-semibold", notif.read && "text-muted-foreground")}>{notif.title}</h4>
                     <time className="text-xs text-muted-foreground">{format(parseISO(notif.timestamp), 'MMM d, h:mm a')}</time>
                  </div>
                  <p className={cn("text-sm", notif.read ? "text-muted-foreground" : "text-foreground/90")}>
                    {notif.message}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {notif.claimId && (
                      <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                        <Link href={`/claims/${notif.claimId}`}>View Claim</Link>
                      </Button>
                    )}
                    {!notif.read && (
                      <Button variant="outline" size="sm" onClick={() => markNotificationAsRead(notif.id)} className="h-auto py-1 px-2">
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
