import { Staff } from "@/types";

export interface StaffFilters {
  search?: string;
  department?: string;
  page?: number;
  limit?: number;
}

export interface StaffListResponse {
  success: boolean;
  data: Staff[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  departments: string[];
}

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  subjects: string[];
  classes: string[];
  qualifications: string;
  experience: number;
  salary: number;
  dateOfJoining: string;
  gender: "Male" | "Female" | "Other";
  address: string;
  createLoginAccount?: boolean;
}

export interface AccountCredentials {
  email: string;
  password: string;
  staffName: string;
  staffId: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }
  return json as T;
}

export const staffService = {
  async list(filters: StaffFilters = {}): Promise<StaffListResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await fetch(`/api/staff?${params.toString()}`, { cache: "no-store" });
    return handleResponse<StaffListResponse>(res);
  },

  async get(id: string): Promise<Staff> {
    const res = await fetch(`/api/staff/${id}`, { cache: "no-store" });
    const json = await handleResponse<{ success: boolean; data: Staff }>(res);
    return json.data;
  },

  async create(data: StaffFormData): Promise<{ data: Staff; staffId: string }> {
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; data: Staff; staffId: string }>(res);
  },

  async update(id: string, data: Partial<StaffFormData>): Promise<Staff> {
    const res = await fetch(`/api/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await handleResponse<{ success: boolean; data: Staff }>(res);
    return json.data;
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    await handleResponse<{ success: boolean }>(res);
  },

  // ── Account management ──────────────────────────────────────────────
  async createAccount(staffId: string): Promise<AccountCredentials> {
    const res = await fetch(`/api/staff/${staffId}/account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = await handleResponse<{ success: boolean; data: AccountCredentials }>(res);
    return json.data;
  },

  async resetPassword(staffId: string): Promise<AccountCredentials> {
    const res = await fetch(`/api/staff/${staffId}/account`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    const json = await handleResponse<{ success: boolean; data: AccountCredentials }>(res);
    return json.data;
  },

  async revokeAccount(staffId: string): Promise<void> {
    const res = await fetch(`/api/staff/${staffId}/account`, { method: "DELETE" });
    await handleResponse<{ success: boolean }>(res);
  },
};
