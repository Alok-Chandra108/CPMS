import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  BrainCircuit, BookOpen, AlertTriangle, CheckCircle2,
  Loader2, ChevronRight, Lightbulb, Target, GraduationCap, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Config ────────────────────────────────────────────────────────────────────
const ML_BASE_URL = 'http://localhost:8000';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'Low':    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'Medium': return { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500'   };
    case 'High':   return { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500'     };
    default:       return { color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200',    dot: 'bg-gray-400'    };
  }
};

const coverageColor = (pct) => pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

// ── Animations ────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

// ── Sub-components ────────────────────────────────────────────────────────────

const CoverageRing = ({ score }) => {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = coverageColor(score);
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" strokeWidth="9" stroke="#f1f5f9" />
        <motion.circle
          cx="56" cy="56" r={r} fill="none" strokeWidth="9" stroke={color}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span className="text-2xl font-extrabold text-stripe-text"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {score}%
        </motion.span>
      </div>
    </div>
  );
};

const ProbabilityMeter = ({ value }) => {
  const color = value >= 70 ? '#22c55e' : value >= 45 ? '#f59e0b' : '#ef4444';
  const label = value >= 70 ? 'High Placement Chance' : value >= 45 ? 'Moderate Chance' : 'Low Chance — Focus on Gaps';
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-semibold text-stripe-textSecondary">Placement Probability</span>
        <motion.span className="text-4xl font-black" style={{ color }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {value}%
        </motion.span>
      </div>
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
      </div>
      <p className="text-xs font-bold mt-2" style={{ color }}>{label}</p>
    </div>
  );
};

const ShapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-stripe-border rounded-lg shadow-stripe-card px-3 py-2 text-left">
      <p className="text-xs font-bold text-stripe-text">{payload[0].payload.feature}</p>
      <p className={`text-sm font-black ${val >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {val >= 0 ? '+' : ''}{val.toFixed(4)}
      </p>
      <p className="text-[10px] text-stripe-textSecondary mt-0.5">
        {val >= 0 ? '▲ Pushes score higher' : '▼ Pulls score lower'}
      </p>
    </div>
  );
};

const FormField = ({ label, id, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">{label}</label>
    <input id={id} {...props}
      className="w-full px-3.5 py-2.5 rounded-lg border border-stripe-border bg-white text-stripe-text
                 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30
                 focus:border-brand-primary transition-all placeholder:text-slate-300" />
  </div>
);

const FormTextarea = ({ label, id, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">{label}</label>
    <textarea id={id} {...props}
      className="w-full px-3.5 py-2.5 rounded-lg border border-stripe-border bg-white text-stripe-text
                 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30
                 focus:border-brand-primary transition-all placeholder:text-slate-300 resize-none custom-scrollbar" />
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className={`p-2.5 rounded-xl ${gradient} shadow-sm flex-shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <h2 className="text-lg font-extrabold text-stripe-text">{title}</h2>
      <p className="text-sm text-stripe-textSecondary mt-0.5">{subtitle}</p>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 1 ─ XAI Placement Predictor
// ═════════════════════════════════════════════════════════════════════════════
const PlacementPredictor = () => {
  const [form, setForm] = useState({ cgpa: '', internships_completed: '', aptitude_score: '', backlogs: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePredict = async () => {
    if (Object.values(form).some((v) => v === '')) {
      toast.error('Please fill in all four fields.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${ML_BASE_URL}/api/v1/ml/predict-placement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'current-user',
          cgpa: parseFloat(form.cgpa),
          internships_completed: parseInt(form.internships_completed, 10),
          aptitude_score: parseFloat(form.aptitude_score),
          backlogs: parseInt(form.backlogs, 10),
        }),
      });
      if (!res.ok) throw new Error(`ML service error: ${res.status}`);
      const data = await res.json();
      setResult(data.data);
      toast.success('Prediction complete!');
    } catch (err) {
      toast.error(err.message || 'Could not reach ML service. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const shapData = result
    ? Object.entries(result.shap_feature_importances)
        .map(([k, v]) => ({
          feature: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value: parseFloat(v.toFixed(4)),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="stripe-card p-6 lg:p-8">
      <SectionHeader
        icon={BrainCircuit}
        gradient="bg-violet-500"
        title="XAI Placement Predictor"
        subtitle="Enter your academic profile to get an AI prediction with transparent SHAP explanations."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <FormField label="CGPA (out of 10)" id="cgpa" name="cgpa" type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.5" value={form.cgpa} onChange={onChange} />
        <FormField label="Internships Done"  id="internships_completed" name="internships_completed" type="number" min="0" placeholder="e.g. 2" value={form.internships_completed} onChange={onChange} />
        <FormField label="Aptitude Score /100" id="aptitude_score" name="aptitude_score" type="number" min="0" max="100" placeholder="e.g. 78" value={form.aptitude_score} onChange={onChange} />
        <FormField label="Active Backlogs"  id="backlogs" name="backlogs" type="number" min="0" placeholder="e.g. 0" value={form.backlogs} onChange={onChange} />
      </div>

      <button onClick={handlePredict} disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700
                   text-white text-sm font-bold transition-all shadow-sm active:scale-95
                   disabled:opacity-60 disabled:cursor-not-allowed">
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Predicting…</>
          : <><Zap className="h-4 w-4" />Predict My Chances</>}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div key="pred-result" variants={fadeUp} initial="hidden" animate="visible"
            className="mt-8 space-y-6">

            {/* Probability bar */}
            <div className="p-5 rounded-xl bg-slate-50 border border-stripe-border">
              <ProbabilityMeter value={result.placement_probability_percentage} />
            </div>

            {/* SHAP chart */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-stripe-text">Why this score? (AI Explanation)</h3>
              </div>
              <p className="text-xs text-stripe-textSecondary mb-4">
                <span className="font-bold text-emerald-600">Green</span> = pushes score higher &nbsp;|&nbsp;
                <span className="font-bold text-red-500">Red</span> = pulls score lower
              </p>
              <div className="p-4 rounded-xl bg-white border border-stripe-border">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={shapData} layout="vertical"
                    margin={{ left: 8, right: 36, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="feature" width={145}
                      tick={{ fontSize: 12, fill: '#0A2540', fontWeight: 600 }} />
                    <Tooltip content={<ShapTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={30}>
                      {shapData.map((entry, i) => (
                        <Cell key={i} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tech metadata */}
            <div className="flex flex-wrap gap-2">
              {[
                ['Model', result.metadata.model],
                ['Balancing', result.metadata.balancing_technique],
                ['XAI Engine', result.metadata.explainability],
              ].map(([k, v]) => (
                <span key={k} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1
                  rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {k}: {v}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SECTION 2 ─ Skill Gap Analyzer
// ═════════════════════════════════════════════════════════════════════════════
const SkillGapAnalyzer = () => {
  const [form, setForm] = useState({ resume: '', jd: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAnalyze = async () => {
    if (!form.resume.trim() || !form.jd.trim()) {
      toast.error('Please paste both your resume and the job description.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${ML_BASE_URL}/api/v1/ml/skill-gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'current-user',
          resume_text: form.resume,
          job_description_text: form.jd,
        }),
      });
      if (!res.ok) throw new Error(`Skill gap service error: ${res.status}`);
      const data = await res.json();
      setResult(data.data);
      toast.success(`Analysis complete — ${data.data.missing_count} gap(s) found.`);
    } catch (err) {
      toast.error(err.message || 'Could not reach ML service. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const sev = result ? getSeverityConfig(result.gap_severity) : null;

  return (
    <div className="stripe-card p-6 lg:p-8">
      <SectionHeader
        icon={Target}
        gradient="bg-brand-primary"
        title="Resume Skill Gap Analyzer"
        subtitle="Identify missing skills and get a personalised course learning path in seconds."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <FormTextarea label="Paste Your Resume" id="resume" name="resume" rows={9}
          placeholder="Paste your full resume content here…"
          value={form.resume} onChange={onChange} />
        <FormTextarea label="Paste Target Job Description" id="jd" name="jd" rows={9}
          placeholder="Paste the job description you are targeting…"
          value={form.jd} onChange={onChange} />
      </div>

      <button onClick={handleAnalyze} disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primaryHover
                   text-white text-sm font-bold transition-all shadow-sm active:scale-95
                   disabled:opacity-60 disabled:cursor-not-allowed">
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</>
          : <><Target className="h-4 w-4" />Analyze Skill Gap</>}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div key="gap-result" variants={fadeUp} initial="hidden" animate="visible"
            className="mt-8 space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-slate-50 border border-stripe-border
                              flex flex-col items-center gap-2">
                <CoverageRing score={result.skill_coverage_percentage} />
                <p className="text-[10px] font-bold text-stripe-textSecondary uppercase tracking-wider">Skill Coverage</p>
              </div>

              <div className={`p-4 rounded-xl border ${sev.bg} ${sev.border} flex flex-col justify-center gap-1`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gap Severity</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${sev.dot}`} />
                  <p className={`text-xl font-black ${sev.color}`}>{result.gap_severity}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Skills Matched</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xl font-black text-emerald-600">{result.matched_count}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col justify-center gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Skills Missing</p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <p className="text-xl font-black text-red-600">{result.missing_count}</p>
                </div>
              </div>
            </div>

            {/* Matched skill chips */}
            {result.matched_skills.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Skills You Already Have
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.matched_skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200
                                             text-emerald-700 text-xs font-semibold">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Course recommendations */}
            {result.recommended_courses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-4 w-4 text-brand-primary" />
                  <h3 className="text-sm font-extrabold text-stripe-text">Your Personalised Learning Path</h3>
                </div>
                <div className="space-y-3">
                  {result.recommended_courses.map((item, i) => (
                    <motion.div key={item.skill} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                      className="flex items-start gap-4 p-4 rounded-xl bg-white border border-stripe-border
                                 hover:border-brand-primary/40 hover:shadow-stripe-sm transition-all group">
                      <div className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-center min-w-[80px]">
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Missing</p>
                        <p className="text-xs font-black text-red-700 mt-0.5 capitalize">{item.skill}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 mt-1 flex-shrink-0 group-hover:text-brand-primary transition-colors" />
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <BookOpen className="h-4 w-4 text-brand-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-stripe-text leading-snug">{item.course}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Perfect match */}
            {result.missing_count === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-700">Excellent Match!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Your resume covers all required skills for this role. You are ready to apply!
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ═════════════════════════════════════════════════════════════════════════════
const AIDashboardPage = () => (
  <div className="min-h-screen bg-[#F6F9FC]">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Page header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-md">
          <BrainCircuit className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-stripe-text">AI Career Dashboard</h1>
          <p className="text-sm text-stripe-textSecondary mt-1">
            Powered by Hybrid NLP · RandomForest + SMOTE · SHAP Explainable AI
          </p>
        </div>
      </motion.div>

      {/* Research badges */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="flex flex-wrap gap-2">
        {[
          ['🎯 Gap 1 Resolved', 'Transparent Feedback Loop'],
          ['🔍 Gap 2 Resolved', 'Zero Keyword Noise'],
          ['🤖 XAI Enabled',    'SHAP Feature Importance'],
        ].map(([label, desc]) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white
                                      border border-stripe-border shadow-stripe-sm text-xs">
            <span className="font-bold text-stripe-text">{label}</span>
            <span className="text-stripe-textSecondary">— {desc}</span>
          </div>
        ))}
      </motion.div>

      {/* Section 1 */}
      <motion.div variants={fadeUp} custom={2} initial="hidden" animate="visible">
        <PlacementPredictor />
      </motion.div>

      {/* Section 2 */}
      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible">
        <SkillGapAnalyzer />
      </motion.div>

    </div>
  </div>
);

export default AIDashboardPage;
