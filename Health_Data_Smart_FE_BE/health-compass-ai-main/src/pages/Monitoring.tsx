import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import {
  Heart,
  Droplets,
  Weight,
  Wind,
  Moon,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Pill,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

const bpData = [
  { date: "Feb 14", systolic: 145, diastolic: 92 },
  { date: "Feb 15", systolic: 180, diastolic: 110 },
  { date: "Feb 16", systolic: 165, diastolic: 100 },
  { date: "Feb 17", systolic: 155, diastolic: 95 },
  { date: "Feb 18", systolic: 150, diastolic: 92 },
  { date: "Feb 19", systolic: 148, diastolic: 90 },
  { date: "Feb 20", systolic: 142, diastolic: 88 },
];

const sugarData = [
  { date: "Feb 14", fasting: 165, post: 245 },
  { date: "Feb 15", fasting: 178, post: 268 },
  { date: "Feb 16", fasting: 172, post: 255 },
  { date: "Feb 17", fasting: 168, post: 240 },
  { date: "Feb 18", fasting: 160, post: 235 },
  { date: "Feb 19", fasting: 155, post: 228 },
  { date: "Feb 20", fasting: 152, post: 220 },
];

const oxygenData = [
  { date: "Feb 14", spo2: 95 },
  { date: "Feb 15", spo2: 92 },
  { date: "Feb 16", spo2: 93 },
  { date: "Feb 17", spo2: 94 },
  { date: "Feb 18", spo2: 95 },
  { date: "Feb 19", spo2: 96 },
  { date: "Feb 20", spo2: 95 },
];

const sleepData = [
  { date: "Mon", deep: 1.5, light: 3, rem: 1.2 },
  { date: "Tue", deep: 1.2, light: 3.5, rem: 0.8 },
  { date: "Wed", deep: 1.8, light: 2.8, rem: 1.5 },
  { date: "Thu", deep: 1.0, light: 4.0, rem: 0.7 },
  { date: "Fri", deep: 1.6, light: 3.2, rem: 1.3 },
  { date: "Sat", deep: 2.0, light: 3.5, rem: 1.8 },
  { date: "Sun", deep: 1.4, light: 3.0, rem: 1.0 },
];

const adherenceData = [
  { med: "Metformin", adherence: 92 },
  { med: "Amlodipine", adherence: 85 },
  { med: "Losartan", adherence: 78 },
  { med: "Aspirin", adherence: 95 },
  { med: "Statin", adherence: 70 },
];

const alerts = [
  { time: "Today 2:30 AM", message: "SpO2 dropped to 92% for 15 minutes", level: "high" as const },
  { time: "Yesterday", message: "BP spike: 180/110 mmHg detected", level: "critical" as const },
  { time: "Feb 17", message: "Post-meal glucose >250 mg/dL", level: "high" as const },
  { time: "Feb 16", message: "Missed evening Losartan dose", level: "moderate" as const },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const Monitoring = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Remote Patient Monitoring</h1>
            <p className="text-sm text-muted-foreground">Priya Sharma · Real-time vitals tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-health-good/15 px-4 py-2 text-sm font-medium text-health-good">
              <span className="h-2 w-2 animate-pulse-gentle rounded-full bg-health-good" />
              Connected
            </div>
            <select className="rounded-lg border bg-card px-3 py-2 text-sm outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-5 gap-4">
          <StatCard title="Blood Pressure" value="142/88" subtitle="mmHg" icon={Heart} variant="warning" trend={{ value: "Improving", positive: true }} />
          <StatCard title="Blood Sugar" value="152" subtitle="mg/dL fasting" icon={Droplets} variant="warning" trend={{ value: "Slowly improving", positive: true }} />
          <StatCard title="Weight" value="78.2" subtitle="kg" icon={Weight} variant="default" trend={{ value: "−0.5 kg/wk", positive: true }} />
          <StatCard title="SpO2" value="95%" subtitle="Oxygen" icon={Wind} variant="primary" />
          <StatCard title="Sleep" value="5.4h" subtitle="avg/night" icon={Moon} variant="danger" trend={{ value: "Below target", positive: false }} />
        </motion.div>

        {/* Vital Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* BP Trend */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">Blood Pressure Trend</h3>
              <RiskBadge level="moderate" label="Improving" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={bpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" domain={[60, 200]} />
                <Tooltip />
                <ReferenceLine y={140} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" />
                <ReferenceLine y={90} stroke="hsl(38, 92%, 50%)" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="systolic" stroke="hsl(0, 72%, 56%)" strokeWidth={2.5} name="Systolic" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="diastolic" stroke="hsl(210, 90%, 56%)" strokeWidth={2} name="Diastolic" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Sugar Trend */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">Blood Sugar Trend</h3>
              <RiskBadge level="high" label="Above target" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sugarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" domain={[80, 300]} />
                <Tooltip />
                <ReferenceLine y={126} stroke="hsl(142, 71%, 40%)" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="fasting" stroke="hsl(262, 60%, 55%)" strokeWidth={2.5} name="Fasting" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="post" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Post-meal" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* SpO2 */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">Oxygen Saturation</h3>
              <RiskBadge level="low" label="Normal range" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={oxygenData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" domain={[88, 100]} />
                <Tooltip />
                <ReferenceLine y={95} stroke="hsl(142, 71%, 40%)" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="spo2" stroke="hsl(174, 62%, 38%)" fill="hsl(174, 62%, 38%)" fillOpacity={0.15} strokeWidth={2.5} name="SpO2 %" dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Sleep */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-card-foreground">Sleep Pattern</h3>
              <RiskBadge level="high" label="Poor quality" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <Tooltip />
                <Bar dataKey="deep" stackId="a" fill="hsl(210, 90%, 56%)" name="Deep" radius={[0, 0, 0, 0]} />
                <Bar dataKey="light" stackId="a" fill="hsl(210, 90%, 80%)" name="Light" />
                <Bar dataKey="rem" stackId="a" fill="hsl(262, 60%, 55%)" name="REM" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Alerts */}
          <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold text-card-foreground">Abnormal Alerts</h3>
              <Bell className="h-4 w-4 text-risk-critical" />
            </div>
            <div className="divide-y">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.level === "critical" ? "text-risk-critical" : a.level === "high" ? "text-risk-high" : "text-risk-moderate"}`} />
                  <div className="flex-1">
                    <p className="text-sm text-card-foreground">{a.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                  </div>
                  <RiskBadge level={a.level} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Medication Adherence */}
          <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
              <Pill className="h-4 w-4 text-medical-purple" />
              Medication Adherence
            </h3>
            <div className="space-y-3">
              {adherenceData.map((m) => (
                <div key={m.med}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-card-foreground">{m.med}</span>
                    <span className={`font-semibold ${m.adherence >= 90 ? "text-health-excellent" : m.adherence >= 80 ? "text-health-fair" : "text-risk-high"}`}>
                      {m.adherence}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${m.adherence >= 90 ? "bg-health-excellent" : m.adherence >= 80 ? "bg-health-fair" : "bg-risk-high"}`}
                      style={{ width: `${m.adherence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Relapse Prediction */}
          <motion.div {...fadeIn} transition={{ delay: 0.45 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Risk Prediction
            </h3>
            <div className="space-y-4">
              {[
                { label: "30-day Hospitalization", risk: 35, level: "high" as const },
                { label: "CKD Progression", risk: 72, level: "critical" as const },
                { label: "Cardiac Event", risk: 28, level: "moderate" as const },
                { label: "Hypoglycemia Episode", risk: 18, level: "low" as const },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-card-foreground">{r.label}</span>
                    <RiskBadge level={r.level} label={`${r.risk}%`} />
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${r.level === "critical" ? "bg-risk-critical" : r.level === "high" ? "bg-risk-high" : r.level === "moderate" ? "bg-risk-moderate" : "bg-risk-low"
                        }`}
                      style={{ width: `${r.risk}%` }}
                    />
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

export default Monitoring;
