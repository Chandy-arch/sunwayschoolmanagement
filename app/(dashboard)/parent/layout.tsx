"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ChatWidget from "@/components/shared/ChatWidget";
import { NotificationProvider } from "@/components/providers/NotificationContext";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/parent": { title: "Parent Dashboard", subtitle: "Overview of your child's progress" },
  "/parent/performance": { title: "Academic Performance", subtitle: "Marks and grades by subject" },
  "/parent/attendance": { title: "Attendance", subtitle: "Your child's attendance record" },
  "/parent/homework": { title: "Homework", subtitle: "Assignments and due dates" },
  "/parent/report-card": { title: "Report Card", subtitle: "Official academic report" },
  "/parent/fees": { title: "Fee Management", subtitle: "Fee status and payments" },
  "/parent/messages": { title: "Messages", subtitle: "Communicate with teachers" },
  "/parent/calendar": { title: "School Calendar", subtitle: "Events and holidays" },
};

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  const pageInfo = pageTitles[pathname] ?? { title: "Parent Portal", subtitle: "Sunway Global School" };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session || (session.user as { role?: string })?.role !== "parent") {
    redirect("/login");
  }

  return (
    <NotificationProvider>
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar role="parent" />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex">
            <Sidebar role="parent" />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          userRole="parent"
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
    </NotificationProvider>
  );
}
