"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  Plus, Edit, Trash2, Loader2, Megaphone, AlertCircle, Users, BookOpen,
  CheckCircle2, Bell,
} from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  targetAudience: "staff" | "parent" | "both";
  createdByName: string;
  expiresAt?: string;
  createdAt: string;
}

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const AUDIENCES = ["staff", "parent", "both"] as const;

const priorityConfig: Record<string, { label: string; badge: string; dot: string }> = {
  low:    { label: "Low",    badge: "secondary", dot: "bg-gray-400" },
  medium: { label: "Medium", badge: "info",      dot: "bg-blue-500" },
  high:   { label: "High",   badge: "warning",   dot: "bg-amber-500" },
  urgent: { label: "Urgent", badge: "destructive", dot: "bg-red-500" },
};

const audienceConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
  staff:  { label: "Staff Only",  icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  parent: { label: "Parents Only", icon: Users,   color: "text-purple-600 bg-purple-50 border-purple-200" },
  both:   { label: "Everyone",    icon: Bell,     color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
};

const emptyForm = { title: "", content: "", priority: "medium" as Announcement["priority"], targetAudience: "both" as Announcement["targetAudience"], expiresAt: "" };

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", { cache: "no-store" });
      const json = await res.json();
      if (json.success) setAnnouncements(json.data);
    } catch {
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (a: Announcement) => {
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      targetAudience: a.targetAudience,
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 10) : "",
    });
    setEditTarget(a);
    setError("");
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = { ...form, expiresAt: form.expiresAt || undefined };
      if (editTarget) {
        const res = await fetch(`/api/announcements/${editTarget._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed");
        setEditTarget(null);
      } else {
        const res = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed");
        setAddSuccess(true);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await fetch(`/api/announcements/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const resetAdd = () => {
    setShowAdd(false);
    setAddSuccess(false);
    setForm(emptyForm);
    setError("");
  };

  const filtered = announcements.filter((a) => {
    if (filterAudience !== "all" && a.targetAudience !== filterAudience) return false;
    if (filterPriority !== "all" && a.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: announcements.length,
    staff: announcements.filter((a) => a.targetAudience === "staff" || a.targetAudience === "both").length,
    parent: announcements.filter((a) => a.targetAudience === "parent" || a.targetAudience === "both").length,
    urgent: announcements.filter((a) => a.priority === "urgent").length,
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <Card className="bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Megaphone className="w-5 h-5" /> Announcements
              </h2>
              <p className="text-white/70 text-sm">Broadcast messages to staff and parents</p>
              <div className="flex items-center gap-4 mt-3">
                <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-white/60 text-xs">Total</p></div>
                <div className="w-px h-10 bg-white/20" />
                <div><p className="text-2xl font-bold">{stats.staff}</p><p className="text-white/60 text-xs">Reach Staff</p></div>
                <div className="w-px h-10 bg-white/20" />
                <div><p className="text-2xl font-bold">{stats.parent}</p><p className="text-white/60 text-xs">Reach Parents</p></div>
                <div className="w-px h-10 bg-white/20" />
                <div><p className="text-2xl font-bold text-red-300">{stats.urgent}</p><p className="text-white/60 text-xs">Urgent</p></div>
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-white text-violet-700 hover:bg-violet-50 shadow-lg font-semibold text-sm px-5 py-2 rounded-xl transition-all duration-200 active:scale-[0.97]"
              onClick={() => { setForm(emptyForm); setError(""); setAddSuccess(false); setShowAdd(true); }}
            >
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-xl text-sm bg-white"
            >
              <option value="all">All Audiences</option>
              <option value="staff">Staff Only</option>
              <option value="parent">Parents Only</option>
              <option value="both">Both (Everyone)</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-xl text-sm bg-white"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{priorityConfig[p].label}</option>)}
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} announcement{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-gray-400">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No announcements yet. Create one above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const aud = audienceConfig[a.targetAudience];
            const pri = priorityConfig[a.priority];
            const AudIcon = aud.icon;
            return (
              <Card key={a._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${aud.color}`}>
                      <AudIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${aud.color}`}>
                          <AudIcon className="w-3 h-3" /> {aud.label}
                        </span>
                        <Badge variant={pri.badge as "secondary" | "info" | "warning" | "destructive"} className="text-xs">
                          {pri.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>By {a.createdByName}</span>
                        <span>•</span>
                        <span>{formatDate(a.createdAt)}</span>
                        {a.expiresAt && <><span>•</span><span className="text-amber-600">Expires {formatDate(a.expiresAt)}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ─────────────────────────────────────────────── */}
      <Dialog open={showAdd} onClose={resetAdd} maxWidth="md">
        <DialogHeader>
          <DialogTitle>{addSuccess ? "Announcement Published!" : "New Announcement"}</DialogTitle>
          <DialogCloseButton onClose={resetAdd} />
        </DialogHeader>
        <DialogContent>
          {addSuccess ? (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Announcement sent!</h3>
              <p className="text-sm text-gray-500">
                Your announcement has been published to <strong>{audienceConfig[form.targetAudience].label}</strong>.
              </p>
            </div>
          ) : (
            <AnnouncementForm form={form} setForm={setForm} error={error} saving={saving} />
          )}
        </DialogContent>
        <DialogFooter>
          {addSuccess ? (
            <>
              <Button variant="outline" onClick={() => { setAddSuccess(false); setForm(emptyForm); setError(""); }}>
                Post Another
              </Button>
              <Button onClick={resetAdd}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetAdd} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Megaphone className="w-4 h-4 mr-1" />}
                Publish
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>

      {/* ── Edit Modal ─────────────────────────────────────────────── */}
      {editTarget && (
        <Dialog open onClose={() => { setEditTarget(null); setError(""); }} maxWidth="md">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogCloseButton onClose={() => { setEditTarget(null); setError(""); }} />
          </DialogHeader>
          <DialogContent>
            <AnnouncementForm form={form} setForm={setForm} error={error} saving={saving} />
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditTarget(null); setError(""); }} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* ── Delete Confirm ─────────────────────────────────────────── */}
      {deleteTarget && (
        <Dialog open onClose={() => setDeleteTarget(null)} maxWidth="sm">
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogCloseButton onClose={() => setDeleteTarget(null)} />
          </DialogHeader>
          <DialogContent>
            <div className="flex items-start gap-3 py-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Are you sure?</p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">&ldquo;{deleteTarget.title}&rdquo;</span> will be removed.
                </p>
              </div>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}

// ── Shared form component ──────────────────────────────────────────────────────
function AnnouncementForm({
  form, setForm, error, saving,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  error: string;
  saving: boolean;
}) {
  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Audience selector — prominent */}
      <div className="grid grid-cols-3 gap-2">
        {(["staff", "parent", "both"] as const).map((aud) => {
          const cfg = audienceConfig[aud];
          const AudIcon = cfg.icon;
          return (
            <button
              key={aud}
              type="button"
              disabled={saving}
              onClick={() => setForm({ ...form, targetAudience: aud })}
              className={`flex flex-col items-center gap-1 p-3 border-2 text-xs font-semibold transition-all ${
                form.targetAudience === aud
                  ? `${cfg.color} border-current`
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <AudIcon className="w-5 h-5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 w-20 flex-shrink-0 text-right">Title *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. School closed on Friday"
          disabled={saving}
          className="flex-1 h-10 px-3 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Priority */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 w-20 flex-shrink-0 text-right">Priority</label>
        <div className="flex gap-2 flex-1">
          {(["low", "medium", "high", "urgent"] as const).map((p) => {
            const cfg = priorityConfig[p];
            return (
              <button
                key={p}
                type="button"
                disabled={saving}
                onClick={() => setForm({ ...form, priority: p })}
                className={`flex-1 py-1.5 text-xs font-semibold border transition-all rounded ${
                  form.priority === p
                    ? p === "urgent" ? "bg-red-500 text-white border-red-500"
                      : p === "high" ? "bg-amber-500 text-white border-amber-500"
                      : p === "medium" ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-500 text-white border-gray-500"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-start gap-3">
        <label className="text-xs font-medium text-gray-500 w-20 flex-shrink-0 text-right mt-2">Content *</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={4}
          placeholder="Write your announcement message here..."
          disabled={saving}
          className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />
      </div>

      {/* Expiry */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 w-20 flex-shrink-0 text-right">Expires</label>
        <input
          type="date"
          value={form.expiresAt}
          onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          disabled={saving}
          min={new Date().toISOString().slice(0, 10)}
          className="flex-1 h-10 px-3 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        {form.expiresAt && (
          <button type="button" onClick={() => setForm({ ...form, expiresAt: "" })} className="text-xs text-gray-400 hover:text-red-500">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
