"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { calculateGrade, getGradeColor } from "@/lib/utils";
import { Grade } from "@/types";
import { Save, CheckCheck, Award, Loader2 } from "lucide-react";
import BarChartComponent from "@/components/charts/BarChartComponent";

const examTypes = ["Unit Test 1", "Unit Test 2", "Mid Term", "Final"];

interface ClassInfo {
  name: string;
  className: string;
  section: string;
  subjects: string[];
}

interface StudentInfo {
  _id: string;
  name: string;
  className: string;
  section: string;
  rollNumber: number;
}

interface MarkRecord {
  studentId: string;
  marksObtained: number;
}

export default function StaffMarksPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState(examTypes[0]);
  const [existingMarks, setExistingMarks] = useState<Record<string, number>>({});
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(false);

  // Load staff profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setClasses(json.data.classSummary);
          setAllStudents(json.data.students);
          const subs = json.data.profile.subjects as string[];
          setSubjects(subs);
          if (json.data.classSummary.length > 0) {
            setSelectedClass(json.data.classSummary[0]);
          }
          if (subs.length > 0) setSelectedSubject(subs[0]);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load existing marks for the selected class/subject/exam
  const fetchMarks = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) return;
    setLoadingMarks(true);
    setSaved(false);
    try {
      const year = new Date().getFullYear();
      const params = new URLSearchParams({
        className: selectedClass.className,
        subject: selectedSubject,
        examType: selectedExam,
        academicYear: `${year}-${year + 1}`,
      });
      if (selectedClass.section) params.set("section", selectedClass.section);
      const res = await fetch(`/api/marks?${params}`);
      const json = await res.json();
      if (json.success) {
        const map: Record<string, number> = {};
        json.data.forEach((r: MarkRecord) => {
          map[r.studentId] = r.marksObtained;
        });
        setExistingMarks(map);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMarks(false);
    }
  }, [selectedClass, selectedSubject, selectedExam]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  const students = selectedClass
    ? allStudents
        .filter(
          (s) =>
            s.className === selectedClass.className &&
            (!selectedClass.section || s.section === selectedClass.section)
        )
        .sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0))
    : [];

  const getMark = (studentId: string): number | null => {
    if (marks[studentId] !== undefined) {
      return marks[studentId] === "" ? null : parseInt(marks[studentId]);
    }
    return existingMarks[studentId] ?? null;
  };

  const handleMark = (studentId: string, val: string) => {
    setSaved(false);
    if (val === "") {
      setMarks((prev) => ({ ...prev, [studentId]: "" }));
      return;
    }
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0 && n <= 100) {
      setMarks((prev) => ({ ...prev, [studentId]: String(n) }));
    }
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) return;
    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const records = students
        .filter((s) => getMark(s._id) !== null)
        .map((s) => ({
          studentId: s._id,
          studentName: s.name,
          className: selectedClass.className,
          section: selectedClass.section || s.section,
          subject: selectedSubject,
          examType: selectedExam,
          marksObtained: getMark(s._id),
          maxMarks: 100,
          academicYear: `${year}-${year + 1}`,
        }));

      if (records.length === 0) return;

      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        // Update existingMarks from response
        const map: Record<string, number> = { ...existingMarks };
        json.data.forEach((r: MarkRecord) => {
          map[r.studentId] = r.marksObtained;
        });
        setExistingMarks(map);
        setMarks({});
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const chartData = students
    .map((s) => {
      const m = getMark(s._id);
      return { name: s.name.split(" ")[0], marks: m ?? 0 };
    })
    .filter((d) => d.marks > 0);

  const avg =
    chartData.length > 0
      ? Math.round(chartData.reduce((a, b) => a + b.marks, 0) / chartData.length)
      : 0;

  const gradeDist = ["A+", "A", "B+", "B", "C+", "C", "D", "F"].map((g) => ({
    name: g,
    count: students.filter((s) => {
      const m = getMark(s._id);
      if (m === null) return false;
      return calculateGrade(m) === g;
    }).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Class</p>
              <div className="flex gap-2">
                {classes.map((cls) => (
                  <button
                    key={cls.name}
                    onClick={() => {
                      setSelectedClass(cls);
                      setMarks({});
                      setSaved(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedClass?.name === cls.name
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Subject</p>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setMarks({});
                  setSaved(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
              >
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-medium">Exam</p>
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value);
                  setMarks({});
                  setSaved(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
              >
                {examTypes.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Marks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
          <CheckCheck className="w-4 h-4" />
          Marks saved for {selectedSubject} — {selectedExam}, {selectedClass?.name}!
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Entry Table */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {selectedSubject} — {selectedExam}
                  {loadingMarks && <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2" />}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-600">
                    Class Avg: <span className="font-bold text-gray-900">{avg}/100</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {students.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No students in this class</p>
              ) : (
                <div className="space-y-2">
                  {students.map((student, i) => {
                    const m = getMark(student._id);
                    const grade = m !== null ? calculateGrade(m) : null;
                    const gc = grade ? getGradeColor(grade) : "";
                    return (
                      <div key={student._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
                        <Avatar name={student.name} size="sm" colorIndex={i % 8} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                          <p className="text-xs text-gray-400">Roll #{student.rollNumber || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="Marks"
                            value={marks[student._id] !== undefined ? marks[student._id] : (m ?? "")}
                            onChange={(e) => handleMark(student._id, e.target.value)}
                            className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                          <span className="text-xs text-gray-400">/ 100</span>
                          {grade && (
                            <span className={`text-xs font-bold w-7 text-center px-1.5 py-0.5 rounded-lg ${gc}`}>
                              {grade}
                            </span>
                          )}
                        </div>
                        {m !== null && (
                          <div className="hidden sm:block w-32">
                            <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                              <span>{m}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  m >= 80 ? "bg-emerald-500" : m >= 60 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${m}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <BarChartComponent
                  data={chartData.slice(0, 8)}
                  bars={[{ key: "marks", color: "#7C3AED", name: "Marks" }]}
                  xKey="name"
                  height={180}
                  showLegend={false}
                />
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No marks entered yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {gradeDist.map((g) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold w-8 text-center px-1 py-0.5 rounded ${getGradeColor(g.name as Grade)}`}
                    >
                      {g.name}
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: students.length > 0 ? `${(g.count / students.length) * 100}%` : "0%",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-4">{g.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Highest",
                value: chartData.length > 0 ? Math.max(...chartData.map((d) => d.marks)) : "—",
                color: "text-emerald-600",
              },
              {
                label: "Lowest",
                value: chartData.length > 0 ? Math.min(...chartData.map((d) => d.marks)) : "—",
                color: "text-red-500",
              },
              { label: "Average", value: avg || "—", color: "text-blue-600" },
              {
                label: "Pass %",
                value:
                  chartData.length > 0
                    ? `${Math.round((chartData.filter((d) => d.marks >= 40).length / chartData.length) * 100)}%`
                    : "—",
                color: "text-violet-600",
              },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
