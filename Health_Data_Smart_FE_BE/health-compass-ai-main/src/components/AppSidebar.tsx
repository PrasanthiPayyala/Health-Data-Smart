import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileBarChart,
  Activity,
  Shield,
  Heart,
  Bell,
  Search,
} from "lucide-react";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: FileBarChart, label: "Reports", path: "/reports" },
  { icon: Activity, label: "Monitoring", path: "/monitoring" },
  { icon: Shield, label: "Outbreak", path: "/outbreak" },
  { icon: Heart, label: "Preventive", path: "/preventive" },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r"
      style={{ background: "#FFFFFF", borderColor: SKY_LINE }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b" style={{ borderColor: SKY_LINE }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-md"
            style={{ background: NAVY }}
          >
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight" style={{ color: NAVY }}>AP Health IQ</h1>
            <p className="text-[10px] text-slate-500 leading-tight">Andhra Pradesh · Govt. Health</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b" style={{ borderColor: SKY_LINE }}>
        <div
          className="flex items-center gap-2 rounded-md border px-3 py-2"
          style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            placeholder="Search patients..."
            className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Section header */}
      <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Navigation
      </p>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 ap-scroll overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
              )}
              style={
                isActive
                  ? { background: SKY, color: NAVY, fontWeight: 700 }
                  : { color: "#475569" }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#F4F8FC";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <item.icon className="h-4 w-4" style={isActive ? { color: NAVY } : undefined} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom profile */}
      <div className="m-3 mt-2 rounded-md border p-3" style={{ borderColor: SKY_LINE, background: "#F4F8FC" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: NAVY }}
          >
            VR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">Dr. Venkata Rao</p>
            <p className="text-[10px] text-slate-500 truncate">Medical Officer · PHC</p>
          </div>
          <button
            className="relative text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
              style={{ background: "#C62828" }}
            />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
