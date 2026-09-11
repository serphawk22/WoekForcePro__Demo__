import { Brain, FileCheck, Sparkles, Bot } from "lucide-react";

const aiFeatures = [
  {
    icon: Brain,
    title: "Intelligent Leave Detection",
    description: "AI reads leave requests in natural language and routes them to the right approver instantly.",
  },
  {
    icon: FileCheck,
    title: "Paperless Approval System",
    description: "Zero paper, zero friction. Smart forms auto-populate from employee profiles and historical data.",
  },
  {
    icon: Bot,
    title: "Automated Workflow Triggers",
    description: "When a task closes, AI can auto-assign follow-ups, notify stakeholders, and update payroll records.",
  },
  {
    icon: Sparkles,
    title: "Predictive Analytics",
    description: "Forecast workload, flag burnout risks, and surface productivity bottlenecks before they escalate.",
  },
];

export function AIVisionSection() {
  return (
    <section id="ai-vision" className="py-28 relative overflow-hidden bg-[#f5f5f5]">
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d9d9d9] bg-white text-[#111111] text-xs font-semibold uppercase tracking-widest mb-6">
            <Sparkles size={12} /> AI-Powered Future
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5">
            The Future of Workforce Management is Intelligent
          </h2>
          <p className="text-[#4b4b4b] text-lg leading-relaxed">
            WorkForce Pro is building toward a fully AI-automated leave and approval system —
            paperless, frictionless, and always compliant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {aiFeatures.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-[#111111]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111111] mb-1.5">{title}</h3>
                  <p className="text-sm text-[#4b4b4b] leading-relaxed">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-[#5b5b5b] text-sm mb-4 uppercase tracking-widest font-medium">
            Coming Soon · Stay tuned
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-[#d9d9d9] text-[#111111] font-semibold text-sm">
            <span className="h-2 w-2 rounded-full bg-[#111111]" />
            AI Beta launching Q3 2026
          </div>
        </div>
      </div>
    </section>
  );
}
