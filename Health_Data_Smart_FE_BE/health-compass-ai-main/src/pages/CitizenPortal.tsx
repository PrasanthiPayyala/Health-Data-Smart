import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Heart, ArrowLeft, Search, MapPin, AlertTriangle, Hospital,
  Shield, LogOut, Clock, CheckCircle, ExternalLink, FileSearch,
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import DetailModal, { DetailGrid, DetailSection, DetailRow } from "@/components/DetailModal";
import { Activity } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

export default function CitizenPortal() {
  const navigate = useNavigate();
  const { t, td, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [phcLoad, setPhcLoad] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [sampleIds, setSampleIds] = useState<string[]>([]);

  const [patientId, setPatientId] = useState("");
  const [myRecord, setMyRecord] = useState<any>(null);
  const [recordError, setRecordError] = useState("");
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [detailAlert, setDetailAlert] = useState<any | null>(null);
  const [detailPhc, setDetailPhc] = useState<any | null>(null);
  const [detailScreening, setDetailScreening] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API}/api/districts/all`).then(r => r.json()).then(d => {
      const all = d.districts || [];
      setDistricts(all);
      const firstLive = all.find((x: any) => x.cases > 0) || all[0];
      if (firstLive) setSelectedDistrict(firstLive.district_upper);
    });
    fetch(`${API}/api/public/sample-patient-ids`).then(r => r.json()).then(d => setSampleIds(d.sample_ids || []));
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    Promise.all([
      fetch(`${API}/api/public/alerts?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
      fetch(`${API}/api/public/phc-load?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
      fetch(`${API}/api/public/screenings?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
    ]).then(([a, p, s]) => {
      setAlerts(a.alerts || []);
      setPhcLoad(p.phcs || []);
      setScreenings(s.screenings || []);
    });
  }, [selectedDistrict]);

  const lookupRecord = async () => {
    if (!patientId.trim()) return;
    setLoadingRecord(true); setRecordError(""); setMyRecord(null);
    try {
      const res = await fetch(`${API}/api/public/my-record/${encodeURIComponent(patientId.trim())}`);
      if (!res.ok) {
        setRecordError(t("citizen_no_record"));
      } else {
        const data = await res.json();
        setMyRecord(data);
        toast.success(`Found ${data.total_visits} ${t("citizen_visits_found")}`);
      }
    } catch {
      setRecordError("Service temporarily unavailable.");
    }
    setLoadingRecord(false);
  };

  const districtInfo = districts.find(d => d.district_upper === selectedDistrict);

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Heart className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>{t("citizen_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("citizen_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
              {districts.map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
            </select>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><LogOut className="h-3.5 w-3.5 inline mr-1" /> {t("exit")}</button>
          </div>
        </div>
      </header>

      {/* Hero strip — full width */}
      <section className="w-full px-8 py-12" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${ELECTRIC} 100%)` }}>
        <div dir={isRTL ? "rtl" : "ltr"} className="text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#BBDEFB" }}>{t("citizen_namaste")}</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold">{t("citizen_hero")}</h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "#E3F2FD" }}>{t("citizen_hero_sub")}</p>
          {districtInfo && (
            <div className="mt-5 flex flex-wrap gap-3 text-xs justify-center">
              <span className="rounded-full px-3 py-1.5 font-semibold border" style={{ background: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.30)", color: "#FFFFFF" }}>
                <MapPin className="mr-1 inline h-3 w-3" /> {districtInfo.district}, {districtInfo.region}
              </span>
              <span className="rounded-full px-3 py-1.5 font-semibold border" style={{ background: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.30)", color: "#FFFFFF" }}>
                {districtInfo.cases.toLocaleString()} OPD cases tracked
              </span>
              <span className="rounded-full px-3 py-1.5 font-semibold border" style={{ background: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.30)", color: "#FFFFFF" }}>
                {districtInfo.mandals} mandals
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="w-full px-8 py-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: SKY_LINE }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#E65100" }} />
              <div>
                <h3 className="text-sm font-bold" style={{ color: NAVY }}>{t("citizen_alerts_title")}</h3>
                <p className="text-[10px] text-slate-500">{t("citizen_alerts_subtitle")}</p>
              </div>
              <span className="ap-badge ap-badge-amber ml-auto">{alerts.length} active</span>
            </div>
            <div className="divide-y max-h-[420px] overflow-y-auto ap-scroll">
              {alerts.length === 0 && <p className="px-6 py-8 text-center text-xs text-slate-500">{t("citizen_no_alerts")}</p>}
              {alerts.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setDetailAlert(a)}
                  className="w-full text-left px-6 py-4 border-t hover:bg-blue-50"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                  title="Click for alert details"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{td(a.disease)}</span>
                        <span className={`ap-badge ${a.severity === "critical" ? "ap-badge-critical" : a.severity === "high" ? "ap-badge-high" : "ap-badge-moderate"}`}>
                          {a.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{a.mandal} Mandal · {a.case_count} reported cases</p>
                      <p className="text-xs text-slate-700 rounded-md px-3 py-2 border" style={{ background: SKY, borderColor: SKY_LINE }}>{a.advisory}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center gap-2 border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <CheckCircle className="h-4 w-4" style={{ color: "#2E7D32" }} />
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>{t("citizen_screenings")}</h3>
            </div>
            <div className="divide-y max-h-[420px] overflow-y-auto ap-scroll">
              {screenings.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setDetailScreening(s)}
                  className="w-full text-left px-5 py-3 border-t hover:bg-blue-50"
                  style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                  title="Click for screening details"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{s.name}</span>
                    <span className={`ap-badge ${s.category === "NCD" ? "ap-badge-moderate" : s.category === "Communicable" ? "ap-badge-critical" : s.category === "Maternal" ? "ap-badge-info" : "ap-badge-info"}`}>
                      {s.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">{s.reason}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.frequency}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.where}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
          <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: SKY_LINE }}>
            <Hospital className="h-4 w-4" style={{ color: ELECTRIC }} />
            <div>
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>{t("citizen_phc_load")}</h3>
              <p className="text-[10px] text-slate-500">{t("citizen_phc_subtitle")}</p>
            </div>
          </div>
          <div className="overflow-x-auto ap-scroll">
            <table className="w-full">
              <thead style={{ background: SKY }}>
                <tr>
                  {["PHC / Facility", "Current Load", "Estimated Wait", "Action"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phcLoad.slice(0, 10).map((p, i) => {
                  const loadCls = p.load_pct >= 80 ? "danger" : p.load_pct >= 50 ? "warning" : "success";
                  const textColor = p.load_pct >= 80 ? "#C62828" : p.load_pct >= 50 ? "#E65100" : "#2E7D32";
                  return (
                    <tr
                      key={p.phc_code}
                      className="border-t cursor-pointer hover:bg-blue-50"
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                      onClick={() => setDetailPhc(p)}
                      title="Click for PHC load details"
                    >
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-800">{p.facility_name}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`ap-progress ${loadCls}`} style={{ width: 96, height: 6 }}>
                            <div className="bar" style={{ width: `${p.load_pct}%` }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: textColor }}>{p.load_label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-700">
                        <Clock className="mr-1 inline h-3 w-3 text-slate-400" />~{p.estimated_wait_min} minutes
                      </td>
                      <td className="px-6 py-3.5">
                        <button className="ap-btn-secondary px-2.5 py-1.5 text-[10px]">
                          <ExternalLink className="h-3 w-3" /> Get Directions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
          <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: SKY_LINE }}>
            <FileSearch className="h-4 w-4" style={{ color: "#6A1B9A" }} />
            <div>
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>{t("citizen_my_record")}</h3>
              <p className="text-[10px] text-slate-500">{t("citizen_my_record_sub")}</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-3 flex-wrap">
              <input
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupRecord()}
                placeholder={t("citizen_id_placeholder")}
                className="flex-1 min-w-[200px] rounded-md border px-4 py-2.5 text-sm text-slate-900 outline-none"
                style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
              />
              <button
                onClick={lookupRecord}
                disabled={loadingRecord || !patientId.trim()}
                className="ap-btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {loadingRecord ? t("citizen_searching") : t("citizen_find_record")}
              </button>
            </div>

            {sampleIds.length > 0 && !myRecord && !recordError && (
              <div className="rounded-md p-3 text-xs text-slate-700 border" style={{ background: SKY, borderColor: SKY_LINE }}>
                <p className="font-semibold mb-1.5" style={{ color: NAVY }}>{t("citizen_try_samples")}</p>
                <div className="flex flex-wrap gap-2">
                  {sampleIds.map(id => (
                    <button key={id} onClick={() => setPatientId(id)} className="rounded border bg-white px-2 py-1 font-mono text-[11px]" style={{ borderColor: SKY_LINE, color: NAVY }}>
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recordError && (
              <div className="rounded-md border p-3 text-xs" style={{ background: "#FFEBEE", borderColor: "#FFCDD2", color: "#C62828" }}>{recordError}</div>
            )}

            {myRecord && (
              <div className="space-y-3">
                <div className="rounded-md border p-4" style={{ background: "#F3E5F5", borderColor: "#CE93D8" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4" style={{ color: "#6A1B9A" }} />
                    <p className="text-xs font-bold" style={{ color: "#4A148C" }}>Found {myRecord.total_visits} Visit(s)</p>
                  </div>
                  <p className="text-[11px]" style={{ color: "#6A1B9A" }}>{myRecord.anonymisation_note}</p>
                </div>
                {myRecord.visits.map((v: any, i: number) => (
                  <div key={i} className="rounded-md border p-4" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="text-xs font-bold text-slate-800">Visit {v.visit_id}</p>
                      <span className="rounded-full bg-white border px-2 py-0.5 text-[10px] font-semibold text-slate-700" style={{ borderColor: SKY_LINE }}>
                        {v.facility} · {v.mandal}
                      </span>
                    </div>
                    {v.complaint && <p className="text-xs text-slate-700 mb-2"><span className="font-semibold text-slate-500">Complaints: </span>{v.complaint}</p>}
                    {v.duration_days && <p className="text-xs text-slate-700 mb-2"><span className="font-semibold text-slate-500">Duration: </span>{v.duration_days} days</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                      {Object.entries(v.vitals).filter(([_, val]) => val).map(([k, val]) => (
                        <div key={k} className="rounded-md border bg-white px-3 py-2 text-center" style={{ borderColor: SKY_LINE }}>
                          <p className="text-[9px] font-bold uppercase text-slate-500">{k}</p>
                          <p className="text-xs font-bold text-slate-900">{val as string}</p>
                        </div>
                      ))}
                    </div>
                    {v.tests && <p className="mt-3 text-[11px] text-slate-600"><span className="font-semibold">Tests: </span>{v.tests}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p dir={isRTL ? "rtl" : "ltr"} className="text-center text-[10px] text-slate-500 pb-4">
          <Shield className="mr-1 inline h-3 w-3" />
          {t("citizen_dpdp")}
        </p>
      </main>

      {/* ─── Alert detail ─── */}
      <DetailModal
        open={!!detailAlert}
        onClose={() => setDetailAlert(null)}
        title={detailAlert ? td(detailAlert.disease) : ""}
        subtitle={detailAlert ? `${detailAlert.mandal} Mandal · ${detailAlert.case_count} reported cases` : ""}
        icon={Activity}
        accent={
          detailAlert?.severity === "critical" ? "#C62828" :
          detailAlert?.severity === "high" ? "#E65100" : "#0D47A1"
        }
      >
        {detailAlert && (
          <>
            <DetailGrid
              items={[
                { label: "Disease", value: td(detailAlert.disease) },
                {
                  label: "Severity",
                  value: detailAlert.severity.toUpperCase(),
                  accent: detailAlert.severity === "critical" ? "#C62828" : detailAlert.severity === "high" ? "#E65100" : NAVY,
                },
                { label: "Cases", value: detailAlert.case_count },
              ]}
            />
            <DetailSection title="Public Advisory">
              <p className="text-xs text-slate-700 leading-relaxed rounded-md p-3 border" style={{ background: SKY, borderColor: SKY_LINE }}>
                {detailAlert.advisory}
              </p>
            </DetailSection>
            <DetailSection title="Location">
              <DetailRow label="Mandal" value={detailAlert.mandal} />
              <DetailRow label="District" value={districtInfo?.district || selectedDistrict} />
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* ─── PHC load detail ─── */}
      <DetailModal
        open={!!detailPhc}
        onClose={() => setDetailPhc(null)}
        title={detailPhc?.facility_name || ""}
        subtitle={`Current load · ${detailPhc?.load_label || ""}`}
        icon={Activity}
        accent={detailPhc?.load_pct >= 80 ? "#C62828" : detailPhc?.load_pct >= 50 ? "#E65100" : "#2E7D32"}
      >
        {detailPhc && (
          <>
            <DetailGrid
              items={[
                {
                  label: "Load",
                  value: `${detailPhc.load_pct}%`,
                  accent: detailPhc.load_pct >= 80 ? "#C62828" : detailPhc.load_pct >= 50 ? "#E65100" : "#2E7D32",
                },
                { label: "Status", value: detailPhc.load_label },
                { label: "Wait Time", value: `~${detailPhc.estimated_wait_min} min`, accent: "#E65100" },
              ]}
            />
            <DetailSection title="Recommendation">
              <p className="text-xs text-slate-700">
                {detailPhc.load_pct >= 80
                  ? "This PHC is heavily loaded right now — consider visiting a less busy facility nearby or waiting until off-peak hours."
                  : detailPhc.load_pct >= 50
                  ? "Moderate load. Expect a short wait."
                  : "Low load — a good time to visit."}
              </p>
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* ─── Screening detail ─── */}
      <DetailModal
        open={!!detailScreening}
        onClose={() => setDetailScreening(null)}
        title={detailScreening?.name || ""}
        subtitle={detailScreening?.category}
        icon={Activity}
        accent={
          detailScreening?.category === "NCD" ? "#0D47A1" :
          detailScreening?.category === "Communicable" ? "#C62828" :
          detailScreening?.category === "Maternal" ? "#6A1B9A" : "#2E7D32"
        }
      >
        {detailScreening && (
          <>
            <DetailGrid
              items={[
                { label: "Category", value: detailScreening.category },
                { label: "Frequency", value: detailScreening.frequency },
                { label: "Where", value: detailScreening.where },
              ]}
            />
            <DetailSection title="Why this screening is recommended">
              <p className="text-xs text-slate-700 leading-relaxed">{detailScreening.reason}</p>
            </DetailSection>
          </>
        )}
      </DetailModal>
    </div>
  );
}
