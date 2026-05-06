import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell, Search, ChevronRight } from "lucide-react";
import AppSidebar from "./AppSidebar";
import AICopilot from "./AICopilot";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  "state-dashboard": "State Dashboard",
  "district-dashboard": "District Dashboard",
  "chc-dashboard": "CHC Dashboard",
  "phc-dashboard": "PHC Dashboard",
  "field-dashboard": "Field Dashboard",
  "citizen-portal": "Citizen Portal",
  "compliance": "Compliance",
  "patients": "Patients",
  "reports": "Reports",
  "monitoring": "Monitoring",
  "outbreak": "Outbreak",
  "preventive": "Preventive",
  "login": "Login",
};

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const segments = location.pathname.split("/").filter(Boolean);
  const crumb =
    segments.length === 0
      ? "Dashboard"
      : routeLabels[segments[segments.length - 1]] || segments[segments.length - 1];

  const dateLabel = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen" style={{ background: "#F4F8FC" }}>
      <AppSidebar />

      {/* Header — full width to the right of sidebar */}
      <header
        className="fixed top-0 left-64 right-0 z-30 h-16 flex items-center gap-4 px-6 border-b"
        style={{ background: "#FFFFFF", borderColor: SKY_LINE }}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">AP Health IQ</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold" style={{ color: NAVY }}>{crumb}</span>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div
          className="hidden md:flex items-center gap-2 rounded-md border px-3 py-1.5 min-w-[260px]"
          style={{ borderColor: SKY_LINE, background: "#F8FBFE" }}
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            placeholder="Search patients, mandals, reports..."
            className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          <kbd
            className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
            style={{ borderColor: SKY_LINE, background: "#FFFFFF", color: "#475569" }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Live clock */}
        <div className="hidden lg:flex flex-col items-end leading-tight">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{dateLabel}</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: NAVY }}>{timeLabel}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md border"
          style={{ borderColor: SKY_LINE, background: "#FFFFFF", color: NAVY }}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ background: "#C62828" }}
          >
            3
          </span>
        </button>

        {/* Avatar */}
        <button
          className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1"
          style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
          aria-label="Account"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: NAVY }}
          >
            VR
          </span>
          <span className="hidden sm:block text-xs font-semibold" style={{ color: NAVY }}>Dr. Rao</span>
        </button>
      </header>

      {/* Main content */}
      <main className="ml-64 min-h-screen pt-16">
        <div className="p-6">{children}</div>
      </main>

      <AICopilot floating />
    </div>
  );
};

export default AppLayout;
