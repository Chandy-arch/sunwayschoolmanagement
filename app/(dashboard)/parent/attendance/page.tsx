"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarChartComponent from "@/components/charts/BarChartComponent";
import { Check, X, Clock, AlertCircle, Loader2 } from "lucide-react";

interface DailyRecord { date: string; status: string }

interface ChildData {
  _id: string;
  name: string;
  className: string;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    monthly: Record<string, { total: number; present: number; absent: number; late: number }>;
    daily: DailyRecord[];
  };
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ParentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data.children.length > 0) {
          setChildren(json.data.children);
          setSelectedChild(json.data.children[0]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const child = selectedChild;
  const att = child?.attendance;
  const pct = att?.percentage ?? 0;

  // Build calendar days from daily attendance
  const calendarDays = useMemo(() => {
    if (!att) return [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const dailyMap = new Map<number, string>();
    att.daily.forEach((d) => {
      const dt = new Date(d.date);
      if (dt.getMonth() === month && dt.getFullYear() === year) {
        dailyMap.set(dt.getDate(), d.status);
      }
    });

    const days: { date: number; status: "Present" | "Absent" | "Late" | "Holiday" | "Future" | "Weekend" }[] = [];
    for (let i = 0; i < firstDay; i++) days.push({ date: 0, status: "Weekend" });
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow === 0 || dow === 6) {
        days.push({ date: d, status: "Weekend" });
      } else if (new Date(year, month, d) > today) {
        days.push({ date: d, status: "Future" });
      } else {
        const s = dailyMap.get(d);
        days.push({ date: d, status: (s as any) || "Holiday" });
      }
    }
    return days;
  }, [att]);

  // Build monthly trend data
  const monthlyTrend = useMemo(() => {
    if (!att?.monthly) return [];
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const today = new Date();
    const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;

    return months
      .map((label, i) => {
        const mIdx = (i + 3) % 12; // Apr=3, May=4, ..., Mar=2
        const yr = mIdx >= 3 ? startYear : startYear + 1;
        const key = `${yr}-${String(mIdx + 1).padStart(2, "0")}`;
        const data = att.monthly[key];
        if (!data) return null;
        const pres = data.total > 0 ? Math.round(((data.present + data.late) / data.total) * 100) : 0;
        return { name: label, present: pres };
      })
      .filter(Boolean) as { name: string; present: number }[];
  }, [att]);

  const statusConfig = {
    Present: { color: "bg-emerald-500", textColor: "text-white", icon: Check },
    Absent: { color: "bg-red-500", textColor: "text-white", icon: X },
    Late: { color: "bg-amber-400", textColor: "text-white", icon: Clock },
    Holiday: { color: "bg-purple-200", textColor: "text-purple-700", icon: null },
    Future: { color: "bg-gray-100", textColor: "text-gray-300", icon: null },
    Weekend: { color: "bg-transparent", textColor: "text-gray-300", icon: null },
  };

  const monthName = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!child || !att) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <p className="text-sm">No children linked to your account</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Child Selector */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedChild(c)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedChild?._id === c._id
                  ? "bg-purple-600 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Days", value: att.totalDays, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Days Present", value: att.present, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Days Absent", value: att.absent, color: "text-red-500", bg: "bg-red-50" },
          { label: "Attendance %", value: `${pct}%`, color: pct >= 75 ? "text-emerald-600" : "text-red-500", bg: pct >= 75 ? "bg-emerald-50" : "bg-red-50" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-2xl p-4 text-center border border-gray-100`}>
            <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {pct < 75 && pct > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Attendance is below 75%. Students need at least 75% attendance to sit for exams.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{monthName}</CardTitle>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Absent</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Late</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 mb-2">
                {weekdays.map((w) => (
                  <div key={w} className="text-center text-xs font-bold text-gray-400 py-1">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day.status === "Weekend" && day.date === 0) {
                    return <div key={i} />;
                  }
                  const cfg = statusConfig[day.status];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={i}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all text-xs font-semibold ${cfg.color} ${cfg.textColor}`}
                    >
                      <span>{day.date || ""}</span>
                      {Icon && <Icon className="w-2.5 h-2.5 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length > 0 ? (
                <BarChartComponent
                  data={monthlyTrend}
                  bars={[{ key: "present", color: "#10B981", name: "Present %" }]}
                  xKey="name"
                  height={160}
                  showLegend={false}
                />
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="38"
                      fill="none"
                      stroke={pct >= 75 ? "#10B981" : "#EF4444"}
                      strokeWidth="12"
                      strokeDasharray={`${2 * Math.PI * 38 * (pct / 100)} ${2 * Math.PI * 38}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-extrabold ${pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>{pct}%</span>
                    <span className="text-xs text-gray-400">Attended</span>
                  </div>
                </div>
                <div className="w-full space-y-1.5">
                  {[
                    { label: "Present", count: att.present, color: "bg-emerald-500" },
                    { label: "Absent", count: att.absent, color: "bg-red-500" },
                    { label: "Late", count: att.late, color: "bg-amber-400" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="flex-1 text-gray-600">{item.label}</span>
                      <span className="font-bold text-gray-800">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
