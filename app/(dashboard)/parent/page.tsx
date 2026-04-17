"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import StatCard from "@/components/shared/StatCard";
import BarChartComponent from "@/components/charts/BarChartComponent";
import { formatCurrency, getGradeColor } from "@/lib/utils";
import { CheckCircle, Award, CreditCard, Bell, ChevronRight, BookOpen, Loader2 } from "lucide-react";

interface ChildData {
  _id: string;
  studentId: string;
  name: string;
  className: string;
  section: string;
  rollNumber: number;
  gender: string;
  bloodGroup: string;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  marks: {
    _id: string;
    subject: string;
    examType: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }[];
  latestExam: string | null;
  avgPercentage: number;
  fees: {
    _id: string;
    feeType: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: string;
  }[];
  totalFeesDue: number;
}

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [parentName, setParentName] = useState("");
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data.children.length > 0) {
          setChildren(json.data.children);
          setSelectedChild(json.data.children[0]);
          setParentName(json.data.parentName);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!selectedChild) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <p className="text-sm">No children linked to your account</p>
        <p className="text-xs">Please contact the school administration</p>
      </div>
    );
  }

  const child = selectedChild;
  const recentMarks = child.marks.slice(0, 5);
  const pendingFees = child.fees.filter((f) => ["Pending", "Partial", "Overdue"].includes(f.status));

  // Build subject performance data from latest exam
  const latestExamMarks = child.latestExam
    ? child.marks.filter((m) => m.examType === child.latestExam)
    : [];
  const subjectBarData = latestExamMarks.map((m) => ({
    subject: m.subject.substring(0, 4),
    marks: m.percentage,
  }));

  return (
    <div className="space-y-5">
      {/* Child Selector (if multiple children) */}
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

      {/* Child Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <div className="relative z-10 flex items-center gap-5">
          <Avatar name={child.name} size="xl" colorIndex={2} />
          <div>
            <p className="text-white/70 text-xs font-medium mb-0.5">My Child</p>
            <h2 className="text-2xl font-bold">{child.name}</h2>
            <p className="text-white/70 text-sm">Class {child.className} {child.section} • Roll #{child.rollNumber || "—"}</p>
            <div className="flex gap-3 mt-2">
              {child.bloodGroup && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{child.bloodGroup}</span>}
              {child.gender && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{child.gender}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Attendance"
          value={`${child.attendance.percentage}%`}
          subtitle={`${child.attendance.present}/${child.attendance.totalDays} days`}
          icon={CheckCircle}
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Latest Grade"
          value={recentMarks.length > 0 ? recentMarks[0].grade : "—"}
          subtitle={recentMarks.length > 0 ? recentMarks[0].subject : "No marks yet"}
          icon={Award}
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Fees Due"
          value={child.totalFeesDue > 0 ? formatCurrency(child.totalFeesDue) : "NIL"}
          subtitle={pendingFees.length > 0 ? `${pendingFees.length} pending` : "All paid"}
          icon={CreditCard}
          iconBg={child.totalFeesDue > 0 ? "bg-red-100" : "bg-green-100"}
        />
        <StatCard
          title="Average"
          value={child.avgPercentage > 0 ? `${child.avgPercentage}%` : "—"}
          subtitle={child.latestExam || "No exams yet"}
          icon={Award}
          iconBg="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Performance Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Subject Performance {child.latestExam ? `(${child.latestExam})` : ""}</CardTitle>
              <a href="/parent/performance" className="text-xs text-purple-600 font-medium hover:text-purple-700">View All →</a>
            </div>
          </CardHeader>
          <CardContent>
            {subjectBarData.length > 0 ? (
              <BarChartComponent
                data={subjectBarData}
                bars={[{ key: "marks", color: "#9333EA", name: "Score" }]}
                xKey="subject"
                height={180}
                showLegend={false}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No marks data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Marks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Marks</CardTitle>
              <a href="/parent/performance" className="text-xs text-purple-600 font-medium hover:text-purple-700">Full Report →</a>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentMarks.length > 0 ? (
              <div className="space-y-2">
                {recentMarks.map((m) => (
                  <div key={m._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.subject}</p>
                      <p className="text-xs text-gray-500">{m.examType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{m.marksObtained}/{m.maxMarks}</p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getGradeColor(m.grade as import("@/types").Grade)}`}>{m.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No marks recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fee Summary */}
      {pendingFees.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-amber-800">Outstanding Fees</p>
              <p className="text-sm text-amber-700 mt-0.5">Please pay to avoid late charges</p>
              <div className="flex gap-3 mt-3">
                {pendingFees.slice(0, 3).map((f) => (
                  <div key={f._id} className="bg-white/70 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-700 font-medium">{f.feeType}</p>
                    <p className="text-sm font-bold text-amber-900">{formatCurrency(f.amount - f.paidAmount)}</p>
                    <Badge variant={f.status === "Overdue" ? "destructive" : "warning"} className="text-xs mt-0.5">{f.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <a href="/parent/fees" className="flex items-center gap-1 text-sm text-amber-700 font-bold hover:text-amber-800">
              Pay Now <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
