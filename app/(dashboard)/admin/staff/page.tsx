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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogCloseButton,
} from "@/components/ui/dialog";
import { staffService, StaffFormData, AccountCredentials } from "@/lib/services/staffService";
import { Staff } from "@/types";
import { formatDate, getSubjectColor } from "@/lib/utils";
import { SCHOOL_GRADES } from "@/lib/constants";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Search, Plus, Eye, Edit, Trash2, Phone, Mail, Award, Users,
  Loader2, AlertCircle, Building2, BookOpen, CheckCircle2,
  KeyRound, ShieldOff, RefreshCw, Copy, Check, ShieldCheck,
} from "lucide-react";

// ─── Zod validation schema ────────────────────────────────────────────────────
const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().min(2, "Department is required"),
  subjectsRaw: z.string().optional(),
  classesRaw: z.string().optional(),
  qualifications: z.string().optional(),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  salary: z.coerce.number().min(0, "Salary cannot be negative"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z.string().optional(),
  createLoginAccount: z.boolean().optional(),
});
type StaffFormValues = z.infer<typeof staffSchema>;

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [viewStaff, setViewStaff] = useState<Staff | null>(null);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<{ staffId: string; name: string } | null>(null);

  // Account management
  const [accountCredentials, setAccountCredentials] = useState<AccountCredentials | null>(null);
  const [accountAction, setAccountAction] = useState<"create" | "reset" | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Staff | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffService.list({ search, department: selectedDept, page: currentPage, limit: 15 });
      setStaff(res.data);
      setDepartments(res.departments);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [search, selectedDept, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const addForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { experience: 0, salary: 0, createLoginAccount: true, gender: "Male" },
  });

  const editForm = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema) });

  useEffect(() => {
    if (editStaff) {
      editForm.reset({
        name: editStaff.name,
        email: editStaff.email,
        phone: editStaff.phone,
        designation: editStaff.designation,
        department: editStaff.department,
        subjectsRaw: editStaff.subjects.join(", "),
        classesRaw: editStaff.classes.join(", "),
        qualifications: editStaff.qualifications,
        experience: editStaff.experience,
        salary: editStaff.salary,
        dateOfJoining: editStaff.dateOfJoining,
        gender: editStaff.gender,
        address: editStaff.address,
      });
    }
  }, [editStaff, editForm]);

  const parseFormData = (values: StaffFormValues): StaffFormData => ({
    name: values.name,
    email: values.email,
    phone: values.phone,
    designation: values.designation,
    department: values.department,
    subjects: values.subjectsRaw ? values.subjectsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    classes: values.classesRaw ? values.classesRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    qualifications: values.qualifications || "",
    experience: values.experience,
    salary: values.salary,
    dateOfJoining: values.dateOfJoining,
    gender: values.gender,
    address: values.address || "",
    createLoginAccount: values.createLoginAccount,
  });

  const handleAddSubmit = async (values: StaffFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await staffService.create(parseFormData(values));
      setAddSuccess({ staffId: result.staffId, name: values.name });
      addForm.reset();
      await fetchStaff();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: StaffFormValues) => {
    if (!editStaff) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await staffService.update(editStaff._id, parseFormData(values));
      setEditStaff(null);
      editForm.reset();
      await fetchStaff();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await staffService.remove(deleteTarget._id);
      setDeleteTarget(null);
      await fetchStaff();
    } catch {
      // intentionally swallowed — retry via UI
    } finally {
      setSubmitting(false);
    }
  };

  const totalTeachers = staff.filter((s) => s.designation.toLowerCase().includes("teacher")).length;
  const totalHODs = staff.filter((s) => s.designation === "HOD").length;

  // ── Account management handlers ──────────────────────────────────────
  const handleCreateAccount = async (s: Staff) => {
    setAccountLoading(true);
    setAccountError(null);
    setAccountAction("create");
    try {
      const creds = await staffService.createAccount(s._id);
      setAccountCredentials(creds);
      await fetchStaff();
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleResetPassword = async (s: Staff) => {
    setAccountLoading(true);
    setAccountError(null);
    setAccountAction("reset");
    try {
      const creds = await staffService.resetPassword(s._id);
      setAccountCredentials(creds);
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleRevokeAccount = async () => {
    if (!revokeTarget) return;
    setAccountLoading(true);
    setAccountError(null);
    try {
      await staffService.revokeAccount(revokeTarget._id);
      setRevokeTarget(null);
      await fetchStaff();
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Failed to revoke access");
    } finally {
      setAccountLoading(false);
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: pagination.total, color: "from-indigo-500 to-purple-600", icon: Users },
          { label: "Teachers", value: totalTeachers, color: "from-emerald-500 to-teal-600", icon: BookOpen },
          { label: "HODs", value: totalHODs, color: "from-amber-500 to-orange-600", icon: Award },
          { label: "Departments", value: departments.length, color: "from-blue-500 to-cyan-600", icon: Building2 },
        ].map((stat) => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} text-white border-0 shadow-lg`}>
            <CardContent className="p-4">
              <p className="text-3xl font-bold">{loading ? "—" : stat.value}</p>
              <p className="text-white/70 text-sm mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name, ID, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setShowAddModal(true);
                setAddSuccess(null);
                addForm.reset({ experience: 0, salary: 0, createLoginAccount: true, gender: "Male" });
              }}
            >
              <Plus className="w-4 h-4" /> Add Staff
            </Button>
          </div>
          {!loading && (
            <p className="text-xs text-gray-500 mt-2">
              {pagination.total} staff member{pagination.total !== 1 ? "s" : ""} found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <Button variant="ghost" size="sm" className="ml-auto text-red-700" onClick={fetchStaff}>Retry</Button>
        </div>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading staff...
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">No staff members found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" colorIndex={parseInt(s._id.slice(-2), 16) % 8} />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg font-mono font-medium">{s.staffId}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.designation === "HOD" || s.designation === "Vice Principal" ? "purple" : "info"}>
                      {s.designation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{s.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.subjects.slice(0, 2).map((sub) => (
                        <span key={sub} className={`text-xs px-1.5 py-0.5 rounded-md border ${getSubjectColor(sub)}`}>{sub}</span>
                      ))}
                      {s.subjects.length > 2 && (
                        <span className="text-xs text-gray-500">+{s.subjects.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-700">{s.experience} yrs</span>
                  </TableCell>
                  <TableCell>
                    {s.hasLoginAccount ? (
                      <Badge variant="success" className="gap-1">
                        <ShieldCheck className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-gray-500">
                        No Account
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" title="View" onClick={() => setViewStaff(s)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => { setEditStaff(s); setFormError(null); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Deactivate"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(s)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      {/* Account actions */}
                      {!s.hasLoginAccount ? (
                        <Button variant="ghost" size="icon-sm" title="Create Login"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleCreateAccount(s)}>
                          <KeyRound className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon-sm" title="Reset Password"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => handleResetPassword(s)}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Revoke Access"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setRevokeTarget(s)}>
                            <ShieldOff className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={currentPage >= pagination.totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── View Modal ─────────────────────────────────────────────────────── */}
      {viewStaff && (
        <Dialog open onClose={() => setViewStaff(null)} maxWidth="lg">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogCloseButton onClose={() => setViewStaff(null)} />
          </DialogHeader>
          <DialogContent>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl mb-4">
              <Avatar name={viewStaff.name} size="xl" colorIndex={2} />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewStaff.name}</h3>
                <p className="text-sm text-gray-600">{viewStaff.staffId} • {viewStaff.designation}</p>
                <p className="text-sm text-emerald-600 font-medium">{viewStaff.department}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Email", value: viewStaff.email, icon: Mail },
                { label: "Phone", value: viewStaff.phone, icon: Phone },
                { label: "Qualifications", value: viewStaff.qualifications || "—", icon: Award },
                { label: "Experience", value: `${viewStaff.experience} years`, icon: Award },
                { label: "Joining Date", value: formatDate(viewStaff.dateOfJoining), icon: Award },
                { label: "Gender", value: viewStaff.gender, icon: Users },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {viewStaff.subjects.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Subjects Teaching</p>
                <div className="flex flex-wrap gap-2">
                  {viewStaff.subjects.map((sub) => (
                    <span key={sub} className={`text-xs px-2.5 py-1 rounded-full border ${getSubjectColor(sub)}`}>{sub}</span>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStaff(null)}>Close</Button>
            <Button onClick={() => { setEditStaff(viewStaff); setViewStaff(null); setFormError(null); }}>Edit Profile</Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={showAddModal} onClose={() => !submitting && setShowAddModal(false)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>{addSuccess ? "Staff Added Successfully" : "Add New Staff Member"}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setShowAddModal(false)} />
        </DialogHeader>
        <DialogContent>
          {addSuccess ? (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{addSuccess.name}</h3>
                <p className="text-sm text-gray-500">has been added to the staff directory</p>
              </div>
              <div className="bg-gray-100 px-6 py-3 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Staff ID</p>
                <p className="text-xl font-mono font-bold text-indigo-600">{addSuccess.staffId}</p>
              </div>
            </div>
          ) : (
            <StaffFormFields
              form={addForm}
              onSubmit={addForm.handleSubmit(handleAddSubmit)}
              submitting={submitting}
              formError={formError}
              showLoginOption
            />
          )}
        </DialogContent>
        <DialogFooter>
          {addSuccess ? (
            <>
              <Button variant="outline" onClick={() => { setAddSuccess(null); addForm.reset({ experience: 0, salary: 0, createLoginAccount: true, gender: "Male" }); }}>
                Add Another
              </Button>
              <Button onClick={() => setShowAddModal(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={addForm.handleSubmit(handleAddSubmit)} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Staff Member
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={!!editStaff} onClose={() => !submitting && setEditStaff(null)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>Edit Staff — {editStaff?.name}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setEditStaff(null)} />
        </DialogHeader>
        <DialogContent>
          <StaffFormFields
            form={editForm}
            onSubmit={editForm.handleSubmit(handleEditSubmit)}
            submitting={submitting}
            formError={formError}
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditStaff(null)} disabled={submitting}>Cancel</Button>
          <Button onClick={editForm.handleSubmit(handleEditSubmit)} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => !submitting && setDeleteTarget(null)} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Deactivate Staff Member</DialogTitle>
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
                <span className="font-medium">{deleteTarget?.name}</span> ({deleteTarget?.staffId}) will be
                deactivated and hidden from the staff directory. This can be reversed by an administrator.
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

      {/* ── Credentials Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={!!accountAction}
        onClose={() => { if (!accountLoading) { setAccountCredentials(null); setAccountAction(null); setAccountError(null); } }}
        maxWidth="sm"
      >
        <DialogHeader>
          <DialogTitle>{accountAction === "create" ? "Login Account Created" : "Password Reset"}</DialogTitle>
          <DialogCloseButton onClose={() => { if (!accountLoading) { setAccountCredentials(null); setAccountAction(null); setAccountError(null); } }} />
        </DialogHeader>
        <DialogContent>
          {accountLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {accountAction === "create" ? "Creating account..." : "Resetting password..."}
            </div>
          ) : accountError ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {accountError}
            </div>
          ) : accountCredentials ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center gap-2 pb-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{accountCredentials.staffName}</h3>
                <p className="text-xs text-gray-500">Staff ID: {accountCredentials.staffId}</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-amber-700">
                  ⚠ This password will only be shown once. Please copy and share it with the staff member.
                </p>
              </div>

              {/* Email */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Login Email</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{accountCredentials.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyToClipboard(accountCredentials.email, "email")}
                  className="flex-shrink-0"
                >
                  {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Password */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Password</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">{accountCredentials.password}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyToClipboard(accountCredentials.password, "password")}
                  className="flex-shrink-0"
                >
                  {copiedField === "password" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
        <DialogFooter>
          <Button onClick={() => { setAccountCredentials(null); setAccountAction(null); setAccountError(null); }} disabled={accountLoading}>
            Done
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ── Revoke Access Confirm Modal ────────────────────────────────────── */}
      <Dialog open={!!revokeTarget} onClose={() => !accountLoading && setRevokeTarget(null)} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Revoke Login Access</DialogTitle>
          <DialogCloseButton onClose={() => !accountLoading && setRevokeTarget(null)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldOff className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Revoke login access?</p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{revokeTarget?.name}</span> ({revokeTarget?.staffId}) will no longer
                be able to log in to the system. Their staff profile will remain intact.
                You can create a new login account later.
              </p>
            </div>
          </div>
          {accountError && (
            <div className="flex items-center gap-2 p-3 mt-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {accountError}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={accountLoading}>Cancel</Button>
          <Button variant="destructive" onClick={handleRevokeAccount} disabled={accountLoading} className="gap-2">
            {accountLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Revoke Access
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ─── Shared Staff Form Fields ─────────────────────────────────────────────────
function StaffFormFields({
  form,
  submitting,
  formError,
  showLoginOption,
}: {
  form: ReturnType<typeof useForm<StaffFormValues>>;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  submitting: boolean;
  formError: string | null;
  showLoginOption?: boolean;
}) {
  const { register, formState: { errors }, watch, setValue } = form;

  const dateOfJoining = watch("dateOfJoining");
  const classesValue = watch("classesRaw") || "";
  const selectedClasses = classesValue.split(",").map((s) => s.trim()).filter(Boolean);

  const toggleClass = (grade: string) => {
    const updated = selectedClasses.includes(grade)
      ? selectedClasses.filter((c) => c !== grade)
      : [...selectedClasses, grade];
    setValue("classesRaw", updated.join(", "));
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-5">
      {formError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formError}
        </div>
      )}

      {/* Personal Info */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          Personal Information
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Full Name *</label>
            <Input {...register("name")} placeholder="e.g. Dr. Priya Sharma" disabled={submitting} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email Address *</label>
            <Input {...register("email")} type="email" placeholder="staff@school.edu" disabled={submitting} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Phone Number *</label>
            <Input {...register("phone")} placeholder="+91 9876543210" disabled={submitting} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Gender *</label>
            <select
              {...register("gender")}
              disabled={submitting}
              className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          Professional Details
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Designation *</label>
            <Input {...register("designation")} placeholder="e.g. Senior Teacher" disabled={submitting} />
            {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Department *</label>
            <Input {...register("department")} placeholder="e.g. Mathematics" disabled={submitting} />
            {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">Date of Joining *</label>
            <DatePicker
              value={dateOfJoining}
              onChange={(e) => setValue("dateOfJoining", e.target.value, { shouldValidate: true })}
              disabled={submitting}
              minYear={1990}
              maxYear={currentYear}
            />
            {errors.dateOfJoining && <p className="text-xs text-red-500 mt-1">{errors.dateOfJoining.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Experience (years) *</label>
            <Input {...register("experience")} type="number" min={0} placeholder="0" disabled={submitting} />
            {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Monthly Salary (₹) *</label>
            <Input {...register("salary")} type="number" min={0} placeholder="0" disabled={submitting} />
            {errors.salary && <p className="text-xs text-red-500 mt-1">{errors.salary.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Qualifications</label>
            <Input {...register("qualifications")} placeholder="e.g. M.Sc Mathematics, B.Ed" disabled={submitting} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subjects (comma-separated)</label>
            <Input {...register("subjectsRaw")} placeholder="e.g. Mathematics, Physics" disabled={submitting} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
            <Input {...register("address")} placeholder="Residential address" disabled={submitting} />
          </div>
        </div>
      </div>

      {/* Classes Handling */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          Classes Handling
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCHOOL_GRADES.map((grade) => (
            <label
              key={grade}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm transition-colors ${
                selectedClasses.includes(grade)
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "border-gray-200 text-gray-600 hover:border-purple-200"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedClasses.includes(grade)}
                onChange={() => toggleClass(grade)}
                disabled={submitting}
                className="w-3.5 h-3.5 accent-purple-600"
              />
              {grade}
            </label>
          ))}
        </div>
      </div>

      {showLoginOption && (
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none p-3 bg-purple-50 rounded-xl border border-purple-100">
          <input type="checkbox" {...register("createLoginAccount")} className="w-4 h-4 accent-purple-600" />
          Create login account for this staff member
          <span className="text-xs text-gray-400">(default password: firstname@year)</span>
        </label>
      )}
    </div>
  );
}
