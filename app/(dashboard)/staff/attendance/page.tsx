"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, CheckCheck, RotateCcw, Save, Loader2 } from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late";

interface ClassInfo {
  name: string;
  className: string;
  section: string;
  studentCount: number;
  isClassTeacher: boolean;
}

interface StudentInfo {
  _id: string;
  name: string;
  className: string;
  section: string;
  rollNumber: number;
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function StaffAttendancePage() {
  const today = new Date();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(today));
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [isSubjectTeacher, setIsSubjectTeacher] = useState(false);

  // Load staff profile + classes
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          if (json.data.profile?.teacherType === "subject_teacher") {
            setIsSubjectTeacher(true);
            setLoading(false);
            return;
          }
          setClasses(json.data.classSummary);
          setStudents(json.data.students);
          if (json.data.classSummary.length > 0) {
            setSelectedClass(json.data.classSummary[0]);
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load existing attendance for selected class + date
  const fetchAttendance = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingAtt(true);
    setSaved(false);
    try {
      const params = new URLSearchParams({
        className: selectedClass.className,
        date: selectedDate,
      });
      if (selectedClass.section) params.set("section", selectedClass.section);
      const res = await fetch(`/api/attendance?${params}`);
      const json = await res.json();
      if (json.success) {
        const map: Record<string, AttendanceStatus> = {};
        json.data.forEach((r: { studentId: string; status: AttendanceStatus }) => {
          map[r.studentId] = r.status;
        });
        setAttendance(map);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingAtt(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const classStudents = selectedClass
    ? students
        .filter(
          (s) =>
            s.className === selectedClass.className &&
            (!selectedClass.section || s.section === selectedClass.section)
        )
        .sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0))
    : [];

  const getStatus = (studentId: string): AttendanceStatus | null => {
    return attendance[studentId] || null;
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setSaved(false);
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      all[s._id] = status;
    });
    setAttendance(all);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const records = classStudents.map((s) => ({
        studentId: s._id,
        studentName: s.name,
        className: selectedClass.className,
        section: selectedClass.section || s.section,
        date: selectedDate,
        status: attendance[s._id] || "Present",
      }));
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    Present: classStudents.filter((s) => getStatus(s._id) === "Present").length,
    Absent: classStudents.filter((s) => getStatus(s._id) === "Absent").length,
    Late: classStudents.filter((s) => getStatus(s._id) === "Late").length,
    NotMarked: classStudents.filter((s) => !getStatus(s._id)).length,
  };

  const offsets = [-2, -1, 0, 1, 2];
  const calDays = offsets.map((o) => {
    const d = new Date(today);
    d.setDate(d.getDate() + o);
    return d;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (isSubjectTeacher) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
          <X className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Attendance Not Available</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            As a subject teacher, you are not assigned to a class and cannot mark attendance.
            Only class teachers have access to this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {classes.map((cls) => (
            <button
              key={cls.name}
              onClick={() => {
                setSelectedClass(cls);
                setAttendance({});
                setSaved(false);
              }}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedClass?.name === cls.name
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cls.name}
              {cls.isClassTeacher && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  CT
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={selectedDate}
          max={toDateStr(today)}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setAttendance({});
            setSaved(false);
          }}
          className="ml-auto px-3 py-2 rounded-xl border border-gray-200 text-sm"
        />
      </div>

      {/* View-only banner for non-class-teacher classes */}
      {selectedClass && !selectedClass.isClassTeacher && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
          <span className="text-base">👁</span>
          You are viewing attendance for <span className="font-bold mx-1">{selectedClass.name}</span> in read-only mode.
          Only the assigned class teacher can mark attendance for this class.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Student List */}
        <div className="xl:col-span-2 space-y-3">
          {/* Summary Strip */}
          <div className="flex gap-3">
            {[
              { label: "Present", count: counts.Present, color: "bg-emerald-100 text-emerald-700" },
              { label: "Absent", count: counts.Absent, color: "bg-red-100 text-red-700" },
              { label: "Late", count: counts.Late, color: "bg-amber-100 text-amber-700" },
              { label: "Not Marked", count: counts.NotMarked, color: "bg-gray-100 text-gray-600" },
            ].map((item) => (
              <div key={item.label} className={`flex-1 items-center text-center py-3 rounded-xl ${item.color}`}>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs font-semibold">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Bulk Actions — only shown for class teacher */}
          {selectedClass?.isClassTeacher && (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="success" onClick={() => markAll("Present")}>
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" /> Mark All Present
              </Button>
              <Button size="sm" variant="destructive" onClick={() => markAll("Absent")}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Mark All Absent
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setAttendance({}); fetchAttendance(); }}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
                disabled={saving || classStudents.length === 0}
                className="ml-auto gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Attendance
              </Button>
            </div>
          )}

          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              Attendance saved successfully for {selectedDate}!
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedClass?.name} — {selectedDate}
                {selectedClass?.isClassTeacher && (
                  <span className="ml-2 text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Class Teacher
                  </span>
                )}
                {loadingAtt && <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {classStudents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No students in this class</p>
              ) : (
                classStudents.map((student, i) => {
                  const status = getStatus(student._id);
                  const isEditable = !!selectedClass?.isClassTeacher;
                  return (
                    <div key={student._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 group">
                      <Avatar name={student.name} size="sm" colorIndex={i % 8} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                        <p className="text-xs text-gray-400">Roll #{student.rollNumber || "—"}</p>
                      </div>
                      <div className="flex gap-1.5">
                        {(["Present", "Absent", "Late"] as AttendanceStatus[]).map((s) => {
                          const styles: Record<AttendanceStatus, string> = {
                            Present: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
                            Absent: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200",
                            Late: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",
                          };
                          const activeStyles: Record<AttendanceStatus, string> = {
                            Present: "bg-emerald-600 !text-white border-emerald-600",
                            Absent: "bg-red-600 !text-white border-red-600",
                            Late: "bg-amber-500 !text-white border-amber-500",
                          };
                          return (
                            <button
                              key={s}
                              onClick={() => isEditable && setStatus(student._id, s)}
                              disabled={!isEditable}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${styles[s]} ${status === s ? activeStyles[s] : ""} ${!isEditable ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              {s === "Present" ? "P" : s === "Absent" ? "A" : "L"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Mini Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Date Nav</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1.5">
                {calDays.map((d) => {
                  const ds = toDateStr(d);
                  const isSelected = ds === selectedDate;
                  const isToday = ds === toDateStr(today);
                  const isFuture = d > today;
                  return (
                    <button
                      key={ds}
                      disabled={isFuture}
                      onClick={() => {
                        if (!isFuture) {
                          setSelectedDate(ds);
                          setAttendance({});
                          setSaved(false);
                        }
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold"
                          : isFuture
                          ? "text-gray-300 cursor-not-allowed"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span className="flex-1 text-left">
                        {d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      {isToday && !isSelected && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Today</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
