import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import StatCard from "@/components/StatCard";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  MapPin,
  TrendingUp,
  Shield,
  Activity,
  Thermometer,
  Bug,
  Zap,
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
  AreaChart,
  Area,
} from "recharts";

const weeklyTrend = [
  { week: "W1", fever: 185, cough: 142, hypertension: 38, gastric: 88 },
  { week: "W2", fever: 210, cough: 158, hypertension: 42, gastric: 96 },
  { week: "W3", fever: 198, cough: 172, hypertension: 45, gastric: 104 },
  { week: "W4", fever: 235, cough: 165, hypertension: 48, gastric: 98 },
  { week: "W5", fever: 268, cough: 148, hypertension: 52, gastric: 88 },
  { week: "W6", fever: 287, cough: 160, hypertension: 55, gastric: 94 },
];

const clinicDistribution = [
  { clinic: "East Godavari PHCs", cases: 166 },
  { clinic: "Visakhapatnam PHCs", cases: 160 },
  { clinic: "Vizianagaram PHCs", cases: 91 },
  { clinic: "KRISHNA PHCs", cases: 87 },
  { clinic: "Kurnool PHCs", cases: 74 },
];

const spikeAlerts = [
  { disease: "Fever (ILI)", region: "East Godavari – Rajanagaram Mandal", spike: "+165%", cases: 166, level: "critical" as const },
  { disease: "Cough / ARI", region: "Krishna – Machilipatnam Mandal", spike: "+108%", cases: 108, level: "high" as const },
  { disease: "Gastric / GI", region: "West Godavari – Tanuku Mandal", spike: "+62%", cases: 119, level: "moderate" as const },
];

const heatMapZones = [
  { zone: "East Godavari", risk: 91, diseases: ["Fever", "Cough"], pop: "5.1M" },
  { zone: "Krishna", risk: 88, diseases: ["Cough", "Fever"], pop: "4.5M" },
  { zone: "West Godavari", risk: 85, diseases: ["Gastric", "Cough"], pop: "3.9M" },
  { zone: "Visakhapatnam", risk: 78, diseases: ["Fever", "Allergy"], pop: "4.3M" },
  { zone: "Srikakulam", risk: 62, diseases: ["Fever", "Headache"], pop: "2.7M" },
];

const preventiveRecs = [
  { action: "Deploy rapid response teams to East Godavari – Rajanagaram Mandal for fever surveillance", urgency: "critical" as const, impact: "Early containment of ILI cluster" },
  { action: "Activate ARI monitoring at Krishna District PHCs and increase throat swab testing", urgency: "high" as const, impact: "~35% reduction in ARI spread" },
  { action: "Conduct water quality testing in West Godavari – Tanuku and Bhimavaram mandals", urgency: "high" as const, impact: "Prevent gastric outbreak escalation" },
  { action: "Launch community health awareness camps in Vizianagaram District on seasonal fever prevention", urgency: "moderate" as const, impact: "Long-term ILI reduction" },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const Outbreak = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Outbreak Analytics</h1>
            <p className="text-sm text-muted-foreground">Andhra Pradesh – Real-time disease surveillance and early warning system</p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border bg-card px-3 py-2 text-sm outline-none">
              <option>All Districts</option>
              <option>East Godavari</option>
              <option>Krishna</option>
              <option>West Godavari</option>
              <option>Visakhapatnam</option>
              <option>Guntur</option>
            </select>
            <select className="rounded-lg border bg-card px-3 py-2 text-sm outline-none">
              <option>Last 6 weeks</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
          <StatCard title="Active Alerts" value={3} subtitle="Fever, Cough, Gastric" icon={Bug} variant="danger" />
          <StatCard title="Total OPD Cases (6wk)" value={10045} icon={Activity} variant="primary" trend={{ value: "+18% vs prior period", positive: false }} />
          <StatCard title="Spike Alerts" value={3} subtitle="This week" icon={Zap} variant="warning" />
          <StatCard title="Districts Affected" value={13} subtitle="All AP districts" icon={MapPin} variant="default" />
        </motion.div>

        {/* Spike Alerts */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="rounded-xl border border-risk-critical/20 bg-risk-critical/5 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-risk-critical">
            <AlertTriangle className="h-5 w-5" />
            Disease Spike Alerts
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-4">
            {spikeAlerts.map((a) => (
              <div key={a.disease} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-card-foreground">{a.disease}</h4>
                  <RiskBadge level={a.level} label={a.spike} animate />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.region}</p>
                <p className="mt-2 text-lg font-bold text-card-foreground">{a.cases} <span className="text-xs font-normal text-muted-foreground">cases this week</span></p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {/* Weekly Trend */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="col-span-2 rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-card-foreground">Disease Trend (6 Weeks)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(210, 12%, 52%)" />
                <Tooltip />
                <Area type="monotone" dataKey="fever" stroke="hsl(0, 72%, 56%)" fill="hsl(0, 72%, 56%)" fillOpacity={0.1} strokeWidth={2.5} name="Fever / ILI" />
                <Area type="monotone" dataKey="cough" stroke="hsl(210, 90%, 56%)" fill="hsl(210, 90%, 56%)" fillOpacity={0.1} strokeWidth={2} name="Cough / ARI" />
                <Area type="monotone" dataKey="gastric" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.1} strokeWidth={2} name="Gastric / GI" />
                <Area type="monotone" dataKey="hypertension" stroke="hsl(262, 60%, 55%)" fill="hsl(262, 60%, 55%)" fillOpacity={0.1} strokeWidth={1.5} name="Hypertension" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Heat Zones */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold text-card-foreground">Risk Zones</h3>
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="divide-y">
              {heatMapZones.map((z) => (
                <div key={z.zone} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">{z.zone}</span>
                    <RiskBadge level={z.risk >= 80 ? "critical" : z.risk >= 60 ? "high" : z.risk >= 40 ? "moderate" : "low"} label={`${z.risk}%`} />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex gap-1">
                      {z.diseases.map((d) => (
                        <span key={d} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">{d}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Pop: {z.pop}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full ${z.risk >= 80 ? "bg-risk-critical" : z.risk >= 60 ? "bg-risk-high" : z.risk >= 40 ? "bg-risk-moderate" : "bg-risk-low"}`}
                      style={{ width: `${z.risk}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Clinic Distribution */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-card-foreground">District PHC-Level Fever Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clinicDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis type="category" dataKey="clinic" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" width={90} />
                <Tooltip />
                <Bar dataKey="cases" fill="hsl(174, 62%, 38%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Preventive Recommendations */}
          <motion.div {...fadeIn} transition={{ delay: 0.35 }} className="rounded-xl border bg-card shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-semibold text-card-foreground">Preventive Recommendations</h3>
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="divide-y">
              {preventiveRecs.map((r) => (
                <div key={r.action} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-card-foreground">{r.action}</p>
                    <RiskBadge level={r.urgency} />
                  </div>
                  <p className="mt-1 text-xs text-health-good">Impact: {r.impact}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Outbreak;
