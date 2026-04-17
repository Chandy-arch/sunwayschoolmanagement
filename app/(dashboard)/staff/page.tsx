"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import BarChartComponent from "@/components/charts/BarChartComponent";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Users, ClipboardList, Award, Bell, BookOpen, Loader2 } from "lucide-react";

interface StaffProfile {
  name: string;
  staffId: string;
  designation: string;
  department: string;
  subjects: string[];
  classes: string[];
}

interface ClassSummary {
  name: string;
  className: string;
  section: string;
  studentCount: number;
  subjects: string[];
}

interface StudentInfo {
  _id: string;
  name: string;
  className: string;
  section: string;
  rollNumber: number;
}

interface AttendanceInfo {
  studentId: string;
  studentName: string;
  status: "Present" | "Absent" | "Late";
}

interface DashboardData {
  profile: StaffProfile;
  stats: {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    attendancePercent: number;
    attendanceMarked: boolean;
    marksPendingSubjects: number;
  };
  classSummary: ClassSummary[];
  students: StudentInfo[];
  todayAttendance: AttendanceInfo[];
}

export default function StaffDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const todayDate = formatDate(new Date().toISOString());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <Users className="w-10 h-10 opacity-30" />
        <p className="text-sm">Staff profile not found. Please contact admin.</p>
      </div>
    );
  }

  const { profile, stats, classSummary, students, todayAttendance } = data;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Build attendance map for quick lookup
  const attMap = new Map(todayAttendance.map((a) => [a.studentId, a.status]));

  // First class students for quick attendance view
  const firstClass = classSummary[0];
  const firstClassStudents = firstClass
    ? students.filter((s) => s.className === firstClass.className && (!firstClass.section || s.section === firstClass.section)).slice(0, 10)
    : [];

  // Subject performance data (placeholder — will show subjects with 0 avg until marks exist)
  const subjectChartData = profile.subjects.map((sub) => ({ subject: sub, average: 0 }));

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">{greeting}, {profile.name.split(" ")[0]}! 🌸</h2>
          <p className="text-white/70 text-sm">{todayDate} • {profile.designation} — {profile.department}</p>
          <div className="flex gap-6 mt-3">
            <div><p className="text-2xl font-bold">{stats.totalStudents}</p><p className="text-white/60 text-xs">Students</p></div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-2xl font-bold">{stats.attendanceMarked ? `${stats.attendancePercent}%` : "—"}</p>
              <p className="text-white/60 text-xs">Today&apos;s Att.</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div><p className="text-2xl font-bold">{stats.marksPendingSubjects}</p><p className="text-white/60 text-xs">Pending Marks</p></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="My Students" value={stats.totalStudents} subtitle={`${classSummary.length} class${classSummary.length !== 1 ? "es" : ""}`} icon={Users} iconBg="bg-blue-100" />
        <StatCard
          title="Attendance Today"
          value={stats.attendanceMarked ? `${stats.attendancePercent}%` : "Not Marked"}
          subtitle={stats.attendanceMarked ? `${stats.presentToday}/${stats.totalStudents} present` : "Click to mark"}
          icon={ClipboardList}
          iconBg="bg-emerald-100"
        />
        <StatCard title="Marks Pending" value={stats.marksPendingSubjects} subtitle="Subjects" icon={Award} iconBg="bg-amber-100" />
        <StatCard title="Classes" value={classSummary.length} subtitle={profile.classes.join(", ")} icon={BookOpen} iconBg="bg-purple-100" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Today's Attendance Quick View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Today&apos;s Attendance{firstClass ? ` — ${firstClass.name}` : ""}
              </CardTitle>
              <a href="/staff/attendance" className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
                Mark All →
              </a>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {firstClassStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No students assigned yet</p>
            ) : (
              <div className="space-y-2">
                {firstClassStudents.map((student, i) => {
                  const status = attMap.get(student._id);
                  return (
                    <div key={student._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                      <Avatar name={student.name} size="sm" colorIndex={i % 8} />
                      <span className="flex-1 text-sm font-medium text-gray-800">{student.name}</span>
                      <span className="text-xs text-gray-500">#{student.rollNumber}</span>
                      {status ? (
                        <Badge
                          variant={status === "Present" ? "success" : status === "Late" ? "warning" : "destructive"}
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Not Marked</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Subject Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectChartData.length > 0 ? (
                <BarChartComponent
                  data={subjectChartData}
                  bars={[{ key: "average", color: "#7C3AED", name: "Average" }]}
                  xKey="subject"
                  height={200}
                  showLegend={false}
                />
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No subjects assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Assigned Classes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {classSummary.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No classes assigned yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {classSummary.map((cls) => (
                <div key={cls.name} className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{cls.name}</p>
                      <p className="text-xs text-gray-500">{cls.studentCount} students</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cls.subjects.slice(0, 3).map((sub) => (
                      <span key={sub} className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
