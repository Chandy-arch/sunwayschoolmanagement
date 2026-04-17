"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, Menu, X, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/components/providers/NotificationContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const typeColors = {
  info: "bg-blue-100 text-blue-600",
  warning: "bg-amber-100 text-amber-600",
  success: "bg-emerald-100 text-emerald-600",
  error: "bg-red-100 text-red-600",
};

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-30 shadow-sm">
      {/* Mobile Menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students, staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64 placeholder:text-gray-400"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold hover:bg-red-200">
                        {unreadCount} new
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => markRead(notif._id)}
                      className={cn(
                        "p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors",
                        !notif.isRead && "bg-indigo-50/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold", typeColors[notif.type])}>
                          {notif.type === "info" ? "i" : notif.type === "warning" ? "!" : notif.type === "success" ? "✓" : "×"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-900 truncate">{notif.title}</p>
                            {!notif.isRead && (
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center">
                  <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Avatar name={session?.user?.name || "User"} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-800 leading-tight">
                {session?.user?.name?.split(" ")[0] || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {(session?.user as { role?: string })?.role || "user"}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden md:block" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={session?.user?.name || ""} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Change Password
                  </button>
                  <hr className="my-2 border-gray-100" />
                  <button className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
