import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import HealthScore from "@/components/HealthScore";
import DetailModal, { DetailGrid, DetailSection, DetailRow } from "@/components/DetailModal";
import { toast } from "sonner";
import {
  Users, AlertTriangle, Activity, FileText, Mic, RefreshCw, TrendingUp, Clock, Heart,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY_LINE = "#90CAF9";

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

const pieColors = ["#0D47A1", "#1976D2", "#00695C", "#E65100", "#C62828"];

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

const chartTooltipStyle = {
  background: "#FFFFFF",
  border: `1px solid ${SKY_LINE}`,
  borderRadius: "8px",
  fontSize: "11px",
  color: "#0F172A",
  boxShadow: "0 4px 12px rgba(15,23,42,0.10)",
};

const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

const Dashboard = () => {
  const [detailKpi, setDetailKpi] = useState<null | "patients" | "alerts" | "followups" | "score">(null);
  const [detailAppt, setDetailAppt] = useState<typeof appointments[number] | null>(null);
  const [detailHigh, setDetailHigh] = useState<typeof highRiskPatients[number] | null>(null);
  const [detailPrev, setDetailPrev] = useState<typeof preventiveAlerts[number] | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Good Morning, Dr. Srinivasan</h1>
            <p className="text-sm text-slate-600">You have 12 appointments today · 3 critical alerts</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: Mic, label: "Voice Consult", primary: true },
              { icon: RefreshCw, label: "Repeat Rx", primary: false },
              { icon: FileText, label: "AI Summary", primary: false },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => toast.success(`${action.label} initiated successfully`)}
                className={action.primary ? "ap-btn-primary" : "ap-btn-secondary"}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Patients" value={12} subtitle="3 remaining" icon={Users} variant="primary" trend={{ value: "8%", positive: true }} onClick={() => setDetailKpi("patients")} />
          <StatCard title="Critical Alerts" value={3} subtitle="Needs attention" icon={AlertTriangle} variant="danger" onClick={() => setDetailKpi("alerts")} />
          <StatCard title="Follow-ups Due" value={7} subtitle="This week" icon={Clock} variant="warning" onClick={() => setDetailKpi("followups")} />
          <StatCard title="Health Score Avg" value="72" subtitle="Your patients" icon={Heart} variant="primary" trend={{ value: "3pts", positive: true }} onClick={() => setDetailKpi("score")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h2 className="font-semibold" style={{ color: NAVY }}>Today's Appointments</h2>
              <span className="ap-badge ap-badge-moderate">12 total</span>
            </div>
            <div className="divide-y">
              {appointments.map((apt, i) => (
                <button
                  key={apt.id}
                  onClick={() => setDetailAppt(apt)}
                  className="w-full text-left flex items-center gap-4 px-5 py-3.5 border-t hover:bg-blue-50"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                  title="Click for appointment details"
                >
                  <HealthScore score={apt.score} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{apt.name}</p>
                    <p className="text-xs text-slate-600">{apt.type}</p>
                  </div>
                  <RiskBadge level={apt.risk} />
                  <span className="text-sm font-medium text-slate-600">{apt.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h2 className="font-semibold" style={{ color: NAVY }}>High Risk Patients</h2>
              <RiskBadge level="critical" label="3 critical" />
            </div>
            <div className="divide-y">
              {highRiskPatients.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setDetailHigh(p)}
                  className="w-full text-left px-5 py-3.5 border-t hover:bg-blue-50"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                  title="Click for patient details"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-600">{p.condition}</p>
                    </div>
                    <HealthScore score={p.score} size="sm" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#C62828" }}>
                    <TrendingUp className="h-3 w-3 rotate-180" />
                    {p.trend}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-lg border bg-white p-5" style={cardStyle}>
            <h2 className="mb-4 font-semibold" style={{ color: NAVY }}>Patient Trends</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} stroke={SKY_LINE} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} stroke={SKY_LINE} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="patients" stroke={ELECTRIC} strokeWidth={2.5} dot={{ r: 4, fill: ELECTRIC }} />
                <Line type="monotone" dataKey="risk" stroke="#C62828" strokeWidth={2} dot={{ r: 3, fill: "#C62828" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <h2 className="mb-4 font-semibold" style={{ color: NAVY }}>Disease Distribution</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={diseaseData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} stroke="#FFFFFF">
                  {diseaseData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {diseaseData.slice(0, 3).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i] }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <span className="font-medium text-slate-900">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h2 className="font-semibold" style={{ color: NAVY }}>Preventive Care Alerts</h2>
              <Activity className="h-4 w-4" style={{ color: ELECTRIC }} />
            </div>
            <div className="divide-y">
              {preventiveAlerts.map((a, i) => (
                <button
                  key={a.alert}
                  onClick={() => setDetailPrev(a)}
                  className="w-full flex items-center justify-between px-5 py-3 border-t hover:bg-blue-50 text-left"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                  title="Click for alert details"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.patient}</p>
                    <p className="text-xs text-slate-600">{a.alert}</p>
                  </div>
                  <RiskBadge level={a.days === 0 ? "critical" : a.days <= 7 ? "high" : "moderate"} label={a.days === 0 ? "Due now" : `${a.days}d overdue`} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <h2 className="mb-4 font-semibold" style={{ color: NAVY }}>Frequent Diseases This Week</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={diseaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} stroke={SKY_LINE} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} stroke={SKY_LINE} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "#E3F2FD" }} />
                <Bar dataKey="count" fill={ELECTRIC} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── KPI Detail Modals ─── */}
      <DetailModal
        open={detailKpi === "patients"}
        onClose={() => setDetailKpi(null)}
        title="Today's Patients — 12 scheduled"
        subtitle="3 still remaining for today"
        icon={Users}
        size="lg"
      >
        <DetailGrid
          items={[
            { label: "Total Today", value: 12 },
            { label: "Completed", value: 9, accent: "#2E7D32" },
            { label: "Remaining", value: 3, accent: "#E65100" },
            { label: "Trend (wk)", value: "+8%", accent: "#2E7D32" },
          ]}
          cols={4}
        />
        <DetailSection title="Today's appointments">
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 rounded-md border bg-white p-3" style={{ borderColor: SKY_LINE }}>
                <HealthScore score={apt.score} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{apt.name}</p>
                  <p className="text-xs text-slate-600">{apt.type}</p>
                </div>
                <RiskBadge level={apt.risk} />
                <span className="text-xs font-medium text-slate-600">{apt.time}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      </DetailModal>

      <DetailModal
        open={detailKpi === "alerts"}
        onClose={() => setDetailKpi(null)}
        title="Critical Alerts — 3 active"
        subtitle="Patients requiring immediate attention"
        icon={AlertTriangle}
        accent="#C62828"
        size="lg"
      >
        <div className="space-y-3">
          {appointments.filter(a => a.risk === "critical").concat(highRiskPatients.map(h => ({ id: 0, name: h.name, time: "—", type: h.condition, risk: "critical" as const, score: h.score }))).map((p, i) => (
            <div key={i} className="rounded-md border p-4" style={{ background: "#FFEBEE", borderColor: "#FFCDD2" }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                <RiskBadge level="critical" />
              </div>
              <p className="text-xs text-slate-700">{p.type}</p>
              <p className="text-xs text-slate-600">Health score: {p.score}</p>
            </div>
          ))}
        </div>
      </DetailModal>

      <DetailModal
        open={detailKpi === "followups"}
        onClose={() => setDetailKpi(null)}
        title="Follow-ups Due — 7 this week"
        subtitle="Scheduled patient revisits"
        icon={Clock}
        accent="#E65100"
      >
        <div className="space-y-2">
          {appointments.filter(a => a.type === "Follow-up").concat(preventiveAlerts.map(p => ({ id: 0, name: p.patient, time: "—", type: p.alert, risk: (p.days === 0 ? "critical" : p.days <= 7 ? "high" : "moderate") as any, score: 75 }))).map((apt, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border bg-white p-3" style={{ borderColor: SKY_LINE }}>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{apt.name}</p>
                <p className="text-xs text-slate-600">{apt.type}</p>
              </div>
              <RiskBadge level={apt.risk as any} />
            </div>
          ))}
        </div>
      </DetailModal>

      <DetailModal
        open={detailKpi === "score"}
        onClose={() => setDetailKpi(null)}
        title="Average Health Score — 72"
        subtitle="Across all your patients · +3pts vs last week"
        icon={Heart}
        size="lg"
      >
        <DetailGrid
          items={[
            { label: "Average", value: 72, accent: "#1976D2" },
            { label: "Best", value: 89, accent: "#2E7D32" },
            { label: "Lowest", value: 34, accent: "#C62828" },
            { label: "Trend", value: "+3pts", accent: "#2E7D32" },
          ]}
          cols={4}
        />
        <DetailSection title="Patient health scores">
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 rounded-md border bg-white p-3" style={{ borderColor: SKY_LINE }}>
                <HealthScore score={apt.score} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{apt.name}</p>
                  <p className="text-xs text-slate-600">{apt.type}</p>
                </div>
                <RiskBadge level={apt.risk} />
              </div>
            ))}
          </div>
        </DetailSection>
      </DetailModal>

      {/* ─── Appointment row detail ─── */}
      <DetailModal
        open={!!detailAppt}
        onClose={() => setDetailAppt(null)}
        title={detailAppt?.name || ""}
        subtitle={`${detailAppt?.type || ""} · ${detailAppt?.time || ""}`}
        icon={Activity}
      >
        {detailAppt && (
          <>
            <div className="flex items-center justify-center mb-4">
              <HealthScore score={detailAppt.score} size="lg" />
            </div>
            <DetailGrid
              items={[
                { label: "Score", value: detailAppt.score, accent: detailAppt.score >= 80 ? "#2E7D32" : detailAppt.score >= 60 ? "#1976D2" : detailAppt.score >= 40 ? "#E65100" : "#C62828" },
                { label: "Risk Level", value: detailAppt.risk.toUpperCase() },
                { label: "Visit Type", value: detailAppt.type },
              ]}
            />
            <div className="mt-5 space-y-1">
              <DetailRow label="Patient" value={detailAppt.name} />
              <DetailRow label="Scheduled" value={detailAppt.time} />
              <DetailRow label="Risk" value={<RiskBadge level={detailAppt.risk} />} />
            </div>
          </>
        )}
      </DetailModal>

      {/* ─── High-risk patient detail ─── */}
      <DetailModal
        open={!!detailHigh}
        onClose={() => setDetailHigh(null)}
        title={detailHigh?.name || ""}
        subtitle={`High-risk patient · trend ${detailHigh?.trend || ""}`}
        icon={AlertTriangle}
        accent="#C62828"
      >
        {detailHigh && (
          <>
            <div className="flex items-center justify-center mb-4">
              <HealthScore score={detailHigh.score} size="lg" />
            </div>
            <DetailGrid
              items={[
                { label: "Health Score", value: detailHigh.score, accent: "#C62828" },
                { label: "Trend", value: detailHigh.trend.toUpperCase(), accent: detailHigh.trend === "declining" ? "#C62828" : "#E65100" },
                { label: "Severity", value: "Critical", accent: "#C62828" },
              ]}
            />
            <div className="mt-5 space-y-1">
              <DetailRow label="Condition" value={detailHigh.condition} />
              <DetailRow label="Trend direction" value={detailHigh.trend} />
            </div>
          </>
        )}
      </DetailModal>

      {/* ─── Preventive alert detail ─── */}
      <DetailModal
        open={!!detailPrev}
        onClose={() => setDetailPrev(null)}
        title={detailPrev?.patient || ""}
        subtitle="Preventive care alert"
        icon={Activity}
        accent={detailPrev?.days === 0 ? "#C62828" : (detailPrev?.days ?? 99) <= 7 ? "#E65100" : "#1976D2"}
      >
        {detailPrev && (
          <>
            <DetailGrid
              items={[
                { label: "Patient", value: detailPrev.patient },
                { label: "Days overdue", value: detailPrev.days, accent: detailPrev.days === 0 ? "#C62828" : "#E65100" },
                { label: "Status", value: detailPrev.days === 0 ? "Due now" : `${detailPrev.days}d overdue` },
              ]}
            />
            <DetailSection title="Recommended action">
              <p className="text-xs text-slate-700 leading-relaxed">{detailPrev.alert}</p>
            </DetailSection>
          </>
        )}
      </DetailModal>
    </AppLayout>
  );
};

export default Dashboard;
