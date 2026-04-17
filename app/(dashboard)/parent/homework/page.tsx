"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getSubjectColor } from "@/lib/utils";
import { Calendar, BookOpen, Loader2, AlertCircle, ClipboardList, CheckCircle } from "lucide-react";

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

interface ChildInfo {
  _id: string;
  name: string;
  className: string;
  section: string;
}

const today = new Date();

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function isPastDue(dueDate: string) {
  return new Date(dueDate) < new Date(toDateStr(today));
}

function daysLeftLabel(dueDate: string) {
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "Past Due";
  if (diff === 0) return "Due Today";
  if (diff === 1) return "Due Tomorrow";
  return `${diff} days left`;
}

export default function ParentHomeworkPage() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState("");
  const [showPast, setShowPast] = useState(false);

  // Load children from parent/me
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/parent/me", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data.children?.length > 0) {
          const kids: ChildInfo[] = json.data.children.map(
            (c: { _id: string; name: string; className: string; section: string }) => ({
              _id: c._id,
              name: c.name,
              className: c.className,
              section: c.section,
            })
          );
          setChildren(kids);
          setSelectedChild(kids[0]);
        }
      } catch {
        setError("Failed to load children data");
      } finally {
        setLoadingChildren(false);
      }
    })();
  }, []);

  // Load assignments when child changes
  useEffect(() => {
    if (!selectedChild) return;
    setLoadingAssignments(true);
    setError(null);
    setFilterSubject("");

    (async () => {
      try {
        const res = await fetch(
          `/api/assignments?childId=${selectedChild._id}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (json.success) {
          setAssignments(json.data);
        } else {
          setError(json.message || "Failed to load homework");
        }
      } catch {
        setError("Failed to load homework");
      } finally {
        setLoadingAssignments(false);
      }
    })();
  }, [selectedChild]);

  const allSubjects = Array.from(new Set(assignments.map((a) => a.subject))).sort();

  const filtered = assignments.filter((a) => {
    if (filterSubject && a.subject !== filterSubject) return false;
    if (!showPast && isPastDue(a.dueDate)) return false;
    return true;
  });

  const upcoming = filtered.filter((a) => !isPastDue(a.dueDate));
  const past = filtered.filter((a) => isPastDue(a.dueDate));

  if (loadingChildren) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <BookOpen className="w-10 h-10 text-gray-300" />
        <p className="text-gray-500 text-sm">No children linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child selector + filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Child tabs */}
              {children.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setSelectedChild(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedChild?._id === c._id
                      ? "bg-purple-600 text-white shadow"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c.name}
                  <span className="ml-1.5 text-xs opacity-70">
                    {c.className}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
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
              <button
                onClick={() => setShowPast((v) => !v)}
                className={`px-3 h-9 rounded-xl text-xs font-medium border transition-colors ${
                  showPast
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {showPast ? "Hide Past" : "Show Past"}
              </button>
            </div>
          </div>
          {!loadingAssignments && selectedChild && (
            <p className="text-xs text-gray-500 mt-2">
              {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} for{" "}
              {selectedChild.name}
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

      {loadingAssignments ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading homework…
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Upcoming Homework
              <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            </h2>

            {upcoming.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">All caught up!</p>
                  <p className="text-xs text-gray-400">No pending homework assignments.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <HomeworkCard key={a._id} assignment={a} />
                ))}
              </div>
            )}
          </div>

          {/* Past (only shown when toggled) */}
          {showPast && past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                Past Assignments
                <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {past.length}
                </span>
              </h2>
              <div className="space-y-3 opacity-70">
                {past.map((a) => (
                  <HomeworkCard key={a._id} assignment={a} isPast />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Homework Card ────────────────────────────────────────────────────────────
function HomeworkCard({
  assignment: a,
  isPast = false,
}: {
  assignment: Assignment;
  isPast?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const daysLeft = Math.ceil(
    (new Date(a.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const urgent = !isPast && daysLeft <= 2;

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${
        urgent ? "border-red-200 bg-red-50/30" : ""
      }`}
      onClick={() => setExpanded((v) => !v)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Colour stripe */}
          <div
            className={`w-1 self-stretch rounded-full flex-shrink-0 ${
              isPast ? "bg-gray-300" : urgent ? "bg-red-400" : "bg-purple-400"
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assigned by {a.createdByName} · {a.className}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${getSubjectColor(a.subject)}`}
                >
                  {a.subject}
                </span>
                <Badge
                  variant={
                    isPast ? "secondary" : daysLeft === 0 ? "destructive" : urgent ? "destructive" : "info"
                  }
                  className="text-xs"
                >
                  {daysLeftLabel(a.dueDate)}
                </Badge>
              </div>
            </div>

            {/* Collapsible description */}
            {expanded && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                {a.description}
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {formatDate(a.dueDate)}
              </span>
              <span
                className={`transition-colors ${
                  expanded ? "text-purple-600" : "text-gray-400"
                }`}
              >
                {expanded ? "▲ Hide details" : "▼ Show details"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
