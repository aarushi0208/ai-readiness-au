import { useState } from "react";
import { Search, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { performAudit, type AuditResult } from "./services/geminiService";
import axios from "axios";

export default function App() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let normalizedUrl = url;
    if (!url.startsWith('http')) {
      normalizedUrl = 'https://' + url;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Fetch content via our server proxy
      const fetchResp = await axios.get(`/api/fetch-url?url=${encodeURIComponent(normalizedUrl)}`);
      const { content } = fetchResp.data;

      // 2. Perform audit with Gemini
      const auditResult = await performAudit(normalizedUrl, content);
      setResult(auditResult);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Something went wrong. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 md:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <Sparkles size={20} />
          </div>
          <h1 className="text-sm font-mono uppercase tracking-[0.2em] font-medium opacity-60">AI Intelligence Audit</h1>
        </div>
        <h2 className="text-5xl md:text-7xl font-serif italic mb-6 leading-[0.9]">
          Is your site <br />
          <span className="not-italic text-brand">AI-Ready?</span>
        </h2>
        <p className="text-xl text-ink/60 max-w-xl leading-relaxed">
          The way web content is consumed is changing. Ensure your data is structured, semantic, and optimized for the next generation of AI search and agents.
        </p>
      </header>

      {/* Audit Input */}
      <section className="mb-12">
        <form onSubmit={handleAudit} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-ink/30">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., example.com)"
              className="w-full h-16 pl-12 pr-4 bg-white border border-ink/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all text-lg"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url}
            className="h-16 px-10 bg-ink text-white rounded-2xl font-medium text-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:hover:bg-ink flex items-center justify-center gap-3 shadow-xl shadow-ink/10"
          >
            {isLoading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Analyzing Site...
              </>
            ) : (
              "Get Free Audit"
            )}
          </button>
        </form>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100"
          >
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </section>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.section
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16"
          >
            {/* Score Card */}
            <div className="md:col-span-4 bg-white p-8 rounded-[2rem] border border-ink/5 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-6">Readiness Score</h3>
              <div className="relative mb-6">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-surface"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={552.92}
                    initial={{ strokeDashoffset: 552.92 }}
                    animate={{ strokeDashoffset: 552.92 * (1 - result.score / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-brand"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-serif italic">{result.score}</span>
                  <span className="text-xs font-mono opacity-40">OF 100</span>
                </div>
              </div>
              <p className="text-sm text-ink/60 leading-relaxed italic">
                {result.score > 80 ? "Excellent. Your site is highly discoverable by AI agents." :
                 result.score > 50 ? "Good foundation, but missing key structural data." :
                 "Significant optimization needed for AI visibility."}
              </p>
            </div>

            {/* Analysis Card */}
            <div className="md:col-span-8 bg-white p-8 rounded-[2rem] border border-ink/5 shadow-sm">
              <div className="mb-10">
                <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-6">Key Improvements</h3>
                <div className="space-y-4">
                  {result.issues.map((issue, idx) => (
                    <div key={idx} className="group p-4 bg-surface/50 rounded-2xl hover:bg-surface transition-colors border border-transparent hover:border-ink/5">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${
                          issue.impact === 'high' ? 'bg-red-50 text-red-500' :
                          issue.impact === 'medium' ? 'bg-orange-50 text-orange-500' :
                          'bg-blue-50 text-blue-500'
                        }`}>
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-3">
                            {issue.title}
                            <span className={`text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded-full border ${
                              issue.impact === 'high' ? 'border-red-200 text-red-500 bg-white' :
                              issue.impact === 'medium' ? 'border-orange-200 text-orange-500 bg-white' :
                              'border-blue-200 text-blue-500 bg-white'
                            }`}>
                              {issue.impact} IMPACT
                            </span>
                          </h4>
                          <p className="text-sm text-ink/60 mt-1 leading-relaxed">{issue.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-6">Strategic Positives</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.positives.map((pos, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-green-50/30 rounded-xl border border-green-100/50">
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-ink/80">{pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* How it Works section - simple toggle */}
      <section className="mb-12">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-ink hover:text-brand transition-colors group mb-4"
        >
          {showHowItWorks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          How it works
        </button>
        <AnimatePresence>
          {showHowItWorks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-ink/5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="font-bold text-lg mb-2">1. Web Crawling</h4>
                  <p className="text-sm text-ink/60 leading-relaxed">
                    Our server fetches the structural fingerprint of your URL, looking for metadata, semantic hierarchy, and structured data blocks.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">2. LLM Analysis</h4>
                  <p className="text-sm text-ink/60 leading-relaxed">
                    Gemini analyzes the site through the eyes of an AI Agent. It checks if the content is clear enough for a LLM to accurately summarize.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">3. Actionable Insights</h4>
                  <p className="text-sm text-ink/60 leading-relaxed">
                    We generate a score and a prioritized list of issues ranging from missing JSON-LD schemas to weak semantic navigation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-12 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-xs font-mono">
        <p>© 2026 AI READINESS LABS</p>
        <div className="flex gap-8">
          <span className="cursor-not-allowed">PRIVACY</span>
          <span className="cursor-not-allowed">API</span>
          <span className="cursor-not-allowed">ABOUT</span>
        </div>
      </footer>
    </div>
  );
}
