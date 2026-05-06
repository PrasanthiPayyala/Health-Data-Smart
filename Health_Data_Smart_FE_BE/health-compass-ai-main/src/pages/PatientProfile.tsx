import AppLayout from "@/components/AppLayout";
import HealthScore from "@/components/HealthScore";
import RiskBadge from "@/components/RiskBadge";
import PatientTimeline, { TimelineEvent } from "@/components/PatientTimeline";
import { UploadReportModal, VoiceInputModal, PrescriptionModal, FullHistorySlideOver } from "@/components/ActionModals";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Upload,
  Mic,
  Pill,
  FileText,
  Heart,
  Activity,
  Droplets,
  Brain,
  TrendingDown,
  Eye,
  X,
  Plus,
  Search,
  Check,
  Sparkles,
  FlaskConical,
  Dumbbell,
  Salad,
  Lightbulb,
  FileEdit,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  CalendarCheck,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Mock Data ───────────────────────────────────────────────────────────
const patient = {
  name: "Priya Sharma",
  age: 58,
  gender: "Female",
  bloodType: "O+",
  score: 34,
  chronic: ["Type 2 Diabetes", "Hypertension", "CKD Stage 3"],
  allergies: ["Penicillin", "Sulfa drugs"],
  lifestyle: { smoking: "Never", alcohol: "Social", exercise: "Sedentary", diet: "High sodium" },
  family: ["Father: MI at 52", "Mother: T2DM", "Sister: Breast Cancer"],
};

const timeline: TimelineEvent[] = [
  { id: "1", date: "Feb 18", title: "Lab Results - Critical", description: "Creatinine 2.8 mg/dL (↑), eGFR 28 mL/min (↓), HbA1c 9.2%", type: "report", risk: "critical" },
  { id: "2", date: "Feb 15", title: "Emergency Visit", description: "Presented with acute dyspnea, elevated BP 180/110", type: "visit", risk: "high" },
  { id: "3", date: "Feb 10", title: "Prescription Updated", description: "Metformin increased to 1000mg BD, Amlodipine added 5mg OD", type: "prescription" },
  { id: "4", date: "Feb 1", title: "Routine Check-up", description: "BP 150/95, Weight 78kg, mild pedal edema noted", type: "visit", risk: "moderate" },
  { id: "5", date: "Jan 20", title: "Lab Results", description: "Creatinine 2.2 mg/dL, eGFR 35 mL/min, HbA1c 8.8%", type: "report", risk: "high" },
];

const labTrends = [
  { month: "Oct", creatinine: 1.8, hba1c: 8.1 },
  { month: "Nov", creatinine: 2.0, hba1c: 8.4 },
  { month: "Dec", creatinine: 2.2, hba1c: 8.6 },
  { month: "Jan", creatinine: 2.2, hba1c: 8.8 },
  { month: "Feb", creatinine: 2.8, hba1c: 9.2 },
];

const defaultTests = ["Renal Ultrasound", "Urine Albumin/Creatinine Ratio", "Retinal Screening", "Lipid Panel"];
const defaultMeds = ["Losartan 50mg OD", "Insulin Glargine 10U", "Erythropoietin evaluation"];

const activeMedications = ["Metformin 500mg BD", "Amlodipine 5mg OD", "Atorvastatin 20mg HS"];
const aiInteractionWarning = "Caution: Potential interaction between currently active Metformin and suggested Losartan";

const latestVitals = [
  { label: "Blood Pressure", value: "140/90", unit: "mmHg", status: "High", trend: "up" as const },
  { label: "Heart Rate", value: "72", unit: "bpm", status: "Normal", trend: "down" as const },
  { label: "SpO2", value: "98", unit: "%", status: "Normal", trend: null as const },
  { label: "BMI", value: "28.4", unit: "kg/m²", status: "Overweight", trend: "up" as const },
];

const preventiveCareGaps = [
  { name: "Diabetic Retinopathy Screening", status: "Overdue by 2 months" },
  { name: "Renal Function Panel", status: "Due next week" },
  { name: "HbA1c Test", status: "Due in 3 weeks" },
];

const symptomSuggestions = [
  "Shortness of breath", "Chest pain", "Fatigue", "Swelling in legs",
  "Frequent urination", "Blurry vision", "Headache", "Nausea",
  "Dizziness", "Weight gain", "Muscle cramps", "Back pain",
];

const shapFeatures = [
  { label: "Age > 50", value: 23, color: "hsl(0, 72%, 56%)" },
  { label: "Elevated Creatinine", value: 19, color: "hsl(25, 95%, 53%)" },
  { label: "Hypertension History", value: 17, color: "hsl(38, 92%, 50%)" },
  { label: "HbA1c > 9.0%", value: 15, color: "hsl(174, 62%, 38%)" },
  { label: "Sedentary Lifestyle", value: 11, color: "hsl(210, 90%, 56%)" },
  { label: "Family History (MI)", value: 8, color: "hsl(262, 60%, 55%)" },
  { label: "High Sodium Diet", value: 7, color: "hsl(45, 93%, 47%)" },
];

const treatmentTabs = [
  { id: "medication", label: "Medication", icon: Pill },
  { id: "diet", label: "Diet", icon: Salad },
  { id: "physical", label: "Physical Therapy", icon: Dumbbell },
  { id: "lifestyle", label: "Lifestyle", icon: Lightbulb },
  { id: "explain", label: "Explain", icon: Sparkles },
];

const treatmentContent: Record<string, { title: string; items: string[] }> = {
  medication: {
    title: "Recommended Medication Plan",
    items: [
      "Losartan 50mg — once daily, renoprotective",
      "Insulin Glargine 10U — bedtime, glycemic control",
      "Amlodipine 10mg — once daily, BP management",
      "Furosemide 40mg — morning, edema control",
      "Atorvastatin 20mg — bedtime, lipid management",
    ],
  },
  diet: {
    title: "Dietary Recommendations",
    items: [
      "Reduce sodium intake to < 2g/day",
      "Increase potassium-rich foods (bananas, spinach)",
      "Limit protein to 0.8g/kg/day for renal protection",
      "Avoid processed sugars — target HbA1c < 7%",
      "Hydrate with 1.5–2L water/day (monitor fluid balance)",
    ],
  },
  physical: {
    title: "Physical Therapy Plan",
    items: [
      "Start with 15-min daily walks, gradually increase",
      "Low-impact seated exercises 3x/week",
      "Avoid heavy lifting due to cardiac risk",
      "Ankle/leg elevation exercises for edema management",
      "Breathing exercises for dyspnea management",
    ],
  },
  lifestyle: {
    title: "Lifestyle Modifications",
    items: [
      "Monitor blood pressure twice daily (AM/PM)",
      "Weekly weight monitoring — report >2kg gain",
      "Stress reduction through meditation or yoga",
      "Sleep 7–8 hours, maintain consistent schedule",
      "Avoid alcohol, continue no-smoking status",
    ],
  },
};

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

// ─── Modal types ─────────────────────────────────────────────────────
type ModalType = "upload" | "voice" | "prescription" | "history" | null;

// ─── Main Component ──────────────────────────────────────────────────────
const PatientProfile = () => {
  // Symptoms state
  const [symptoms, setSymptoms] = useState<string[]>(["Shortness of breath", "Swelling in legs"]);
  const [symptomInput, setSymptomInput] = useState("");
  const [showSymptomDropdown, setShowSymptomDropdown] = useState(false);

  // Tests & Meds state
  const [tests, setTests] = useState<string[]>(defaultTests);
  const [meds, setMeds] = useState<string[]>(defaultMeds);
  const [testInput, setTestInput] = useState("");
  const [medInput, setMedInput] = useState("");

  // Treatment plan tabs
  const [activeTab, setActiveTab] = useState("explain");

  // Draft prescription (lifted state for Add/Order → New Prescription flow)
  const [draftPrescription, setDraftPrescription] = useState<{ medicines: string[]; tests: string[] }>({
    medicines: [],
    tests: [],
  });

  // Clinical notes (for Clinical Notes & AI Risk Forecast card)
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const filteredSymptoms = symptomSuggestions.filter(
    (s) => s.toLowerCase().includes(symptomInput.toLowerCase()) && !symptoms.includes(s)
  );

  const addSymptom = (s: string) => {
    setSymptoms((prev) => [...prev, s]);
    setSymptomInput("");
    setShowSymptomDropdown(false);
  };

  const addTest = () => {
    if (testInput.trim() && !tests.includes(testInput.trim())) {
      setTests((prev) => [...prev, testInput.trim()]);
      setTestInput("");
      toast.success(`Test "${testInput.trim()}" added`);
    }
  };

  const addMed = () => {
    if (medInput.trim() && !meds.includes(medInput.trim())) {
      setMeds((prev) => [...prev, medInput.trim()]);
      setMedInput("");
      toast.success(`Medicine "${medInput.trim()}" added`);
    }
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-3 gap-6 items-stretch">
        {/* ─── Left: Main Content ─── */}
        <div className="col-span-2 space-y-6">
          {/* Patient Header */}
          <motion.div {...fadeIn} className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-start gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground">
                ED
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-card-foreground">{patient.name}</h1>
                  <RiskBadge level="critical" label="Critical" animate />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {patient.age}y · {patient.gender} · Blood Type: {patient.bloodType} · ID: PT-2847
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {patient.chronic.map((c) => (
                    <span key={c} className="rounded-full bg-medical-blue-light px-3 py-1 text-xs font-medium text-medical-blue">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {patient.allergies.map((a) => (
                    <span key={a} className="flex items-center gap-1 rounded-full bg-risk-critical/10 px-3 py-1 text-xs font-medium text-risk-critical">
                      <AlertTriangle className="h-3 w-3" /> {a}
                    </span>
                  ))}
                </div>
              </div>
              <HealthScore score={patient.score} size="lg" />
            </div>
          </motion.div>

          {/* What Changed + Lifestyle */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <TrendingDown className="h-4 w-4 text-risk-critical" />
                What Changed Since Last Visit
              </h3>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Creatinine", from: "2.2", to: "2.8", unit: "mg/dL" },
                  { label: "eGFR", from: "35", to: "28", unit: "mL/min" },
                  { label: "HbA1c", from: "8.8", to: "9.2", unit: "%" },
                  { label: "BP", from: "150/95", to: "180/110", unit: "" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-risk-critical/5 px-3 py-2">
                    <span className="text-xs font-medium text-card-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.from} → <span className="font-semibold text-risk-critical">{item.to} {item.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="rounded-xl border bg-card p-5 shadow-card">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                <Activity className="h-4 w-4 text-primary" />
                Lifestyle & Family
              </h3>
              <div className="mt-3 space-y-2">
                {Object.entries(patient.lifestyle).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{k}</span>
                    <span className={`font-medium ${v === "Sedentary" || v === "High sodium" ? "text-risk-high" : "text-card-foreground"}`}>{v}</span>
                  </div>
                ))}
                <div className="mt-3 border-t pt-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Family History</p>
                  {patient.family.map((f) => (
                    <p key={f} className="text-xs text-card-foreground">{f}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Lab Trends */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-card-foreground">Lab Value Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={labTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 52%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 52%)" />
                <Tooltip />
                <Line type="monotone" dataKey="creatinine" stroke="hsl(0, 72%, 56%)" strokeWidth={2.5} name="Creatinine" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="hba1c" stroke="hsl(38, 92%, 50%)" strokeWidth={2.5} name="HbA1c" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Timeline */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="mb-4 font-semibold text-card-foreground">Patient Timeline</h3>
            <PatientTimeline events={timeline} />
          </motion.div>

          {/* ─── AI-Suggested Treatment Plan ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="rounded-xl border bg-card shadow-card">
            <div className="border-b px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Suggested Treatment Plan
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Personalized recommendation based on patient history, lab values, and clinical guidelines
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b px-6">
              {treatmentTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-card-foreground"
                    }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "explain" ? (
                  <motion.div
                    key="explain"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-5"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-card-foreground">SHAP Feature Importance</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Key factors driving the AI's treatment recommendation for this patient
                      </p>
                    </div>
                    <div className="space-y-3">
                      {shapFeatures.map((feature) => (
                        <div key={feature.label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-card-foreground">{feature.label}</span>
                            <span className="text-sm font-semibold" style={{ color: feature.color }}>{feature.value}%</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${feature.value}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: feature.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-accent/50 p-4">
                      <p className="text-xs leading-relaxed text-accent-foreground">
                        <strong>Interpretation:</strong> The model identifies age, elevated creatinine, and hypertension history as the
                        primary drivers for the treatment recommendation. The combination of renal decline and uncontrolled
                        diabetes strongly influences the urgency of the intervention plan.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <h4 className="mb-3 text-sm font-semibold text-card-foreground">
                      {treatmentContent[activeTab]?.title}
                    </h4>
                    <div className="space-y-2">
                      {treatmentContent[activeTab]?.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/60 px-4 py-3">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm text-card-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Model Version: <strong className="text-card-foreground">MedAI-v2.4.1</strong></span>
                <span className="h-3 w-px bg-border" />
                <span>Last Trained: <strong className="text-card-foreground">2026-02-15</strong></span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.info("Treatment plan editor opened for Priya Sharma")}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
                >
                  Modify
                </button>
                <button
                  onClick={() => {
                    toast.error("Treatment plan rejected. The care team will be notified.");
                  }}
                  className="rounded-lg bg-risk-critical px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-risk-critical/90"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    toast.success("Treatment plan accepted and prescription generated for Priya Sharma.");
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Accept & Prescribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="flex flex-col gap-6 h-full min-h-0">
          {/* Actions */}
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Upload, label: "Upload Report", modalKey: "upload" as ModalType },
                { icon: Mic, label: "Voice Input", modalKey: "voice" as ModalType },
                { icon: FileText, label: "New Prescription", modalKey: "prescription" as ModalType },
                { icon: Eye, label: "Full History", modalKey: "history" as ModalType },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => setActiveModal(a.modalKey)}
                  className="flex flex-col items-center gap-1.5 rounded-lg border bg-background p-3 text-xs font-medium text-card-foreground transition-colors hover:bg-secondary"
                >
                  <a.icon className="h-5 w-5 text-primary" />
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ─── Symptoms Input ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.12 }} className="rounded-xl border bg-card p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Search className="h-4 w-4 text-primary" />
              Symptoms
            </h3>
            <div className="relative mt-3">
              <input
                value={symptomInput}
                onChange={(e) => {
                  setSymptomInput(e.target.value);
                  setShowSymptomDropdown(true);
                }}
                onFocus={() => setShowSymptomDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && symptomInput.trim()) {
                    addSymptom(symptomInput.trim());
                  }
                }}
                placeholder="Type a symptom..."
                className="w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => toast.info("Voice input activated — speak now")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary/10 p-1.5 text-primary transition hover:bg-primary/20"
              >
                <Mic className="h-4 w-4" />
              </button>
              {showSymptomDropdown && filteredSymptoms.length > 0 && symptomInput.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border bg-card py-1 shadow-card-hover">
                  {filteredSymptoms.map((s) => (
                    <button
                      key={s}
                      onClick={() => addSymptom(s)}
                      className="w-full px-3 py-2 text-left text-sm text-card-foreground hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {s}
                  <button onClick={() => setSymptoms(symptoms.filter((x) => x !== s))} className="ml-0.5 hover:text-risk-critical">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </motion.div>

          {/* ─── AI Suggested Tests ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="rounded-xl border bg-card p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Brain className="h-4 w-4 text-primary" />
              AI Suggested Tests
            </h3>
            {/* Custom input */}
            <div className="mt-3 flex gap-2">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTest()}
                placeholder="Add custom test..."
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={addTest}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {tests.map((t) => {
                const isInDraft = draftPrescription.tests.includes(t);
                return (
                  <div key={t} className="flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                    <span className="text-xs font-medium text-accent-foreground">{t}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isInDraft) return;
                          setDraftPrescription((prev) => ({ ...prev, tests: [...prev.tests, t] }));
                          toast.success("Added to Draft Prescription");
                        }}
                        disabled={isInDraft}
                        className={`flex items-center gap-1 text-xs font-semibold ${isInDraft ? "text-primary" : "text-primary hover:underline"}`}
                      >
                        {isInDraft ? <><Check className="h-3.5 w-3.5" /> Added</> : "Order"}
                      </button>
                      <button
                        onClick={() => setTests(tests.filter((x) => x !== t))}
                        className="text-muted-foreground hover:text-risk-critical"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ─── AI Suggested Medicines ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Pill className="h-4 w-4 text-medical-purple" />
              AI Suggested Medicines
            </h3>
            {/* Custom input */}
            <div className="mt-3 flex gap-2">
              <input
                value={medInput}
                onChange={(e) => setMedInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMed()}
                placeholder="Add custom medicine..."
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={addMed}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-medical-purple/10 text-medical-purple transition hover:bg-medical-purple/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {meds.map((m) => {
                const isInDraft = draftPrescription.medicines.includes(m);
                return (
                  <div key={m} className="flex items-center justify-between rounded-lg bg-medical-purple-light px-3 py-2">
                    <span className="text-xs font-medium text-card-foreground">{m}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isInDraft) return;
                          setDraftPrescription((prev) => ({ ...prev, medicines: [...prev.medicines, m] }));
                          toast.success("Added to Draft Prescription");
                        }}
                        disabled={isInDraft}
                        className={`flex items-center gap-1 text-xs font-semibold ${isInDraft ? "text-primary" : "text-primary hover:underline"}`}
                      >
                        {isInDraft ? <><Check className="h-3.5 w-3.5" /> Added</> : "Add"}
                      </button>
                      <button
                        onClick={() => setMeds(meds.filter((x) => x !== m))}
                        className="text-muted-foreground hover:text-risk-critical"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Differential Diagnosis */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Droplets className="h-4 w-4 text-medical-blue" />
              Differential Diagnosis
            </h3>
            <div className="mt-3 space-y-2">
              {[
                { diagnosis: "Diabetic Nephropathy", confidence: 87 },
                { diagnosis: "Hypertensive Nephrosclerosis", confidence: 72 },
                { diagnosis: "Chronic Glomerulonephritis", confidence: 34 },
              ].map((d) => (
                <div key={d.diagnosis} className="rounded-lg bg-secondary px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-card-foreground">{d.diagnosis}</span>
                    <span className="text-xs font-semibold text-primary">{d.confidence}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${d.confidence}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Clinical Notes & AI Risk Forecast ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-4 shadow-card flex flex-col flex-1 min-h-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground shrink-0">
              <FileEdit className="h-4 w-4 text-primary" />
              Clinical Notes & AI Risk Forecast
            </h3>
            <div className="mt-3 flex flex-col flex-1 min-h-0">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground shrink-0">Doctor&apos;s Observations</label>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter clinical notes, assessment, and follow-up plan..."
                className="flex-1 min-h-[80px] w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm text-card-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
                aria-label="Doctor's observations"
              />
            </div>
            <div className="mt-4 shrink-0">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Risk Trajectory</p>
              <div className="flex items-center gap-2 rounded-lg border bg-secondary/40 px-4 py-3">
                <span className="rounded-full bg-risk-critical/15 px-2.5 py-1 text-xs font-semibold text-risk-critical">Current State</span>
                <div className="flex-1 flex items-center justify-center gap-1">
                  <div className="h-0.5 flex-1 max-w-[60px] bg-border" />
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="h-0.5 flex-1 max-w-[60px] bg-border" />
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">6 Month Forecast (Stable)</span>
              </div>
            </div>
          </motion.div>

          {/* ─── Active Medications & Alerts ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.32 }} className="rounded-xl border bg-card p-4 shadow-card shrink-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Pill className="h-4 w-4 text-medical-purple" />
              Active Medications & Alerts
            </h3>
            <ul className="mt-3 space-y-2">
              {activeMedications.map((med) => (
                <li key={med} className="flex items-center gap-2 rounded-lg bg-medical-purple-light/60 px-3 py-2">
                  <Pill className="h-3.5 w-3.5 text-medical-purple shrink-0" />
                  <span className="text-xs font-medium text-card-foreground">{med}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                AI Interaction Warning: {aiInteractionWarning}
              </p>
            </div>
          </motion.div>

          {/* ─── Vitals Telemetry ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.34 }} className="rounded-xl border bg-card p-4 shadow-card shrink-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Activity className="h-4 w-4 text-primary" />
              Vitals Telemetry
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {latestVitals.map((v) => (
                <div key={v.label} className="rounded-lg border bg-background/80 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{v.label}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-card-foreground">{v.value}</span>
                    <span className="text-[10px] text-muted-foreground">{v.unit}</span>
                    {v.trend === "up" && <ChevronUp className="h-3.5 w-3.5 text-risk-high" />}
                    {v.trend === "down" && <ChevronDown className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className={`mt-0.5 text-[10px] font-semibold ${v.status === "High" || v.status === "Overweight" ? "text-risk-high" : "text-muted-foreground"}`}>
                    {v.status}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── Preventive Care Gaps ─── */}
          <motion.div {...fadeIn} transition={{ delay: 0.36 }} className="rounded-xl border bg-card p-4 shadow-card shrink-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <CalendarCheck className="h-4 w-4 text-medical-teal" />
              Preventive Care Gaps
            </h3>
            <ul className="mt-3 space-y-2">
              {preventiveCareGaps.map((item) => (
                <li key={item.name} className="rounded-lg border bg-secondary/50 px-3 py-2">
                  <p className="text-xs font-medium text-card-foreground">{item.name}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-risk-high">{item.status}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => toast.success("Scheduling requested for all preventive care items")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Schedule All
            </button>
          </motion.div>
        </div>
      </div>

      {/* Action Modals */}
      <UploadReportModal open={activeModal === "upload"} onClose={() => setActiveModal(null)} />
      <VoiceInputModal open={activeModal === "voice"} onClose={() => setActiveModal(null)} />
      <PrescriptionModal
        open={activeModal === "prescription"}
        onClose={() => setActiveModal(null)}
        draftPrescription={draftPrescription}
        onPrescriptionSigned={() => setDraftPrescription({ medicines: [], tests: [] })}
      />
      <FullHistorySlideOver open={activeModal === "history"} onClose={() => setActiveModal(null)} />
    </AppLayout>
  );
};

export default PatientProfile;
