"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import {
  getAllEmployees,
  getAllTasks,
  getMyTasks,
  getTeamAttendance,
  getAllAttendance,
  getMyAttendance,
  getAllTaskSheets,
  getMyTaskSheets,
  getApiBaseUrl,
  type User,
  type Task,
  type AttendanceRecord,
  type TaskSheetEntry,
} from "@/lib/api";
import { htmlToPlainText } from "@/lib/htmlUtils";
import {
  Award,
  CheckCircle2,
  Loader2,
  Search,
  Trophy,
  TrendingUp,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

type SortKey = "score" | "name" | "completed" | "overdue";
type DateRange = "1day" | "1week" | "1month" | "3months";

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: "1day", label: "1 Day" },
  { id: "1week", label: "1 Week" },
  { id: "1month", label: "1 Month" },
  { id: "3months", label: "3 Months" },
];

interface CompletedWork {
  id: string;
  source: "task" | "task_sheet";
  title: string;
  work: string;
  timeTaken: string;
  blockers: string;
  completedOn: string;
  status?: string;
  workspace?: string | null;
}

interface EmployeePerf {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  profilePicture?: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  onTime: number;
  completionRate: number;
  onTimeRate: number;
  hoursWorked: number;
  daysPresent: number;
  score: number;
  rating: "Excellent" | "Good" | "Average" | "Needs Improvement" | "No tasks";
  completionPoints: number;
  onTimePoints: number;
  overduePenalty: number;
  completedWork: CompletedWork[];
}

function getProfilePictureUrl(profilePicture?: string): string | null {
  if (!profilePicture) return null;
  if (profilePicture.startsWith("data:") || profilePicture.startsWith("http")) return profilePicture;
  return `${getApiBaseUrl()}${profilePicture}`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ratingStyle(rating: EmployeePerf["rating"]): string {
  if (rating === "Excellent") return "bg-emerald-500/10 text-emerald-500";
  if (rating === "Good") return "bg-blue-500/10 text-blue-500";
  if (rating === "Average") return "bg-amber-500/10 text-amber-500";
  if (rating === "No tasks") return "bg-muted text-muted-foreground";
  return "bg-red-500/10 text-red-500";
}

function scoreColor(score: number): string {
  if (score >= 85) return "#10b981";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function computeScoreParts(
  completionRate: number,
  onTimeRate: number,
  overdue: number,
  total: number,
) {
  if (total === 0) {
    return { score: 0, completionPoints: 0, onTimePoints: 0, overduePenalty: 0 };
  }
  const completionPoints = Math.round(completionRate * 0.7);
  const onTimePoints = Math.round(onTimeRate * 0.3);
  const overduePenalty = Math.min(20, Math.round((overdue / total) * 20));
  const score = Math.max(0, Math.min(100, completionPoints + onTimePoints - overduePenalty));
  return { score, completionPoints, onTimePoints, overduePenalty };
}

function ratingFromScore(score: number, total: number): EmployeePerf["rating"] {
  if (total === 0) return "No tasks";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs Improvement";
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0.0h";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function parseDurationToHours(raw?: string | null): number {
  if (!raw) return 0;
  const text = raw.toLowerCase();
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  const minutesMatch = text.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)\b/);
  let hours = 0;
  if (hoursMatch) hours += Number(hoursMatch[1]);
  if (minutesMatch) hours += Number(minutesMatch[1]) / 60;
  if (hours === 0) {
    const numeric = text.match(/(\d+(?:\.\d+)?)/);
    if (numeric) {
      const value = Number(numeric[1]);
      hours = /min/.test(text) ? value / 60 : value;
    }
  }
  return Number.isFinite(hours) ? hours : 0;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeBounds(range: DateRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  if (range === "1week") start.setDate(start.getDate() - 6);
  else if (range === "1month") start.setDate(start.getDate() - 29);
  else if (range === "3months") start.setDate(start.getDate() - 89);
  return { start, end };
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inRange(value: string | null | undefined, start: Date, end: Date): boolean {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return parsed >= start && parsed <= end;
}

function formatDisplayDate(value?: string | null): string {
  const parsed = parseDate(value);
  if (!parsed) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function hoursBetween(start?: string | null, end?: string | null): number | null {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to || to.getTime() <= from.getTime()) return null;
  return Math.round(((to.getTime() - from.getTime()) / (1000 * 60 * 60)) * 10) / 10;
}

function attendanceRecordHours(record: AttendanceRecord): number {
  if (record.total_hours != null && Number(record.total_hours) > 0) {
    return Math.abs(Number(record.total_hours));
  }
  if (record.punch_in) {
    const elapsed = hoursBetween(record.punch_in, record.punch_out || new Date().toISOString());
    return elapsed && elapsed > 0 ? elapsed : 0;
  }
  return 0;
}

function attendanceDateValue(record: AttendanceRecord): string | null {
  if (record.date) {
    const raw = String(record.date);
    return raw.length >= 10 ? raw.slice(0, 10) : raw;
  }
  if (record.punch_in) return record.punch_in;
  return null;
}

function isOnTime(task: Task): boolean {
  if (!task.due_date) return true;
  const finished = parseDate(task.completed_at || task.updated_at);
  const due = parseDate(task.due_date);
  if (!finished || !due) return true;
  return finished.getTime() <= endOfDay(due).getTime();
}

function formatTaskTime(task: Task): string {
  if (task.actual_hours != null && task.actual_hours > 0) {
    return `${task.actual_hours}h logged`;
  }
  const elapsed = hoursBetween(task.start_date, task.completed_at || task.updated_at);
  if (elapsed != null) {
    if (elapsed >= 24) {
      const days = Math.round((elapsed / 24) * 10) / 10;
      return `${days} day${days === 1 ? "" : "s"} start to finish`;
    }
    return `${elapsed}h start to finish`;
  }
  if (task.estimated_hours != null && task.estimated_hours > 0) {
    return `${task.estimated_hours}h estimated`;
  }
  return "Not recorded";
}

function extractBlockers(task: Task): string {
  const notes: string[] = [];
  if (task.flag_reason?.trim()) notes.push(task.flag_reason.trim());
  const commentHits = (task.comments || []).filter((comment) =>
    /block|stuck|waiting|issue|delay|hold/i.test(comment),
  );
  notes.push(...commentHits.map((comment) => htmlToPlainText(comment).trim()).filter(Boolean));
  if (task.status === "rejected") notes.push("Task was sent back for changes.");
  return notes.length > 0 ? Array.from(new Set(notes)).join(" • ") : "None recorded";
}

function summarizeWork(task: Task): string {
  const description = htmlToPlainText(task.description || "").replace(/\s+/g, " ").trim();
  if (description) return description.length > 280 ? `${description.slice(0, 277)}...` : description;
  return "No work description recorded.";
}

function isCompletedStatus(status: Task["status"]): boolean {
  return status === "approved" || status === "submitted";
}

function taskOverlapsRange(task: Task, start: Date, end: Date): boolean {
  const created = parseDate(task.start_date || task.created_at);
  if (!created || created > end) return false;
  if (isCompletedStatus(task.status)) {
    const finished = parseDate(task.completed_at || task.updated_at);
    if (finished && finished < start) return false;
  }
  return true;
}

function buildCompletedFromTask(task: Task): CompletedWork {
  return {
    id: `task-${task.id}`,
    source: "task",
    title: task.title,
    work: summarizeWork(task),
    timeTaken: formatTaskTime(task),
    blockers: extractBlockers(task),
    completedOn: formatDisplayDate(task.completed_at || task.updated_at),
    status: task.status.replace("_", " "),
    workspace: task.workspace_name,
  };
}

function buildCompletedFromSheet(sheet: TaskSheetEntry): CompletedWork {
  const title = (sheet.tasks_completed || "").replace(/\s+/g, " ").trim() || "Daily task sheet";
  return {
    id: `sheet-${sheet.id}`,
    source: "task_sheet",
    title: title.length > 90 ? `${title.slice(0, 87)}...` : title,
    work: (sheet.work_impact || "").replace(/\s+/g, " ").trim() || "No work summary recorded.",
    timeTaken: sheet.time_taken?.trim() || "Not recorded",
    blockers: "None recorded",
    completedOn: formatDisplayDate(sheet.date),
    status: "logged",
  };
}

function buildPerformance(
  employees: User[],
  tasks: Task[],
  attendance: AttendanceRecord[],
  taskSheets: TaskSheetEntry[],
  range: DateRange,
): EmployeePerf[] {
  const { start, end } = rangeBounds(range);
  const now = new Date();

  return employees.map((emp) => {
    const assigned = tasks.filter(
      (task) => Number(task.assigned_to) === Number(emp.id) && taskOverlapsRange(task, start, end),
    );
    const completedTasks = assigned.filter(
      (task) =>
        isCompletedStatus(task.status) &&
        inRange(task.completed_at || task.updated_at, start, end),
    );
    const inProgress = assigned.filter(
      (task) => task.status === "in_progress" || task.status === "reviewing",
    ).length;
    const overdue = assigned.filter(
      (task) => task.due_date && new Date(task.due_date) < now && !isCompletedStatus(task.status),
    ).length;
    const onTime = completedTasks.filter(isOnTime).length;

    const empAttendance = attendance.filter((record) => {
      if (Number(record.user_id) !== Number(emp.id)) return false;
      return inRange(attendanceDateValue(record), start, end);
    });
    const sheetEntries = taskSheets.filter(
      (sheet) => Number(sheet.user_id) === Number(emp.id) && inRange(sheet.date, start, end),
    );
    const sheetWork = sheetEntries.map(buildCompletedFromSheet);

    let hoursWorked = Math.round(
      empAttendance.reduce((sum, record) => sum + attendanceRecordHours(record), 0) * 10,
    ) / 10;
    if (hoursWorked <= 0) {
      const taskHours = assigned.reduce((sum, task) => sum + (Number(task.actual_hours) || 0), 0);
      const sheetHours = sheetEntries.reduce((sum, sheet) => sum + parseDurationToHours(sheet.time_taken), 0);
      hoursWorked = Math.round((taskHours + sheetHours) * 10) / 10;
    }
    const daysPresent = new Set(
      empAttendance
        .filter((record) => record.punch_in || attendanceRecordHours(record) > 0)
        .map((record) => String(record.date || record.punch_in).slice(0, 10)),
    ).size;

    const completionRate = assigned.length > 0 ? Math.round((completedTasks.length / assigned.length) * 100) : 0;
    const onTimeRate = completedTasks.length > 0 ? Math.round((onTime / completedTasks.length) * 100) : 0;
    const { score, completionPoints, onTimePoints, overduePenalty } = computeScoreParts(
      completionRate,
      onTimeRate,
      overdue,
      assigned.length,
    );

    const completedWork = [
      ...completedTasks
        .slice()
        .sort((a, b) => {
          const aDate = parseDate(a.completed_at || a.updated_at)?.getTime() || 0;
          const bDate = parseDate(b.completed_at || b.updated_at)?.getTime() || 0;
          return bDate - aDate;
        })
        .map(buildCompletedFromTask),
      ...sheetWork,
    ];

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      isActive: emp.is_active,
      profilePicture: emp.profile_picture,
      total: assigned.length,
      completed: completedTasks.length,
      inProgress,
      overdue,
      onTime,
      completionRate,
      onTimeRate,
      hoursWorked,
      daysPresent,
      score,
      rating: ratingFromScore(score, assigned.length),
      completionPoints,
      onTimePoints,
      overduePenalty,
      completedWork,
    };
  });
}

export default function PerformancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  const [employees, setEmployees] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [taskSheets, setTaskSheets] = useState<TaskSheetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [dateRange, setDateRange] = useState<DateRange>("1month");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

    const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");

    const lookback = rangeBounds("3months");
    const attendanceQuery = {
      startDate: formatYmd(lookback.start),
      endDate: formatYmd(lookback.end),
      limit: 2000,
    };

    if (isAdmin) {
      const [empRes, taskRes, attRes, sheetRes] = await Promise.all([
        getAllEmployees(),
        getAllTasks(),
        getTeamAttendance(attendanceQuery).then(async (teamRes) => {
          if (teamRes.data && !teamRes.error) return teamRes;
          return getAllAttendance(attendanceQuery);
        }),
        getAllTaskSheets(400),
      ]);

      if (empRes.error && !empRes.data) {
        setError(empRes.error);
      } else if (empRes.data) {
        setEmployees(empRes.data.filter((emp) => emp.role === "employee"));
      }

      if (taskRes.data) setTasks(taskRes.data);
      if (attRes.data) setAttendance(attRes.data);
      if (sheetRes.data) setTaskSheets(sheetRes.data);
    } else {
      setEmployees([
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: true,
          created_at: "",
          profile_picture: user.profile_picture,
        },
      ]);
      setExpandedId(user.id);

      const [taskRes, attRes, sheetRes] = await Promise.all([
        getMyTasks(),
        getMyAttendance(120),
        getMyTaskSheets(400),
      ]);

      if (taskRes.data) setTasks(taskRes.data);
      if (attRes.data) setAttendance(attRes.data);
      if (sheetRes.data) setTaskSheets(sheetRes.data);
    }

    setIsLoading(false);
  }, [isAdmin, user]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    let list = buildPerformance(employees, tasks, attendance, taskSheets, dateRange);

    if (!isAdmin && user?.id != null) {
      list = list.filter((row) => Number(row.id) === Number(user.id));
    }

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (row) => row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query),
      );
    }

    return [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "completed") return b.completed - a.completed;
      if (sortKey === "overdue") return b.overdue - a.overdue;
      return b.score - a.score;
    });
  }, [employees, tasks, attendance, taskSheets, dateRange, searchTerm, sortKey, isAdmin, user?.id]);

  const kpis = useMemo(() => {
    if (rows.length === 0) {
      return { avgScore: 0, topPerformer: "—", overdue: 0, completion: 0 };
    }
    const scored = rows.filter((row) => row.total > 0);
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((sum, row) => sum + row.score, 0) / scored.length)
      : 0;
    const top = [...scored].sort((a, b) => b.score - a.score)[0] || rows[0];
    const overdue = rows.reduce((sum, row) => sum + row.overdue, 0);
    const totalTasks = rows.reduce((sum, row) => sum + row.total, 0);
    const completed = rows.reduce((sum, row) => sum + row.completed, 0);
    const completion = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    return { avgScore, topPerformer: top?.name || "—", overdue, completion };
  }, [rows]);

  const periodLabel = DATE_RANGE_OPTIONS.find((option) => option.id === dateRange)?.label || "1 Month";

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDownload = async () => {
    if (rows.length === 0) return;
    setIsDownloading(true);
    try {
      const XLSX = await import("xlsx");
      const summaryRows = rows.map((row, index) => ({
        Rank: index + 1,
        Employee: row.name,
        Email: row.email,
        Score: `${row.score}%`,
        Rating: row.rating,
        "Completed Tasks": row.completed,
        "Assigned Tasks": row.total,
        "On-time Rate": `${row.onTimeRate}%`,
        Overdue: row.overdue,
        "Hours Worked": row.hoursWorked > 0 ? Number(row.hoursWorked.toFixed(1)) : 0,
        "Days Present": row.daysPresent,
      }));

      const detailRows = rows.flatMap((row) =>
        row.completedWork.length > 0
          ? row.completedWork.map((work) => ({
              Employee: row.name,
              Email: row.email,
              Source: work.source === "task" ? "Task" : "Task sheet",
              "Task / Work": work.title,
              "What was completed": work.work,
              "Time taken": work.timeTaken,
              Blockers: work.blockers,
              "Completed on": work.completedOn,
              Status: work.status || "",
              Workspace: work.workspace || "",
            }))
          : [
              {
                Employee: row.name,
                Email: row.email,
                Source: "",
                "Task / Work": "No completed work in this period",
                "What was completed": "",
                "Time taken": "",
                Blockers: "",
                "Completed on": "",
                Status: "",
                Workspace: "",
              },
            ],
      );

      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      const detailSheet = XLSX.utils.json_to_sheet(detailRows);
      summarySheet["!cols"] = [
        { wch: 8 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 18 },
        { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
      ];
      detailSheet["!cols"] = [
        { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 36 }, { wch: 50 },
        { wch: 22 }, { wch: 36 }, { wch: 16 }, { wch: 12 }, { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(workbook, detailSheet, "Completed Work");
      XLSX.writeFile(workbook, `Performance_${periodLabel.replace(" ", "")}_${formatYmd(new Date())}.xlsx`);
      toast.success(`Downloaded ${periodLabel.toLowerCase()} performance report`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download performance report.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "employee"]}>
      <DashboardLayout
        role={isAdmin ? "admin" : "employee"}
        userName={user?.name}
        userHandle={`@${user?.email?.split("@")[0]}`}
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Performance</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isAdmin
                  ? "Completed work, time taken, and blockers for each employee over the selected period."
                  : "Your completed work, time taken, and blockers over the selected period."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDateRange(option.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      dateRange === option.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isLoading || isDownloading || rows.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(isAdmin
                  ? [
                      { label: "Average Score", value: `${kpis.avgScore}%`, icon: TrendingUp, color: "from-violet-500 to-fuchsia-500" },
                      { label: "Top Performer", value: kpis.topPerformer, icon: Trophy, color: "from-amber-500 to-orange-500" },
                      { label: "Team Completion", value: `${kpis.completion}%`, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
                      { label: "Overdue Tasks", value: kpis.overdue, icon: AlertCircle, color: "from-rose-500 to-red-500" },
                    ]
                  : [
                      { label: "Your Score", value: `${rows[0]?.score ?? 0}%`, icon: TrendingUp, color: "from-violet-500 to-fuchsia-500" },
                      { label: "Rating", value: rows[0]?.rating ?? "—", icon: Trophy, color: "from-amber-500 to-orange-500" },
                      { label: "Completion", value: `${kpis.completion}%`, icon: CheckCircle2, color: "from-emerald-500 to-teal-500" },
                      { label: "Overdue Tasks", value: kpis.overdue, icon: AlertCircle, color: "from-rose-500 to-red-500" },
                    ]
                ).map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 card-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`rounded-lg bg-gradient-to-br ${kpi.color} p-2 text-white`}>
                        <kpi.icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{kpi.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground truncate">{kpi.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{periodLabel}</p>
                  </div>
                ))}
              </div>

              {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative max-w-sm flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="score">Sort by score</option>
                  <option value="name">Sort by name</option>
                  <option value="completed">Sort by completed</option>
                  <option value="overdue">Sort by overdue</option>
                </select>
              </div>
              )}

              {rows.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <Users size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isAdmin ? "No employee performance data found for this period." : "No performance data found for this period."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((row, index) => {
                    const photo = getProfilePictureUrl(row.profilePicture);
                    const expanded = expandedId === row.id;
                    return (
                      <div key={row.id} className={`rounded-xl border bg-card card-shadow overflow-hidden ${row.id === user?.id ? "border-primary/40" : "border-border"}`}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.id)}
                          className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex items-center gap-3 min-w-0 lg:w-[280px]">
                              <span className="w-6 text-xs font-bold text-muted-foreground">#{index + 1}</span>
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-white font-semibold text-sm overflow-hidden">
                                {photo ? (
                                  <NextImage
                                    src={photo}
                                    alt={`${row.name}'s profile picture`}
                                    width={44}
                                    height={44}
                                    className="h-full w-full object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  initials(row.name)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground truncate">{row.name}</h3>
                                  {row.id === user?.id && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">You</span>
                                  )}
                                  {index === 0 && row.score > 0 && (
                                    <Award size={14} className="text-amber-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                              </div>
                            </div>

                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <Metric label="Completed" value={`${row.completed}/${row.total}`} />
                              <Metric label="On-time" value={`${row.onTimeRate}%`} />
                              <Metric label="Overdue" value={String(row.overdue)} warn={row.overdue > 0} />
                              <Metric
                                label="Hours"
                                value={formatHours(row.hoursWorked)}
                              />
                            </div>

                            <div className="flex items-center gap-4 lg:w-[220px]">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-semibold text-muted-foreground">Score</span>
                                  <span className="text-sm font-bold" style={{ color: scoreColor(row.score) }}>
                                    {row.score}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted/40">
                                  <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${row.score}%`, background: scoreColor(row.score) }}
                                  />
                                </div>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${ratingStyle(row.rating)}`}>
                                {row.rating}
                              </span>
                              {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                            </div>
                          </div>
                        </button>

                        {expanded && (
                          <div className="border-t border-border bg-muted/20 px-5 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              <Metric label="In progress" value={String(row.inProgress)} />
                              <Metric label="Completion rate" value={`${row.completionRate}%`} />
                              <Metric label="Days present" value={String(row.daysPresent)} />
                              <Metric label="Hours worked" value={formatHours(row.hoursWorked)} />
                            </div>

                            <div className="rounded-lg border border-border bg-card p-3 mb-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                How the score is calculated
                              </p>
                              {row.total === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No tasks were assigned in this period, so the score stays at 0%.
                                </p>
                              ) : (
                                <div className="space-y-1.5 text-sm">
                                  <p className="text-foreground">
                                    Completion (70%): {row.completed}/{row.total} tasks = {row.completionRate}% → <b>{row.completionPoints}</b> pts
                                  </p>
                                  <p className="text-foreground">
                                    On-time (30%): {row.onTime}/{row.completed || 0} finished on time = {row.onTimeRate}% → <b>{row.onTimePoints}</b> pts
                                  </p>
                                  <p className="text-foreground">
                                    Overdue penalty: {row.overdue} overdue → <b>-{row.overduePenalty}</b> pts
                                  </p>
                                  <p className="text-foreground font-semibold pt-1">
                                    Score = {row.completionPoints} + {row.onTimePoints} - {row.overduePenalty} = {row.score}%
                                  </p>
                                </div>
                              )}
                            </div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                              Completed work · {periodLabel}
                            </p>
                            {row.completedWork.length > 0 ? (
                              <div className="space-y-3">
                                {row.completedWork.map((work) => (
                                  <div key={work.id} className="rounded-lg border border-border bg-card p-3">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground">{work.title}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                          {work.source === "task" ? "Project task" : "Daily task sheet"}
                                          {work.workspace ? ` · ${work.workspace}` : ""}
                                          {` · ${work.completedOn}`}
                                        </p>
                                      </div>
                                      {work.status && (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold capitalize text-emerald-600 shrink-0">
                                          {work.status}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-foreground/90 mb-3">{work.work}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Clock size={13} className="mt-0.5 shrink-0" />
                                        <span><span className="font-semibold text-foreground">Time taken:</span> {work.timeTaken}</span>
                                      </div>
                                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                                        <span><span className="font-semibold text-foreground">Blockers:</span> {work.blockers}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No completed work in this period.</p>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => router.push(`/admin/users/${row.id}`)}
                                className="mt-4 text-sm font-semibold text-primary hover:underline"
                              >
                                View employee profile
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${warn ? "text-red-500" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
