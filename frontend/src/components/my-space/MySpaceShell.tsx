"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";

const TABS = [
  { label: "Task Sheet", path: "/my-space/task-sheet" },
  { label: "Happy Sheet", path: "/my-space/happy-sheet" },
  { label: "Visionary Canvas", path: "/my-space/visionary-canvas" },
  { label: "Learning Canvas", path: "/my-space/learning-canvas" },
  { label: "Weekly Sheet", path: "/my-space/weekly-sheet" },
];

interface MySpaceShellProps {
  children: React.ReactNode;
  /** Right side header action (optional) */
  headerAction?: React.ReactNode;
}

export default function MySpaceShell({ children, headerAction }: MySpaceShellProps) {
  const { user } = useAuth();
  const pathname = usePathname() || "";

  return (
    <ProtectedRoute>
      <DashboardLayout
        role={user?.role as "admin" | "employee"}
        userName={user?.name || "User"}
        userHandle={`@${user?.email?.split("@")[0] || "user"}`}
        noPadding
      >
        {/*
          noPadding disables DashboardLayout's p-6 + overflow-auto.
          We now control height, padding and scrolling ourselves.
        */}
        <div
          className="flex w-full flex-col min-h-0"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {/* ── Fixed header + tab bar ── */}
          <div className="flex-shrink-0 px-4 pt-6 pb-4 sm:px-6">
            <div className="mx-auto w-full max-w-6xl space-y-4">
              {/* Page title */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#2B124C] dark:text-purple-100">
                    The Lighthouse
                  </h1>
                  <p className="mt-0.5 text-sm text-[#854F6C] dark:text-purple-400">
                    Your personal space for growth, reflections, and aspirations
                  </p>
                </div>
                {headerAction && <div>{headerAction}</div>}
              </div>

              {/* Tab bar */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur-sm overflow-x-auto">
                {TABS.map((tab) => {
                  const isActive = pathname === tab.path;
                  return (
                    <Link
                      key={tab.path}
                      href={tab.path}
                      className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-5 ${
                        isActive
                          ? "bg-[#111111] text-white shadow-sm ring-1 ring-[#111111]"
                          : "text-[#2B124C] hover:bg-black/5"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Scrollable content area ── */}
          <div className="hide-scrollbar flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
