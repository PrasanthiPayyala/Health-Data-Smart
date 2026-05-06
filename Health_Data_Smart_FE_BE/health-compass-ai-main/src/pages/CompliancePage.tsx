import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ArrowLeft, CheckCircle, FileText, Lock,
  Award, LogOut, Activity, Clock,
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import PilotRolloutCard from "@/components/PilotRolloutCard";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

export default function CompliancePage() {
  const navigate = useNavigate();
  const [auditLog, setAuditLog] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [rbac, setRbac] = useState<any>(null);
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/compliance/audit-log?limit=50`).then(r => r.json()),
      fetch(`${API}/api/compliance/checklist`).then(r => r.json()),
      fetch(`${API}/api/compliance/rbac`).then(r => r.json()),
    ]).then(([log, chk, rb]) => {
      setAuditLog(log); setChecklist(chk); setRbac(rb);
    });
  }, []);

  const refreshAuditLog = () => {
    const params = new URLSearchParams({ limit: "50" });
    if (filterRole) params.set("role", filterRole);
    if (filterAction) params.set("action", filterAction);
    fetch(`${API}/api/compliance/audit-log?${params}`).then(r => r.json()).then(setAuditLog);
  };

  useEffect(() => { refreshAuditLog(); }, [filterRole, filterAction]);

  const actionBadge = (a: string) => {
    if (a === "read") return "ap-badge-moderate";
    if (a === "write") return "ap-badge-low";
    if (a === "delete") return "ap-badge-critical";
    if (a === "export") return "ap-badge-amber";
    return "ap-badge-info";
  };

  const roleBadge = (r: string) => {
    if (r === "state") return "ap-badge-info";
    if (r === "district") return "ap-badge-moderate";
    if (r === "chc") return "ap-badge-info";
    if (r === "phc") return "ap-badge-low";
    if (r === "field") return "ap-badge-amber";
    return "ap-badge-info";
  };

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/state-dashboard")} className="ap-btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>DPDP Compliance Dashboard</h1>
              <p className="text-[10px] text-slate-500">Digital Personal Data Protection Act 2023 — Govt of India</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><LogOut className="h-3.5 w-3.5 inline mr-1" /> Exit</button>
          </div>
        </div>
      </header>

      <main className="w-full px-8 py-6 space-y-6">
        {checklist && (
          <div className="rounded-lg border p-6" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-md" style={{ background: "#2E7D32" }}>
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2E7D32" }}>Compliance Score</p>
                  <h2 className="text-3xl font-extrabold" style={{ color: "#1B5E20" }}>{checklist.compliance_score}%</h2>
                  <p className="text-xs text-slate-700">{checklist.framework}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Audited</p>
                <p className="text-sm font-bold text-slate-900">{checklist.last_audited}</p>
                <span className="ap-badge ap-badge-low mt-1">
                  <CheckCircle className="h-3 w-3" /> Fully Compliant
                </span>
              </div>
            </div>
          </div>
        )}

        {checklist && (
          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: NAVY }} />
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>DPDP Principles — Status &amp; Evidence</h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {checklist.principles.map((p: any, i: number) => (
                <div key={i} className="rounded-md border p-4" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{p.principle}</h3>
                    <span className="ap-badge ap-badge-low flex-shrink-0">
                      <CheckCircle className="h-2.5 w-2.5" /> {p.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{p.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {auditLog && (
          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center gap-2 border-b px-6 py-4 flex-wrap" style={{ borderColor: SKY_LINE }}>
              <Activity className="h-4 w-4" style={{ color: "#6A1B9A" }} />
              <div>
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>Audit Log — All PII Access Events</h2>
                <p className="text-[10px] text-slate-500">Total events recorded: {auditLog.total} · Showing latest {auditLog.events?.length || 0}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="rounded-md border px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
                  <option value="">All Roles</option>
                  <option value="state">State</option>
                  <option value="district">District</option>
                  <option value="chc">CHC</option>
                  <option value="phc">PHC</option>
                  <option value="field">Field</option>
                </select>
                <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="rounded-md border px-2 py-1 text-[11px] font-semibold text-slate-800 outline-none" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
                  <option value="">All Actions</option>
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="export">Export</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto ap-scroll">
              <table className="w-full text-xs">
                <thead style={{ background: SKY }}>
                  <tr>
                    {["When", "Role", "Action", "Resource", "Endpoint", "IP"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.events?.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No events match this filter</td></tr>
                  )}
                  {auditLog.events?.map((e: any, i: number) => (
                    <tr key={e.id} className="border-t" style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                      <td className="px-5 py-2.5 text-[11px] text-slate-700">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(e.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </td>
                      <td className="px-5 py-2.5"><span className={`ap-badge ${roleBadge(e.user_role)}`}>{e.user_role}</span></td>
                      <td className="px-5 py-2.5"><span className={`ap-badge ${actionBadge(e.action)}`}>{e.action}</span></td>
                      <td className="px-5 py-2.5">
                        <p className="font-bold text-slate-900">{e.resource_type}</p>
                        {e.resource_id && <p className="text-[10px] text-slate-500">{e.resource_id}</p>}
                      </td>
                      <td className="px-5 py-2.5 font-mono text-[10px] text-slate-700">{e.endpoint || "—"}</td>
                      <td className="px-5 py-2.5 font-mono text-[10px] text-slate-500">{e.ip_address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rbac && rbac.matrix && (
          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4" style={{ color: "#C62828" }} />
              <div>
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>Role-Based Access Control (RBAC) Matrix</h2>
                <p className="text-[10px] text-slate-500">Who can access what — Principle of Least Privilege enforced at API and UI layers</p>
              </div>
            </div>
            <div className="overflow-x-auto ap-scroll">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ background: NAVY }} className="text-white">
                    {rbac.matrix[0].map((h: string, i: number) => (
                      <th key={i} className="px-3 py-2.5 font-bold text-center" style={i === 0 ? { textAlign: "left" } : {}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rbac.matrix.slice(1).map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx} className="border-t" style={{ background: rowIdx % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                      {row.map((cell: string, cellIdx: number) => (
                        <td key={cellIdx} className={`px-3 py-2 ${cellIdx === 0 ? "font-bold text-slate-900" : "text-center"}`}>
                          {cellIdx === 0 ? cell : (
                            cell === "R/W" ? <span className="ap-badge ap-badge-low">{cell}</span> :
                            cell === "READ" ? <span className="ap-badge ap-badge-moderate">{cell}</span> :
                            <span className="text-slate-400">{cell}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-700 flex-wrap">
              {Object.entries(rbac.legend).map(([k, v]: any) => (
                <span key={k}><span className="font-bold text-slate-900">{k}</span> = {v}</span>
              ))}
            </div>
          </div>
        )}

        <PilotRolloutCard compact />
      </main>
    </div>
  );
}
