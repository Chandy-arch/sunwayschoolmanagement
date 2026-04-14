"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate, getSubjectColor } from "@/lib/utils";
import { SCHOOL_GRADES, getSectionFromGrade } from "@/lib/constants";
import {
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Edit,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  section: string;
  dueDate: string;
  createdByName: string;
  academicYear: string;
  createdAt: string;
}

const today = new Date();
const currentYear =
  today.getMonth() >= 3
    ? `${today.getFullYear()}-${today.getFullYear() + 1}`
    : `${today.getFullYear() - 1}-${today.getFullYear()}`;

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  subject: z.string().min(1, "Subject is required"),
  className: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  dueDate: z.string().min(1, "Due date is required"),
  academicYear: z.string().min(1, "Academic year is required"),
});
type AssignmentFormValues = z.infer<typeof assignmentSchema>;

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function isPastDue(dueDate: string) {
  return new Date(dueDate) < new Date(toDateStr(today));
}

export default function StaffAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const addForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { academicYear: currentYear },
  });

  const editForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
  });

  // Load assignments (all created by this staff member)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setAssignments(json.data);
    } catch {
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-fill section whenever class is picked
  const watchAddClass = addForm.watch("className");
  useEffect(() => {
    if (watchAddClass) addForm.setValue("section", getSectionFromGrade(watchAddClass));
  }, [watchAddClass, addForm]);

  const watchEditClass = editForm.watch("className");
  useEffect(() => {
    if (watchEditClass) editForm.setValue("section", getSectionFromGrade(watchEditClass));
  }, [watchEditClass, editForm]);

  const handleAdd = async (values: AssignmentFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed");
      setAddSuccess(true);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: AssignmentFormValues) => {
    if (!editTarget) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/assignments/${editTarget._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed");
      setEditTarget(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await fetch(`/api/assignments/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadData();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const allSubjects = Array.from(new Set(assignments.map((a) => a.subject))).sort();

  const filtered = assignments.filter((a) => {
    if (filterClass && a.className !== filterClass) return false;
    if (filterSubject && a.subject !== filterSubject) return false;
    return true;
  });

  const upcoming = filtered.filter((a) => !isPastDue(a.dueDate));
  const past = filtered.filter((a) => isPastDue(a.dueDate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Class filter */}
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-xl text-sm bg-white"
              >
                <option value="">All Classes</option>
                {SCHOOL_GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {/* Subject filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-xl text-sm bg-white"
              >
                <option value="">All Subjects</option>
                {allSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="gap-2"
              onClick={() => {
                setShowAdd(true);
                setAddSuccess(false);
                addForm.reset({ academicYear: currentYear });
              }}
            >
              <Plus className="w-4 h-4" /> New Assignment
            </Button>
          </div>
          {!loading && (
            <p className="text-xs text-gray-500 mt-2">
              {filtered.length} assignment{filtered.length !== 1 ? "s" : ""} total
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading assignments…
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Upcoming / Active
              <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </h2>
            {upcoming.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                  <ClipboardList className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No upcoming assignments</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.map((a) => (
                  <AssignmentCard
                    key={a._id}
                    assignment={a}
                    onEdit={() => {
                      setFormError(null);
                      editForm.reset({
                        title: a.title,
                        description: a.description,
                        subject: a.subject,
                        className: a.className,
                        section: a.section,
                        dueDate: a.dueDate,
                        academicYear: a.academicYear,
                      });
                      setEditTarget(a);
                    }}
                    onDelete={() => setDeleteTarget(a)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                Past Due
                <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {past.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                {past.map((a) => (
                  <AssignmentCard
                    key={a._id}
                    assignment={a}
                    isPast
                    onEdit={() => {
                      setFormError(null);
                      editForm.reset({
                        title: a.title,
                        description: a.description,
                        subject: a.subject,
                        className: a.className,
                        section: a.section,
                        dueDate: a.dueDate,
                        academicYear: a.academicYear,
                      });
                      setEditTarget(a);
                    }}
                    onDelete={() => setDeleteTarget(a)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Modal ─────────────────────────────────────────────── */}
      <Dialog open={showAdd} onClose={() => !submitting && setShowAdd(false)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>{addSuccess ? "Assignment Created" : "New Assignment"}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setShowAdd(false)} />
        </DialogHeader>
        <DialogContent>
          {addSuccess ? (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assignment Created!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Students and parents will see it in their Homework portal.
                </p>
              </div>
            </div>
          ) : (
            <AssignmentForm
              form={addForm}
              submitting={submitting}
              formError={formError}
            />
          )}
        </DialogContent>
        <DialogFooter>
          {addSuccess ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setAddSuccess(false);
                  addForm.reset({ academicYear: currentYear });
                }}
              >
                Add Another
              </Button>
              <Button onClick={() => setShowAdd(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowAdd(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={addForm.handleSubmit(handleAdd)}
                disabled={submitting}
                className="gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Assignment
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ── Edit Modal ────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onClose={() => !submitting && setEditTarget(null)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setEditTarget(null)} />
        </DialogHeader>
        <DialogContent>
          <AssignmentForm
            form={editForm}
            submitting={submitting}
            formError={formError}
            editMode
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditTarget(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={editForm.handleSubmit(handleEdit)}
            disabled={submitting}
            className="gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ── Delete Modal ──────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !submitting && setDeleteTarget(null)}
        maxWidth="sm"
      >
        <DialogHeader>
          <DialogTitle>Delete Assignment</DialogTitle>
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
                <span className="font-medium">&ldquo;{deleteTarget?.title}&rdquo;</span> will be
                removed. Parents and students will no longer see it.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ── Assignment Card ──────────────────────────────────────────────────────────
function AssignmentCard({
  assignment: a,
  isPast = false,
  onEdit,
  onDelete,
}: {
  assignment: Assignment;
  isPast?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const daysLeft = Math.ceil(
    (new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          isPast ? "bg-gray-300" : daysLeft <= 2 ? "bg-red-400" : "bg-emerald-400"
        }`}
      />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{a.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {a.className} • {a.section}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${getSubjectColor(a.subject)}`}
          >
            {a.subject}
          </span>
        </div>

        <p className="text-xs text-gray-600 line-clamp-2 mb-3">{a.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            Due: {formatDate(a.dueDate)}
            {!isPast && (
              <Badge
                variant={daysLeft <= 2 ? "destructive" : "success"}
                className="ml-1 text-xs"
              >
                {daysLeft === 0
                  ? "Today"
                  : daysLeft === 1
                  ? "Tomorrow"
                  : `${daysLeft}d left`}
              </Badge>
            )}
            {isPast && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Past Due
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" title="Edit" onClick={onEdit}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Assignment Form ──────────────────────────────────────────────────────────
function AssignmentForm({
  form,
  submitting,
  formError,
  editMode = false,
}: {
  form: ReturnType<typeof useForm<AssignmentFormValues>>;
  submitting: boolean;
  formError: string | null;
  editMode?: boolean;
}) {
  const { register, formState: { errors }, watch, setValue } = form;
  const dueDate = watch("dueDate");

  return (
    <div className="space-y-4">
      {formError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {formError}
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
        <Input
          {...register("title")}
          placeholder="e.g. Chapter 5 Exercise Problems"
          disabled={submitting}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Description / Instructions *</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe what students need to do…"
          disabled={submitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
        {errors.description && (
          <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Class picker — shows all school grades; disabled in edit mode */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Class *</label>
          <select
            {...register("className")}
            disabled={submitting || editMode}
            className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
          >
            <option value="">Select class</option>
            {SCHOOL_GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.className && (
            <p className="text-xs text-red-500 mt-1">{errors.className.message}</p>
          )}
        </div>

        {/* Subject — free text; any teacher types the subject they teach */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Subject *</label>
          <Input
            {...register("subject")}
            placeholder="e.g. Mathematics"
            disabled={submitting}
          />
          {errors.subject && (
            <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>
          )}
        </div>

        {/* Due date */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Due Date *</label>
          <DatePicker
            value={dueDate}
            onChange={(e) => setValue("dueDate", e.target.value, { shouldValidate: true })}
            disabled={submitting}
            minYear={today.getFullYear()}
            maxYear={today.getFullYear() + 1}
          />
          {errors.dueDate && (
            <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>
          )}
        </div>

        {/* Academic year */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Academic Year *</label>
          <Input
            {...register("academicYear")}
            placeholder="e.g. 2025-2026"
            disabled={submitting}
          />
          {errors.academicYear && (
            <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
