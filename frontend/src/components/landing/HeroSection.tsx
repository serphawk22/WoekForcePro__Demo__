import Link from "next/link";
import { ArrowRight, PlayCircle, Sparkles, Brain, Clock, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Task Creation 🤖",
    description: "Create tasks, assign employees, and structure workflows instantly using AI.",
  },
  {
    icon: Clock,
    title: "Smart Attendance Tracking ⏱️",
    description: "Real-time punch-in/out tracking with productivity insights.",
  },
  {
    icon: RefreshCw,
    title: "Recurring Task Automation 🔁",
    description: "Automate weekly/monthly tasks and never miss repetitive workflows.",
  },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white text-[#111111]">
      <div className="absolute inset-0 z-0 bg-white" />

      <div className="relative z-10 container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#e5e5e5] bg-[#f5f5f5] text-[#111111] text-xs font-semibold uppercase tracking-widest mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
            Workforce Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 text-[#111111]">
            Manage Your Workforce Smarter
          </h1>

          <p className="text-lg md:text-xl text-[#4b4b4b] max-w-2xl mx-auto mb-10 leading-relaxed">
            WorkForce Pro unifies task hierarchies, real-time attendance, role-based workflows,
            and AI-powered approvals — all in one premium dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white bg-[#111111] hover:bg-[#2a2a2a] transition-all duration-200"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-[#111111] border border-[#d9d9d9] bg-white hover:bg-[#f5f5f5] transition-all duration-200"
            >
              <PlayCircle size={18} /> See How It Works
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="group relative p-8 rounded-3xl bg-white border border-[#e5e5e5] shadow-sm overflow-hidden flex flex-col items-center gap-4 transition-all duration-200 hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="relative z-10 h-16 w-16 rounded-2xl flex items-center justify-center mb-2 bg-[#f5f5f5] border border-[#e5e5e5]">
                  <Icon size={32} className="text-[#111111]" />
                </div>
                <h3 className="relative z-10 text-xl font-extrabold text-[#111111] text-center mb-1 tracking-tight">{title}</h3>
                <p className="relative z-10 text-[#4b4b4b] text-base leading-relaxed text-center font-medium">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
