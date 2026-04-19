"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard, Users, UserCheck, BookOpen, Calendar, DollarSign,
  BarChart3, MessageSquare, Bell, Settings, LogOut, GraduationCap,
  ClipboardList, FileText, Clock, PlusCircle, Home, Award, ChevronLeft,
  ChevronRight, Shield, Book, Megaphone
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useNotifications } from "@/components/providers/NotificationContext";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Admissions", href: "/admin/admissions", icon: PlusCircle },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Staff", href: "/admin/staff", icon: UserCheck },
  { label: "Fee Management", href: "/admin/fees", icon: DollarSign },
  { label: "Events & Calendar", href: "/admin/events", icon: Calendar },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
];

const staffNavItems = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "My Classes", href: "/staff/classes", icon: BookOpen },
  { label: "Attendance", href: "/staff/attendance", icon: ClipboardList },
  { label: "Marks Entry", href: "/staff/marks", icon: Award },
  { label: "Assignments", href: "/staff/assignments", icon: Book },
  { label: "Calendar", href: "/staff/calendar", icon: Calendar },
  { label: "Announcements", href: "/staff/announcements", icon: Megaphone },
];

const parentNavItems = [
  { label: "Dashboard", href: "/parent", icon: Home },
  { label: "Performance", href: "/parent/performance", icon: BarChart3 },
  { label: "Attendance", href: "/parent/attendance", icon: Calendar },
  { label: "Homework", href: "/parent/homework", icon: ClipboardList },
  { label: "Report Card", href: "/parent/report-card", icon: FileText },
  { label: "Fee Payment", href: "/parent/fees", icon: DollarSign },
  { label: "Calendar", href: "/parent/calendar", icon: Calendar },
  { label: "Announcements", href: "/parent/announcements", icon: Megaphone },
];

const roleConfig = {
  admin: {
    items: adminNavItems,
    color: "from-sky-900 via-blue-900 to-cyan-900",
    badge: "Admin",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    icon: Shield,
  },
  staff: {
    items: staffNavItems,
    color: "from-emerald-900 via-teal-900 to-cyan-900",
    badge: "Staff",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    icon: BookOpen,
  },
  parent: {
    items: parentNavItems,
    color: "from-purple-900 via-violet-900 to-pink-900",
    badge: "Parent",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: Users,
  },
};

interface SidebarProps {
  role: "admin" | "staff" | "parent";
  hiddenNavItems?: string[];
}

export default function Sidebar({ role, hiddenNavItems = [] }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const config = roleConfig[role];
  const { getUnreadCountByCategory } = useNotifications();
  const homeworkBadge = role === "parent" ? getUnreadCountByCategory("homework") : 0;
  const navItems = hiddenNavItems.length
    ? config.items.filter((item) => !hiddenNavItems.includes(item.href))
    : config.items;

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-gradient-to-b transition-all duration-300 relative",
        config.color,
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href={`/${role}`} className="flex items-center gap-3">
          <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-white p-0.5 shadow-sm">
            <Image src="/logo.png" alt="Sunway" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">Sunway</h1>
              <p className="text-white/50 text-xs">Global School</p>
            </div>
          )}
        </Link>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
              config.badgeColor
            )}
          >
            <config.icon className="w-3 h-3" />
            {config.badge} Portal
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const badge = item.href === "/parent/homework" ? homeworkBadge : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-white/20 text-white shadow-sm backdrop-blur"
                  : "text-white/60 hover:text-white hover:bg-white/10",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <item.icon className={cn(collapsed ? "w-5 h-5" : "w-4 h-4")} />
                {badge > 0 && collapsed && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {isActive && !collapsed && badge === 0 && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href={`/${role}/settings`}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
          {!collapsed && <span>Settings</span>}
        </Link>
        
        {/* User Info */}
        {!collapsed && session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-2">
            <Avatar name={session.user.name || ""} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{session.user.name}</p>
              <p className="text-white/50 text-xs truncate">{session.user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all",
            collapsed && "justify-center"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
