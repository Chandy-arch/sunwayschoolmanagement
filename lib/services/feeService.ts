import { Fee } from "@/types";

export interface FeeFilters {
  search?: string;
  status?: string;
  className?: string;
  academicYear?: string;
  feeType?: string;
  page?: number;
  limit?: number;
}

export interface FeeSummary {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: number;
  byStatus: { paid: number; pending: number; partial: number; overdue: number };
}

export interface FeeListResponse {
  data: Fee[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: FeeSummary;
  feeTypes: string[];
  classes: string[];
}

export interface FeeFormData {
  studentId: string;
  feeType: string;
  amount: number;
  dueDate: string;
  academicYear: string;
  remarks?: string;
}

export interface PaymentData {
  paidAmount: number;
  paymentMethod: string;
  paidDate: string;
  remarks?: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json as T;
}

export const feeService = {
  async list(filters: FeeFilters = {}): Promise<FeeListResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.className) params.set("className", filters.className);
    if (filters.academicYear) params.set("academicYear", filters.academicYear);
    if (filters.feeType) params.set("feeType", filters.feeType);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    return apiFetch<FeeListResponse>(`/api/fees?${params}`);
  },

  async create(data: FeeFormData): Promise<Fee> {
    const result = await apiFetch<{ success: boolean; data: Fee }>("/api/fees", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return result.data;
  },

  async collectPayment(id: string, payment: PaymentData): Promise<Fee> {
    const result = await apiFetch<{ success: boolean; data: Fee }>(`/api/fees/${id}`, {
      method: "PUT",
      body: JSON.stringify({ collectPayment: true, ...payment }),
    });
    return result.data;
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/api/fees/${id}`, { method: "DELETE" });
  },

  exportCsv(fees: Fee[]): void {
    const headers = ["Student", "Class", "Fee Type", "Amount", "Paid", "Balance", "Due Date", "Paid Date", "Status", "Receipt No", "Payment Method", "Academic Year"];
    const rows = fees.map((f) => [
      f.studentName,
      `${f.className}${f.section ? "-" + f.section : ""}`,
      f.feeType,
      f.amount,
      f.paidAmount,
      f.amount - f.paidAmount,
      f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN") : "",
      f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : "",
      f.status,
      f.receiptNumber || "",
      f.paymentMethod || "",
      f.academicYear,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
