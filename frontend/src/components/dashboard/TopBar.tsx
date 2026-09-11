"use client";

import { User, LogOut, Search, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { getApiBaseUrl, getGlobalSearch, SearchResult } from "@/lib/api";

export default function TopBar() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  const isAdmin = user?.role === "admin";

  // ─── Global search state ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API fetch when the query changes
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(false);
      return;
    }

    setSearchLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const res = await getGlobalSearch(q);
      if (searchQueryRef.current.trim() !== q) return; // stale response guard
      if (res.data) {
        setSearchResults([
          ...(res.data.employees || []),
          ...(res.data.projects || []),
          ...(res.data.tasks || []),
          ...(res.data.tickets || []),
        ]);
        setSearchError(false);
      } else {
        setSearchResults([]);
        setSearchError(true);
      }
      setSearchLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Show only what the current user is authorized to open
  const visibleResults = useMemo(() => {
    if (isAdmin) return searchResults;
    return searchResults.filter((r) => r.type === "Project" || r.type === "Task");
  }, [isAdmin, searchResults]);

  const navigateToResult = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    searchInputRef.current?.blur();

    let path: string;
    switch (result.type) {
      case "Employee":
        path = `/admin/users/${result.id}`;
        break;
      case "Project":
        path = `/project-management/workspaces/${result.id}`;
        break;
      case "Task":
        path = `/project-management/${result.id}`;
        break;
      case "Ticket":
        path = isAdmin ? `/admin/tickets/${result.id}` : `/employee-dashboard`;
        break;
      default:
        return;
    }
    router.push(path);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (visibleResults.length > 0) {
        setSearchOpen(true);
        setActiveIndex((prev) => (prev + 1) % visibleResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (visibleResults.length > 0) {
        setSearchOpen(true);
        setActiveIndex((prev) => (prev - 1 + visibleResults.length) % visibleResults.length);
      }
    } else if (e.key === "Enter") {
      if (visibleResults.length > 0 && activeIndex >= 0) {
        e.preventDefault();
        navigateToResult(visibleResults[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  const getResultGlyph = (result: SearchResult) => {
    switch (result.type) {
      case "Employee":
        return result.title?.[0]?.toUpperCase() || "U";
      case "Project":
        return "📁";
      case "Task":
        return "✓";
      case "Ticket":
        return "!";
      default:
        return "•";
    }
  };

  const highlightMatch = (text: string, term: string) => {
    const clean = term.trim();
    if (!clean) return text;
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === clean.toLowerCase() ? (
        <span key={i} className="font-semibold text-[#111111]">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const getProfilePictureUrl = () => {
    if (!user?.profile_picture) return null;
    // If it's a data URI (base64), return it directly
    if (user.profile_picture.startsWith("data:")) return user.profile_picture;
    // Otherwise treat as URL
    if (user.profile_picture.startsWith("http")) return user.profile_picture;
    return `${getApiBaseUrl()}${user.profile_picture}`;
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <div className="flex w-full justify-center items-center px-4 pt-3 pb-1">
      <div className="topbar-pill-border mx-auto w-full max-w-[1360px]">
        <header className="topbar-pill-inner flex items-center gap-3 px-4 py-3 sm:px-5">
          <div className="relative min-w-0 flex-1" ref={searchRef}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a5a5a]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              className="h-10 w-full rounded-md border border-[#d8d8d8] bg-white/90 pl-10 pr-3 text-sm text-[#111111] placeholder:text-[#6d6d6d] focus:border-[#111111] focus:outline-none focus:ring-0"
            />

            {searchOpen && searchQuery.trim() !== "" && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#d8d8d8] bg-white shadow-[0_16px_44px_rgba(0,0,0,0.16)]">
                {searchLoading && searchResults.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6d6d6d]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                ) : searchError ? (
                  <div className="px-4 py-3 text-sm text-[#6d6d6d]">
                    Something went wrong. Please try again.
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[380px] overflow-y-auto py-1">
                    {visibleResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-[#6d6d6d]">
                        No results you can access for &quot;{searchQuery.trim()}&quot;
                      </div>
                    ) : (
                      visibleResults.map((item, idx) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => navigateToResult(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                            activeIndex === idx ? "bg-[#111]/[0.06]" : "hover:bg-[#111]/[0.04]"
                          }`}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f1f1] text-sm font-semibold text-[#111111]">
                            {getResultGlyph(item)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[#111111]">
                              {highlightMatch(item.title, searchQuery.trim())}
                            </div>
                            <div className="truncate text-xs text-[#6d6d6d]">{item.subtitle}</div>
                          </div>
                          <span className="shrink-0 rounded-full border border-[#d8d8d8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6d6d6d]">
                            {item.type}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-[#6d6d6d]">
                    No results found for &quot;{searchQuery.trim()}&quot;
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-3 text-[#1b1b1b]">
            <span className="text-[12px] font-semibold tracking-[0.16em] tabular-nums text-[#1b1b1b]/80">
              {time}
            </span>
            <span className="hidden h-4 w-px bg-[#1b1b1b]/25 sm:block" />
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.28em] text-[#1b1b1b]/70 sm:block">
              {date}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NotificationDropdown />
            <button
              onClick={() => router.push("/profile")}
              className="topbar-icon-btn"
              title="Profile"
            >
              {profilePictureUrl ? (
                <Image
                  src={profilePictureUrl}
                  alt={user?.name ? `${user.name}'s profile picture` : "User profile picture"}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b1b1b] text-[10px] font-semibold text-white">
                  {user?.name?.[0] || <User size={12} />}
                </div>
              )}
            </button>
            <button
              onClick={logout}
              className="topbar-icon-btn hover:!text-destructive hover:!bg-destructive/10"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>
      </div>
    </div>
  );
}