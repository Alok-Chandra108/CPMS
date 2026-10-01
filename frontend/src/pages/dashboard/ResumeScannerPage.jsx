import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  X,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { analyzeResume } from '../../api/applicationApi';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_JD_CHARS = 5000;

// ── Sub-components ────────────────────────────────────────────────────────────

/** Circular arc progress ring for the match score */
const ScoreRing = ({ score }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Strong Match' : score >= 40 ? 'Partial Match' : 'Weak Match';

  return (
    <div className="flex flex-col items-center gap-3 relative justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
        {/* Track */}
        <circle cx="64" cy="64" r={radius} fill="none" strokeWidth="10" stroke="#f1f5f9" />
        {/* Progress */}
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: 0 }}>
        <motion.span
          className="text-3xl font-extrabold text-stripe-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stripe-textSecondary">
          {label}
        </span>
      </div>
    </div>
  );
};

/** Individual keyword badge */
const KeywordBadge = ({ keyword, index }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.05 * index }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-error/8 border border-error/20 text-error rounded-lg text-xs font-bold"
  >
    <X className="w-3 h-3 flex-shrink-0" />
    {keyword}
  </motion.span>
);

const MatchedKeywordBadge = ({ keyword, index }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.05 * index }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/8 border border-success/20 text-success rounded-lg text-xs font-bold"
  >
    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
    {keyword}
  </motion.span>
);

// ── Main Page Component ───────────────────────────────────────────────────────
const ResumeScannerPage = () => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Security: Validate file on selection ──────────────────────────────────
  const handleFile = useCallback((file) => {
    setError(null);
    setResult(null);

    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Please upload a PDF file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 2MB.');
      return;
    }
    setResumeFile(file);
  }, []);

  // ── Drag and Drop Handlers ─────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };
  const onFileChange = (e) => handleFile(e.target.files?.[0]);

  // ── Form Submission ────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!resumeFile) {
      toast.error('Please upload your resume PDF.');
      return;
    }
    if (!jdText.trim() || jdText.trim().length < 50) {
      toast.error('Please paste the full job description (at least 50 characters).');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await analyzeResume(resumeFile, jdText.trim());
      setResult(data.data);
      toast.success('AI Scan complete!');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Scan failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const canScan = resumeFile && jdText.trim().length >= 50 && !isLoading;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-sm shadow-brand-primary/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-stripe-text tracking-tight">AI Resume Scanner</h1>
            <p className="text-sm text-stripe-textSecondary font-medium">
              Diagnose your resume against any Job Description before you apply.
            </p>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 flex items-center gap-2 text-xs text-stripe-textSecondary font-medium bg-stripe-bg border border-stripe-border rounded-xl px-4 py-2.5 w-fit">
          <Shield className="h-3.5 w-3.5 text-success flex-shrink-0" />
          <span>Your resume is processed securely and never stored by the AI engine.</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left Column: Inputs ── */}
        <div className="space-y-5">

          {/* Resume Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-stripe-border p-6 shadow-sm"
          >
            <h2 className="text-sm font-bold text-stripe-text mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-stripe-textSecondary" />
              Step 1: Upload Your Resume
            </h2>

            {/* Drop Zone */}
            <div
              id="resume-drop-zone"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => !resumeFile && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                ${isDragging
                  ? 'border-brand-primary bg-brand-primary/5 scale-[1.01]'
                  : resumeFile
                  ? 'border-success/40 bg-success/5 cursor-default'
                  : 'border-stripe-border hover:border-brand-primary/50 hover:bg-stripe-bg'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={onFileChange}
                className="hidden"
                id="resume-file-input"
                aria-label="Upload resume PDF"
              />

              <AnimatePresence mode="wait">
                {resumeFile ? (
                  <motion.div
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-stripe-text text-sm truncate max-w-[240px]">{resumeFile.name}</p>
                      <p className="text-xs text-stripe-textSecondary font-medium mt-0.5">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setResumeFile(null); setResult(null); fileInputRef.current.value = ''; }}
                      className="flex items-center gap-1.5 text-xs text-error font-bold hover:underline"
                      id="remove-resume-btn"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="drop-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <UploadCloud className={`h-10 w-10 transition-colors ${isDragging ? 'text-brand-primary' : 'text-stripe-textSecondary'}`} />
                    <div>
                      <p className="font-bold text-stripe-text text-sm">Drag & drop your resume here</p>
                      <p className="text-xs text-stripe-textSecondary font-medium mt-1">or click to browse • PDF only • Max 2MB</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex items-center gap-2 text-error text-xs font-bold bg-error/5 border border-error/20 rounded-lg px-3 py-2"
                >
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* JD Textarea Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-stripe-border p-6 shadow-sm"
          >
            <h2 className="text-sm font-bold text-stripe-text mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-stripe-textSecondary" />
              Step 2: Paste the Job Description
            </h2>
            <textarea
              id="job-description-input"
              value={jdText}
              onChange={(e) => setJdText(e.target.value.slice(0, MAX_JD_CHARS))}
              placeholder="Paste the full Job Description here. The AI will compare the technical keywords in this description against your resume..."
              rows={10}
              className="w-full text-sm text-stripe-text placeholder-stripe-textSecondary/60 bg-stripe-bg border border-stripe-border rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all font-medium leading-relaxed"
              aria-label="Job description text input"
            />
            <p className="text-right text-[11px] text-stripe-textSecondary font-medium mt-1.5">
              {jdText.length} / {MAX_JD_CHARS}
            </p>
          </motion.div>

          {/* Scan Button */}
          <motion.button
            id="run-ai-scan-btn"
            onClick={handleScan}
            disabled={!canScan}
            whileHover={canScan ? { scale: 1.01 } : {}}
            whileTap={canScan ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
              ${canScan
                ? 'bg-brand-primary text-white hover:bg-brand-primary-dark hover:shadow-md cursor-pointer'
                : 'bg-stripe-bg text-stripe-textSecondary border border-stripe-border cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI is Analysing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Run AI Diagnostic Scan
              </>
            )}
          </motion.button>
        </div>

        {/* ── Right Column: Results ── */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {/* Placeholder state */}
            {!result && !isLoading && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-stripe-border p-8 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[300px]"
              >
                <div className="h-16 w-16 rounded-2xl bg-stripe-bg border border-stripe-border flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-stripe-textSecondary/50" />
                </div>
                <h3 className="font-bold text-stripe-text text-base mb-1.5">Your Results Will Appear Here</h3>
                <p className="text-sm text-stripe-textSecondary font-medium leading-relaxed max-w-xs">
                  Upload your resume and paste a Job Description, then click the scan button to get your AI diagnosis.
                </p>
              </motion.div>
            )}

            {/* Loading state */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-stripe-border p-8 shadow-sm h-full flex flex-col items-center justify-center text-center min-h-[300px] gap-4"
              >
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-primary/20 animate-ping" />
                  <div className="h-16 w-16 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-stripe-text text-base">Scanning with AI...</p>
                  <p className="text-xs text-stripe-textSecondary font-medium mt-1">Running TF-IDF & Cosine Similarity analysis</p>
                </div>
              </motion.div>
            )}

            {/* Results state */}
            {result && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Score Card */}
                <div className="bg-white rounded-2xl border border-stripe-border p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-stripe-text mb-6 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-stripe-textSecondary" />
                    Match Analysis
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-4">
                    {/* Overall Contextual Match (TF-IDF Cosine Similarity) */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative flex items-center justify-center w-32 h-32">
                        <ScoreRing score={Math.round(result.cosine_similarity_score || 0)} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-stripe-text">Overall Match</p>
                        <p className="text-[10px] text-stripe-textSecondary font-medium uppercase tracking-wider">Context & Semantic</p>
                      </div>
                    </div>

                    {/* Skills Coverage Match (Hybrid NLP - Component A+B+C) */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative flex items-center justify-center w-32 h-32">
                        <ScoreRing score={Math.round(result.skill_coverage_score || 0)} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-stripe-text">Skills Match</p>
                        <p className="text-[10px] text-stripe-textSecondary font-medium uppercase tracking-wider">Technical Keywords</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Missing Keywords Card */}
                {result.missing_keywords?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-stripe-border p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-bold text-stripe-text flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-error" />
                        Missing Keywords
                        <span className="inline-flex items-center justify-center h-5 px-2 bg-error text-white rounded-full text-[10px] font-extrabold">
                          {result.missing_keywords.length}
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-stripe-textSecondary font-medium mb-4 leading-relaxed">
                      Add these technical terms to your resume to improve your ATS score before applying.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_keywords.map((kw, i) => (
                        <KeywordBadge key={kw} keyword={kw} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Matched Keywords Card */}
                {result.matched_keywords?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-stripe-border p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-bold text-stripe-text flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        Matched Keywords
                        <span className="inline-flex items-center justify-center h-5 px-2 bg-success text-white rounded-full text-[10px] font-extrabold">
                          {result.matched_keywords.length}
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-stripe-textSecondary font-medium mb-4 leading-relaxed">
                      Your resume successfully highlighted these required skills from the job description!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_keywords.map((kw, i) => (
                        <MatchedKeywordBadge key={kw} keyword={kw} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* All Clear Card */}
                {result.missing_keywords?.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-success/5 rounded-2xl border border-success/30 p-6 shadow-sm flex items-center gap-4"
                  >
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-stripe-text text-sm">Excellent Resume Match!</p>
                      <p className="text-xs text-stripe-textSecondary font-medium mt-0.5">Your resume covers all the key technical requirements.</p>
                    </div>
                  </motion.div>
                )}

                {/* Rescan CTA */}
                <button
                  id="rescan-btn"
                  onClick={() => { setResult(null); setResumeFile(null); setJdText(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-stripe-bg hover:bg-stripe-border/40 border border-stripe-border rounded-xl text-sm font-bold text-stripe-textSecondary hover:text-stripe-text transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                  Scan a Different Resume or Drive
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default ResumeScannerPage;
