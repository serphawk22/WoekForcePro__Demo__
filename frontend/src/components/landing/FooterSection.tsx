import Link from "next/link";
import { Zap, Github, Twitter, Linkedin } from "lucide-react";

const internalLinks = [
  { label: "Login",     href: "/login" },
  { label: "Dashboard", href: "/dashboard" },
];

const anchorLinks = [
  { label: "Features",  href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "AI Vision", href: "#ai-vision" },
];

export function FooterSection() {
  return (
    <footer className="bg-white border-t border-[#e5e5e5] py-16 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#111111] flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#111111]">
                WorkForce <span className="text-[#111111]">Pro</span>
              </span>
            </Link>
            <p className="text-sm text-[#4b4b4b] leading-relaxed">
              Premium workforce management platform for modern teams. Built for clarity, speed, and scale.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#4b4b4b] mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5">
              {internalLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-[#4b4b4b] hover:text-[#111111] transition-colors font-medium"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {anchorLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-[#4b4b4b] hover:text-[#111111] transition-colors font-medium"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#4b4b4b] mb-4">
              Connect
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-10 w-10 rounded-xl border border-[#e5e5e5] bg-white flex items-center justify-center text-[#111111] transition-all duration-200 hover:bg-[#f5f5f5]"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#4b4b4b]">
            © 2026 WorkForce Pro. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-[#4b4b4b]">
            <a href="#" className="hover:text-[#111111] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#111111] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
