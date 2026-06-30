'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, AlertTriangle, Wrench, TrendingUp, Lightbulb } from 'lucide-react'

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

export default function RCAPage() {
  const [query, setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<RCAResult | null>(null)

  const runAnalysis = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResult(null)

    try {
      const res  = await fetch('/api/rca/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query }),
      })
      const data = await res.json()
      if (res.ok) setResult(data.result)
      else alert('Error: ' + data.error)
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const exampleQueries = [
    'Pump failure history',
    'Motor breakdown causes',
    'Why did equipment fail last time',
  ]

  // ── Card/panel shared style ────────────────────────────────────────────────
  const glassCard: React.CSSProperties = {
    background:     'hsl(0 0% 8% / 0.9)',
    border:         '1px solid hsl(0 0% 16% / 0.7)',
    backdropFilter: 'blur(12px)',
  }

  const labelStyle = 'text-xs font-semibold uppercase tracking-widest text-[hsl(0_0%_42%)]'

  return (
    <div>
      {/* Page heading */}
      <h2 className="text-2xl font-bold text-white mb-2">Root Cause Analysis</h2>
      <p className="text-sm mb-8" style={{ color: 'hsl(0 0% 52%)' }}>
        Purani failures aur unke fixes dhundo apne maintenance records mein.
      </p>

      {/* Search Box */}
      <div className="rounded-2xl p-6 mb-8" style={glassCard}>
        <div className="flex gap-3 mb-4">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAnalysis()}
            placeholder="e.g. Pump P-204 kyu kharab hua tha pichle saal?"
            disabled={loading}
            className="flex-1 bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-white placeholder:text-[hsl(0_0%_35%)] focus-visible:ring-[hsl(0_0%_30%)]"
          />
          <Button
            onClick={runAnalysis}
            disabled={loading || !query.trim()}
            className="bg-[hsl(0_0%_20%)] hover:bg-[hsl(0_0%_26%)] text-white border-none"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><Search size={16} className="mr-2" /> Analyze</>
            )}
          </Button>
        </div>

        {/* Example queries */}
        {!result && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs" style={{ color: 'hsl(0 0% 40%)' }}>Try:</span>
            {exampleQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuery(q)}
                className="text-xs transition-colors hover:underline"
                style={{ color: 'hsl(0 0% 60%)' }}
              >
                {q}{i < exampleQueries.length - 1 ? ' ·' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* Summary banner */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: result.found_incidents
                ? 'hsl(0 0% 10% / 0.95)'
                : 'hsl(0 0% 8% / 0.95)',
              border: `1px solid ${result.found_incidents ? 'hsl(0 0% 22%)' : 'hsl(0 0% 18%)'}`,            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="shrink-0 mt-0.5"
                style={{ color: result.found_incidents ? 'hsl(25 75% 60%)' : 'hsl(0 0% 48%)' }}
              />
              <div>
                <p className="font-semibold text-white mb-1">
                  {result.found_incidents
                    ? `${result.incidents.length} Related Incident(s) Found`
                    : 'No Matching History Found'}
                </p>
                <p className="text-sm" style={{ color: 'hsl(0 0% 60%)' }}>{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Incident cards */}
          {result.incidents.map((incident, i) => (
            <div key={i} className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white">{incident.title}</h3>
                <Badge
                  variant="outline"
                  className="border-[hsl(0_0%_22%)] text-[hsl(0_0%_55%)]"
                >
                  Page {incident.source_page}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Root cause */}
                <div className="flex gap-3">
                  <AlertTriangle size={16} className="text-[hsl(0_84%_60%)] shrink-0 mt-0.5" />
                  <div>
                    <p className={labelStyle + ' mb-1'}>Root Cause</p>
                    <p className="text-sm text-white/80">{incident.root_cause}</p>
                  </div>
                </div>

                {/* Resolution */}
                <div className="flex gap-3">
                  <Wrench size={16} className="text-[hsl(142_70%_50%)] shrink-0 mt-0.5" />
                  <div>
                    <p className={labelStyle + ' mb-1'}>Resolution</p>
                    <p className="text-sm text-white/80">{incident.resolution}</p>
                  </div>
                </div>

                {/* Outcome */}
                <div className="flex gap-3">
                  <TrendingUp size={16} className="text-[hsl(270_70%_65%)] shrink-0 mt-0.5" />
                  <div>
                    <p className={labelStyle + ' mb-1'}>Outcome</p>
                    <p className="text-sm text-white/80">{incident.outcome}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex gap-3">
                  <Search size={16} className="shrink-0 mt-0.5" style={{ color: 'hsl(0 0% 45%)' }} />
                  <div>
                    <p className={labelStyle + ' mb-1'}>Date</p>
                    <p className="text-sm text-white/80">{incident.date_mentioned}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="rounded-2xl p-6" style={glassCard}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-yellow-400" />
                <h3 className="font-semibold text-white">Recommendations</h3>
              </div>
              <ul className="flex flex-col gap-2.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex gap-2.5" style={{ color: 'hsl(0 0% 68%)' }}>
                    <span className="text-[hsl(270_70%_65%)] shrink-0">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}