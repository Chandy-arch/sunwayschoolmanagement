"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton } from "@/components/ui/dialog";
import { Users, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { getSubjectColor } from "@/lib/utils";

interface ClassSummary {
  name: string;
  className: string;
  section: string;
  studentCount: number;
  subjects: string[];
}

interface StudentInfo {
  _id: string;
  studentId: string;
  name: string;
  className: string;
  section: string;
  rollNumber: number;
  gender: string;
  bloodGroup: string;
  parentName: string;
  parentPhone: string;
  phone: string;
}

export default function StaffClassesPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassSummary | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success) {
          setClasses(json.data.classSummary);
          setStudents(json.data.students);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const studentsForClass = selectedClass
    ? students.filter(
        (s) =>
          s.className === selectedClass.className &&
          (!selectedClass.section || s.section === selectedClass.section)
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading classes...
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <BookOpen className="w-10 h-10 opacity-30" />
        <p className="text-sm">No classes assigned yet</p>
      </div>
    );
  }

  const gradients = [
    "from-emerald-500 via-teal-500 to-cyan-600",
    "from-violet-500 via-purple-500 to-indigo-600",
    "from-rose-500 via-pink-500 to-fuchsia-600",
    "from-amber-500 via-orange-500 to-red-500",
    "from-blue-500 via-indigo-500 to-violet-600",
  ];

  return (
    <div className="space-y-5">
      {/* Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {classes.map((cls, i) => (
          <div
            key={cls.name}
            onClick={() => setSelectedClass(cls)}
            className="cursor-pointer group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className={`bg-gradient-to-br ${gradients[i % gradients.length]} p-5 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Class</p>
                  <h3 className="text-3xl font-extrabold">{cls.name}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 opacity-70" />
                  <span className="text-sm">{cls.studentCount} students</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1.5">
                {cls.subjects.map((sub) => (
                  <span key={sub} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getSubjectColor(sub)}`}>
                    {sub}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-end mt-3 text-emerald-600 text-xs font-semibold group-hover:text-emerald-700">
                View Roster <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Class Roster Dialog */}
      <Dialog
        open={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        maxWidth="xl"
      >
        <DialogHeader>
          <DialogTitle>{selectedClass?.name} — Student Roster</DialogTitle>
          <DialogCloseButton onClose={() => setSelectedClass(null)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-emerald-500" />
              {studentsForClass.length} students enrolled
            </div>
          </div>

          {studentsForClass.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No students found in this class</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Parent Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsForClass.map((student, i) => (
                    <TableRow key={student._id} className="hover:bg-emerald-50/40 transition-colors">
                      <TableCell className="font-semibold text-gray-500">{student.rollNumber || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="sm" colorIndex={i % 8} />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.parentName || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.gender === "Male" ? "info" : "purple"} className="text-xs">
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                          {student.bloodGroup || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{student.parentPhone || student.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="success" className="text-xs">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
