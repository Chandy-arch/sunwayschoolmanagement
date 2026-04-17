"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogCloseButton, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Edit, Trash2, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  PartyPopper, BookOpen, Users, Trophy, Palette, Handshake, MoreHorizontal, AlertCircle,
} from "lucide-react";

interface EventItem {
  _id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  targetAudience: string;
  className: string;
  color: string;
  isActive: boolean;
}

const EVENT_TYPES = ["Holiday", "Exam", "Meeting", "Sports", "Cultural", "PTM", "Other"] as const;
const AUDIENCES = ["all", "staff", "parent", "admin"] as const;

const typeConfig: Record<string, { icon: typeof PartyPopper; color: string; bg: string; border: string }> = {
  Holiday:  { icon: PartyPopper, color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200" },
  Exam:     { icon: BookOpen,    color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200" },
  Meeting:  { icon: Users,       color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200" },
  Sports:   { icon: Trophy,      color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200" },
  Cultural: { icon: Palette,     color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200" },
  PTM:      { icon: Handshake,   color: "text-indigo-600", bg: "bg-indigo-50",  border: "border-indigo-200" },
  Other:    { icon: MoreHorizontal, color: "text-gray-600", bg: "bg-gray-50",   border: "border-gray-200" },
};

const audienceLabel: Record<string, string> = {
  all: "Everyone", staff: "Staff Only", parent: "Parents Only", admin: "Admin Only",
};

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function formatDateInput(d: string | Date) {
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Calendar state
  const [viewDate, setViewDate] = useState(new Date());
  const [filterType, setFilterType] = useState("all");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventType: "Holiday" as string,
    startDate: "",
    endDate: "",
    isFullDay: true,
    targetAudience: "all" as string,
    className: "",
    color: "",
  });

  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/events?month=${monthKey}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setEvents(json.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = viewDate.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((e) => e.eventType === filterType);
  }, [events, filterType]);

  // Map events to calendar days
  const dayEventsMap = useMemo(() => {
    const map = new Map<number, EventItem[]>();
    filteredEvents.forEach((ev) => {
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = new Date(year, month, d);
        if (dayDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
            dayDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) {
          if (!map.has(d)) map.set(d, []);
          map.get(d)!.push(ev);
        }
      }
    });
    return map;
  }, [filteredEvents, daysInMonth, year, month]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date());

  const openCreate = () => {
    setEditingEvent(null);
    setForm({
      title: "", description: "", eventType: "Holiday", startDate: formatDateInput(new Date()),
      endDate: formatDateInput(new Date()), isFullDay: true, targetAudience: "all", className: "", color: "",
    });
    setError("");
    setFormOpen(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      eventType: ev.eventType,
      startDate: formatDateInput(ev.startDate),
      endDate: formatDateInput(ev.endDate),
      isFullDay: ev.isFullDay,
      targetAudience: ev.targetAudience,
      className: ev.className,
      color: ev.color,
    });
    setError("");
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      setError("Title, start date, and end date are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editingEvent ? `/api/events/${editingEvent._id}` : "/api/events";
      const method = editingEvent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to save event");
        return;
      }
      setFormOpen(false);
      fetchEvents();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setDeleteTarget(null);
        fetchEvents();
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((e) => e.startDate.slice(0, 10) >= todayStr);
  const holidayCount = events.filter((e) => e.eventType === "Holiday").length;
  const examCount = events.filter((e) => e.eventType === "Exam").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: events.length, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Upcoming", value: upcomingEvents.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Holidays", value: holidayCount, color: "text-red-600", bg: "bg-red-50" },
          { label: "Exams", value: examCount, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-gray-100`}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="default" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Event
        </Button>
        <div className="flex items-center gap-1 bg-white border rounded-xl px-1 py-1">
          {["all", ...EVENT_TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === t ? "bg-purple-600 text-white shadow" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <CardTitle className="text-base min-w-[180px] text-center">{monthName}</CardTitle>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <button onClick={goToday} className="text-xs font-semibold text-purple-600 hover:text-purple-700 px-2 py-1 rounded hover:bg-purple-50">
                  Today
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 mb-2">
                {weekdays.map((w) => (
                  <div key={w} className="text-center text-xs font-bold text-gray-400 py-1">{w}</div>
                ))}
              </div>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isToday = d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  const dayEvents = dayEventsMap.get(d) || [];
                  const isWeekend = new Date(year, month, d).getDay() === 0 || new Date(year, month, d).getDay() === 6;

                  return (
                    <div
                      key={d}
                      className={`min-h-[70px] rounded-lg border p-1 transition-all text-xs ${
                        isToday ? "border-purple-400 bg-purple-50/50 ring-1 ring-purple-200" :
                        isWeekend ? "bg-gray-50/50 border-gray-100" :
                        "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className={`font-bold ${isToday ? "text-purple-700" : isWeekend ? "text-gray-400" : "text-gray-700"}`}>
                        {d}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => {
                          const cfg = typeConfig[ev.eventType] || typeConfig.Other;
                          return (
                            <button
                              key={ev._id}
                              onClick={() => openEdit(ev)}
                              className={`w-full text-left truncate rounded px-1 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color} hover:opacity-80 transition-opacity`}
                              title={ev.title}
                            >
                              {ev.title}
                            </button>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-gray-400 font-medium">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
                {EVENT_TYPES.map((t) => {
                  const cfg = typeConfig[t];
                  const Icon = cfg.icon;
                  return (
                    <span key={t} className="flex items-center gap-1 text-xs text-gray-500">
                      <Icon className={`w-3 h-3 ${cfg.color}`} />
                      {t}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700">
            Events This Month <span className="text-gray-400 font-normal">({filteredEvents.length})</span>
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-2 text-center">
                <CalendarIcon className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">No events this month</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredEvents.map((ev) => {
                const cfg = typeConfig[ev.eventType] || typeConfig.Other;
                const Icon = cfg.icon;
                const isSingleDay = ev.startDate.slice(0, 10) === ev.endDate.slice(0, 10);
                return (
                  <div key={ev._id} className={`bg-white rounded-xl border ${cfg.border} p-3 hover:shadow-sm transition-shadow`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{ev.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isSingleDay ? formatDateShort(ev.startDate) : `${formatDateShort(ev.startDate)} – ${formatDateShort(ev.endDate)}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] py-0">{ev.eventType}</Badge>
                          <Badge variant="secondary" className="text-[10px] py-0">{audienceLabel[ev.targetAudience] || ev.targetAudience}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(ev)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2 ml-12">{ev.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          <DialogCloseButton onClose={() => setFormOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-700 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Event Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Annual Sports Day"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Optional description..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Event Type *</label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Visible To</label>
                <select
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {AUDIENCES.map((a) => <option key={a} value={a}>{audienceLabel[a]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFullDay"
                checked={form.isFullDay}
                onChange={(e) => setForm({ ...form, isFullDay: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isFullDay" className="text-xs font-medium text-gray-600">Full day event</label>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="default" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {editingEvent ? "Update Event" : "Create Event"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm">
        <DialogHeader>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogCloseButton onClose={() => setDeleteTarget(null)} />
        </DialogHeader>
        <DialogContent>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <p className="font-semibold text-gray-900 text-center">Delete &quot;{deleteTarget?.title}&quot;?</p>
            <p className="text-xs text-gray-500 text-center">This will remove the event from all calendars.</p>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
