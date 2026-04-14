import { Student } from "@/types";

export interface StudentFilters {
  search?: string;
  className?: string;
  page?: number;
  limit?: number;
}

export interface StudentListResponse {
  success: boolean;
  data: Student[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  classes: string[];
  stats: { total: number; active: number; pendingFees: number };
}

export interface StudentFormData {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  bloodGroup?: string;
  address?: string;
  className: string;
  section: string;
  rollNumber?: number;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  admissionDate?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json as T;
}

export const studentService = {
  async list(filters: StudentFilters = {}): Promise<StudentListResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.className) params.set("className", filters.className);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await fetch(`/api/students?${params.toString()}`, { cache: "no-store" });
    return handleResponse<StudentListResponse>(res);
  },

  async get(id: string): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, { cache: "no-store" });
    const json = await handleResponse<{ success: boolean; data: Student }>(res);
    return json.data;
  },

  async create(data: StudentFormData): Promise<{ data: Student; studentId: string; admissionNumber: string }> {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Student; studentId: string; admissionNumber: string }>(res);
  },

  async update(id: string, data: Partial<StudentFormData>): Promise<Student> {
    const res = await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await handleResponse<{ success: boolean; data: Student }>(res);
    return json.data;
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    await handleResponse<{ success: boolean }>(res);
  },

  exportCsv(students: Student[]): void {
    const headers = ["Student ID", "Name", "Class", "Section", "Roll No", "Parent", "Parent Phone", "Admission No", "Status"];
    const rows = students.map((s) => [
      s.studentId, s.name, s.className, s.section, s.rollNumber ?? "",
      s.parentName, s.parentPhone, s.admissionNumber,
      s.isActive ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
