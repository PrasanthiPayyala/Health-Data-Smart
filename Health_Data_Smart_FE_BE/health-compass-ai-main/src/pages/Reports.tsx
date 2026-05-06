import AppLayout from "@/components/AppLayout";
import RiskBadge from "@/components/RiskBadge";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Eye,
  Download,
  ChevronRight,
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
  ReferenceLine,
} from "recharts";

const reports = [
  { id: 1, name: "Complete Blood Count", date: "Feb 18, 2025", status: "critical", abnormals: 3 },
  { id: 2, name: "Renal Function Panel", date: "Feb 18, 2025", status: "critical", abnormals: 4 },
  { id: 3, name: "HbA1c Test", date: "Feb 18, 2025", status: "high", abnormals: 1 },
  { id: 4, name: "Lipid Panel", date: "Jan 20, 2025", status: "moderate", abnormals: 2 },
  { id: 5, name: "Liver Function Test", date: "Jan 20, 2025", status: "low", abnormals: 0 },
];

const extractedValues = [
  { name: "Creatinine", value: 2.8, unit: "mg/dL", range: "0.7-1.3", status: "critical" as const, trend: "up" },
  { name: "eGFR", value: 28, unit: "mL/min", range: ">60", status: "critical" as const, trend: "down" },
  { name: "BUN", value: 38, unit: "mg/dL", range: "7-20", status: "high" as const, trend: "up" },
  { name: "Potassium", value: 5.4, unit: "mEq/L", range: "3.5-5.0", status: "high" as const, trend: "up" },
  { name: "Sodium", value: 138, unit: "mEq/L", range: "136-145", status: "low" as const, trend: "stable" },
  { name: "Hemoglobin", value: 10.2, unit: "g/dL", range: "12-16", status: "high" as const, trend: "down" },
  { name: "WBC", value: 7.8, unit: "K/uL", range: "4.5-11.0", status: "low" as const, trend: "stable" },
  { name: "Platelets", value: 220, unit: "K/uL", range: "150-400", status: "low" as const, trend: "stable" },
];

const creatinineTrend = [
  { month: "Aug", value: 1.4 },
  { month: "Sep", value: 1.5 },
  { month: "Oct", value: 1.8 },
  { month: "Nov", value: 2.0 },
  { month: "Dec", value: 2.2 },
  { month: "Jan", value: 2.2 },
  { month: "Feb", value: 2.8 },
];

const hba1cTrend = [
  { month: "Aug", value: 7.8 },
  { month: "Sep", value: 7.9 },
  { month: "Oct", value: 8.1 },
  { month: "Nov", value: 8.4 },
  { month: "Dec", value: 8.6 },
  { month: "Jan", value: 8.8 },
  { month: "Feb", value: 9.2 },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(reports[1]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div {...fadeIn} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Report Analysis</h1>
            <p className="text-sm text-muted-foreground">AI-powered report extraction and analysis</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevated transition hover:opacity-90">
            <Upload className="h-4 w-4" />
            Upload Report
          </button>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {/* Report List */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="rounded-xl border bg-card shadow-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-card-foreground">Recent Reports</h2>
            </div>
            <div className="divide-y">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 ${
                    selectedReport.id === r.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.abnormals > 0 && (
                      <RiskBadge level={r.status as any} label={`${r.abnormals} abnormal`} />
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Extracted Values */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="col-span-2 space-y-4">
            {/* AI Summary */}
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Report Summary
              </h3>
              <div className="mt-3 rounded-lg bg-accent p-4 text-xs leading-relaxed text-accent-foreground">
                <p className="mb-2">
                  <strong>Critical Finding:</strong> Significant deterioration in renal function with creatinine rising
                  to 2.8 mg/dL and eGFR declining to 28 mL/min, indicating progression to CKD Stage 4.
                </p>
                <p>
                  <strong>Risk Signals:</strong> Hyperkalemia (K+ 5.4), anemia of chronic kidney disease (Hb 10.2),
                  and elevated BUN suggest uremic toxicity. Immediate nephrology consultation recommended.
                </p>
              </div>
            </div>

            {/* Structured Values */}
            <div className="rounded-xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h3 className="font-semibold text-card-foreground">Extracted Values</h3>
                <div className="flex gap-2">
                  <button className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-card-foreground hover:bg-secondary">
                    <Eye className="mr-1 inline h-3.5 w-3.5" /> View Original
                  </button>
                  <button className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-card-foreground hover:bg-secondary">
                    <Download className="mr-1 inline h-3.5 w-3.5" /> Export
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {extractedValues.map((v) => (
                  <div
                    key={v.name}
                    className={`flex items-center gap-4 px-5 py-3 ${
                      v.status === "critical" ? "bg-risk-critical/5" : v.status === "high" ? "bg-risk-high/5" : ""
                    }`}
                  >
                    <div className="w-28">
                      <p className="text-sm font-medium text-card-foreground">{v.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${
                          v.status === "critical"
                            ? "text-risk-critical"
                            : v.status === "high"
                            ? "text-risk-high"
                            : "text-card-foreground"
                        }`}
                      >
                        {v.value}
                      </span>
                      <span className="text-xs text-muted-foreground">{v.unit}</span>
                      {v.trend === "up" && <TrendingUp className="h-4 w-4 text-risk-critical" />}
                      {v.trend === "down" && <TrendingDown className="h-4 w-4 text-risk-high" />}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Ref: {v.range}</span>
                      <RiskBadge level={v.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h3 className="mb-1 text-sm font-semibold text-card-foreground">Creatinine Trend</h3>
                <p className="mb-3 text-xs text-risk-critical">↑ Worsening — above normal since Oct</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={creatinineTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" domain={[0, 4]} />
                    <Tooltip />
                    <ReferenceLine y={1.3} stroke="hsl(142, 71%, 40%)" strokeDasharray="5 5" label={{ value: "Normal max", fontSize: 9 }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(0, 72%, 56%)" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h3 className="mb-1 text-sm font-semibold text-card-foreground">HbA1c Trend</h3>
                <p className="mb-3 text-xs text-risk-high">↑ Uncontrolled — target &lt;7%</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={hba1cTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 12%, 52%)" domain={[6, 10]} />
                    <Tooltip />
                    <ReferenceLine y={7} stroke="hsl(142, 71%, 40%)" strokeDasharray="5 5" label={{ value: "Target", fontSize: 9 }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(38, 92%, 50%)" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;
