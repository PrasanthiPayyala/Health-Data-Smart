import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import HealthScore from "@/components/HealthScore";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import {
  Heart,
  Shield,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Apple,
  Footprints,
  Cigarette,
  Droplets,
  Brain,
  Activity,
} from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const screenings = [
  { name: "HbA1c Test", due: "Overdue by 15 days", status: "critical" as const, lastDone: "Nov 2024" },
  { name: "Retinal Screening", due: "Due in 5 days", status: "high" as const, lastDone: "Feb 2024" },
  { name: "Renal Ultrasound", due: "Due in 2 weeks", status: "moderate" as const, lastDone: "Aug 2024" },
  { name: "Lipid Panel", due: "Due next month", status: "low" as const, lastDone: "Jan 2025" },
  { name: "Flu Vaccination", due: "Annual - due now", status: "high" as const, lastDone: "Mar 2024" },
];

const careGaps = [
  { gap: "No diabetic foot exam in 18 months", severity: "high" as const },
  { gap: "Pneumococcal vaccine not given (age >50)", severity: "high" as const },
  { gap: "No dental checkup in 24 months", severity: "moderate" as const },
  { gap: "Bone density test not done (female, >55)", severity: "moderate" as const },
];

const preventionPlan = [
  { category: "Diabetes Management", tasks: ["Daily glucose monitoring", "Quarterly HbA1c", "Annual retinal exam", "Foot care education"], progress: 45 },
  { category: "Cardiovascular Prevention", tasks: ["BP monitoring 2x/day", "Statin therapy adherence", "Low sodium diet", "30min daily walk"], progress: 62 },
  { category: "Kidney Protection", tasks: ["ACR monitoring", "Avoid nephrotoxic drugs", "Adequate hydration", "Protein restriction"], progress: 38 },
];

const habitData = [
  { habit: "Daily Walking", target: "30 min", current: "12 min", progress: 40, icon: Footprints },
  { habit: "Water Intake", target: "2.5L", current: "1.8L", progress: 72, icon: Droplets },
  { habit: "Healthy Meals", target: "3/day", current: "2/day", progress: 67, icon: Apple },
  { habit: "Meditation", target: "15 min", current: "5 min", progress: 33, icon: Brain },
  { habit: "Sleep", target: "7-8h", current: "5.4h", progress: 72, icon: Clock },
];

const riskPredictions = [
  { risk: "5-Year Cardiovascular Risk", score: 28, level: "high" as const },
  { risk: "CKD Progression to Stage 5", score: 42, level: "critical" as const },
  { risk: "Diabetic Retinopathy", score: 35, level: "high" as const },
  { risk: "Peripheral Neuropathy", score: 55, level: "critical" as const },
];

const healthScoreHistory = [
  { month: "Sep", score: 58 },
  { month: "Oct", score: 55 },
  { month: "Nov", score: 48 },
  { month: "Dec", score: 45 },
  { month: "Jan", score: 40 },
  { month: "Feb", score: 34 },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const Preventive = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Preventive Healthcare</h1>
            <p className="text-sm text-muted-foreground">Priya Sharma · Personalized prevention & wellness plan</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Health Score</p>
              <HealthScore score={34} size="md" />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
          <StatCard title="Screenings Overdue" value={2} subtitle="Needs action" icon={Calendar} variant="danger" />
          <StatCard title="Care Gaps" value={4} subtitle="Identified" icon={AlertTriangle} variant="warning" />
          <StatCard title="Prevention Score" value="38%" subtitle="Below target" icon={Shield} variant="warning" trend={{ value: "−8% this quarter", positive: false }} />
          <StatCard title="Habits Tracked" value={5} subtitle="2 on target" icon={Target} variant="primary" />
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {/* Screening Reminders */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="col-span-2 rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold text-card-foreground">Screening Reminders</h3>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="divide-y">
              {screenings.map((s) => (
                <div key={s.name} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.status === "critical" ? "bg-risk-critical/10" : s.status === "high" ? "bg-risk-high/10" : "bg-secondary"
                      }`}>
                      <Activity className={`h-4 w-4 ${s.status === "critical" ? "text-risk-critical" : s.status === "high" ? "text-risk-high" : "text-muted-foreground"
                        }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">Last: {s.lastDone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskBadge level={s.status} label={s.due} />
                    <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                      Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Care Gap Detection */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold text-card-foreground">Care Gap Detection</h3>
              <AlertTriangle className="h-4 w-4 text-risk-high" />
            </div>
            <div className="divide-y">
              {careGaps.map((g) => (
                <div key={g.gap} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${g.severity === "high" ? "bg-risk-high" : "bg-risk-moderate"}`} />
                  <div>
                    <p className="text-sm text-card-foreground">{g.gap}</p>
                    <RiskBadge level={g.severity} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Prevention Plan */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="col-span-2 rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Personalized Prevention Plan
            </h3>
            <div className="space-y-5">
              {preventionPlan.map((p) => (
                <div key={p.category}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-card-foreground">{p.category}</h4>
                    <span className={`text-xs font-semibold ${p.progress >= 60 ? "text-health-good" : p.progress >= 40 ? "text-health-fair" : "text-health-poor"}`}>
                      {p.progress}% complete
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${p.progress >= 60 ? "bg-health-good" : p.progress >= 40 ? "bg-health-fair" : "bg-health-poor"}`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.tasks.map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Health Score Trend */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-1 font-semibold text-card-foreground">Health Score Trend</h3>
            <p className="mb-4 text-xs text-risk-critical">↓ Declining — needs intervention</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={healthScoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(0, 72%, 56%)" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Habit Coaching */}
          <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
              <Target className="h-4 w-4 text-primary" />
              Habit Coaching Progress
            </h3>
            <div className="space-y-4">
              {habitData.map((h) => (
                <div key={h.habit} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <h.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground">{h.habit}</span>
                      <span className="text-xs text-muted-foreground">{h.current} / {h.target}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all ${h.progress >= 70 ? "bg-health-good" : h.progress >= 50 ? "bg-health-fair" : "bg-health-poor"}`}
                        style={{ width: `${h.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk Prediction */}
          <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
              <Brain className="h-4 w-4 text-primary" />
              Risk Prediction Cards
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {riskPredictions.map((r) => (
                <div
                  key={r.risk}
                  className={`rounded-xl border p-4 ${r.level === "critical" ? "border-risk-critical/30 bg-risk-critical/5" : "border-risk-high/20 bg-risk-high/5"
                    }`}
                >
                  <p className="text-xs font-medium text-card-foreground">{r.risk}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <span className={`text-2xl font-bold ${r.level === "critical" ? "text-risk-critical" : "text-risk-high"}`}>
                      {r.score}%
                    </span>
                    <RiskBadge level={r.level} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Preventive;
