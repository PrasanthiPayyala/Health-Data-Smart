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
  Settings,
  Bell,
  Search,
} from "lucide-react";
import HealthScore from "./HealthScore";

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
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-primary-foreground">AP Health IQ</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Andhra Pradesh · Govt. Health Platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2">
          <Search className="h-4 w-4 text-sidebar-foreground/50" />
          <input
            placeholder="Search patients..."
            className="flex-1 bg-transparent text-xs text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/40"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-primary">
            VS
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">Dr. Venkata Rao</p>
            <p className="text-[10px] text-sidebar-foreground/50">Medical Officer, PHC</p>
          </div>
          <button className="relative text-sidebar-foreground/50 hover:text-sidebar-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-risk-critical" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
