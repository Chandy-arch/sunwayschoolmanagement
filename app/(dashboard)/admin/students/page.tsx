"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogCloseButton,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { studentService, StudentFormData, ParentAccountCredentials } from "@/lib/services/studentService";
import { cn } from "@/lib/utils";
import { Student } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { SCHOOL_GRADES, getSectionFromGrade } from "@/lib/constants";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Search, Plus, Eye, Edit, Trash2, Download,
  Users, UserCheck, AlertTriangle, Loader2, AlertCircle, CheckCircle2,
  KeyRound, Copy, Check, ShieldOff, RefreshCw,
} from "lucide-react";

// ─── Validation schema ────────────────────────────────────────────────────────
const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  className: z.string().min(1, "Class is required"),
  section: z.string().optional(),
  rollNumber: z.coerce.number().optional(),
  parentName: z.string().min(2, "Parent name is required"),
  parentPhone: z.string().min(10, "Parent phone is required"),
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  admissionDate: z.string().optional(),
});
type StudentFormValues = z.infer<typeof studentSchema>;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  // List state
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, active: 0, pendingFees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<{ studentId: string; admissionNumber: string; name: string; parentLoginEmail?: string; parentLoginPassword?: string } | null>(null);
  const [addStep, setAddStep] = useState(1);
  const [editStep, setEditStep] = useState(1);

  // Parent account state
  const [parentAccountCredentials, setParentAccountCredentials] = useState<ParentAccountCredentials | null>(null);
  const [parentAccountAction, setParentAccountAction] = useState<"create" | "reset" | null>(null);
  const [parentRevokeTarget, setParentRevokeTarget] = useState<Student | null>(null);
  const [parentAccountLoading, setParentAccountLoading] = useState(false);
  const [parentAccountError, setParentAccountError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.list({ search, className: selectedClass, page: currentPage, limit: 12 });
      setStudents(res.data);
      setClasses(res.classes);
      setPagination(res.pagination);
      setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, selectedClass, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Forms ──────────────────────────────────────────────────────────────────
  const addForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { gender: "Male", admissionDate: new Date().toISOString().slice(0, 10) },
  });

  const editForm = useForm<StudentFormValues>({ resolver: zodResolver(studentSchema) });

  useEffect(() => {
    if (editStudent) {
      editForm.reset({
        name: editStudent.name,
        email: editStudent.email || "",
        phone: editStudent.phone || "",
        dateOfBirth: editStudent.dateOfBirth?.slice(0, 10) || "",
        gender: editStudent.gender,
        bloodGroup: editStudent.bloodGroup || "",
        address: editStudent.address || "",
        className: editStudent.className,
        section: editStudent.section,
        rollNumber: editStudent.rollNumber,
        parentName: editStudent.parentName,
        parentPhone: editStudent.parentPhone,
        parentEmail: editStudent.parentEmail || "",
        admissionDate: editStudent.admissionDate?.slice(0, 10) || "",
      });
    }
  }, [editStudent, editForm]);

  // ── Submit handlers ────────────────────────────────────────────────────────
  const toFormData = (values: StudentFormValues): StudentFormData => ({
    name: values.name,
    email: values.email || undefined,
    phone: values.phone || undefined,
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    bloodGroup: values.bloodGroup || undefined,
    address: values.address || undefined,
    className: values.className,
    section: values.section || getSectionFromGrade(values.className),
    rollNumber: values.rollNumber,
    parentName: values.parentName,
    parentPhone: values.parentPhone,
    parentEmail: values.parentEmail || undefined,
    admissionDate: values.admissionDate || undefined,
  });

  const handleAddSubmit = async (values: StudentFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await studentService.create(toFormData(values));
      setAddSuccess({ studentId: result.studentId, admissionNumber: result.admissionNumber, name: values.name, parentLoginEmail: result.parentLoginEmail, parentLoginPassword: result.parentLoginPassword });
      addForm.reset();
      await fetchStudents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: StudentFormValues) => {
    if (!editStudent) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await studentService.update(editStudent._id, toFormData(values));
      setEditStudent(null);
      editForm.reset();
      await fetchStudents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await studentService.remove(deleteTarget._id);
      setDeleteTarget(null);
      await fetchStudents();
    } catch {
      // intentionally swallowed
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pagination page numbers ────────────────────────────────────────────────
  const pageNums = Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
    const start = Math.max(1, Math.min(currentPage - 2, pagination.totalPages - 4));
    return start + i;
  });

  // -- Parent account management handlers --------------------------------
  const handleCreateParentAccount = async (s: Student) => {
    setParentAccountLoading(true);
    setParentAccountError(null);
    setParentAccountAction("create");
    try {
      const creds = await studentService.createParentAccount(s._id);
      setParentAccountCredentials(creds);
      await fetchStudents();
    } catch (err) {
      setParentAccountError(err instanceof Error ? err.message : "Failed to create parent account");
    } finally {
      setParentAccountLoading(false);
    }
  };

  const handleResetParentPassword = async (s: Student) => {
    setParentAccountLoading(true);
    setParentAccountError(null);
    setParentAccountAction("reset");
    try {
      const creds = await studentService.resetParentPassword(s._id);
      setParentAccountCredentials(creds);
    } catch (err) {
      setParentAccountError(err instanceof Error ? err.message : "Failed to reset parent password");
    } finally {
      setParentAccountLoading(false);
    }
  };

  const handleRevokeParentAccount = async () => {
    if (!parentRevokeTarget) return;
    setParentAccountLoading(true);
    setParentAccountError(null);
    try {
      await studentService.revokeParentAccount(parentRevokeTarget._id);
      setParentRevokeTarget(null);
      await fetchStudents();
    } catch (err) {
      setParentAccountError(err instanceof Error ? err.message : "Failed to revoke parent access");
    } finally {
      setParentAccountLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: "email" | "password") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{loading ? "—" : stats.total}</p>
              <p className="text-xs text-gray-600">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{loading ? "—" : stats.active}</p>
              <p className="text-xs text-gray-600">Active Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{loading ? "—" : stats.pendingFees}</p>
              <p className="text-xs text-gray-600">Pending Fees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name, ID, admission number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white min-w-[150px]"
            >
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setShowAddModal(true);
                setAddSuccess(null);
                addForm.reset({ gender: "Male", admissionDate: new Date().toISOString().slice(0, 10) });
              }}
            >
              <Plus className="w-4 h-4" /> Add Student
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => studentService.exportCsv(students)}
              disabled={students.length === 0}
            >
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
          {!loading && (
            <p className="text-xs text-gray-500 mt-2">
              Showing {students.length} of {pagination.total} students
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <Button variant="ghost" size="sm" className="ml-auto text-red-700" onClick={fetchStudents}>Retry</Button>
        </div>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-52 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading students...
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">No students found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Parent Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size="sm" colorIndex={parseInt(student._id.slice(-2), 16) % 8} />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500">Roll #{student.rollNumber ?? "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg font-mono font-medium">
                      {student.studentId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">Class {student.className}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-700">{student.parentName}</p>
                    <p className="text-xs text-gray-500">{student.parentPhone}</p>
                  </TableCell>
                  <TableCell>
                    {student.attendance ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-16">
                          <div
                            className={`h-1.5 rounded-full ${student.attendance.percentage >= 90 ? "bg-emerald-500" : student.attendance.percentage >= 75 ? "bg-blue-500" : "bg-red-500"}`}
                            style={{ width: `${student.attendance.percentage}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${student.attendance.percentage >= 90 ? "text-emerald-600" : student.attendance.percentage >= 75 ? "text-blue-600" : "text-red-600"}`}>
                          {student.attendance.percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.fees?.[0] ? (
                      <Badge variant={
                        student.fees[0].status === "Paid" ? "success" :
                        student.fees[0].status === "Pending" ? "warning" :
                        student.fees[0].status === "Partial" ? "info" : "destructive"
                      }>
                        {student.fees[0].status}
                      </Badge>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.isActive ? "success" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.hasParentAccount ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="success" className="text-xs">Active</Badge>
                        <Button variant="ghost" size="icon-sm" title="Reset Parent Password"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleResetParentPassword(student)}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Revoke Parent Access"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setParentRevokeTarget(student)}>
                          <ShieldOff className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" title="Create Parent Login"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1 text-xs"
                        onClick={() => handleCreateParentAccount(student)}>
                        <KeyRound className="w-3.5 h-3.5" />
                        Create
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" title="View" onClick={() => setViewStudent(student)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => { setEditStudent(student); setFormError(null); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Deactivate"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(student)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                Previous
              </Button>
              {pageNums.map((p) => (
                <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm"
                  className="w-8 p-0" onClick={() => setCurrentPage(p)}>
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage >= pagination.totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── View Modal ─────────────────────────────────────────────────────── */}
      {viewStudent && (
        <Dialog open onClose={() => setViewStudent(null)} maxWidth="xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogCloseButton onClose={() => setViewStudent(null)} />
          </DialogHeader>
          <DialogContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                <Avatar name={viewStudent.name} size="xl" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewStudent.name}</h3>
                  <p className="text-sm text-gray-600">{viewStudent.studentId} • {viewStudent.admissionNumber}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="info">Class {viewStudent.className}</Badge>
                    <Badge variant={viewStudent.isActive ? "success" : "secondary"}>
                      {viewStudent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Info</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Date of Birth", value: viewStudent.dateOfBirth ? formatDate(viewStudent.dateOfBirth) : "—" },
                      { label: "Gender", value: viewStudent.gender },
                      { label: "Blood Group", value: viewStudent.bloodGroup || "—" },
                      { label: "Admission Date", value: viewStudent.admissionDate ? formatDate(viewStudent.admissionDate) : "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Parent Info</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Parent Name", value: viewStudent.parentName },
                      { label: "Phone", value: viewStudent.parentPhone },
                      { label: "Email", value: viewStudent.parentEmail || "—" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-medium text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {viewStudent.attendance && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total Days", value: viewStudent.attendance.totalDays, color: "bg-blue-50 text-blue-700" },
                      { label: "Present", value: viewStudent.attendance.presentDays, color: "bg-emerald-50 text-emerald-700" },
                      { label: "Absent", value: viewStudent.attendance.absentDays, color: "bg-red-50 text-red-700" },
                      { label: "Percentage", value: `${viewStudent.attendance.percentage}%`, color: "bg-purple-50 text-purple-700" },
                    ].map((item) => (
                      <div key={item.label} className={`${item.color} rounded-xl p-3 text-center`}>
                        <p className="text-xl font-bold">{item.value}</p>
                        <p className="text-xs mt-0.5 opacity-80">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewStudent.fees && viewStudent.fees.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Fee Records</h4>
                  <div className="space-y-2">
                    {viewStudent.fees.map((fee) => (
                      <div key={fee._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{fee.feeType}</p>
                          <p className="text-xs text-gray-500">Due: {formatDate(fee.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(fee.amount)}</p>
                          <Badge variant={fee.status === "Paid" ? "success" : fee.status === "Pending" ? "warning" : "destructive"}>
                            {fee.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStudent(null)}>Close</Button>
            <Button onClick={() => { setEditStudent(viewStudent); setViewStudent(null); setFormError(null); }}>Edit Student</Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={showAddModal} onClose={() => { if (!submitting) { setShowAddModal(false); setAddStep(1); } }} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>{addSuccess ? "Student Enrolled Successfully" : "Add New Student"}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setShowAddModal(false)} />
        </DialogHeader>
        <DialogContent>
          {addSuccess ? (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{addSuccess.name}</h3>
                <p className="text-sm text-gray-500">has been enrolled successfully</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-gray-100 px-4 py-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500 mb-1">Student ID</p>
                  <p className="text-base font-mono font-bold text-indigo-600">{addSuccess.studentId}</p>
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500 mb-1">Admission No</p>
                  <p className="text-base font-mono font-bold text-indigo-600">{addSuccess.admissionNumber}</p>
                </div>
              </div>
              {addSuccess.parentLoginEmail && (
                <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Parent Login Account Created</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">Login Email</span>
                    <code className="flex-1 text-xs font-mono bg-white border border-emerald-200 rounded px-2 py-1 text-indigo-700 break-all">{addSuccess.parentLoginEmail}</code>
                  </div>
                  <p className="text-xs text-gray-400">Parent can log in using this email. They will be prompted to set their password on first login.</p>
                </div>
              )}
            </div>
          ) : (
            <StudentFormFields form={addForm} onSubmit={addForm.handleSubmit(handleAddSubmit)} submitting={submitting} formError={formError} step={addStep} />
          )}
        </DialogContent>
        <DialogFooter>
          {addSuccess ? (
            <>
              <Button variant="outline" onClick={() => { setAddSuccess(null); setAddStep(1); addForm.reset({ gender: "Male", admissionDate: new Date().toISOString().slice(0, 10) }); }}>
                Add Another
              </Button>
              <Button onClick={() => { setShowAddModal(false); setAddStep(1); }}>Done</Button>
            </>
          ) : (
            <>
              {addStep > 1 ? (
                <Button variant="outline" onClick={() => setAddStep((s) => s - 1)} disabled={submitting}>&larr; Back</Button>
              ) : (
                <Button variant="outline" onClick={() => { setShowAddModal(false); setAddStep(1); }} disabled={submitting}>Cancel</Button>
              )}
              {addStep < 3 ? (
                <Button onClick={async () => {
                  const stepFields: Record<number, (keyof StudentFormValues)[]> = {
                    1: ["name", "dateOfBirth", "gender"],
                    2: ["className"],
                  };
                  const valid = await addForm.trigger(stepFields[addStep]);
                  if (valid) setAddStep((s) => s + 1);
                }} disabled={submitting}>
                  Next &rarr;
                </Button>
              ) : (
                <Button onClick={addForm.handleSubmit(handleAddSubmit)} disabled={submitting} className="gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enroll Student
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={!!editStudent} onClose={() => { if (!submitting) { setEditStudent(null); setEditStep(1); } }} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>Edit Student — {editStudent?.name}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setEditStudent(null)} />
        </DialogHeader>
        <DialogContent>
          <StudentFormFields form={editForm} onSubmit={editForm.handleSubmit(handleEditSubmit)} submitting={submitting} formError={formError} step={editStep} />
        </DialogContent>
        <DialogFooter>
          {editStep > 1 ? (
            <Button variant="outline" onClick={() => setEditStep((s) => s - 1)} disabled={submitting}>&larr; Back</Button>
          ) : (
            <Button variant="outline" onClick={() => { setEditStudent(null); setEditStep(1); }} disabled={submitting}>Cancel</Button>
          )}
          {editStep < 3 ? (
            <Button onClick={async () => {
              const stepFields: Record<number, (keyof StudentFormValues)[]> = {
                1: ["name", "dateOfBirth", "gender"],
                2: ["className"],
              };
              const valid = await editForm.trigger(stepFields[editStep]);
              if (valid) setEditStep((s) => s + 1);
            }} disabled={submitting}>
              Next &rarr;
            </Button>
          ) : (
            <Button onClick={editForm.handleSubmit(handleEditSubmit)} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => !submitting && setDeleteTarget(null)} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Deactivate Student</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setDeleteTarget(null)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Are you sure?</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{deleteTarget?.name}</span> ({deleteTarget?.studentId}) will be
                deactivated. This can be reversed by an administrator.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Deactivate
          </Button>
        </DialogFooter>
      </Dialog>

      {/* -- Parent Account Credentials Modal ------------------------------ */}
      <Dialog
        open={!!parentAccountAction}
        onClose={() => { if (!parentAccountLoading) { setParentAccountCredentials(null); setParentAccountAction(null); setParentAccountError(null); } }}
        maxWidth="sm"
      >
        <DialogHeader>
          <DialogTitle>{parentAccountAction === "create" ? "Parent Login Account Created" : "Parent Password Reset"}</DialogTitle>
          <DialogCloseButton onClose={() => { if (!parentAccountLoading) { setParentAccountCredentials(null); setParentAccountAction(null); setParentAccountError(null); } }} />
        </DialogHeader>
        <DialogContent>
          {parentAccountLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {parentAccountAction === "create" ? "Creating parent account..." : "Resetting parent password..."}
            </div>
          ) : parentAccountError ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {parentAccountError}
            </div>
          ) : parentAccountCredentials ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center gap-2 pb-2">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{parentAccountCredentials.parentName}</h3>
                <p className="text-xs text-gray-500">Parent of {parentAccountCredentials.studentName} ({parentAccountCredentials.studentId})</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-amber-700">
                  ? This password will only be shown once. Please copy and share it with the parent.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Login Email</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{parentAccountCredentials.email}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(parentAccountCredentials.email, "email")} className="flex-shrink-0">
                  {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Password</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{parentAccountCredentials.password}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(parentAccountCredentials.password, "password")} className="flex-shrink-0">
                  {copiedField === "password" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => { setParentAccountCredentials(null); setParentAccountAction(null); setParentAccountError(null); }} disabled={parentAccountLoading}>
            Done
          </Button>
        </DialogFooter>
      </Dialog>

      {/* -- Revoke Parent Access Confirm Modal ---------------------------- */}
      <Dialog open={!!parentRevokeTarget} onClose={() => !parentAccountLoading && setParentRevokeTarget(null)} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Revoke Parent Login Access</DialogTitle>
          <DialogCloseButton onClose={() => !parentAccountLoading && setParentRevokeTarget(null)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Revoke parent login access?</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{parentRevokeTarget?.parentName}</span> (parent of {parentRevokeTarget?.name}) will no longer
                be able to log in to the parent portal. You can create a new login account later.
              </p>
            </div>
          </div>
          {parentAccountError && (
            <div className="flex items-center gap-2 p-3 mt-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {parentAccountError}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setParentRevokeTarget(null)} disabled={parentAccountLoading}>Cancel</Button>
          <Button variant="destructive" onClick={handleRevokeParentAccount} disabled={parentAccountLoading} className="gap-2">
            {parentAccountLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Revoke Access
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}


const FORM_STEPS = ["Personal Info", "Academic", "Parent / Guardian"];

function StudentFormFields({
  form,
  submitting,
  formError,
  step = 1,
}: {
  form: ReturnType<typeof useForm<StudentFormValues>>;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  submitting: boolean;
  formError: string | null;
  step?: number;
}) {
  const { register, formState: { errors }, watch, setValue } = form;

  const dateOfBirth = watch("dateOfBirth");
  const admissionDate = watch("admissionDate");
  const selectedGrade = watch("className");

  // Auto-derive section from selected grade
  useEffect(() => {
    if (selectedGrade) setValue("section", getSectionFromGrade(selectedGrade));
  }, [selectedGrade, setValue]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-1">
        {FORM_STEPS.map((label, i) => (
          <>
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                step > i + 1 ? "bg-purple-600 text-white" :
                step === i + 1 ? "bg-purple-600 text-white ring-4 ring-purple-100" :
                "bg-gray-200 text-gray-500"
              )}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                step === i + 1 ? "text-gray-900" : step > i + 1 ? "text-purple-600" : "text-gray-400"
              )}>
                {label}
              </span>
            </div>
            {i < FORM_STEPS.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-1", step > i + 1 ? "bg-purple-400" : "bg-gray-200")} />
            )}
          </>
        ))}
      </div>

      {formError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formError}
        </div>
      )}

      {/* Step 1 - Personal Info */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
            <span className="w-2 h-2 bg-purple-600 rounded-full" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Personal Information</span>
          </div>
          {/* Full Name */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Full Name *</label>
            <div className="flex-1">
              <Input {...register("name")} placeholder="e.g. Arjun Sharma" disabled={submitting} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name.message}</p>}
            </div>
          </div>
          {/* Date of Birth */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Date of Birth *</label>
            <div className="flex-1">
              <DatePicker
                value={dateOfBirth}
                onChange={(e) => setValue("dateOfBirth", e.target.value, { shouldValidate: true })}
                disabled={submitting}
                minYear={currentYear - 20}
                maxYear={currentYear - 3}
              />
              {errors.dateOfBirth && <p className="text-xs text-red-500 mt-0.5">{errors.dateOfBirth.message}</p>}
            </div>
          </div>
          {/* Gender + Blood Group */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Gender *</label>
            <select {...register("gender")} disabled={submitting}
              className="flex-1 h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <label className="text-xs font-medium text-gray-500 w-24 flex-shrink-0 text-right">Blood Group</label>
            <select {...register("bloodGroup")} disabled={submitting}
              className="flex-1 h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {/* Phone */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Phone</label>
            <Input {...register("phone")} placeholder="Student phone" disabled={submitting} className="flex-1" />
          </div>
          {/* Email */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Email</label>
            <div className="flex-1">
              <Input {...register("email")} type="email" placeholder="student@email.com" disabled={submitting} />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>}
            </div>
          </div>
          {/* Address */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Address</label>
            <Input {...register("address")} placeholder="Residential address" disabled={submitting} className="flex-1" />
          </div>
        </div>
      )}

      {/* Step 2 - Academic Info */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
            <span className="w-2 h-2 bg-purple-600 rounded-full" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Academic Information</span>
          </div>
          {/* Grade */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Grade / Class *</label>
            <div className="flex-1">
              <select
                {...register("className")}
                disabled={submitting}
                className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select grade</option>
                {SCHOOL_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.className && <p className="text-xs text-red-500 mt-0.5">{errors.className.message}</p>}
            </div>
          </div>
          {/* Roll Number */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Roll No.</label>
            <Input {...register("rollNumber")} type="number" min={1} placeholder="e.g. 12" disabled={submitting} className="flex-1" />
          </div>
          {/* Admission Date */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Admission Date</label>
            <div className="flex-1">
              <DatePicker
                value={admissionDate}
                onChange={(e) => setValue("admissionDate", e.target.value)}
                disabled={submitting}
                minYear={2010}
                maxYear={currentYear}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3 - Parent / Guardian */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
            <span className="w-2 h-2 bg-purple-600 rounded-full" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Parent / Guardian</span>
          </div>
          {/* Parent Name + Phone */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Parent Name *</label>
            <div className="flex-1">
              <Input {...register("parentName")} placeholder="e.g. Rajesh Sharma" disabled={submitting} />
              {errors.parentName && <p className="text-xs text-red-500 mt-0.5">{errors.parentName.message}</p>}
            </div>
            <label className="text-xs font-medium text-gray-500 w-24 flex-shrink-0 text-right">Phone *</label>
            <div className="flex-1">
              <Input {...register("parentPhone")} placeholder="+91 9876543210" disabled={submitting} />
              {errors.parentPhone && <p className="text-xs text-red-500 mt-0.5">{errors.parentPhone.message}</p>}
            </div>
          </div>
          {/* Parent Email */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 text-right">Parent Email</label>
            <div className="flex-1">
              <Input {...register("parentEmail")} type="email" placeholder="parent@gmail.com" disabled={submitting} />
              <p className="text-xs text-gray-400 mt-0.5">Personal Gmail — login email will be auto-generated</p>
              {errors.parentEmail && <p className="text-xs text-red-500 mt-0.5">{errors.parentEmail.message}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
