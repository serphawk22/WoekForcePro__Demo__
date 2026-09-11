"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Menu, X, Zap } from "lucide-react";
import { BookDemoModal } from "./BookDemoModal";

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#e5e5e5] bg-white/95 backdrop-blur-sm">
      <div className="h-16 px-6 md:px-8 relative flex items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 relative z-20">
          <div className="h-9 w-9 rounded-xl bg-[#111111] flex items-center justify-center shadow-sm">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#111111]">
            WorkForce <span className="text-[#111111]">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-[#4b4b4b] absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <a href="#features" className="hover:text-[#111111] transition-colors pointer-events-auto">Features</a>
          <a href="#how-it-works" className="hover:text-[#111111] transition-colors pointer-events-auto">How It Works</a>
          <a href="#ai-vision" className="hover:text-[#111111] transition-colors pointer-events-auto">AI Vision</a>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3 absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold rounded-full text-[#111111] border border-[#d9d9d9] bg-white hover:bg-[#f5f5f5] transition-all duration-200"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-semibold rounded-full text-white bg-[#111111] hover:bg-[#2a2a2a] transition-all duration-200 border-0"
          >
            Get Started
          </Link>
          <BookDemoModal
            buttonClassName="demo-cta px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 text-[#111111] border border-[#d9d9d9] bg-white hover:bg-[#f5f5f5]"
            buttonIcon={<CalendarDays size={14} className="opacity-75 transition-opacity duration-200" aria-hidden="true" />}
          />
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2 ml-auto relative z-30">
          <BookDemoModal buttonClassName="demo-cta px-3 py-2 text-sm font-semibold rounded-full text-[#111111] border border-[#d9d9d9] bg-white hover:bg-[#f5f5f5]" buttonIcon={<CalendarDays size={14} className="opacity-75 transition-opacity duration-200" aria-hidden="true" />} />
          <button
            onClick={() => setOpen(!open)}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-[#111111] hover:bg-[#f5f5f5]"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white px-6 py-4 space-y-3 border-t border-[#e5e5e5]">
          {["#features", "#how-it-works", "#ai-vision"].map((href) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-[#4b4b4b] hover:text-[#111111] transition-colors capitalize"
            >
              {href.replace("#", "").replace("-", " ")}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="w-full text-center py-2.5 text-sm font-semibold rounded-xl border border-[#d9d9d9] text-[#111111] bg-white">Log In</Link>
            <Link href="/signup" className="w-full text-center py-2.5 text-sm font-semibold rounded-xl text-white bg-[#111111]">Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
