import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import HealthScore from "@/components/HealthScore";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  AlertTriangle,
  Activity,
  Stethoscope,
  FileText,
  Mic,
  RefreshCw,
  TrendingUp,
  Clock,
  Heart,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";

const trendData = [
  { day: "Mon", patients: 28, risk: 3 },
  { day: "Tue", patients: 35, risk: 5 },
  { day: "Wed", patients: 42, risk: 4 },
  { day: "Thu", patients: 31, risk: 6 },
  { day: "Fri", patients: 38, risk: 2 },
  { day: "Sat", patients: 22, risk: 3 },
  { day: "Sun", patients: 15, risk: 1 },
];

const diseaseData = [
  { name: "Hypertension", count: 45 },
  { name: "Diabetes", count: 38 },
  { name: "COPD", count: 22 },
  { name: "Cardiac", count: 18 },
  { name: "Renal", count: 12 },
];

const pieColors = [
  "hsl(174, 62%, 38%)",
  "hsl(210, 90%, 56%)",
  "hsl(262, 60%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 56%)",
];

const appointments = [
  { id: 1, name: "Kavita Reddy", time: "09:00 AM", type: "Follow-up", risk: "high" as const, score: 62 },
  { id: 2, name: "Arjun Mehta", time: "09:30 AM", type: "New Visit", risk: "moderate" as const, score: 78 },
  { id: 3, name: "Priya Sharma", time: "10:00 AM", type: "Lab Review", risk: "critical" as const, score: 34 },
  { id: 4, name: "Rajesh Verma", time: "10:30 AM", type: "Chronic Care", risk: "low" as const, score: 89 },
  { id: 5, name: "Sneha Iyer", time: "11:00 AM", type: "Follow-up", risk: "moderate" as const, score: 71 },
];

const highRiskPatients = [
  { name: "Priya Sharma", condition: "Acute Renal Failure", score: 34, trend: "declining" },
  { name: "Vikram Desai", condition: "Uncontrolled DM", score: 41, trend: "stable" },
  { name: "Anjali Nair", condition: "Heart Failure", score: 45, trend: "declining" },
];

const preventiveAlerts = [
  { patient: "R. Verma", alert: "HbA1c screening overdue", days: 15 },
  { patient: "A. Mehta", alert: "Annual eye exam due", days: 5 },
  { patient: "K. Reddy", alert: "Flu vaccination recommended", days: 0 },
];

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good Morning, Dr. Srinivasan</h1>
            <p className="text-sm text-muted-foreground">You have 12 appointments today · 3 critical alerts</p>
          </div>
          <div className="flex gap-2">
            {[
              { icon: Mic, label: "Voice Consult", primary: true },
              { icon: RefreshCw, label: "Repeat Rx", primary: false },
              { icon: FileText, label: "AI Summary", primary: false },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => toast.success(`${action.label} initiated successfully`)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${action.primary
                  ? "gradient-primary text-primary-foreground shadow-elevated hover:opacity-90"
                  : "border bg-card text-card-foreground hover:bg-secondary"
                  }`}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
          <StatCard title="Today's Patients" value={12} subtitle="3 remaining" icon={Users} variant="primary" trend={{ value: "8% vs last week", positive: true }} />
          <StatCard title="Critical Alerts" value={3} subtitle="Needs attention" icon={AlertTriangle} variant="danger" />
          <StatCard title="Follow-ups Due" value={7} subtitle="This week" icon={Clock} variant="warning" />
          <StatCard title="Health Score Avg" value="72" subtitle="Your patients" icon={Heart} variant="primary" trend={{ value: "3pts improvement", positive: true }} />
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Appointments */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="col-span-2 rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold text-card-foreground">Today's Appointments</h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">12 total</span>
            </div>
            <div className="divide-y">
              {appointments.map((apt) => (
                <Link
                  to="/patient/1"
                  key={apt.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <HealthScore score={apt.score} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{apt.name}</p>
                    <p className="text-xs text-muted-foreground">{apt.type}</p>
                  </div>
                  <RiskBadge level={apt.risk} />
                  <span className="text-sm font-medium text-muted-foreground">{apt.time}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* High Risk Patients */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold text-card-foreground">High Risk Patients</h2>
              <RiskBadge level="critical" label="3 critical" animate />
            </div>
            <div className="divide-y">
              {highRiskPatients.map((p) => (
                <div key={p.name} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.condition}</p>
                    </div>
                    <HealthScore score={p.score} size="sm" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-risk-critical">
                    <TrendingUp className="h-3 w-3 rotate-180" />
                    {p.trend}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Patient Trend */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="col-span-2 rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold text-card-foreground">Patient Trends</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 52%)" />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="hsl(174, 62%, 38%)" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="risk" stroke="hsl(0, 72%, 56%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Disease Distribution */}
          <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold text-card-foreground">Disease Distribution</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={diseaseData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {diseaseData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {diseaseData.slice(0, 3).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium text-card-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Preventive Alerts */}
          <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold text-card-foreground">Preventive Care Alerts</h2>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="divide-y">
              {preventiveAlerts.map((a) => (
                <div key={a.alert} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{a.patient}</p>
                    <p className="text-xs text-muted-foreground">{a.alert}</p>
                  </div>
                  <RiskBadge level={a.days === 0 ? "critical" : a.days <= 7 ? "high" : "moderate"} label={a.days === 0 ? "Due now" : `${a.days}d overdue`} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Disease frequency */}
          <motion.div {...fadeIn} transition={{ delay: 0.45 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="mb-4 font-semibold text-card-foreground">Frequent Diseases This Week</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={diseaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 52%)" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(174, 62%, 38%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
