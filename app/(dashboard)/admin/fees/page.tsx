"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogCloseButton,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import AreaChartComponent from "@/components/charts/AreaChartComponent";
import PieChartComponent from "@/components/charts/PieChartComponent";
import { feeService, FeeFormData, PaymentData } from "@/lib/services/feeService";
import { Fee } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SCHOOL_GRADES } from "@/lib/constants";
import {
  Search, Plus, Trash2, Download, CheckCircle2, AlertTriangle, Clock,
  TrendingUp, Loader2, AlertCircle, IndianRupee, Eye, Receipt,
} from "lucide-react";

// ─── Schemas ─────────────────────────────────────────────────────────────────
const feeSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  studentName: z.string().optional(),
  className: z.string().optional(),
  feeType: z.string().min(1, "Fee type is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  remarks: z.string().optional(),
});
type FeeFormValues = z.infer<typeof feeSchema>;

const paySchema = z.object({
  paidAmount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paidDate: z.string().min(1, "Payment date is required"),
  remarks: z.string().optional(),
});
type PayFormValues = z.infer<typeof paySchema>;

const FEE_TYPES = [
  "Term Fee", "Tuition Fee", "Transport Fee", "Lab Fee",
  "Library Fee", "Sports Fee", "Exam Fee", "Uniform Fee", "Miscellaneous",
];
const PAYMENT_METHODS = ["Cash", "Online Transfer", "UPI", "DD/Cheque", "Bank Transfer"];
const thisYear = new Date().getFullYear();

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FeeManagementPage() {
  // Data state
  const [fees, setFees] = useState<Fee[]>([]);
  const [summary, setSummary] = useState({
    totalCollected: 0, totalPending: 0, totalOverdue: 0, collectionRate: 0,
    byStatus: { paid: 0, pending: 0, partial: 0, overdue: 0 },
  });
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [payTarget, setPayTarget] = useState<Fee | null>(null);
  const [viewTarget, setViewTarget] = useState<Fee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<Fee | null>(null);
  const [paySuccess, setPaySuccess] = useState<Fee | null>(null);

  // Student search
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<{ _id: string; name: string; studentId: string; className: string; section: string }[]>([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [showStudentDrop, setShowStudentDrop] = useState(false);

  // ── Fetch fees ──
  const fetchFees = useCallback(async () => {
    setLoading(true); setListError(null);
    try {
      const res = await feeService.list({
        search, status: statusFilter, className: classFilter,
        feeType: feeTypeFilter, page: currentPage, limit: 15,
      });
      setFees(res.data);
      setSummary(res.summary);
      setFeeTypes(res.feeTypes);
      setPagination(res.pagination);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load fees");
    } finally { setLoading(false); }
  }, [search, statusFilter, classFilter, feeTypeFilter, currentPage]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, classFilter, feeTypeFilter]);
  useEffect(() => { fetchFees(); }, [fetchFees]);

  // ── Student search ──
  useEffect(() => {
    if (studentQuery.length < 2) { setStudentResults([]); setShowStudentDrop(false); return; }
    const t = setTimeout(async () => {
      setStudentSearching(true);
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(studentQuery)}&limit=8`);
        const json = await res.json();
        setStudentResults(json.data || []);
        setShowStudentDrop(true);
      } catch { setStudentResults([]); }
      finally { setStudentSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [studentQuery]);

  // ── Forms ──
  const addForm = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: { academicYear: `${thisYear}-${thisYear + 1}`, dueDate: "" },
  });
  const payForm = useForm<PayFormValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { paymentMethod: "Cash", paidDate: new Date().toISOString().slice(0, 10) },
  });
  const dueDateVal = addForm.watch("dueDate");
  const payDateVal = payForm.watch("paidDate");
  const payAmtVal = payForm.watch("paidAmount");

  useEffect(() => {
    if (payTarget) {
      payForm.reset({
        paidAmount: payTarget.amount - payTarget.paidAmount,
        paymentMethod: "Cash",
        paidDate: new Date().toISOString().slice(0, 10),
      });
    }
  }, [payTarget, payForm]);

  const openAddModal = () => {
    setShowAddModal(true); setAddSuccess(null); setFormError(null);
    addForm.reset({ academicYear: `${thisYear}-${thisYear + 1}`, dueDate: "" });
    setStudentQuery(""); setStudentResults([]);
  };

  const handleAddSubmit = async (values: FeeFormValues) => {
    setSubmitting(true); setFormError(null);
    try {
      const data: FeeFormData = {
        studentId: values.studentId, feeType: values.feeType,
        amount: values.amount, dueDate: values.dueDate,
        academicYear: values.academicYear, remarks: values.remarks,
      };
      const created = await feeService.create(data);
      setAddSuccess(created);
      await fetchFees();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create fee record");
    } finally { setSubmitting(false); }
  };

  const handlePaySubmit = async (values: PayFormValues) => {
    if (!payTarget) return;
    setSubmitting(true); setFormError(null);
    try {
      const payment: PaymentData = {
        paidAmount: values.paidAmount, paymentMethod: values.paymentMethod,
        paidDate: values.paidDate, remarks: values.remarks,
      };
      const updated = await feeService.collectPayment(payTarget._id, payment);
      setPaySuccess(updated);
      await fetchFees();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record payment");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await feeService.remove(deleteTarget._id);
      setDeleteTarget(null);
      await fetchFees();
    } catch { /* swallowed */ }
    finally { setSubmitting(false); }
  };

  // Pagination page numbers
  const start = Math.max(1, Math.min(currentPage - 2, pagination.totalPages - 4));
  const pageNums = Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => start + i);

  // Chart data
  const pieData = [
    { name: "Paid", value: summary.byStatus.paid, fill: "#10B981" },
    { name: "Pending", value: summary.byStatus.pending, fill: "#F59E0B" },
    { name: "Partial", value: summary.byStatus.partial, fill: "#3B82F6" },
    { name: "Overdue", value: summary.byStatus.overdue, fill: "#EF4444" },
  ];
  const areaData = [
    { name: "Collected", amount: summary.totalCollected },
    { name: "Pending", amount: summary.totalPending },
    { name: "Overdue", amount: summary.totalOverdue },
  ];

  return (
    <div className="space-y-5">
      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(summary.totalCollected), icon: CheckCircle2, bg: "from-emerald-500 to-teal-600", sub: `${summary.byStatus.paid} paid in full` },
          { label: "Total Pending", value: formatCurrency(summary.totalPending), icon: AlertTriangle, bg: "from-amber-500 to-orange-500", sub: `${summary.byStatus.pending + summary.byStatus.partial} outstanding` },
          { label: "Overdue Amount", value: formatCurrency(summary.totalOverdue), icon: Clock, bg: "from-red-500 to-rose-600", sub: `${summary.byStatus.overdue} overdue records` },
          { label: "Collection Rate", value: `${summary.collectionRate}%`, icon: TrendingUp, bg: "from-indigo-500 to-purple-600", sub: "Of total billed amount" },
        ].map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.bg} text-white border-0 shadow-lg`}>
            <CardContent className="p-4">
              <s.icon className="w-5 h-5 text-white/70 mb-2" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-white/80 text-sm mt-0.5 font-medium">{s.label}</p>
              <p className="text-white/55 text-xs mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fee Overview</CardTitle>
            <CardDescription>Collected vs Pending vs Overdue (₹)</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChartComponent
              data={areaData}
              areas={[
                { key: "amount", color: "#6366F1", name: "Amount (₹)" },
              ]}
              height={220}
              showLegend={false}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>By number of records</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={pieData}
              height={220}
              innerRadius={55}
              outerRadius={85}
              showLegend
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Filters + Table ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Input
              placeholder="Search student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="flex-1 min-w-[180px]"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white">
              <option value="">All Status</option>
              {["Paid", "Pending", "Partial", "Overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white">
              <option value="">All Classes</option>
              {SCHOOL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={feeTypeFilter} onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white">
              <option value="">All Fee Types</option>
              {[...new Set([...FEE_TYPES, ...feeTypes])].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Button size="sm" className="gap-1.5" onClick={openAddModal}>
              <Plus className="w-4 h-4" /> Add Fee
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => feeService.exportCsv(fees)} disabled={fees.length === 0}>
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>
          {!loading && (
            <p className="text-xs text-gray-400 mt-2">
              {pagination.total} record{pagination.total !== 1 ? "s" : ""} found
            </p>
          )}
        </CardContent>

        {listError && (
          <div className="mx-4 mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {listError}
            <Button variant="ghost" size="sm" className="ml-auto text-red-700" onClick={fetchFees}>Retry</Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-52 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading records…
          </div>
        ) : fees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
            <IndianRupee className="w-10 h-10 opacity-25" />
            <p className="text-sm">No fee records found</p>
            <Button variant="ghost" size="sm" onClick={openAddModal} className="text-purple-600">Add a fee record</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => {
                const balance = fee.amount - fee.paidAmount;
                const isOverdueDatewise = new Date(fee.dueDate) < new Date() && fee.status !== "Paid";
                return (
                  <TableRow key={fee._id}>
                    <TableCell>
                      <p className="font-semibold text-sm text-gray-900">{fee.studentName}</p>
                      <p className="text-xs text-gray-400">{fee.className} • {fee.academicYear}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{fee.feeType}</span>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold ${fee.paidAmount >= fee.amount ? "text-emerald-600" : "text-amber-600"}`}>
                        {formatCurrency(fee.paidAmount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {balance > 0 ? formatCurrency(balance) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${isOverdueDatewise ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {formatDate(fee.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        fee.status === "Paid" ? "success" :
                        fee.status === "Pending" ? "warning" :
                        fee.status === "Partial" ? "info" : "destructive"
                      }>
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon-sm" title="View details" onClick={() => setViewTarget(fee)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {fee.status !== "Paid" && (
                          <Button variant="ghost" size="icon-sm" title="Collect payment"
                            className="text-emerald-600 hover:bg-emerald-50"
                            onClick={() => { setPayTarget(fee); setFormError(null); setPaySuccess(null); }}>
                            <Receipt className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" title="Delete"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(fee)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Prev</Button>
              {pageNums.map((p) => (
                <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm"
                  className="w-8 p-0" onClick={() => setCurrentPage(p)}>{p}</Button>
              ))}
              <Button variant="outline" size="sm" disabled={currentPage >= pagination.totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ══ Add Fee Modal ══════════════════════════════════════════════════════ */}
      <Dialog open={showAddModal} onClose={() => !submitting && setShowAddModal(false)} maxWidth="md">
        <DialogHeader>
          <DialogTitle>{addSuccess ? "Fee Record Created" : "Add Fee Record"}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setShowAddModal(false)} />
        </DialogHeader>
        <DialogContent>
          {addSuccess ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{addSuccess.studentName}</h3>
                <p className="text-sm text-gray-500">{addSuccess.feeType} — {formatCurrency(addSuccess.amount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-semibold">{formatDate(addSuccess.dueDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Academic Year</p>
                  <p className="font-semibold">{addSuccess.academicYear}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                </div>
              )}

              {/* Student search */}
              <div className={showStudentDrop && studentResults.length > 0 ? "min-h-[220px]" : ""}>
                <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" /> Student
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search student by name or ID…"
                    value={studentQuery}
                    onChange={(e) => { setStudentQuery(e.target.value); addForm.setValue("studentId", ""); }}
                    onFocus={() => studentResults.length > 0 && setShowStudentDrop(true)}
                    onBlur={() => setTimeout(() => setShowStudentDrop(false), 200)}
                    leftIcon={studentSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    disabled={submitting}
                    autoComplete="off"
                  />
                  {showStudentDrop && studentResults.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      {studentResults.map((s) => (
                        <button type="button" key={s._id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-left transition-colors"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            addForm.setValue("studentId", s._id, { shouldValidate: true });
                            addForm.setValue("studentName", s.name);
                            addForm.setValue("className", s.className);
                            setStudentQuery(`${s.name}${s.studentId ? ` (${s.studentId})` : ""}`);
                            setShowStudentDrop(false);
                          }}>
                          <span className="w-8 h-8 bg-purple-100 rounded-full inline-flex items-center justify-center text-sm font-bold text-purple-700 flex-shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-gray-900">{s.name}</span>
                            <span className="text-xs text-gray-500">{s.studentId && `${s.studentId} • `}{s.className}{s.section ? `-${s.section}` : ""}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {addForm.formState.errors.studentId && (
                  <p className="text-xs text-red-500 mt-1">{addForm.formState.errors.studentId.message}</p>
                )}
              </div>

              {/* Fee details */}
              <div>
                <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" /> Fee Details
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Fee Type *</label>
                    <select {...addForm.register("feeType")} disabled={submitting}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="">Select type</option>
                      {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {addForm.formState.errors.feeType && <p className="text-xs text-red-500 mt-1">{addForm.formState.errors.feeType.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Amount (₹) *</label>
                    <Input {...addForm.register("amount")} type="number" min={1} placeholder="e.g. 5000" disabled={submitting} />
                    {addForm.formState.errors.amount && <p className="text-xs text-red-500 mt-1">{addForm.formState.errors.amount.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Due Date *</label>
                    <DatePicker
                      value={dueDateVal}
                      onChange={(e) => addForm.setValue("dueDate", e.target.value, { shouldValidate: true })}
                      disabled={submitting}
                      minYear={thisYear - 1}
                      maxYear={thisYear + 2}
                    />
                    {addForm.formState.errors.dueDate && <p className="text-xs text-red-500 mt-1">{addForm.formState.errors.dueDate.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Academic Year *</label>
                    <select {...addForm.register("academicYear")} disabled={submitting}
                      className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                      {[-1, 0, 1].map((offset) => {
                        const y = thisYear + offset;
                        return <option key={y} value={`${y}-${y + 1}`}>{y}–{y + 1}</option>;
                      })}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
                    <Input {...addForm.register("remarks")} placeholder="Optional note" disabled={submitting} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {addSuccess ? (
            <>
              <Button variant="outline" onClick={() => {
                setAddSuccess(null);
                addForm.reset({ academicYear: `${thisYear}-${thisYear + 1}`, dueDate: "" });
                setStudentQuery(""); setStudentResults([]);
              }}>Add Another</Button>
              <Button onClick={() => setShowAddModal(false)}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={addForm.handleSubmit(handleAddSubmit)} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Record
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ══ Collect Payment Modal ══════════════════════════════════════════════ */}
      <Dialog open={!!payTarget} onClose={() => !submitting && (setPayTarget(null), setPaySuccess(null))} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>{paySuccess ? "Payment Recorded" : "Collect Payment"}</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && (setPayTarget(null), setPaySuccess(null))} />
        </DialogHeader>
        <DialogContent>
          {paySuccess ? (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {formatCurrency(typeof payAmtVal === "number" ? payAmtVal : 0)} Collected
                </h3>
                <p className="text-sm text-gray-500">{payTarget?.studentName} — {payTarget?.feeType}</p>
              </div>
              {paySuccess.receiptNumber && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Receipt Number</p>
                  <p className="text-lg font-mono font-bold text-emerald-700">{paySuccess.receiptNumber}</p>
                </div>
              )}
              <Badge variant={paySuccess.status === "Paid" ? "success" : "info"} className="text-sm px-4 py-1">
                Status: {paySuccess.status}
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                </div>
              )}
              {payTarget && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-1">
                  <p className="text-sm font-bold text-purple-900">{payTarget.studentName}</p>
                  <p className="text-xs text-purple-600">{payTarget.feeType} • {payTarget.className} • {payTarget.academicYear}</p>
                  <div className="flex gap-5 mt-2 text-xs text-gray-700">
                    <span>Total: <strong>{formatCurrency(payTarget.amount)}</strong></span>
                    <span>Paid: <strong className="text-emerald-600">{formatCurrency(payTarget.paidAmount)}</strong></span>
                    <span>Balance: <strong className="text-red-600">{formatCurrency(payTarget.amount - payTarget.paidAmount)}</strong></span>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Amount Received (₹) *</label>
                  <Input
                    {...payForm.register("paidAmount")}
                    type="number" min={1}
                    max={payTarget ? payTarget.amount - payTarget.paidAmount : undefined}
                    disabled={submitting}
                  />
                  {payForm.formState.errors.paidAmount && <p className="text-xs text-red-500 mt-1">{payForm.formState.errors.paidAmount.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Payment Method *</label>
                  <select {...payForm.register("paymentMethod")} disabled={submitting}
                    className="w-full h-10 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Payment Date *</label>
                  <DatePicker
                    value={payDateVal}
                    onChange={(e) => payForm.setValue("paidDate", e.target.value, { shouldValidate: true })}
                    disabled={submitting}
                    minYear={thisYear - 1}
                    maxYear={thisYear}
                  />
                  {payForm.formState.errors.paidDate && <p className="text-xs text-red-500 mt-1">{payForm.formState.errors.paidDate.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
                  <Input {...payForm.register("remarks")} placeholder="Optional note" disabled={submitting} />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {paySuccess ? (
            <Button onClick={() => { setPayTarget(null); setPaySuccess(null); }}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPayTarget(null)} disabled={submitting}>Cancel</Button>
              <Button variant="success" onClick={payForm.handleSubmit(handlePaySubmit)} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Payment
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ══ View Modal ════════════════════════════════════════════════════════ */}
      {viewTarget && (
        <Dialog open onClose={() => setViewTarget(null)} maxWidth="sm">
          <DialogHeader>
            <DialogTitle>Fee Details</DialogTitle>
            <DialogCloseButton onClose={() => setViewTarget(null)} />
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <h3 className="font-bold text-gray-900 text-lg">{viewTarget.studentName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{viewTarget.className} • {viewTarget.academicYear}</p>
                <Badge className="mt-2" variant={viewTarget.status === "Paid" ? "success" : viewTarget.status === "Pending" ? "warning" : viewTarget.status === "Partial" ? "info" : "destructive"}>
                  {viewTarget.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                {[
                  { label: "Fee Type", value: viewTarget.feeType },
                  { label: "Total Amount", value: formatCurrency(viewTarget.amount) },
                  { label: "Paid Amount", value: formatCurrency(viewTarget.paidAmount) },
                  { label: "Balance", value: formatCurrency(viewTarget.amount - viewTarget.paidAmount) },
                  { label: "Due Date", value: formatDate(viewTarget.dueDate) },
                  { label: "Paid Date", value: viewTarget.paidDate ? formatDate(viewTarget.paidDate) : "—" },
                  { label: "Payment Method", value: viewTarget.paymentMethod || "—" },
                  { label: "Receipt No.", value: viewTarget.receiptNumber || "—" },
                  { label: "Remarks", value: viewTarget.remarks || "—" },
                ].map((item) => (
                  <div key={item.label} className="py-2.5 border-b border-gray-100 last:border-0">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
            {viewTarget.status !== "Paid" && (
              <Button variant="success" onClick={() => {
                setPayTarget(viewTarget); setViewTarget(null);
                setFormError(null); setPaySuccess(null);
              }} className="gap-2">
                <Receipt className="w-4 h-4" /> Collect Payment
              </Button>
            )}
          </DialogFooter>
        </Dialog>
      )}

      {/* ══ Delete Confirm Modal ══════════════════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onClose={() => !submitting && setDeleteTarget(null)} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Delete Fee Record</DialogTitle>
          <DialogCloseButton onClose={() => !submitting && setDeleteTarget(null)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Are you sure you want to delete this record?</p>
              <p className="text-sm text-gray-500 mt-1">
                Fee of <strong>{deleteTarget?.feeType}</strong> ({deleteTarget ? formatCurrency(deleteTarget.amount) : ""}) for{" "}
                <strong>{deleteTarget?.studentName}</strong> will be permanently removed.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

