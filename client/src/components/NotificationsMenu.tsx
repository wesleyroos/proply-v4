import { useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  type: "new_user";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock notifications for now - will be replaced with real data
const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "new_user",
    title: "New User Registration",
    message: "Wesley Roos (wesley@grodigital.co.za) just signed up",
    timestamp: new Date().toISOString(),
    read: false,
  },
];

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
            )}
          </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No new notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex flex-col items-start p-4 cursor-pointer",
                !notification.read && "bg-blue-50"
              )}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="font-semibold">{notification.title}</div>
              <div className="text-sm text-gray-600">{notification.message}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}