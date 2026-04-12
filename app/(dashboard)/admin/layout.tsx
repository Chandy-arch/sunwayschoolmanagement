"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ChatWidget from "@/components/shared/ChatWidget";
import { NotificationProvider } from "@/components/providers/NotificationContext";
import { useState } from "react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": { title: "Admin Dashboard", subtitle: "Overview of Sunway Global School" },
  "/admin/admissions": { title: "Admissions", subtitle: "Manage student admissions" },
  "/admin/students": { title: "Students", subtitle: "All enrolled students" },
  "/admin/staff": { title: "Staff Management", subtitle: "Teaching and non-teaching staff" },
  "/admin/timetable": { title: "Timetable", subtitle: "Class schedules and periods" },
  "/admin/fees": { title: "Fee Management", subtitle: "Fee collection and records" },
  "/admin/reports": { title: "Reports & Analytics", subtitle: "Academic and financial reports" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || { title: "Admin Portal", subtitle: "Sunway Global School" };

  return (
    <NotificationProvider>
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar role="admin" />
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
            <Sidebar role="admin" />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 animate-fade-in-up">{children}</div>
        </main>
      </div>
      <ChatWidget />
    </div>
    </NotificationProvider>
  );
}
