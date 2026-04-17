"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BarChartComponent from "@/components/charts/BarChartComponent";
import LineChartComponent from "@/components/charts/LineChartComponent";
import { calculateGrade, getGradeColor } from "@/lib/utils";
import { Grade } from "@/types";
import { Trophy, BookOpen, Loader2 } from "lucide-react";

interface MarkRecord {
  _id: string;
  subject: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
}

interface ChildData {
  _id: string;
  name: string;
  className: string;
  marks: MarkRecord[];
  latestExam: string | null;
  avgPercentage: number;
}

const colors = ["#9333EA", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#8B5CF6"];

export default function ParentPerformancePage() {
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
  const allMarks = child?.marks ?? [];

  // Derive unique subjects and exam types
  const subjects = useMemo(() => [...new Set(allMarks.map((m) => m.subject))], [allMarks]);
  const examTypes = useMemo(() => {
    const order = ["Unit Test 1", "Unit Test 2", "Mid Term", "Quarterly", "Half Yearly", "Final"];
    const types = [...new Set(allMarks.map((m) => m.examType))];
    return types.sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [allMarks]);

  // Subject-wise averages
  const subjectData = useMemo(() => {
    return subjects.map((sub) => {
      const subMarks = allMarks.filter((m) => m.subject === sub);
      const avg = subMarks.length > 0
        ? Math.round(subMarks.reduce((a, m) => a + m.percentage, 0) / subMarks.length)
        : 0;
      return {
        subject: sub,
        shortName: sub.substring(0, 5),
        average: avg,
        grade: calculateGrade(avg),
      };
    });
  }, [subjects, allMarks]);

  // Exam comparison data for line chart
  const examCompData = useMemo(() => {
    return examTypes.map((exam) => {
      const row: Record<string, number | string | null> = { exam };
      subjects.forEach((sub) => {
        const rec = allMarks.find((m) => m.subject === sub && m.examType === exam);
        row[sub.substring(0, 4)] = rec ? Math.round(rec.percentage) : null;
      });
      return row;
    });
  }, [examTypes, subjects, allMarks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!child || allMarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <p className="text-sm">No performance data available</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {subjectData.map((s) => (
          <div key={s.subject} className="bg-white rounded-2xl border p-4 flex flex-col items-center gap-1.5 shadow-sm">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium text-center leading-tight">{s.subject}</p>
            <p className="text-2xl font-extrabold text-gray-900">{s.average}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getGradeColor(s.grade as Grade)}`}>{s.grade}</span>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exams">Exam Comparison</TabsTrigger>
          <TabsTrigger value="details">Marks Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Subject-wise Average</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  data={subjectData.map((s) => ({ name: s.shortName, average: s.average }))}
                  bars={[{ key: "average", color: "#9333EA", name: "Average %" }]}
                  xKey="name"
                  height={220}
                  showLegend={false}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Overall Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                      <circle
                        cx="50" cy="50" r="38"
                        fill="none"
                        stroke="#9333EA"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 38 * (child.avgPercentage / 100)} ${2 * Math.PI * 38}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-purple-700">{child.avgPercentage}%</span>
                      <span className="text-xs text-gray-400">Average</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${getGradeColor(calculateGrade(child.avgPercentage) as Grade)}`}>
                      {calculateGrade(child.avgPercentage)}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">{child.latestExam || "Latest Exam"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exams">
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance Across Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={examCompData.filter((d) => subjects.some((s) => d[s.substring(0, 4)] != null))}
                  lines={subjects.map((sub, i) => ({ key: sub.substring(0, 4), color: colors[i % colors.length], name: sub }))}
                  xKey="exam"
                  height={250}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {examTypes.map((exam) => {
                const examMarks = allMarks.filter((m) => m.examType === exam);
                const avg = examMarks.length > 0
                  ? Math.round(examMarks.reduce((a, m) => a + m.percentage, 0) / examMarks.length)
                  : 0;
                const grade = avg > 0 ? calculateGrade(avg) : "-";
                return (
                  <div key={exam} className="bg-white border rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-xs font-medium text-gray-500 mb-1">{exam}</p>
                    <p className="text-3xl font-bold text-gray-900">{avg || "—"}</p>
                    {avg > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${getGradeColor(grade as Grade)}`}>{grade}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="mt-4 space-y-3">
            {examTypes.map((exam) => {
              const examMarks = allMarks.filter((m) => m.examType === exam);
              if (examMarks.length === 0) return null;
              return (
                <Card key={exam}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      {exam}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 text-xs text-gray-500 font-semibold">Subject</th>
                            <th className="text-center py-2 text-xs text-gray-500 font-semibold">Marks</th>
                            <th className="text-center py-2 text-xs text-gray-500 font-semibold">%</th>
                            <th className="text-center py-2 text-xs text-gray-500 font-semibold">Grade</th>
                            <th className="hidden sm:table-cell py-2 pr-2 text-xs text-gray-500 font-semibold">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examMarks.map((rec) => {
                            const pct = Math.round(rec.percentage);
                            const grade = calculateGrade(pct);
                            return (
                              <tr key={rec._id} className="border-b border-gray-50 last:border-0">
                                <td className="py-2.5 font-medium text-gray-800">{rec.subject}</td>
                                <td className="py-2.5 text-center text-gray-600">{rec.marksObtained}/{rec.maxMarks}</td>
                                <td className="py-2.5 text-center font-semibold text-gray-800">{pct}%</td>
                                <td className="py-2.5 text-center">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${getGradeColor(grade as Grade)}`}>{grade}</span>
                                </td>
                                <td className="py-2.5 pr-2 hidden sm:table-cell">
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
