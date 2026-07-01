'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, AlertTriangle, Wrench, TrendingUp, Lightbulb, Clock } from 'lucide-react'

interface Incident {
  title: string
  date_mentioned: string
  root_cause: string
  resolution: string
  outcome: string
  source_page: number
}

interface RCAResult {
  found_incidents: boolean
  summary: string
  incidents: Incident[]
  recommendations: string[]
}

const EXAMPLE_QUERIES = [
  'Pump failure history',
  'Motor breakdown causes',
  'Why did equipment fail last time',
]

export default function RCAPage() {
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<RCAResult | null>(null)

  const runAnalysis = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch('/api/rca/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (res.ok) setResult(data.result)
      else alert('Error: ' + data.error)
    } catch { alert('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page header */}
      <div className="mb-8 border-b border-[#26282e] pb-6">
        <div className="mb-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">MODULE · ROOT CAUSE ANALYSIS</div>
        <h2 className="text-2xl font-medium text-[#e8e9eb]">Root Cause Analysis</h2>
        <p className="mt-1 text-sm text-[#7a7f8a]">Purani failures aur unke fixes dhundo apne maintenance records mein.</p>
      </div>

      {/* Search */}
      <div className="mb-8 border border-[#26282e] bg-[#0c0d10] p-5">
        <div className="mb-3 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">QUERY</div>
        <div className="flex gap-0 border border-[#26282e]">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAnalysis()}
            placeholder="e.g. Pump P-204 kyu kharab hua tha pichle saal?"
            disabled={loading}
            className="flex-1 bg-[#08090b] px-4 py-3 font-mono text-sm text-[#e8e9eb] placeholder:text-[#3a3d45] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={runAnalysis}
            disabled={loading || !query.trim()}
            className="border-l border-[#26282e] bg-[#08090b] px-5 font-mono text-[11px] tracking-[0.12em] text-[#7a7f8a] transition-colors hover:bg-[#ff6a1a]/10 hover:text-[#ff6a1a] disabled:opacity-30"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'ANALYZE'}
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-[10px] tracking-wider text-[#3a3d45]">TRY:</span>
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="font-mono text-[10px] tracking-wider text-[#7a7f8a] transition-colors hover:text-[#ff6a1a]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            {/* Summary banner */}
            <div className={`border px-5 py-4 ${
              result.found_incidents
                ? 'border-[#ff6a1a]/30 bg-[#ff6a1a]/[0.06]'
                : 'border-[#26282e] bg-[#0c0d10]'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: result.found_incidents ? '#ff6a1a' : '#7a7f8a' }}
                />
                <div>
                  <p className="font-mono text-[11px] tracking-[0.1em] text-[#e8e9eb]">
                    {result.found_incidents
                      ? `${result.incidents.length} RELATED INCIDENT(S) FOUND`
                      : 'NO MATCHING HISTORY FOUND'}
                  </p>
                  <p className="mt-1 text-sm text-[#7a7f8a]">{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Incident cards */}
            {result.incidents.map((incident, i) => (
              <div key={i} className="border border-[#26282e] bg-[#0c0d10]">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-[#26282e] px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-[#ff6a1a]">
                      INCIDENT.{String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-[#e8e9eb]">{incident.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-[#7a7f8a]">
                      <Clock size={10} />
                      {incident.date_mentioned}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider text-[#7a7f8a]">
                      PG.{incident.source_page}
                    </span>
                  </div>
                </div>

                {/* Card body — 2 column grid */}
                <div className="grid grid-cols-1 divide-y divide-[#26282e] md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="flex gap-3 px-5 py-4">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#e5484d]" />
                    <div>
                      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">ROOT CAUSE</div>
                      <p className="text-sm text-[#a9adb6]">{incident.root_cause}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 px-5 py-4">
                    <Wrench size={14} className="mt-0.5 shrink-0 text-[#4caf6e]" />
                    <div>
                      <div className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">RESOLUTION</div>
                      <p className="text-sm text-[#a9adb6]">{incident.resolution}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#26282e] px-5 py-4">
                  <TrendingUp size={14} className="mb-1.5 text-[#7a7f8a]" />
                  <div className="mb-1 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">OUTCOME</div>
                  <p className="text-sm text-[#a9adb6]">{incident.outcome}</p>
                </div>
              </div>
            ))}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="border border-[#26282e] bg-[#0c0d10]">
                <div className="flex items-center gap-2 border-b border-[#26282e] px-5 py-3">
                  <Lightbulb size={13} className="text-[#ff6a1a]" />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-[#ff6a1a]">RECOMMENDATIONS</span>
                </div>
                <ul className="divide-y divide-[#26282e]">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 px-5 py-3.5 text-sm text-[#a9adb6]">
                      <span className="mt-0.5 font-mono text-[10px] text-[#ff6a1a] shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when no result yet */}
      {!result && !loading && (
        <div className="border border-dashed border-[#26282e] py-20 text-center">
          <Search size={28} className="mx-auto mb-3 text-[#26282e]" strokeWidth={1} />
          <p className="font-mono text-[11px] tracking-wider text-[#3a3d45]">
            ENTER A QUERY TO BEGIN ANALYSIS
          </p>
        </div>
      )}
    </div>
  )
}